registerProcessor(
	"double-buffer",
	class extends AudioWorkletProcessor {
		__buffer1: Float32Array[];
		__buffer2: Float32Array[];

		__buffer2IsActive: boolean;

		__buffer1Ready: boolean;
		__buffer2Ready: boolean;

		__index: number;

		constructor() {
			super();

			this.__buffer1 = [];
			this.__buffer2 = [];
			this.__buffer1Ready = this.__buffer2Ready = this.__buffer2IsActive = false;
			this.__index = 0;

			this.port.onmessage = (e) => {
				const wasEmpty = this.__isEmpty;

				// new buffer sent to us!
				// write it to the inactive buffer
				if (this.__buffer2IsActive) {
					this.__buffer1 = e.data;
					this.__buffer1Ready = true;
				} else {
					this.__buffer2 = e.data;
					this.__buffer2Ready = true;
				}

				// if neither buffer filled, flip the buffers immediately to begin playback
				if (wasEmpty) this.__flip();
			};
		}

		__flip() {
			if (this.__buffer2IsActive) {
				this.__buffer2Ready = false;
				this.__buffer2IsActive = false;
			} else {
				this.__buffer1Ready = false;
				this.__buffer2IsActive = true;
			}

			this.__index = 0;

			if (this.__isEmpty) this.port.postMessage("EMPTY");
			else this.port.postMessage("HALF");
		}

		get __isEmpty() {
			return !this.__buffer1Ready && !this.__buffer2Ready;
		}

		get __isSaturated() {
			return this.__buffer1Ready && this.__buffer2Ready;
		}

		get __activeBuffer() {
			return this.__buffer2IsActive ? this.__buffer2 : this.__buffer1;
		}

		process(
			_inputs: Float32Array[][],
			outputs: Float32Array[][],
			_parameters: Record<string, Float32Array>,
		) {
			if (this.__isEmpty) return true;

			if (!outputs.length) return true;

			if (!this.__activeBuffer.length) return true;

			const nChannels = Math.min(outputs[0].length, this.__activeBuffer.length);

			const target = outputs[0];
			const source = this.__activeBuffer.map((b) => b.slice(this.__index));

			for (let i = 0; i < nChannels; i++) target[i].set(source[i]);

			// NOTE: we make the assumption that all channels are equal size.
			this.__index += source[0].length;

			if (source[0].length < target[0].length) {
				this.__flip();
				const leftToFill = target[0].length - source[0].length;

				// write starting at the place we finished writing from (source[0].length)
				// and cut down the source to only `leftToFill` length.
				for (let i = 0; i < nChannels; i++)
					target[i].set(source[i].slice(0, leftToFill), source[0].length);

				this.__index = leftToFill;
			}

			if (this.__index >= this.__activeBuffer[0].length) this.__flip();

			return true;
		}
	},
);
