use crate::theme::Theme;
use super::{MdDocument, MdElement, MdElementKind, TextSpan};

pub struct LayoutEngine {
    pub viewport_width: f32,
    pub theme: Theme,
}

impl LayoutEngine {
    pub fn new(viewport_width: f32, theme: Theme) -> Self {
        Self { viewport_width, theme }
    }

    pub fn layout(&self, doc: &mut MdDocument) {
        let content_width = self.viewport_width.min(self.theme.max_content_width);
        let mut y = 0.0f32;
        let mut prev_role: Option<String> = None;

        for elem in &mut doc.elements {
            // Add gap between role transitions
            let role_transition_gap = if elem.role.is_some() && prev_role.is_some() && elem.role != prev_role {
                16.0f32
            } else {
                0.0f32
            };
            prev_role = elem.role.clone();

            let (height, margin_top, margin_bottom) = self.measure_element(&elem.kind, content_width, &elem.role);
            elem.y_offset = Some(y + role_transition_gap);
            elem.width = content_width;
            elem.height = height;
            elem.margin_top = margin_top;
            elem.margin_bottom = margin_bottom;
            y += role_transition_gap + margin_top + height + margin_bottom;
        }

        doc.total_height = y;
    }

    fn measure_element(&self, kind: &MdElementKind, width: f32, role: &Option<String>) -> (f32, f32, f32) {
        // For bubble messages, text wraps at a narrower width than full content
        let text_width = if role.is_some() {
            (width * 0.85).min(600.0) - 16.0
        } else {
            width
        };
        match kind {
            MdElementKind::Paragraph(spans) => {
                let line_count = self.estimate_text_lines(spans, text_width.max(100.0));
                let line_height = self.theme.font_size_base * self.theme.line_height;
                // Tighter spacing for bubble messages
                let (mt, mb) = if role.is_some() {
                    (4.0f32, 4.0f32)
                } else {
                    (self.theme.margin_paragraph, self.theme.margin_paragraph)
                };
                (line_count * line_height, mt, mb)
            }
            MdElementKind::Heading { level, text } => {
                let scale = match level {
                    1 => 2.0,
                    2 => 1.75,
                    3 => 1.5,
                    4 => 1.25,
                    5 => 1.1,
                    _ => 1.0,
                };
                let font_size = self.theme.font_size_base * scale;
                let line_count = self.estimate_text_lines(text, text_width.max(100.0));
                (line_count * font_size * 1.3, self.theme.margin_heading, self.theme.margin_heading * 0.5)
            }
            MdElementKind::CodeBlock { code, .. } => {
                let chars_per_line = (width / (self.theme.font_size_code * 0.6)).max(20.0) as usize;
                let lines = code.lines().count().max(1);
                let wrapped = code.chars().count() / chars_per_line.max(1);
                let total_lines = lines + wrapped;
                let line_height = self.theme.font_size_code * 1.5;
                let height = total_lines as f32 * line_height + self.theme.padding_code * 2.0;
                (height, self.theme.margin_code, self.theme.margin_code)
            }
            MdElementKind::Image { .. } => {
                let max_img_width = width * 0.9;
                let aspect = 16.0 / 9.0;
                (max_img_width / aspect, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            MdElementKind::Table { headers, rows } => {
                let row_height = self.theme.font_size_base * 2.0;
                let total_rows = headers.len().max(1) + rows.len();
                (total_rows as f32 * row_height, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            MdElementKind::List { items, .. } => {
                let item_height = self.theme.font_size_base * self.theme.line_height * 1.5;
                let total_items = items.len().max(1);
                (total_items as f32 * item_height, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            MdElementKind::HorizontalRule => {
                (2.0, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            MdElementKind::TaskItem { text, .. } => {
                let line_count = self.estimate_text_lines(text, text_width.max(100.0) - 24.0);
                (line_count * self.theme.font_size_base * self.theme.line_height, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            MdElementKind::BlockQuote { children } => {
                let mut child_height = 0.0;
                for child in children {
                    let (h, mt, mb) = self.measure_element(&child.kind, width - 24.0, &None);
                    child_height += mt + h + mb;
                }
                (child_height + 16.0, self.theme.margin_paragraph, self.theme.margin_paragraph)
            }
            _ => (self.theme.font_size_base, 0.0, 0.0),
        }
    }

    fn estimate_text_lines(&self, spans: &[TextSpan], width: f32) -> f32 {
        let total_chars: usize = spans.iter().map(|s| s.text.chars().count()).sum();
        let newline_count: usize = spans.iter().map(|s| s.text.matches('\n').count()).sum();
        // Use a conservative estimate (0.45 instead of 0.55) to account for word wrapping
        // and variable-width glyphs, preventing text overlap
        let chars_per_line = (width / (self.theme.font_size_base * 0.45)).max(10.0) as usize;
        let wrapped_lines = (total_chars / chars_per_line.max(1)) + 1;
        (wrapped_lines.max(newline_count + 1)).max(1) as f32
    }
}
