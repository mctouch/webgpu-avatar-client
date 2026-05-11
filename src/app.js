// Avatar Platform Web Client — Conversational AI Edition
// Supports both WebGPU (WASM) and WebGL2 fallback
// Pipeline: Mic → ASR → LLM → TTS → A2F → Avatar

class AvatarApp {
    constructor() {
        this.engine = null;
        this.backend = null;
        this.audioContext = null;
        this.workletNode = null;
        this.isStreaming = false;
        this.modelLoaded = false;
        this.logs = [];
        this.conversation = [];
        this.recording = false;
        this.recordedChunks = [];
        this.initialized = false;
        this.talkAudioCtx = null;
        this.talkMicStream = null;
        this.talkProcessor = null;

        // Web Speech API fallback
        this.speechRecognition = null;
        this.speechTranscript = '';

        // TTS state
        this.currentUtterance = null;

        this.ARKIT_ORDER = [
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
    }

    log(msg, type='info') {
        const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.logs.push(line);
        console.log(`[app] ${msg}`);
        const el = document.getElementById('log');
        if (el) {
            const d = document.createElement('div');
            d.className = type;
            d.textContent = line;
            el.appendChild(d);
            el.scrollTop = el.scrollHeight;
        }
    }

    toBlendshapeArray(obj) {
        const normalized = {};
        for (const [key, val] of Object.entries(obj)) {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            normalized[camel] = val;
        }
        return this.ARKIT_ORDER.map(name => normalized[name] || 0.0);
    }

    // ========== Init =========================================================
    async init() {
        if (this.initialized) {
            this.log('Already initialized');
            return;
        }
        try {
            this.log('Initializing Avatar Platform...');
            const canvas = document.getElementById('avatar-canvas');
            if (!canvas) throw new Error('Canvas not found');

            const viewport = document.getElementById('viewport');
            const rect = viewport.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            if (navigator.gpu) {
                this.log('WebGPU detected, trying WASM backend...');
                try {
                    await this.initWebGPU(canvas);
                    this.backend = 'webgpu';
                    this.log('WebGPU backend active');
                } catch (e) {
                    this.log('WebGPU init failed: ' + e.message, 'warn');
                    this.log('Falling back to WebGL2...');
                    await this.initWebGL2(canvas);
                    this.backend = 'webgl2';
                    this.log('WebGL2 backend active');
                }
            } else {
                this.log('WebGPU not available, using WebGL2 fallback...');
                await this.initWebGL2(canvas);
                this.backend = 'webgl2';
                this.log('WebGL2 backend active');
            }

            this.modelLoaded = true;

            const placeholder = document.getElementById('placeholder');
            if (placeholder) placeholder.style.display = 'none';
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            this.startRenderLoop();
            this.startDemoAnimation();
            this.log('Initialization complete (' + this.backend + ')');
            this.initialized = true;

            // Update connection status badge
            const connBadge = document.getElementById('conn-status');
            if (connBadge) {
                connBadge.textContent = 'Connected';
                connBadge.className = 'status-badge status-ok';
            }

            // Enable buttons
            const btnMic = document.getElementById('btn-mic');
            const btnTest = document.getElementById('btn-test');
            const btnGreet = document.getElementById('btn-greet');
            const btnTalk = document.getElementById('btn-talk');
            if (btnMic) btnMic.disabled = false;
            if (btnTest) btnTest.disabled = false;
            if (btnGreet) btnGreet.disabled = false;
            if (btnTalk) btnTalk.disabled = false;

            // Update backend status indicators
            this.updateBackendStatus();

        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            this.log('INIT FAILED: ' + msg, 'error');
            throw e;
        }
    }

    async initWebGPU(canvas) {
        if (!window.WebGPUAvatarRenderer) throw new Error('WebGPUAvatarRenderer not loaded');
        this.engine = new window.WebGPUAvatarRenderer(canvas);
        await this.engine.init();
        await this.engine.loadModel('/avatar.glb');
    }

    async initWebGL2(canvas) {
        if (!window.WebGL2AvatarRenderer) throw new Error('WebGL2AvatarRenderer not loaded');
        this.engine = new window.WebGL2AvatarRenderer(canvas);
        await this.engine.loadModel('/avatar.glb');
    }

    setEngineBlendshapes(arr) {
        if (!this.engine) return;
        this.engine.setBlendshapesArray(arr);
    }

    startDemoAnimation() {
        if (this.demoInterval) clearInterval(this.demoInterval);
        let t = 0;
        this.demoInterval = setInterval(() => {
            if (!this.engine || this.isStreaming) return;
            t += 0.05;
            const eye = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.05;
            try {
                const arr = this.toBlendshapeArray({
                    eyeBlinkLeft: eye,
                    eyeBlinkRight: eye,
                    browInnerUp: Math.abs(Math.sin(t * 0.3)) * 0.1,
                    browOuterUpRight: Math.abs(Math.cos(t * 0.4)) * 0.08,
                    // Static neutral mouth pose — prevents base-mesh collapse
                    jawOpen: 0.10,
                    mouthSmileLeft: 0.06,
                    mouthSmileRight: 0.06,
                });
                this.setEngineBlendshapes(arr);
            } catch (e) {
                // ignore
            }
        }, 50);
    }

    stopDemoAnimation() {
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
    }

    startRenderLoop() {
        let lastTime = performance.now();
        const loop = (now) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            if (this.engine) {
                try { this.engine.render(dt); } catch (e) {}
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // ========== Backend Status ===============================================
    async updateBackendStatus() {
        try {
            const res = await fetch('/v1/audio2face/health');
            const data = await res.json();
            const el = document.getElementById('a2f-status');
            if (el) el.textContent = data.a2f_reachable ? 'OK' : 'Degraded';
        } catch (e) {
            const el = document.getElementById('a2f-status');
            if (el) el.textContent = 'Offline';
        }

        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            const asrEl = document.getElementById('asr-status');
            const llmEl = document.getElementById('llm-status');
            const ttsEl = document.getElementById('tts-status');
            if (asrEl) asrEl.textContent = data.services.includes('asr') ? 'OK' : 'N/A';
            if (llmEl) llmEl.textContent = data.services.includes('chat') ? 'OK' : 'N/A';
            if (ttsEl) ttsEl.textContent = window.RivaTTS ? 'OK' : 'N/A';
        } catch (e) {
            const asrEl = document.getElementById('asr-status');
            const llmEl = document.getElementById('llm-status');
            if (asrEl) asrEl.textContent = 'Offline';
            if (llmEl) llmEl.textContent = 'Offline';
        }
    }

    // ========== Microphone (real-time A2F) ===================================
    async startMicrophone() {
        try {
            this.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: false, noiseSuppression: false }
            });
            this.log('Microphone access granted');

            this.audioContext = new AudioContext({ sampleRate: 16000 });
            await this.audioContext.audioWorklet.addModule('/audio-worklet.js');

            const source = this.audioContext.createMediaStreamSource(stream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-streamer');

            this.workletNode.port.onmessage = (e) => {
                if (e.data.type === 'audio') {
                    this.sendAudioToBackend(e.data.pcm);
                }
            };

            source.connect(this.workletNode);
            this.isStreaming = true;
            this.stopDemoAnimation();
            this.log('Audio streaming started (16kHz PCM -> Audio2Face)');
        } catch (e) {
            this.log('Mic error: ' + ((e && e.message) ? e.message : String(e)), 'error');
        }
    }

