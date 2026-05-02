// PersonaPlex WebSocket Client for Avatar Integration
// Protocol: kind=3 PCM (16kHz Int16 in, 24kHz float32 out), kind=2 text

class PersonaPlexClient {
    constructor(avatarApp) {
        this.app = avatarApp;
        this.ws = null;
        this.connected = false;
        this.audioCtx = null;
        this.nextPlayTime = 0;
        this.a2fClient = null;
        this.a2fStreaming = false;
        this.textBuffer = '';
        this.micStream = null;
        this.micAudioCtx = null;
        this.micWorklet = null;
        this.micAccumulator = [];
        this.isTalking = false;
        this.pendingA2FEnd = null;
    }

    async connect(textPrompt = '', voicePrompt = '') {
        if (this.connected) {
            this.app.log('PersonaPlex already connected');
            return;
        }

        const url = `wss://personaplex.capitalviz.com/api/chat?use_pcm=true&text_prompt=${encodeURIComponent(textPrompt)}&voice_prompt=${encodeURIComponent(voicePrompt)}`;
        this.app.log('Connecting to PersonaPlex...');

        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            this.connected = true;
            this.app.log('PersonaPlex connected');
            this.audioCtx = new AudioContext({ sampleRate: 24000 });
            this.nextPlayTime = 0;
            this.updateUI();
        };

        this.ws.onmessage = async (event) => {
            const data = new Uint8Array(event.data);
            const kind = data[0];
            const payload = data.slice(1);

            if (kind === 0x03) {
                const pcm24k = new Float32Array(payload.buffer);
                await this.handleAudioChunk(pcm24k);
            } else if (kind === 0x02) {
                const text = new TextDecoder().decode(payload);
                this.handleText(text);
            }
        };

        this.ws.onerror = (e) => {
            this.app.log('PersonaPlex WebSocket error', 'error');
        };

