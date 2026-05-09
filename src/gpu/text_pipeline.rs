use glyphon::{FontSystem, SwashCache, TextAtlas, TextRenderer, Viewport};
use wgpu::{Device, MultisampleState, Queue, TextureFormat};

#[cfg(target_arch = "wasm32")]
static FONT_BYTES: &[u8] = include_bytes!("../../fonts/NotoSans-Regular.ttf");

#[cfg(not(target_arch = "wasm32"))]
static FONT_BYTES: &[u8] = &[];

pub struct TextPipeline {
    font_system: FontSystem,
    swash_cache: SwashCache,
    atlas: TextAtlas,
    renderer: TextRenderer,
    viewport: Viewport,
}

impl TextPipeline {
    pub fn new(device: &Device, queue: &Queue, format: TextureFormat) -> Self {
        let mut font_system = if cfg!(target_arch = "wasm32") {
            let font_data = std::sync::Arc::new(FONT_BYTES.to_vec());
            let source = glyphon::fontdb::Source::Binary(font_data);
            FontSystem::new_with_fonts([source])
        } else {
            FontSystem::new()
        };
        let swash_cache = SwashCache::new();
        let cache = glyphon::Cache::new(device);
        let mut atlas = TextAtlas::new(device, queue, &cache, format);
        let renderer = TextRenderer::new(&mut atlas, device, MultisampleState::default(), None);
        let viewport = Viewport::new(device, &cache);

        Self {
            font_system,
            swash_cache,
            atlas,
            renderer,
            viewport,
        }
    }

    pub fn resize(&mut self, queue: &Queue, width: u32, height: u32) {
        self.viewport.update(queue, glyphon::Resolution { width, height });
    }

    pub fn create_buffer(&mut self, text: &str, metrics: glyphon::Metrics, width: f32) -> glyphon::Buffer {
        let mut buffer = glyphon::Buffer::new(&mut self.font_system, metrics);
        buffer.set_text(&mut self.font_system, text, &glyphon::Attrs::new(), glyphon::Shaping::Advanced, None);
        buffer.set_size(&mut self.font_system, Some(width), None);
        buffer.shape_until_scroll(&mut self.font_system, false);
        buffer
    }

    pub fn prepare<'a>(
        &'a mut self,
        device: &Device,
        queue: &Queue,
        text_areas: Vec<glyphon::TextArea<'a>>,
    ) {
        self.renderer.prepare(
            device,
            queue,
            &mut self.font_system,
            &mut self.atlas,
            &self.viewport,
            text_areas,
            &mut self.swash_cache,
        ).unwrap();
    }

    pub fn render<'a>(&'a self, pass: &mut wgpu::RenderPass<'a>) {
        self.renderer.render(&self.atlas, &self.viewport, pass).unwrap();
    }
}
