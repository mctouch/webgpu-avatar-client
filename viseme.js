// VisemeAnimator: text-to-ARKit-blendshape sequencer for lip-sync
// Maps simplified English phonemes to ARKit blendshape weights and plays them over time

const ARKIT_NAMES = [
    'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight',
    'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight',
    'eyeBlinkLeft', 'eyeBlinkRight', 'eyeSquintLeft', 'eyeSquintRight',
    'eyeWideLeft', 'eyeWideRight',
    'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
    'noseSneerLeft', 'noseSneerRight',
    'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
    'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
    'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
    'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
    'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
    'mouthPressLeft', 'mouthPressRight',
    'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
    'tongueOut'
];

const NAME_TO_INDEX = Object.fromEntries(ARKIT_NAMES.map((n, i) => [n, i]));

// Viseme definitions: name -> { blendshape: weight, ... }
const VISemes = {
    REST:  {},
    AAH:   { jawOpen: 0.35, mouthUpperUpLeft: 0.15, mouthUpperUpRight: 0.15, mouthLowerDownLeft: 0.10, mouthLowerDownRight: 0.10 },
    EE:    { jawOpen: 0.10, mouthStretchLeft: 0.35, mouthStretchRight: 0.35, mouthSmileLeft: 0.15, mouthSmileRight: 0.15 },
    IH:    { jawOpen: 0.12, mouthStretchLeft: 0.25, mouthStretchRight: 0.25 },
    OH:    { jawOpen: 0.25, mouthFunnel: 0.35, mouthPucker: 0.10 },
    OOH:   { jawOpen: 0.08, mouthPucker: 0.45, mouthFunnel: 0.20 },
    MBP:   { jawOpen: 0.02, mouthPressLeft: 0.30, mouthPressRight: 0.30, mouthRollUpper: 0.10 },
    FV:    { jawOpen: 0.05, mouthRollLower: 0.35, mouthUpperUpLeft: 0.10, mouthUpperUpRight: 0.10 },
    TH:    { jawOpen: 0.10, tongueOut: 0.25, mouthLowerDownLeft: 0.05, mouthLowerDownRight: 0.05 },
    L:     { jawOpen: 0.08, mouthLowerDownLeft: 0.20, mouthLowerDownRight: 0.20, tongueOut: 0.10 },
    S:     { jawOpen: 0.05, mouthSmileLeft: 0.20, mouthSmileRight: 0.20, mouthStretchLeft: 0.10, mouthStretchRight: 0.10 },
    SH:    { jawOpen: 0.08, mouthPucker: 0.25, mouthFunnel: 0.20 },
    CH:    { jawOpen: 0.10, mouthPucker: 0.20, mouthFunnel: 0.15, mouthStretchLeft: 0.10, mouthStretchRight: 0.10 },
    W:     { jawOpen: 0.05, mouthPucker: 0.30, mouthFunnel: 0.15 },
    R:     { jawOpen: 0.08, mouthPucker: 0.20, mouthFunnel: 0.15, mouthStretchLeft: 0.10, mouthStretchRight: 0.10 },
    K:     { jawOpen: 0.15, mouthStretchLeft: 0.10, mouthStretchRight: 0.10, mouthUpperUpLeft: 0.10, mouthUpperUpRight: 0.10 },
    G:     { jawOpen: 0.12, mouthStretchLeft: 0.10, mouthStretchRight: 0.10 },
    N:     { jawOpen: 0.06, mouthPressLeft: 0.15, mouthPressRight: 0.15, tongueOut: 0.05 },
    T:     { jawOpen: 0.08, mouthPressLeft: 0.10, mouthPressRight: 0.10, tongueOut: 0.10 },
    D:     { jawOpen: 0.08, tongueOut: 0.08, mouthPressLeft: 0.08, mouthPressRight: 0.08 },
};

