/**
 * AudioWorklet processor that captures microphone PCM and sends to main thread.
 */
class AudioStreamer extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.bufferSize = options.processorOptions?.bufferSize || 1600;
        this.accumulator = [];
    }

    process(inputs, _outputs, _parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;
        const channel = input[0];

        // Accumulate samples
        for (let i = 0; i < channel.length; i++) {
            this.accumulator.push(channel[i]);
        }

        // Send when buffer is full
        while (this.accumulator.length >= this.bufferSize) {
            const chunk = this.accumulator.slice(0, this.bufferSize);
            this.accumulator = this.accumulator.slice(this.bufferSize);
            this.port.postMessage({ type: 'audio', pcm: new Float32Array(chunk) });
            console.log('[worklet] sent chunk of', chunk.length);
        }

        return true;
    }
}

registerProcessor('audio-streamer', AudioStreamer);
// v20: added logging



