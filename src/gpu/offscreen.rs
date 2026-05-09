use wgpu::{BufferUsages, Extent3d, TextureDescriptor, TextureDimension, TextureFormat, TextureUsages};

pub struct OffscreenSurface {
    pub texture: wgpu::Texture,
    pub view: wgpu::TextureView,
    pub staging_buffer: wgpu::Buffer,
    pub width: u32,
    pub height: u32,
    pub format: TextureFormat,
}

impl OffscreenSurface {
    pub fn new(device: &wgpu::Device, width: u32, height: u32) -> Self {
        let format = TextureFormat::Rgba8Unorm;
        let texture = device.create_texture(&TextureDescriptor {
            label: Some("offscreen"),
            size: Extent3d { width, height, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format,
            usage: TextureUsages::RENDER_ATTACHMENT | TextureUsages::COPY_SRC,
            view_formats: &[],
        });

        let view = texture.create_view(&wgpu::TextureViewDescriptor::default());

        let aligned_bpr = ((width * 4 + 255) / 256) * 256;
        let buffer_size = (aligned_bpr * height) as u64;
        let staging_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("staging"),
            size: buffer_size,
            usage: BufferUsages::COPY_DST | BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        Self { texture, view, staging_buffer, width, height, format }
    }

    pub fn resize(&mut self, device: &wgpu::Device, width: u32, height: u32) {
        if self.width == width && self.height == height {
            return;
        }
        *self = Self::new(device, width, height);
    }

    pub fn copy_to_buffer(&self, encoder: &mut wgpu::CommandEncoder) {
        let aligned_bpr = ((self.width * 4 + 255) / 256) * 256;
        encoder.copy_texture_to_buffer(
            wgpu::TexelCopyTextureInfo {
                texture: &self.texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::TexelCopyBufferInfo {
                buffer: &self.staging_buffer,
                layout: wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(aligned_bpr),
                    rows_per_image: Some(self.height),
                },
            },
            Extent3d { width: self.width, height: self.height, depth_or_array_layers: 1 },
        );
    }
}
