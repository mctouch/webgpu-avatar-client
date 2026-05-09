pub mod parser;
pub mod layout;
pub mod renderer;

pub struct MdDocument {
    pub elements: Vec<MdElement>,
    pub total_height: f32,
}

#[derive(Clone)]
pub struct MdElement {
    pub kind: MdElementKind,
    pub y_offset: Option<f32>,
    pub width: f32,
    pub height: f32,
    pub margin_top: f32,
    pub margin_bottom: f32,
    pub role: Option<String>,
}

#[derive(Clone)]
pub enum MdElementKind {
    Paragraph(Vec<TextSpan>),
    Heading { level: u8, text: Vec<TextSpan> },
    CodeBlock { lang: String, code: String },
    InlineCode { code: String },
    Image { src: String, alt: String },
    Table { headers: Vec<String>, rows: Vec<Vec<String>> },
    List { items: Vec<ListItem>, ordered: bool },
    HorizontalRule,
    TaskItem { checked: bool, text: Vec<TextSpan> },
    BlockQuote { children: Vec<MdElement> },
}

#[derive(Clone)]
pub struct TextSpan {
    pub text: String,
    pub bold: bool,
    pub italic: bool,
    pub strikethrough: bool,
    pub code: bool,
    pub link: Option<String>,
}

#[derive(Clone)]
pub struct ListItem {
    pub marker: String,
    pub text: Vec<TextSpan>,
    pub children: Vec<MdElement>,
}