// Simple text-to-viseme mapping (not a full phoneme engine, but good enough for demo)
function charToViseme(c, next) {
    c = c.toLowerCase();
    next = (next || '').toLowerCase();
    // Digraphs
    if (c === 't' && next === 'h') return 'TH';
    if (c === 's' && next === 'h') return 'SH';
    if (c === 'c' && next === 'h') return 'CH';
    if (c === 'a' && next === 'w') return 'OOH';
    if (c === 'o' && next === 'o') return 'OOH';
    if (c === 'a' && next === 'u') return 'OOH';
    if (c === 'o' && next === 'u') return 'OOH';
    if (c === 'o' && next === 'w') return 'OOH';
    // Single chars
    if ('ae'.includes(c)) return 'AAH';
    if (c === 'i') return 'EE';
    if (c === 'o') return 'OH';
    if (c === 'u') return 'OOH';
    if (c === 'y') return 'EE';
    if ('mbp'.includes(c)) return 'MBP';
    if ('fv'.includes(c)) return 'FV';
    if (c === 'l') return 'L';
    if (c === 's' || c === 'z') return 'S';
    if (c === 'w') return 'W';
    if (c === 'r') return 'R';
    if (c === 'k') return 'K';
    if (c === 'g') return 'G';
    if (c === 'n') return 'N';
    if (c === 't') return 'T';
    if (c === 'd') return 'D';
    if (c === 'h') return 'AAH';
    if (c === 'j') return 'CH';
    if ('.!?'.includes(c)) return 'REST'; // punctuation pauses
    return null; // skip non-mapped chars (spaces, etc.)
}

function textToVisemeSequence(text) {
    const seq = [];
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
        const v = charToViseme(chars[i], chars[i+1]);
        if (v) {
            seq.push(v);
            // Skip next char if it was part of a digraph
            if (chars[i+1] && 'hwh'.includes(chars[i+1]) && 'tscoaj'.includes(chars[i])) {
                // crude digraph detection already handled above, but don't double-consume
            }
        }
    }
    return seq;
}

class VisemeAnimator {
    constructor() {
        this.sequence = [];
        this.index = 0;
        this.timeInViseme = 0;
        this.visemeDuration = 0.08; // seconds per viseme
        this.restDuration = 0.12;
        this.currentWeights = new Float32Array(52);
        this.targetWeights = new Float32Array(52);
        this.interpSpeed = 12.0; // blend speed
        this.isPlaying = false;
        this.idleTime = 0;
    }

    speak(text, totalDuration) {
        this.sequence = textToVisemeSequence(text);
        this.index = 0;
        this.timeInViseme = 0;
        this.isPlaying = true;
        // Scale viseme duration to match audio length
        if (totalDuration && this.sequence.length > 0) {
            this.visemeDuration = totalDuration / this.sequence.length;
        } else {
            this.visemeDuration = 0.08;
        }
        // Prime first target
        this._setTargetFromViseme(this.sequence[0] || 'REST');
    }

    stop() {
        this.isPlaying = false;
        this.sequence = [];
        this._setTargetFromViseme('REST');
    }

    _setTargetFromViseme(name) {
        this.targetWeights.fill(0);
        const def = VISemes[name] || VISemes.REST;
        for (const [k, v] of Object.entries(def)) {
            const idx = NAME_TO_INDEX[k];
            if (idx !== undefined) this.targetWeights[idx] = v;
        }
    }

    update(dt) {
        this.idleTime += dt;

        if (this.isPlaying && this.sequence.length > 0) {
            this.timeInViseme += dt;
            const dur = this.visemeDuration;
            if (this.timeInViseme >= dur) {
                this.timeInViseme -= dur;
                this.index++;
                if (this.index >= this.sequence.length) {
                    this.isPlaying = false;
                    this._setTargetFromViseme('REST');
                } else {
                    this._setTargetFromViseme(this.sequence[this.index]);
                }
            }
        }

        // Smooth interpolation toward target
        const speed = Math.min(1.0, this.interpSpeed * dt);
        for (let i = 0; i < 52; i++) {
            this.currentWeights[i] += (this.targetWeights[i] - this.currentWeights[i]) * speed;
        }

        return this.currentWeights;
    }

    // Returns a plain object for window.updateAvatarBlendshapes
    getBlendshapeObject() {
        const obj = {};
        for (let i = 0; i < 52; i++) {
            if (this.currentWeights[i] > 0.001) {
                obj[ARKIT_NAMES[i]] = this.currentWeights[i];
            }
        }
        return obj;
    }
}

window.VisemeAnimator = VisemeAnimator;
