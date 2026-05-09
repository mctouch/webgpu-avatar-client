use std::collections::HashMap;

/// Standard ARKit blendshape names (52 shapes)
pub const ARKIT_BLENDSHAPES: &[&str] = &[
    "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
    "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight",
    "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight",
    "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight",
    "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight",
    "jawForward", "jawLeft", "jawOpen", "jawRight",
    "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight",
    "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight",
    "mouthPressLeft", "mouthPressRight", "mouthPucker", "mouthRight",
    "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
    "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight",
    "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft", "noseSneerRight",
    "tongueOut",
];

/// A single frame of blendshape weights received from the A2F-3D backend
#[derive(Clone, Debug, Default)]
pub struct BlendShapeFrame {
    pub timestamp_ms: f64,
    pub weights: HashMap<String, f32>,
}

impl BlendShapeFrame {
    pub fn new(timestamp_ms: f64) -> Self {
        Self {
            timestamp_ms,
            weights: HashMap::new(),
        }
    }

    pub fn with_weights(timestamp_ms: f64, weights: HashMap<String, f32>) -> Self {
        Self { timestamp_ms, weights }
    }

    /// Get weight for a specific blendshape, defaulting to 0.0
    pub fn get(&self, name: &str) -> f32 {
        self.weights.get(name).copied().unwrap_or(0.0)
    }

    /// Serialize to JSON string for JS interop
    pub fn to_json(&self) -> String {
        let mut entries: Vec<String> = self.weights
            .iter()
            .map(|(k, v)| format!("\"{}\":{:.4}", k, v))
            .collect();
        entries.sort();
        format!("{{\"t\":{:.3},\"w\":{{{}}}}}", self.timestamp_ms, entries.join(","))
    }

    /// Deserialize from a simple JSON object: {"timestamp": 123.4, "weights": {"jawOpen": 0.5}}
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        #[derive(serde::Deserialize)]
        struct RawFrame {
            #[serde(default)]
            timestamp: f64,
            #[serde(default)]
            weights: HashMap<String, f32>,
        }
        let raw: RawFrame = serde_json::from_str(json)?;
        Ok(Self::with_weights(raw.timestamp, raw.weights))
    }
}
