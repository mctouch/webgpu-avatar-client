use super::colors::ThemeColor;

#[derive(Clone)]
pub struct SyntaxColors {
    pub keyword: ThemeColor,
    pub string: ThemeColor,
    pub comment: ThemeColor,
    pub number: ThemeColor,
    pub type_name: ThemeColor,
    pub function: ThemeColor,
    pub variable: ThemeColor,
    pub punctuation: ThemeColor,
}

impl SyntaxColors {
    pub fn default_dark() -> Self {
        Self {
            keyword: ThemeColor::new(0xff, 0x7b, 0x72, 0xff),
            string: ThemeColor::new(0xa5, 0xd6, 0xff, 0xff),
            comment: ThemeColor::new(0x8b, 0x94, 0x9e, 0xff),
            number: ThemeColor::new(0x79, 0xc0, 0xff, 0xff),
            type_name: ThemeColor::new(0xff, 0xd7, 0x00, 0xff),
            function: ThemeColor::new(0xd2, 0xa8, 0xff, 0xff),
            variable: ThemeColor::new(0xe0, 0xe0, 0xe0, 0xff),
            punctuation: ThemeColor::new(0xc0, 0xc0, 0xc0, 0xff),
        }
    }
}
