use std::collections::HashMap;
use wgpu::{
    BlendState, BufferUsages, ColorTargetState, ColorWrites, Device, FragmentState,
    MultisampleState, PipelineLayoutDescriptor, PrimitiveState, PrimitiveTopology, Queue,
    RenderPipeline, ShaderModuleDescriptor, ShaderSource, VertexAttribute, VertexBufferLayout,
    VertexState, VertexStepMode,
};
use crate::avatar::mesh::{FaceMesh, FaceVertex};

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
struct AvatarUniforms {
    rect: [f32; 4],     // x, y, w, h in screen pixels
    viewport: [f32; 2], // w, h
    _pad: [f32; 2],
}

pub struct AvatarRenderer {
    pipeline: RenderPipeline,
    vertex_buffer: wgpu::Buffer,
    index_buffer: wgpu::Buffer,
    index_count: u32,
    uniform_buffer: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
    mesh: FaceMesh,
}

impl AvatarRenderer {
    pub fn new(device: &Device, format: wgpu::TextureFormat) -> Self {
        let mesh = FaceMesh::procedural();

        let shader_src = r#"
struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) face_pos: vec2<f32>,
};

struct Uniforms {
    rect: vec4<f32>,
    viewport: vec2<f32>,
};

@group(0) @binding(0)
var<uniform> u: Uniforms;

@vertex
fn vs_main(
    @location(0) pos: vec3<f32>,
    @location(1) color: vec4<f32>,
) -> VertexOutput {
    var out: VertexOutput;
    let screen_x = u.rect.x + (pos.x + 1.0) * 0.5 * u.rect.z;
    let screen_y = u.rect.y + (pos.y + 1.0) * 0.5 * u.rect.w;
    let ndc_x = (screen_x / u.viewport.x) * 2.0 - 1.0;
    let ndc_y = -((screen_y / u.viewport.y) * 2.0 - 1.0);
    out.clip_position = vec4<f32>(ndc_x, ndc_y, pos.z * 0.01, 1.0);
    out.color = color;
    out.face_pos = pos.xy;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Ellipse mask to clip face shape
    let e = (in.face_pos.x / 0.65) * (in.face_pos.x / 0.65)
          + (in.face_pos.y / 0.85) * (in.face_pos.y / 0.85);
    if e > 1.0 {
        discard;
    }
    return in.color;
}
"#;

        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("avatar_shader"),
            source: ShaderSource::Wgsl(shader_src.into()),
        });

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("avatar_bgl"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            }],
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("avatar_pl"),
            bind_group_layouts: &[Some(&bind_group_layout)],
            immediate_size: 0,
        });

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("avatar_pipeline"),
            layout: Some(&pipeline_layout),
            vertex: VertexState {
                module: &shader,
                entry_point: Some("vs_main"),
                buffers: &[VertexBufferLayout {
                    array_stride: std::mem::size_of::<FaceVertex>() as wgpu::BufferAddress,
                    step_mode: VertexStepMode::Vertex,
                    attributes: &[
                        VertexAttribute {
                            format: wgpu::VertexFormat::Float32x3,
                            offset: 0,
                            shader_location: 0,
                        },
                        VertexAttribute {
                            format: wgpu::VertexFormat::Float32x4,
                            offset: 12,
                            shader_location: 1,
                        },
                    ],
                }],
                compilation_options: Default::default(),
            },
            fragment: Some(FragmentState {
                module: &shader,
                entry_point: Some("fs_main"),
                targets: &[Some(ColorTargetState {
                    format,
                    blend: Some(BlendState::ALPHA_BLENDING),
                    write_mask: ColorWrites::ALL,
                })],
                compilation_options: Default::default(),
            }),
            primitive: PrimitiveState {
                topology: PrimitiveTopology::TriangleList,
                ..Default::default()
            },
            depth_stencil: None,
            multisample: MultisampleState::default(),
            multiview_mask: None,
            cache: None,
        });

        let vbuf_size = (mesh.base_vertices.len() * std::mem::size_of::<FaceVertex>()) as u64;
        let vertex_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("avatar_vbuf"),
            size: vbuf_size.max(1024),
            usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let ibuf_size = (mesh.indices.len() * std::mem::size_of::<u16>()) as u64;
        let index_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("avatar_ibuf"),
            size: ibuf_size.max(1024),
            usage: BufferUsages::INDEX | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let uniform_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("avatar_ubuf"),
            size: std::mem::size_of::<AvatarUniforms>() as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("avatar_bg"),
            layout: &bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: uniform_buffer.as_entire_binding(),
            }],
        });

        Self {
            pipeline,
            vertex_buffer,
            index_buffer,
            index_count: mesh.indices.len() as u32,
            uniform_buffer,
            bind_group,
            mesh,
        }
    }

    pub fn update(&mut self, queue: &Queue, viewport_w: f32, viewport_h: f32, weights: &HashMap<String, f32>) {
        let vertices = self.mesh.compute_frame(weights);
        queue.write_buffer(&self.vertex_buffer, 0, bytemuck::cast_slice(&vertices));
        queue.write_buffer(&self.index_buffer, 0, bytemuck::cast_slice(&self.mesh.indices));

        // Avatar panel: top-right corner, 170x220 px
        let u = AvatarUniforms {
            rect: [viewport_w - 186.0, 48.0, 170.0, 220.0],
            viewport: [viewport_w, viewport_h],
            _pad: [0.0, 0.0],
        };
        queue.write_buffer(&self.uniform_buffer, 0, bytemuck::cast_slice(&[u]));
    }

    pub fn render<'a>(&'a self, pass: &mut wgpu::RenderPass<'a>) {
        pass.set_pipeline(&self.pipeline);
        pass.set_bind_group(0, &self.bind_group, &[]);
        pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
        pass.set_index_buffer(self.index_buffer.slice(..), wgpu::IndexFormat::Uint16);
        pass.draw_indexed(0..self.index_count, 0, 0..1);
    }
}
