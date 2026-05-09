//! Native desktop entry point for wasm-markdown-chat
//!
//! Run with: cargo run --bin wasm-markdown-chat-native

use pollster::FutureExt;
use winit::event_loop::{ControlFlow, EventLoop};

fn main() {
    env_logger::init();

    let event_loop = EventLoop::new().expect("create event loop");
    event_loop.set_control_flow(ControlFlow::Poll);

    let mut app = wasm_markdown_chat::app::App::new()
        .block_on();

    event_loop
        .run_app(&mut app)
        .expect("run event loop");
}
