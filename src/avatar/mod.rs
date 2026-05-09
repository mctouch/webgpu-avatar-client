pub mod blendshape;
pub mod mesh;
pub mod renderer;

pub use mesh::FaceMesh;
pub use renderer::AvatarRenderer;

use blendshape::BlendShapeFrame;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use wasm_bindgen::prelude::*;
use web_sys::{MessageEvent, WebSocket};

// Global storage for the latest blendshape frame
static LATEST_FRAME: Mutex<Option<BlendShapeFrame>> = Mutex::new(None);
static WS_STATUS: Mutex<String> = Mutex::new(String::new());

/// Connect to an avatar WebSocket endpoint that streams blendshape JSON
pub fn connect_ws(url: &str) -> Result<WebSocket, JsValue> {
    let ws = WebSocket::new(url)?;
    ws.set_binary_type(web_sys::BinaryType::Arraybuffer);

    let onmessage = Closure::wrap(Box::new(move |e: MessageEvent| {
        if let Ok(text) = e.data().dyn_into::<js_sys::JsString>() {
            let text_str = String::from(text);
            if let Ok(frame) = BlendShapeFrame::from_json(&text_str) {
                if let Ok(mut guard) = LATEST_FRAME.lock() {
                    *guard = Some(frame);
                }
            }
        }
    }) as Box<dyn FnMut(MessageEvent)>);
    ws.set_onmessage(Some(onmessage.as_ref().unchecked_ref()));
    onmessage.forget();

    let onopen = Closure::wrap(Box::new(move |_e: web_sys::Event| {
        if let Ok(mut guard) = WS_STATUS.lock() {
            *guard = "connected".into();
        }
    }) as Box<dyn FnMut(web_sys::Event)>);
    ws.set_onopen(Some(onopen.as_ref().unchecked_ref()));
    onopen.forget();

    let onclose = Closure::wrap(Box::new(move |_e: web_sys::Event| {
        if let Ok(mut guard) = WS_STATUS.lock() {
            *guard = "disconnected".into();
        }
    }) as Box<dyn FnMut(web_sys::Event)>);
    ws.set_onclose(Some(onclose.as_ref().unchecked_ref()));
    onclose.forget();

    let onerror = Closure::wrap(Box::new(move |_e: web_sys::Event| {
        if let Ok(mut guard) = WS_STATUS.lock() {
            *guard = "error".into();
        }
    }) as Box<dyn FnMut(web_sys::Event)>);
    ws.set_onerror(Some(onerror.as_ref().unchecked_ref()));
    onerror.forget();

    Ok(ws)
}

/// Get the latest blendshape frame as a JSON string
pub fn get_latest_frame_json() -> String {
    if let Ok(guard) = LATEST_FRAME.lock() {
        if let Some(ref frame) = *guard {
            return frame.to_json();
        }
    }
    "{}".into()
}

/// Get the latest blendshape weights as a HashMap
pub fn get_latest_weights() -> HashMap<String, f32> {
    if let Ok(guard) = LATEST_FRAME.lock() {
        if let Some(ref frame) = *guard {
            return frame.weights.clone();
        }
    }
    HashMap::new()
}

/// Get connection status
pub fn get_ws_status() -> String {
    if let Ok(guard) = WS_STATUS.lock() {
        return guard.clone();
    }
    "unknown".into()
}

/// Manually set a blendshape frame (for testing or direct injection)
pub fn set_frame_from_json(json: &str) -> Result<(), JsValue> {
    let frame = BlendShapeFrame::from_json(json)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;
    if let Ok(mut guard) = LATEST_FRAME.lock() {
        *guard = Some(frame);
    }
    Ok(())
}
