import {RCSrc} from "./types.js";
import {RCDoubleBufferSrc} from "./RCDoubleBufferSrc.js";

export class RCQueueSrc implements RCSrc {
	readonly doubleBuf: RCDoubleBufferSrc;

	get ctx() { return this.doubleBuf.ctx }
	get channels() { return this.doubleBuf.channels }
	get ready() { return this.doubleBuf.ready }
	get node() { return this.doubleBuf.node }

	connect(dest?: AudioNode) {
		return this.doubleBuf.connect(dest);
	}

	disconnect(dest?: AudioNode) {
		return this.doubleBuf.disconnect(dest);
	}

	constructor(channels = 2, customCtx?: AudioContext) {
		this.doubleBuf = new RCDoubleBufferSrc(channels, customCtx);

		this.doubleBuf.onflip.add(() => this.#setIfNeeded());
		this.doubleBuf.onempty.add(() => this.#setIfNeeded());
	}

	readonly queue: Float32Array[][] = [];

	async pushBuffer(data: Float32Array[]) {
		if (!data.length) return; // no channels

		for (let i = 1; i < data.length; i++)
			if (data[0].length !== data[i].length)
				throw new Error(
					"[RCQueueSrc] All channels in a buffer must be the same size.",
				);

		if (!this.doubleBuf.node) await this.ready;

		this.queue.push(data);
		if (this.doubleBuf.state === "EMPTY")
			await this.#setIfNeeded();
	}

	async #setIfNeeded() {
		// already full! we'll cause skips.
		if (this.doubleBuf.state === "SATURATED") return;

		const next = this.queue.shift();
		if (next) {
			await this.doubleBuf.setBuffer(next);
		}
	}

}