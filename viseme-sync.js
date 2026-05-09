// viseme-sync.js — Time-synchronized viseme player aligned with Web Audio playback.
//
(function() {
"use strict";
// Usage:
//   const player = new VisemeSyncPlayer();
//   player.schedule([
//     { phoneme: 'HH', startTime: 0.0, duration: 0.06 },
//     { phoneme: 'AH', startTime: 0.06, duration: 0.10 },
//     { phoneme: 'L',  startTime: 0.16, duration: 0.08 },
//     { phoneme: 'OW', startTime: 0.24, duration: 0.14 },
//   ], audioCtx.currentTime);
//
//   // In your render loop:
//   const weights = player.getCurrentWeights(audioCtx.currentTime);
//   applyWeightsToAvatar(weights);
//
//   player.stop();  // cancel playback

/* ========================================================================== */
/* ARPAbet-to-viseme mapping (same mapping as piper-tts ARPABET_TO_VISeme)   */
/* ========================================================================== */
const ARPABET_TO_VISeme = {
  'AA': 'AAH',    'AE': 'AAH',    'AH': 'AAH',     'AO': 'OH',
  'AW': 'AAH',    'AY': 'AAH',    'B':  'MBP',     'CH': 'CH',
  'D':  'D',      'DH': 'TH',     'EH': 'EE',      'ER': 'R',
  'EY': 'EE',     'F':  'FV',     'G':  'G',       'HH': 'AAH',
  'IH': 'IH',     'IY': 'EE',     'JH': 'CH',      'K':  'K',
  'L':  'L',      'M':  'MBP',    'N':  'N',       'NG': 'N',
  'OW': 'OH',     'OY': 'OH',     'P':  'MBP',     'R':  'R',
  'S':  'S',      'SH': 'SH',     'T':  'T',       'TH': 'L',
  'UH': 'OOH',    'UW': 'OOH',    'V':  'FV',      'W':  'W',
  'WH': 'W',      'Y':  'EE',     'Z':  'S',       'ZH': 'SH',
};

/* ========================================================================== */
/* ARKit blendshape name-to-index mapping (shared with viseme.js)            */
/* ========================================================================== */
// Re-use ARKIT_NAMES from viseme.js (loaded first) or define locally if missing
const ARKIT_NAMES_SYNC = typeof ARKIT_NAMES !== 'undefined' ? ARKIT_NAMES : [
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

const NAME_TO_INDEX = Object.fromEntries(ARKIT_NAMES_SYNC.map((n, i) => [n, i]));

/* ========================================================================== */
/* Viseme definitions — exact same definitions from viseme.js                 */
/* ========================================================================== */
const VISEMES = {
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

/* ========================================================================== */
/* Helper: convert viseme name → Float32Array(52)                             */
/* ========================================================================== */
const _tmpVisemeMap = new Map();
function visemeToWeights(name) {
  const cached = _tmpVisemeMap.get(name);
  if (cached) return cached;

  const w = new Float32Array(52);
  const def = VISEMES[name] || VISEMES.REST;
  for (const [blendName, value] of Object.entries(def)) {
    const idx = NAME_TO_INDEX[blendName];
    if (idx !== undefined) w[idx] = value;
  }
  _tmpVisemeMap.set(name, w);
  return w;
}

/* ========================================================================== */
/* Helper: smoothstep / cosine blend factor (0→1)                             */
/* ========================================================================== */
function smoothBlend(t) {
  // Cosine interpolation for smooth ramps
  return 0.5 * (1 - Math.cos(t * Math.PI));
}

/* ========================================================================== */
/* VisemeSyncPlayer                                                            */
/* ========================================================================== */
class VisemeSyncPlayer {
  /** Fraction of phoneme used for fade-in (0..0.5). Remainder for fade-out. */
  static FADE_FRACTION = 0.3;

  constructor() {
    /** @type {Array<{startTime:number, endTime:number, viseme:string, phoneme:string}>} */
    this._events = [];
    /** Offset to add to every event's startTime so scheduling is relative to audioCtx.currentTime. */
    this._audioStartTime = 0;
    /** Whether playback is active. */
    this._isActive = false;
  }

  /* ----------------------------------------------------------------------- */
  /**
   * Schedule phoneme events for playback.
   *
   * @param {Array<{phoneme:string, startTime:number, duration:number, [viseme:string]}>} phonemeEvents
   *   Each event has:
   *     - phoneme : ARPAbet phoneme name (e.g. 'AA', 'CH', 'S')
   *     - startTime: seconds relative to audioStartTime (0 = the moment audio begins)
   *     - duration : seconds the phoneme is held
   *     - viseme   : optional override viseme name; derived from phoneme if omitted
   * @param {number} audioStartTime
   *   The value of `audioCtx.currentTime` at which audio playback will begin
   *   (or has already begun). Events will be mapped to absolute audio context
   *   time.
   */
  schedule(phonemeEvents, audioStartTime) {
    this._events = [];
    this._audioStartTime = audioStartTime || 0;
    this._isActive = phonemeEvents.length > 0;

    // Pre-build sorted event list with absolute times
    const sorted = phonemeEvents
      .filter(e => e.duration > 0)
      .sort((a, b) => a.startTime - b.startTime);

    for (const evt of sorted) {
      const viseme = evt.viseme || ARPABET_TO_VISeme[evt.phoneme] || 'REST';
      this._events.push({
        startTime: this._audioStartTime + evt.startTime,
        endTime:   this._audioStartTime + evt.startTime + evt.duration,
        viseme,
        phoneme:   evt.phoneme,
      });
    }
  }

  /* ----------------------------------------------------------------------- */
  /** Cancel playback and clear all scheduled events. Weights return to zero. */
  stop() {
    this._events = [];
    this._isActive = false;
  }

  /* ----------------------------------------------------------------------- */
  /** @returns {boolean} True if there are still events to be played. */
  get isActive() {
    if (!this._isActive || this._events.length === 0) return false;
    const lastEnd = this._events[this._events.length - 1].endTime;
    return performance.now() / 1000 <= lastEnd + 0.1; // small grace
  }

  /* ----------------------------------------------------------------------- */
  /**
   * Get the current ARKit blendshape weights for the given audio context time.
   *
   * @param {number} audioTime  audioCtx.currentTime
   * @returns {Float32Array(52)}
   */
  getCurrentWeights(audioTime) {
    const result = new Float32Array(52);

    if (!this._isActive || this._events.length === 0) {
      return result; // REST = all zeros
    }

    const fadeFraction = VisemeSyncPlayer.FADE_FRACTION;

    // Binary search to find the first event whose endTime > audioTime
    let idx = this._findEventIndex(audioTime);

    // If we're before the first event or after the last, return rest
    if (idx < 0 || idx >= this._events.length) {
      return result;
    }

    const current = this._events[idx];
    const currentDuration = current.endTime - current.startTime;
    if (currentDuration <= 0) {
      return result;
    }

    // Where are we inside this phoneme? 0 → start, 1 → end
    const phase = Math.max(0, Math.min(1,
      (audioTime - current.startTime) / currentDuration
    ));

    const prevEvent  = idx > 0 ? this._events[idx - 1] : null;
    const nextEvent  = idx < this._events.length - 1 ? this._events[idx + 1] : null;

    const currentWeights = visemeToWeights(current.viseme);

    // --- Determine blend regions ---
    // Fade-in: from prev → current during first FADE_FRACTION of current phoneme
    // Hold:    full current during middle region
    // Fade-out: from current → next during last FADE_FRACTION of current phoneme

    const fadeInEnd  = fadeFraction;
    const fadeOutStart = 1 - fadeFraction;

    let prevFactor = 0;
    let currFactor = 0;
    let nextFactor = 0;

    if (phase < fadeInEnd) {
      // Fading in from previous
      const localT = phase / fadeInEnd; // 0..1
      currFactor = smoothBlend(localT);
      if (prevEvent) {
        prevFactor = 1 - currFactor;
      } else {
        prevFactor = 1 - currFactor; // blend toward REST implicitly
      }
      currFactor = currFactor; // already smooth
    } else if (phase > fadeOutStart && nextEvent) {
      // Fading out to next
      const localT = (phase - fadeOutStart) / (1 - fadeOutStart); // 0..1
      currFactor = 1 - smoothBlend(localT);
      nextFactor = smoothBlend(localT);
    } else {
      // Fully in the current phoneme
      currFactor = 1;
    }

    // Apply weighted sum: prev * prevFactor + curr * currFactor + next * nextFactor
    // We need prev and next weights too
    const prevWeights = prevFactor > 0 ? visemeToWeights(prevEvent ? prevEvent.viseme : 'REST') : null;
    const nextWeights = nextFactor > 0 ? visemeToWeights(nextEvent.viseme) : null;

    for (let i = 0; i < 52; i++) {
      let w = currentWeights[i] * currFactor;
      if (prevWeights && prevFactor > 0.001) w += prevWeights[i] * prevFactor;
      if (nextWeights && nextFactor > 0.001) w += nextWeights[i] * nextFactor;
      result[i] = w;
    }

    return result;
  }

  /* ----------------------------------------------------------------------- */
  /**
   * Find the index of the event that is active at the given audio time.
   * Returns -1 if before all events, or events.length if after all events.
   */
  _findEventIndex(audioTime) {
    const events = this._events;
    // Early exit: before first
    if (audioTime < events[0].startTime) return -1;
    // After last
    if (audioTime >= events[events.length - 1].endTime) return events.length;

    // Binary search
    let lo = 0, hi = events.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const evt = events[mid];
      if (audioTime >= evt.startTime && audioTime < evt.endTime) {
        return mid;
      }
      if (audioTime < evt.startTime) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    // We're in a gap between events
    return hi < events.length ? hi + 1 : events.length;
  }
}

// Expose globally so index.html or scripts can access it via window.VisemeSyncPlayer
window.VisemeSyncPlayer = VisemeSyncPlayer;
})();
