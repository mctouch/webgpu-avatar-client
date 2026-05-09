use pulldown_cmark::{Event, Parser, Tag, TagEnd, CodeBlockKind, HeadingLevel};
use super::{MdDocument, MdElement, MdElementKind, ListItem, TextSpan};

pub fn parse_markdown(input: &str) -> MdDocument {
    let mut opts = pulldown_cmark::Options::empty();
    opts.insert(pulldown_cmark::Options::ENABLE_TABLES);
    opts.insert(pulldown_cmark::Options::ENABLE_STRIKETHROUGH);
    opts.insert(pulldown_cmark::Options::ENABLE_TASKLISTS);
    opts.insert(pulldown_cmark::Options::ENABLE_SMART_PUNCTUATION);

    let parser = Parser::new_ext(input, opts);
    let mut elements: Vec<MdElement> = Vec::new();
    let mut stack: Vec<Vec<MdElement>> = vec![elements];
    let mut current_spans: Vec<TextSpan> = Vec::new();
    let mut in_code_block: Option<(String, String)> = None;
    let mut list_stack: Vec<(bool, Vec<ListItem>)> = Vec::new();
    let mut current_list_item: Option<(String, Vec<TextSpan>, Vec<MdElement>)> = None;
    let mut table_headers: Vec<String> = Vec::new();
    let mut table_rows: Vec<Vec<String>> = Vec::new();
    let mut current_row: Vec<String> = Vec::new();
    let mut in_table = false;
    let mut in_blockquote = false;
    let mut in_link = false;
    let mut link_url = String::new();

    for event in parser {
        match event {
            Event::Start(tag) => match tag {
                Tag::Paragraph => {
                    current_spans.clear();
                }
                Tag::Heading { level, .. } => {
                    current_spans.clear();
                }
                Tag::CodeBlock(kind) => {
                    let lang = match kind {
                        CodeBlockKind::Fenced(lang) => lang.into_string(),
                        CodeBlockKind::Indented => String::new(),
                    };
                    in_code_block = Some((lang, String::new()));
                }
                Tag::List(start_num) => {
                    list_stack.push((start_num.is_some(), Vec::new()));
                }
                Tag::Item => {
                    current_list_item = Some((String::new(), Vec::new(), Vec::new()));
                }
                Tag::Table(_) => {
                    in_table = true;
                    table_headers.clear();
                    table_rows.clear();
                }
                Tag::TableHead => {
                    current_row.clear();
                }
                Tag::TableRow => {
                    current_row.clear();
                }
                Tag::TableCell => {
                    current_spans.clear();
                }
                Tag::BlockQuote(_) => {
                    in_blockquote = true;
                    stack.push(Vec::new());
                }
                Tag::Emphasis => {}
                Tag::Strong => {}
                Tag::Strikethrough => {}
                Tag::Link { dest_url, .. } => {
                    in_link = true;
                    link_url = dest_url.into_string();
                    current_spans.push(TextSpan {
                        text: String::new(),
                        bold: false,
                        italic: false,
                        strikethrough: false,
                        code: false,
                        link: Some(link_url.clone()),
                    });
                }
                Tag::Image { dest_url, title, .. } => {
                    let last = stack.last_mut().unwrap();
                    last.push(MdElement {
                        kind: MdElementKind::Image {
                            src: dest_url.into_string(),
                            alt: title.into_string(),
                        },
                        y_offset: None,
                        width: 0.0,
                        height: 0.0,
                        margin_top: 0.0,
                        margin_bottom: 0.0,
                        role: None,
                    });
                }
                _ => {}
            },
            Event::End(tag_end) => match tag_end {
                TagEnd::Paragraph => {
                    if !current_spans.is_empty() {
                        let last = stack.last_mut().unwrap();
                        last.push(MdElement {
                            kind: MdElementKind::Paragraph(current_spans.clone()),
                            y_offset: None,
                            width: 0.0,
                            height: 0.0,
                            margin_top: 0.0,
                            margin_bottom: 0.0,
                        role: None,
                        });
                    }
                    current_spans.clear();
                }
                TagEnd::Heading(level) => {
                    let last = stack.last_mut().unwrap();
                    last.push(MdElement {
                        kind: MdElementKind::Heading {
                            level: level as u8,
                            text: current_spans.clone(),
                        },
                        y_offset: None,
                        width: 0.0,
                        height: 0.0,
                        margin_top: 0.0,
                        margin_bottom: 0.0,
                        role: None,
                    });
                    current_spans.clear();
                }
                TagEnd::CodeBlock => {
                    if let Some((lang, code)) = in_code_block.take() {
                        let last = stack.last_mut().unwrap();
                        last.push(MdElement {
                            kind: MdElementKind::CodeBlock { lang, code },
                            y_offset: None,
                            width: 0.0,
                            height: 0.0,
                            margin_top: 0.0,
                            margin_bottom: 0.0,
                        role: None,
                        });
                    }
                }
                TagEnd::List(_) => {
                    if let Some((ordered, items)) = list_stack.pop() {
                        let last = stack.last_mut().unwrap();
                        last.push(MdElement {
                            kind: MdElementKind::List { items, ordered },
                            y_offset: None,
                            width: 0.0,
                            height: 0.0,
                            margin_top: 0.0,
                            margin_bottom: 0.0,
                        role: None,
                        });
                    }
                }
                TagEnd::Item => {
                    if let Some((marker, text, children)) = current_list_item.take() {
                        if let Some((_, items)) = list_stack.last_mut() {
                            items.push(ListItem { marker, text, children });
                        }
                    }
                }
                TagEnd::Table => {
                    in_table = false;
                    let last = stack.last_mut().unwrap();
                    last.push(MdElement {
                        kind: MdElementKind::Table {
                            headers: table_headers.clone(),
                            rows: table_rows.clone(),
                        },
                        y_offset: None,
                        width: 0.0,
                        height: 0.0,
                        margin_top: 0.0,
                        margin_bottom: 0.0,
                        role: None,
                    });
                }
                TagEnd::TableHead => {
                    table_headers = current_row.clone();
                }
                TagEnd::TableRow => {
                    if !current_row.is_empty() && !table_headers.is_empty() {
                        table_rows.push(current_row.clone());
                    }
                }
                TagEnd::TableCell => {
                    let text: String = current_spans.iter().map(|s| s.text.as_str()).collect();
                    current_row.push(text);
                    current_spans.clear();
                }
                TagEnd::BlockQuote(_) => {
                    in_blockquote = false;
                    if let Some(children) = stack.pop() {
                        let last = stack.last_mut().unwrap();
                        last.push(MdElement {
                            kind: MdElementKind::BlockQuote { children },
                            y_offset: None,
                            width: 0.0,
                            height: 0.0,
                            margin_top: 0.0,
                            margin_bottom: 0.0,
                        role: None,
                        });
                    }
                }
                TagEnd::Link => {
                    in_link = false;
                }
                TagEnd::Image => {}
                _ => {}
            },
            Event::Text(text) => {
                if let Some((_, ref mut code)) = in_code_block {
                    code.push_str(&text);
                } else if in_link {
                    if let Some(span) = current_spans.last_mut() {
                        span.text.push_str(&text);
                    }
                } else {
                    current_spans.push(TextSpan {
                        text: text.into_string(),
                        bold: false,
                        italic: false,
                        strikethrough: false,
                        code: false,
                        link: None,
                    });
                }
            }
            Event::Code(code) => {
                current_spans.push(TextSpan {
                    text: code.into_string(),
                    bold: false,
                    italic: false,
                    strikethrough: false,
                    code: true,
                    link: None,
                });
            }
            Event::Html(html) | Event::InlineHtml(html) => {
                current_spans.push(TextSpan {
                    text: html.into_string(),
                    bold: false,
                    italic: false,
                    strikethrough: false,
                    code: false,
                    link: None,
                });
            }
            Event::SoftBreak | Event::HardBreak => {
                if let Some(span) = current_spans.last_mut() {
                    span.text.push('\n');
                }
            }
            Event::Rule => {
                let last = stack.last_mut().unwrap();
                last.push(MdElement {
                    kind: MdElementKind::HorizontalRule,
                    y_offset: None,
                    width: 0.0,
                    height: 0.0,
                    margin_top: 0.0,
                    margin_bottom: 0.0,
                        role: None,
                });
            }
            Event::TaskListMarker(checked) => {
                current_spans.push(TextSpan {
                    text: if checked { "[x] ".into() } else { "[ ] ".into() },
                    bold: false,
                    italic: false,
                    strikethrough: false,
                    code: false,
                    link: None,
                });
            }
            _ => {}
        }
    }

    MdDocument {
        elements: stack.into_iter().next().unwrap_or_default(),
        total_height: 0.0,
    }
}
