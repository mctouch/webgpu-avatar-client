#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ThemeColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl ThemeColor {
    pub const fn new(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    pub fn to_f32_array(&self) -> [f32; 4] {
        [
            self.r as f32 / 255.0,
            self.g as f32 / 255.0,
            self.b as f32 / 255.0,
            self.a as f32 / 255.0,
        ]
    }

    pub fn to_glyphon(&self) -> glyphon::Color {
        glyphon::Color::rgb(self.r, self.g, self.b)
    }

    pub fn to_wgpu(&self) -> wgpu::Color {
        let [r, g, b, a] = self.to_f32_array();
        wgpu::Color { r: r as f64, g: g as f64, b: b as f64, a: a as f64 }
    }

    pub fn to_wgpu_red_debug(&self) -> wgpu::Color {
        wgpu::Color { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }
    }
}
