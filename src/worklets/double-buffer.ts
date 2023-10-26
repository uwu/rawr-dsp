registerProcessor("double-buffer", class extends AudioWorkletProcessor {

	#buffer1: Float32Array[];
	#buffer2: Float32Array[];

	#buffer2IsActive: boolean;

	#buffer1Ready: boolean;
	#buffer2Ready: boolean;

	#index: number;

	constructor() {
		super();

		this.#buffer1 = [];
		this.#buffer2 = [];
		this.#buffer1Ready = this.#buffer2Ready = this.#buffer2IsActive = false;
		this.#index = 0;

		this.port.onmessage = (e) => {
			const wasEmpty = this.#isEmpty;


			// new buffer sent to us!
			// write it to the inactive buffer
			if (this.#buffer2IsActive) {
				this.#buffer1 = e.data;
				this.#buffer1Ready = true;
			} else {
				this.#buffer2 = e.data;
				this.#buffer2Ready = true;
			}

			// if neither buffer filled, flip the buffers immediately to begin playback
			if (wasEmpty) this.#flip();
		};
	}

	#flip() {
		if (this.#buffer2IsActive) {
			this.#buffer2Ready = false;
			this.#buffer2IsActive = false;
		}
		else {
			this.#buffer1Ready = false;
			this.#buffer2IsActive = true;
		}

		this.#index = 0;

		if (this.#isEmpty)
			this.port.postMessage("EMPTY");
		else this.port.postMessage("HALF");
	}

	get #isEmpty() {
		return !this.#buffer1Ready && !this.#buffer2Ready;
	}

	get #isSaturated() {
		return this.#buffer1Ready && this.#buffer2Ready;
	}

	get #activeBuffer() {
		return this.#buffer2IsActive ? this.#buffer2 : this.#buffer1;
	}

	process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>) {
		if (this.#isEmpty) return true;

		if (!outputs.length) return true;

		if (!this.#activeBuffer.length) return true;

		for (let i = 0; i < Math.min(outputs[0].length, this.#activeBuffer.length); i++) {
			const outputChannel = outputs[0][i];
			const toSet = this.#activeBuffer[i].slice(this.#index);

			outputChannel.set(toSet);

			if (i === 0) this.#index += toSet.length;

			if (toSet.length < outputChannel.length)
			{
				this.#flip();
				const remaining = outputChannel.length - toSet.length;

				outputChannel.set(this.#activeBuffer[i].slice(0, remaining), toSet.length);

				if (i === 0) this.#index = remaining;
			}
		}

		if (this.#index >= this.#activeBuffer[0].length)
			this.#flip();

		return true;
	}
});