        this.ws.onclose = () => {
            this.connected = false;
            this.app.log('PersonaPlex disconnected');
            this.stopMic();
            this.closeA2F();
            this.updateUI();
        };
    }

    disconnect() {
        this.stopMic();
        this.closeA2F();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        this.updateUI();
    }

    async handleAudioChunk(pcm24k) {
        // 1. Gapless audio playback
        if (this.audioCtx) {
            const now = this.audioCtx.currentTime;
            if (this.nextPlayTime < now) this.nextPlayTime = now + 0.05;

            const buffer = this.audioCtx.createBuffer(1, pcm24k.length, 24000);
            buffer.copyToChannel(pcm24k, 0);
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioCtx.destination);
            source.start(this.nextPlayTime);
            this.nextPlayTime += pcm24k.length / 24000;
        }

        // 2. A2F lip-sync
        await this.sendToA2F(pcm24k);
    }

    async sendToA2F(pcm24k) {
        // Resample 24kHz → 16kHz for A2F
        let pcm16k;
        try {
            const offlineCtx = new OfflineAudioContext(1, Math.floor(pcm24k.length * 16000 / 24000), 16000);
            const buffer24k = offlineCtx.createBuffer(1, pcm24k.length, 24000);
            buffer24k.copyToChannel(pcm24k, 0);
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer24k;
            source.connect(offlineCtx.destination);
            source.start();
            const buffer16k = await offlineCtx.startRendering();
            pcm16k = buffer16k.getChannelData(0);
        } catch (e) {
            this.app.log('Resample error: ' + e.message, 'warn');
            return;
        }

        // Convert to Int16
        const int16 = new Int16Array(pcm16k.length);
        for (let i = 0; i < pcm16k.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, Math.round(pcm16k[i] * 32767)));
        }

        // Start A2F stream if needed
        if (!this.a2fStreaming) {
            try {
                this.a2fClient = new window.Audio2FaceClient({
                    envoyUrl: window.location.origin,
                    sampleRate: 16000,
                    bitsPerSample: 16,
                    channels: 1
                });
                await this.a2fClient.startStream();
                this.a2fStreaming = true;
                this.readA2FResponses();
            } catch (e) {
                this.app.log('A2F stream start error: ' + e.message, 'warn');
                return;
            }
        }

        try {
            await this.a2fClient.sendAudioChunk(int16);
        } catch (e) {
            this.app.log('A2F send error: ' + e.message, 'warn');
        }

        // Schedule A2F stream end after a silence period
        if (this.pendingA2FEnd) clearTimeout(this.pendingA2FEnd);
        this.pendingA2FEnd = setTimeout(() => this.closeA2F(), 800);
    }

    async readA2FResponses() {
        try {
            for await (const frame of this.a2fClient.responses()) {
                if (frame && frame.blendshapeWeights) {
                    const w = frame.blendshapeWeights;
                    // Log top 5 active blendshapes for debugging
                    const top5 = w.map((v, i) => ({ name: ARKIT_NAMES[i] || `idx${i}`, val: v }))
                        .sort((a, b) => b.val - a.val)
                        .slice(0, 5)
                        .filter(x => x.val > 0.001)
                        .map(x => `${x.name}=${x.val.toFixed(3)}`)
                        .join(', ');
                    if (top5) console.log('[PersonaPlex] A2F top blendshapes:', top5);
                    this.app.setEngineBlendshapes(frame.blendshapeWeights);
                }
            }
        } catch (e) {
            this.app.log('A2F response error: ' + e.message, 'warn');
        }
        this.a2fStreaming = false;
    }

    closeA2F() {
        if (this.pendingA2FEnd) {
            clearTimeout(this.pendingA2FEnd);
            this.pendingA2FEnd = null;
        }
        if (this.a2fClient && this.a2fStreaming) {
            this.a2fClient.endAudio().catch(() => {});
            this.a2fStreaming = false;
        }
    }

    handleText(text) {
        this.textBuffer += text;
        const chatEl = document.getElementById('chat-messages');
        if (chatEl) {
            chatEl.textContent += text;
            chatEl.scrollTop = chatEl.scrollHeight;
        }
        // Also log
        this.app.log('PersonaPlex: ' + text);
    }

    async startMic() {
        if (this.isTalking) return;
        try {
            this.app.log('Starting mic for PersonaPlex...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: false, noiseSuppression: false }
            });

            this.micAudioCtx = new AudioContext({ sampleRate: 16000 });
            await this.micAudioCtx.audioWorklet.addModule('/audio-worklet.js');

            const source = this.micAudioCtx.createMediaStreamSource(stream);
            this.micWorklet = new AudioWorkletNode(this.micAudioCtx, 'audio-streamer');

            this.micWorklet.port.onmessage = (e) => {
                if (e.data.type === 'audio') {
                    this.queueAudioChunk(e.data.pcm);
                }
            };

            source.connect(this.micWorklet);
            this.micStream = stream;
            this.isTalking = true;
            this.app.stopDemoAnimation();
            this.app.log('Mic streaming to PersonaPlex');
            this.updateUI();
        } catch (e) {
            this.app.log('Mic error: ' + e.message, 'error');
        }
    }

    stopMic() {
        if (!this.isTalking) return;
        if (this.micWorklet) {
            this.micWorklet.disconnect();
            this.micWorklet = null;
        }
        if (this.micAudioCtx) {
            this.micAudioCtx.close().catch(() => {});
            this.micAudioCtx = null;
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(t => t.stop());
            this.micStream = null;
        }
        this.isTalking = false;
        this.micAccumulator = [];
        this.app.startDemoAnimation();
        this.app.log('Mic streaming stopped');
        this.updateUI();
    }

    toggleMic() {
        if (this.isTalking) {
            this.stopMic();
        } else {
            this.startMic();
        }
    }

    queueAudioChunk(pcmFloat32) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Accumulate and convert to Int16
        for (let i = 0; i < pcmFloat32.length; i++) {
            this.micAccumulator.push(Math.max(-32768, Math.min(32767, Math.round(pcmFloat32[i] * 32767))));
        }

        // Send ~160ms chunks (2560 samples at 16kHz) for low latency
        const chunkSize = 2560;
        while (this.micAccumulator.length >= chunkSize) {
            const chunk = new Int16Array(this.micAccumulator.splice(0, chunkSize));
            const msg = new Uint8Array(1 + chunk.length * 2);
            msg[0] = 0x03;
            const view = new DataView(msg.buffer);
            for (let i = 0; i < chunk.length; i++) {
                view.setInt16(1 + i * 2, chunk[i], true); // little-endian
            }
            this.ws.send(msg);
        }
    }

    updateUI() {
        const btnConnect = document.getElementById('btn-pp-connect');
        const btnTalk = document.getElementById('btn-pp-talk');
        const status = document.getElementById('pp-status');

        if (btnConnect) {
            btnConnect.textContent = this.connected ? 'Disconnect PersonaPlex' : 'Connect PersonaPlex';
            btnConnect.disabled = false;
        }
        if (btnTalk) {
            btnTalk.textContent = this.isTalking ? 'Stop Talking' : 'Talk to PersonaPlex';
            btnTalk.disabled = !this.connected;
        }
        if (status) {
            status.textContent = this.connected
                ? (this.isTalking ? '● Connected — Listening' : '● Connected')
                : '○ Disconnected';
            status.style.color = this.connected ? '#10b981' : '#9ca3af';
        }
    }
}

window.PersonaPlexClient = PersonaPlexClient;

