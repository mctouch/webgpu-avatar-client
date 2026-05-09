use std::collections::HashMap;

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
pub struct FaceVertex {
    pub position: [f32; 3],
    pub color: [f32; 4],
}

pub struct FaceMesh {
    pub base_vertices: Vec<FaceVertex>,
    pub blendshape_targets: HashMap<String, Vec<[f32; 3]>>,
    pub indices: Vec<u16>,
}

impl FaceMesh {
    pub fn procedural() -> Self {
        let nx = 16;
        let ny = 20;
        let mut base_vertices = Vec::new();

        for iy in 0..=ny {
            for ix in 0..=nx {
                let u = ix as f32 / nx as f32;
                let v = iy as f32 / ny as f32;

                let x = (u - 0.5) * 1.4;
                let y = (v - 0.5) * 1.8;

                let ellipse = (x / 0.65).powi(2) + (y / 0.85).powi(2);
                let z = if ellipse < 1.0 {
                    0.22 * (1.0 - ellipse.sqrt())
                } else {
                    0.0
                };

                let (cx, cy) = if ellipse > 1.0 {
                    let s = 1.0 / ellipse.sqrt();
                    (x * s, y * s)
                } else {
                    (x, y)
                };

                base_vertices.push(FaceVertex {
                    position: [cx, cy, z],
                    color: Self::vertex_color(cx, cy),
                });
            }
        }

        let mut indices = Vec::new();
        for iy in 0..ny {
            for ix in 0..nx {
                let i0 = iy * (nx + 1) + ix;
                let i1 = i0 + 1;
                let i2 = (iy + 1) * (nx + 1) + ix;
                let i3 = i2 + 1;
                indices.push(i0 as u16);
                indices.push(i2 as u16);
                indices.push(i1 as u16);
                indices.push(i1 as u16);
                indices.push(i2 as u16);
                indices.push(i3 as u16);
            }
        }

        let mut blendshape_targets = HashMap::new();
        blendshape_targets.insert("jawOpen".into(), Self::target_jaw_open(&base_vertices));
        blendshape_targets.insert("mouthSmileLeft".into(), Self::target_smile_left(&base_vertices));
        blendshape_targets.insert("mouthSmileRight".into(), Self::target_smile_right(&base_vertices));
        blendshape_targets.insert("eyeBlinkLeft".into(), Self::target_blink_left(&base_vertices));
        blendshape_targets.insert("eyeBlinkRight".into(), Self::target_blink_right(&base_vertices));
        blendshape_targets.insert("browInnerUp".into(), Self::target_brow_up(&base_vertices));

        Self {
            base_vertices,
            blendshape_targets,
            indices,
        }
    }

    fn vertex_color(x: f32, y: f32) -> [f32; 4] {
        let mut r = 0.95;
        let mut g = 0.82;
        let mut b = 0.72;

        let d_le = ((x + 0.25).powi(2) + (y - 0.18).powi(2)).sqrt();
        if d_le < 0.13 {
            r = 1.0;
            g = 1.0;
            b = 1.0;
        }
        if d_le < 0.055 {
            r = 0.25;
            g = 0.45;
            b = 0.75;
        }
        if d_le < 0.025 {
            r = 0.05;
            g = 0.05;
            b = 0.05;
        }

        let d_re = ((x - 0.25).powi(2) + (y - 0.18).powi(2)).sqrt();
        if d_re < 0.13 {
            r = 1.0;
            g = 1.0;
            b = 1.0;
        }
        if d_re < 0.055 {
            r = 0.25;
            g = 0.45;
            b = 0.75;
        }
        if d_re < 0.025 {
            r = 0.05;
            g = 0.05;
            b = 0.05;
        }

        let d_mouth = (x.powi(2) + (y + 0.32).powi(2)).sqrt();
        if d_mouth < 0.16 && y < -0.18 {
            r = 0.82;
            g = 0.32;
            b = 0.32;
        }

        let d_nose = (x.powi(2) + (y + 0.02).powi(2)).sqrt();
        if d_nose < 0.07 {
            r = 0.92;
            g = 0.78;
            b = 0.68;
        }

        [r, g, b, 1.0]
    }

    fn target_jaw_open(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                if p[1] < -0.12 {
                    p[1] -= 0.22;
                }
                p
            })
            .collect()
    }

    fn target_smile_left(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                let d = ((p[0] + 0.28).powi(2) + (p[1] + 0.32).powi(2)).sqrt();
                if d < 0.14 {
                    let f = 1.0 - d / 0.14;
                    p[1] += 0.1 * f;
                    p[0] -= 0.04 * f;
                }
                p
            })
            .collect()
    }

    fn target_smile_right(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                let d = ((p[0] - 0.28).powi(2) + (p[1] + 0.32).powi(2)).sqrt();
                if d < 0.14 {
                    let f = 1.0 - d / 0.14;
                    p[1] += 0.1 * f;
                    p[0] += 0.04 * f;
                }
                p
            })
            .collect()
    }

    fn target_blink_left(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                let d = ((p[0] + 0.25).powi(2) + (p[1] - 0.18).powi(2)).sqrt();
                if d < 0.12 {
                    p[1] += 0.07 * (1.0 - d / 0.12);
                }
                p
            })
            .collect()
    }

    fn target_blink_right(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                let d = ((p[0] - 0.25).powi(2) + (p[1] - 0.18).powi(2)).sqrt();
                if d < 0.12 {
                    p[1] += 0.07 * (1.0 - d / 0.12);
                }
                p
            })
            .collect()
    }

    fn target_brow_up(base: &[FaceVertex]) -> Vec<[f32; 3]> {
        base.iter()
            .map(|v| {
                let mut p = v.position;
                let d = (p[0].powi(2) + (p[1] - 0.32).powi(2)).sqrt();
                if d < 0.22 && p[1] > 0.18 {
                    p[1] += 0.07 * (1.0 - d / 0.22);
                }
                p
            })
            .collect()
    }

    pub fn compute_frame(&self, weights: &HashMap<String, f32>) -> Vec<FaceVertex> {
        let mut result = self.base_vertices.clone();
        for (name, target_positions) in &self.blendshape_targets {
            let w = weights.get(name).copied().unwrap_or(0.0);
            if w == 0.0 {
                continue;
            }
            for (i, target) in target_positions.iter().enumerate() {
                let base = self.base_vertices[i].position;
                result[i].position = [
                    base[0] + (target[0] - base[0]) * w,
                    base[1] + (target[1] - base[1]) * w,
                    base[2] + (target[2] - base[2]) * w,
                ];
            }
        }
        result
    }
}
