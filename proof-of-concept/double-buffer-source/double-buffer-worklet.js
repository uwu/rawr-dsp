class DoubleBufferProcessor extends AudioWorkletProcessor {

	buffer1;
	buffer2;

	buffer2IsActive;

	buffer1Ready;
	buffer2Ready;

	//index;

	postState() {
		this.port.postMessage(this.buffer2IsActive ? [this.buffer2Ready, this.buffer1Ready] : [this.buffer1Ready, this.buffer2Ready]);
	}

	flip() {
		if (this.buffer2IsActive)
			this.buffer2Ready = false;
		else
			this.buffer1Ready = false;

		this.buffer2IsActive = !this.buffer2IsActive;

		//this.index = 0;
	}

	get isEmpty() {
		return !this.buffer1Ready && !this.buffer2Ready;
	}

	get isSaturated() {
		return this.buffer1Ready && this.buffer2Ready;
	}

	constructor(...args) {
		super(...args);

		this.buffer1 = new Float32Array(0);
		this.buffer2 = new Float32Array(0);
		this.buffer1Ready = this.buffer2Ready = false;
		this.buffer2IsActive = false;
		//this.index = 0;

		this.port.onmessage = (e) => {
			const wasEmpty = this.isEmpty;

			// new buffer sent to us!
			// write it to the inactive buffer
			if (this.buffer2IsActive) {
				this.buffer1 = e.data;
				this.buffer1Ready = true;
			} else {
				this.buffer2 = e.data;
				this.buffer2Ready = true;
			}

			// if neither buffer filled, flip the buffers immediately to begin playback
			if (wasEmpty) this.flip();

			this.postState();
		};
	}

	process(_inputs, outputs, _parameters) {
		if (this.isEmpty) return true;

		const buf = this.buffer2IsActive ? this.buffer2 : this.buffer1;

		if (!outputs.length) return;

		// for proof-of-concept, assume mono.
		const outputChannel = outputs[0][0];

		// for the real impl, handle differing input and output buffer sizes.
		// for this POC, we assume that both are always the same (128) length
		for (let j = 0; j < outputChannel.length; j++)
			outputChannel[j] = buf[j];

		

		this.postState();

		// in the real impl, have a way to close this and a way to pause etc
		return true;
	}
}

registerProcessor("double-buffer", DoubleBufferProcessor);