    stopMicrophone() {
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isStreaming = false;
        this.startDemoAnimation();
        this.log('Audio streaming stopped');
    }

    async sendAudioToBackend(samples) {
        if (!this.audioAccumulator) this.audioAccumulator = [];
        for (let i = 0; i < samples.length; i++) {
            this.audioAccumulator.push(Math.round(samples[i] * 32767));
        }
        if (this.audioAccumulator.length < 5120) return;
        const pcm16 = new Int16Array(this.audioAccumulator.splice(0, 5120));

        try {
            const response = await fetch('/v1/audio2face/encode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: pcm16
            });
            if (!response.ok) {
                this.log('A2F fetch failed: ' + response.status, 'error');
                return;
            }
            const data = await response.json();
            if (data.latest_frame && data.latest_frame.blendshapes) {
                const arr = this.toBlendshapeArray(data.latest_frame.blendshapes);
                const maxVal = Math.max(...arr);
                if (maxVal > 0.001) {
                    this.setEngineBlendshapes(arr);
                }
            } else if (data.error) {
                this.log('A2F error: ' + data.error, 'error');
            }
        } catch (e) {
            this.log('A2F send error: ' + e.message, 'error');
        }
    }

    toggleMic() {
        if (this.isStreaming) {
            this.stopMicrophone();
        } else {
            this.startMicrophone();
        }
    }

    // ========== Test A2F =====================================================
    async testAudio2Face() {
        try {
            this.log('Testing Audio2Face with synthetic audio...');
            const sampleRate = 16000;
            const duration = 1.0;
            const samples = new Int16Array(sampleRate * duration);
            for (let i = 0; i < samples.length; i++) {
                const t = i / sampleRate;
                samples[i] = Math.round(Math.sin(2 * Math.PI * 440 * t) * 16000);
            }
            const response = await fetch('/v1/audio2face/encode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: samples
            });
            const data = await response.json();
            this.log('A2F test response keys: ' + Object.keys(data).join(', '));
            if (data.latest_frame && data.latest_frame.blendshapes) {
                const arr = this.toBlendshapeArray(data.latest_frame.blendshapes);
                const maxVal = Math.max(...arr);
                this.log('A2F test blendshapes max=' + maxVal.toFixed(3));
                if (maxVal > 0.001) {
                    this.setEngineBlendshapes(arr);
                    this.log('A2F test: applied to avatar', 'ok');
                } else {
                    this.log('A2F test: all blendshapes near zero', 'warn');
                }
            } else if (data.error) {
                this.log('A2F test error: ' + data.error, 'error');
            }
        } catch (e) {
            this.log('Audio2Face test error: ' + e.message, 'error');
        }
    }

    testA2F() {
        this.testAudio2Face();
    }

    // ========== TTS + A2F Pipeline ==========================================
    async speakWithTTS(text) {
        if (!window.RivaTTS || !window.RivaTTS.RivaTTSClient) {
            this.log('Riva TTS client not loaded, falling back to speechSynthesis', 'warn');
            return this.speakWithBrowserTTS(text);
        }
        if (!window.Audio2FaceClient) {
            this.log('Audio2Face client not loaded, falling back to speechSynthesis', 'warn');
            return this.speakWithBrowserTTS(text);
        }

        this.log('Synthesizing TTS via Riva...');
        this.stopDemoAnimation();
        this.isStreaming = true;

        try {
            const riva = new window.RivaTTS.RivaTTSClient(window.location.origin);
            const pcmFloat32 = await riva.synthesize(text, 'English-US.Female-1', 16000);
            this.log('TTS synthesized: ' + pcmFloat32.length + ' samples (' + (pcmFloat32.length/16000).toFixed(2) + 's)');

            const a2f = new window.Audio2FaceClient({
                envoyUrl: window.location.origin,
                sampleRate: 16000,
                bitsPerSample: 16,
                channels: 1
            });
            await a2f.startStream();
            this.log('A2F stream started');

            let audioCtx;
            try {
                audioCtx = new AudioContext({ sampleRate: 16000 });
            } catch (audioErr) {
                if (audioErr.name === 'NotAllowedError') {
                    throw new Error('Audio playback blocked: please click a button first to enable audio.');
                }
                throw audioErr;
            }
            const audioBuffer = audioCtx.createBuffer(1, pcmFloat32.length, 16000);
            audioBuffer.copyToChannel(pcmFloat32, 0);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);

            const pcmInt16 = new Int16Array(pcmFloat32.length);
            for (let i = 0; i < pcmFloat32.length; i++) {
                pcmInt16[i] = Math.max(-32768, Math.min(32767, Math.round(pcmFloat32[i] * 32767)));
            }

            const chunkSize = 1600;
            const chunks = [];
            for (let off = 0; off < pcmInt16.length; off += chunkSize) {
                chunks.push(pcmInt16.slice(off, Math.min(off + chunkSize, pcmInt16.length)));
            }

            const blendshapeQueue = [];
            let a2fDone = false;
            const readA2F = async () => {
                try {
                    for await (const frame of a2f.responses()) {
                        if (frame && frame.blendshapeWeights) {
                            blendshapeQueue.push(frame.blendshapeWeights);
                        }
                    }
                } catch (e) {
                    this.log('A2F response error: ' + e.message, 'warn');
                }
                a2fDone = true;
            };
            readA2F();

            const startTime = audioCtx.currentTime + 0.1;
            source.start(startTime);

            const chunkDuration = chunkSize / 16000;
            for (let i = 0; i < chunks.length; i++) {
                await a2f.sendAudioChunk(chunks[i]);
                await new Promise(r => setTimeout(r, chunkDuration * 1000 * 0.5));
            }
            await a2f.endAudio();
            this.log('Audio sent to A2F, waiting for blendshapes...');

            const applyLoop = () => {
                if (blendshapeQueue.length > 0) {
                    const weights = blendshapeQueue.shift();
                    this.setEngineBlendshapes(weights);
                }
                if (!a2fDone || blendshapeQueue.length > 0) {
                    requestAnimationFrame(applyLoop);
                } else {
                    this.isStreaming = false;
                    this.startDemoAnimation();
                    this.log('TTS playback complete');
                }
            };
            applyLoop();

            source.onended = () => {
                if (audioCtx.state !== 'closed') audioCtx.close();
            };

        } catch (e) {
            this.log('TTS/A2F error: ' + e.message + '. Falling back to browser TTS.', 'error');
            this.isStreaming = false;
            this.startDemoAnimation();
            return this.speakWithBrowserTTS(text);
        }
    }

    // ========== Greeting =====================================================
    async speakGreeting() {
        const text = "Hello! I am your avatar assistant. Welcome to the Avatar Engine.";
        this.log('Speaking greeting...');

        if (window.RivaTTS && window.Audio2FaceClient) {
            return this.speakWithTTS(text);
        }

        this.stopDemoAnimation();
        this.isStreaming = true;

        let voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
            await new Promise(resolve => {
                const handler = () => {
                    voices = window.speechSynthesis.getVoices();
                    window.speechSynthesis.removeEventListener('voiceschanged', handler);
                    resolve();
                };
                window.speechSynthesis.addEventListener('voiceschanged', handler);
                setTimeout(resolve, 1000);
            });
        }
        const femaleVoice = voices.find(v =>
            /Samantha|Victoria|Karen|Moira|Tessa|Fiona|Serena|Zira/.test(v.name)
        ) || voices.find(v => v.lang === 'en-US' && /Google|Apple/.test(v.name))
          || voices.find(v => v.lang && v.lang.startsWith('en'));

        const utterance = new SpeechSynthesisUtterance(text);
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.92;
        utterance.pitch = 1.15;
        utterance.volume = 1.0;

        utterance.onstart = () => { this.log('Greeting audio started'); };
        utterance.onend = () => {
            this.isStreaming = false;
            this.startDemoAnimation();
            this.log('Greeting complete');
        };
        utterance.onerror = (e) => {
            this.log('TTS error: ' + e.error, 'warn');
            this.isStreaming = false;
            this.startDemoAnimation();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // ========== Browser TTS Fallback =========================================
    async speakWithBrowserTTS(text) {
        // Cancel any previous speech
        if (this.currentUtterance) {
            window.speechSynthesis.cancel();
            this.currentUtterance = null;
        }
        this.log('Speaking via browser TTS: ' + text.substring(0, 60) + (text.length > 60 ? '...' : ''));
        this.stopDemoAnimation();
        this.isStreaming = true;

        let voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
            await new Promise(resolve => {
                const handler = () => {
                    voices = window.speechSynthesis.getVoices();
                    window.speechSynthesis.removeEventListener('voiceschanged', handler);
                    resolve();
                };
                window.speechSynthesis.addEventListener('voiceschanged', handler);
                setTimeout(resolve, 1000);
            });
        }
        const femaleVoice = voices.find(v =>
            /Samantha|Victoria|Karen|Moira|Tessa|Fiona|Serena|Zira/.test(v.name)
        ) || voices.find(v => v.lang === 'en-US' && /Google|Apple/.test(v.name))
          || voices.find(v => v.lang && v.lang.startsWith('en'));

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.92;
        utterance.pitch = 1.15;
        utterance.volume = 1.0;

        utterance.onstart = () => { this.log('Browser TTS audio started'); };
        utterance.onend = () => {
            this.isStreaming = false;
            this.currentUtterance = null;
            this.startDemoAnimation();
            this.log('Browser TTS complete');
        };
        utterance.onerror = (e) => {
            this.log('Browser TTS error: ' + e.error, 'warn');
            this.isStreaming = false;
            this.currentUtterance = null;
            this.startDemoAnimation();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // ========== Conversation: Talk → ASR → LLM → TTS → A2F ===========
    async startTalk() {
        if (this.recording) return;
        this.recording = true;
        this.recordedChunks = [];
        this.speechTranscript = '';

        const btnTalk = document.getElementById('btn-talk');
        const convStatus = document.getElementById('conversation-status');
        if (btnTalk) { btnTalk.classList.add('recording'); btnTalk.textContent = 'Listening...'; }
        if (convStatus) convStatus.textContent = 'Recording... speak now';
        this.log('Started recording for ASR', 'info');

        // Use Web Speech API if available (Chrome supports this well)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            try {
                this.speechRecognition = new SpeechRecognition();
                this.speechRecognition.continuous = true;
                this.speechRecognition.interimResults = true;
                this.speechRecognition.lang = 'en-US';
                this.speechRecognition.onresult = (e) => {
                    let interim = '';
                    let final = '';
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        const transcript = e.results[i][0].transcript;
                        if (e.results[i].isFinal) {
                            final += transcript;
                        } else {
                            interim += transcript;
                        }
                    }
                    if (final) this.speechTranscript += final;
                    if (convStatus) convStatus.textContent = interim || final || 'Listening...';
                };
                this.speechRecognition.onerror = (e) => {
                    if (e.error !== 'no-speech' && e.error !== 'aborted') {
                        this.log('Speech recognition error: ' + e.error, 'warn');
                    }
                };
                this.speechRecognition.start();
                this.log('Using Web Speech API for ASR');
                return;
            } catch (e) {
                this.log('Web Speech API failed: ' + e.message + ', falling back to manual recording', 'warn');
                this.speechRecognition = null;
            }
        }

        // Fallback: manual ScriptProcessorNode recording
        let localAudioCtx = null;
        let localMicStream = null;
        let localProcessor = null;

        try {
            localAudioCtx = new AudioContext({ sampleRate: 16000 });
            localMicStream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            const source = localAudioCtx.createMediaStreamSource(localMicStream);
            localProcessor = localAudioCtx.createScriptProcessor(4096, 1, 1);
            localProcessor.onaudioprocess = (e) => {
                if (!this.recording) return;
                const input = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    pcm16[i] = Math.max(-32768, Math.min(32767, input[i] * 32767));
                }
                const buf = new Uint8Array(pcm16.buffer);
                this.recordedChunks.push(buf);
            };
            source.connect(localProcessor);
            localProcessor.connect(localAudioCtx.destination);

            // Store locally so stopTalk can clean up
            this.talkAudioCtx = localAudioCtx;
            this.talkMicStream = localMicStream;
            this.talkProcessor = localProcessor;
        } catch (e) {
            this.log('Talk mic error: ' + e.message, 'error');
            this.stopTalk();
        }
    }

    async stopTalk() {
        if (!this.recording) return;
        this.recording = false;

        const btnTalk = document.getElementById('btn-talk');
        const convStatus = document.getElementById('conversation-status');
        if (btnTalk) { btnTalk.classList.remove('recording'); btnTalk.textContent = 'Hold to Talk'; }
        if (convStatus) convStatus.textContent = 'Processing speech...';
        this.log('Stopped recording, sending to ASR...', 'info');

        // Stop Web Speech API if active
        if (this.speechRecognition) {
            try { this.speechRecognition.stop(); } catch (e) {}
            await new Promise(r => setTimeout(r, 500)); // let final results come in
            const transcript = this.speechTranscript.trim();
            this.speechRecognition = null;
            if (transcript) {
                this.log('Web Speech ASR: "' + transcript + '"', 'ok');
                this.addChatMessage('user', transcript);
                await this.processUserMessage(transcript, convStatus);
            } else {
                this.log('No speech detected from Web Speech API', 'warn');
                if (convStatus) convStatus.textContent = 'No speech detected. Try again.';
            }
            return;
        }

        // Clean up manual recording
        if (this.talkProcessor) { this.talkProcessor.disconnect(); this.talkProcessor = null; }
        if (this.talkMicStream) { this.talkMicStream.getTracks().forEach(t => t.stop()); this.talkMicStream = null; }
        if (this.talkAudioCtx) { this.talkAudioCtx.close(); this.talkAudioCtx = null; }

        let totalLen = 0;
        for (const c of this.recordedChunks) totalLen += c.length;
        if (totalLen < 3200) {
            this.log('Audio too short, ignored', 'warn');
            if (convStatus) convStatus.textContent = 'No speech detected. Try again.';
            this.recordedChunks = [];
            return;
        }
        const merged = new Uint8Array(totalLen);
        let off = 0;
        for (const c of this.recordedChunks) { merged.set(c, off); off += c.length; }
        this.recordedChunks = [];

        try {
            const transcript = await this.sendAudioToASR(merged);
            if (!transcript) {
                if (convStatus) convStatus.textContent = 'No speech detected. Try again.';
                return;
            }
            this.addChatMessage('user', transcript);
            await this.processUserMessage(transcript, convStatus);
        } catch (e) {
            this.log('Conversation error: ' + e.message, 'error');
            if (convStatus) convStatus.textContent = 'Error: ' + e.message;
        }
    }

    async processUserMessage(transcript, convStatus) {
        if (convStatus) convStatus.textContent = 'AI is thinking...';
        const response = await this.sendToLLM(transcript);
        if (!response) {
            if (convStatus) convStatus.textContent = 'No response from AI.';
            return;
        }
        this.addChatMessage('assistant', response);

        if (convStatus) convStatus.textContent = 'AI is speaking...';
        await this.speakWithTTS(response);

        if (convStatus) convStatus.textContent = 'Press and hold to speak';
    }

    async sendAudioToASR(audioBuffer) {
        try {
            const res = await fetch('/api/asr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: audioBuffer,
            });
            const data = await res.json();
            if (data.error) {
                this.log('ASR error: ' + data.error, 'error');
                return null;
            }
            this.log('ASR: "' + data.transcript + '"', 'ok');
            return data.transcript;
        } catch (e) {
            this.log('ASR request failed: ' + e.message, 'error');
            return null;
        }
    }

    async sendToLLM(userText) {
        try {
            const messages = [
                { role: 'system', content: 'You are a helpful, friendly AI avatar assistant. Keep responses concise (1-2 sentences). Do not use markdown or formatting.' },
                ...this.conversation.map(m => ({ role: m.role, content: m.text })),
                { role: 'user', content: userText },
            ];

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, max_tokens: 150, temperature: 0.7 }),
            });
            const data = await res.json();
            if (data.error) {
                this.log('LLM error: ' + data.error, 'error');
                return null;
            }
            const choice = data.choices && data.choices[0];
            if (!choice) {
                this.log('LLM: no choices in response', 'error');
                return null;
            }
            const msg = choice.message;
            let text = msg.content || msg.reasoning || '';
            // Strip various reasoning/thinking tag formats
            text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
            text = text.replace(/Here's a thinking process:[\s\S]*?(?=\n\n|\n[A-Z]|$)/i, '');
            text = text.replace(/\*\*Thinking:[\s\S]*?(?=\n\n|\n[A-Z]|$)/i, '');
            text = text.replace(/<\|thinking\|>[\s\S]*?<\|end_thinking\|>/gi, '');
            text = text.trim();
            if (!text) text = "I'm not sure how to respond to that.";
            this.log('LLM: "' + text.substring(0, 80) + (text.length > 80 ? '...' : '') + '"', 'ok');
            return text;
        } catch (e) {
            this.log('LLM request failed: ' + e.message, 'error');
            return null;
        }
    }

    addChatMessage(role, text) {
        this.conversation.push({ role, text });
        const div = document.createElement('div');
        div.className = 'chat-msg ' + role;
        const roleLabel = role === 'user' ? 'You' : 'Avatar';
        div.innerHTML = '<div class="role">' + roleLabel + '</div><div class="text">' + this.escapeHtml(text) + '</div>';
        const hist = document.getElementById('chat-history');
        if (hist) {
            hist.appendChild(div);
            hist.scrollTop = hist.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.app = new AvatarApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.app.init());
} else {
    window.app.init();
}
