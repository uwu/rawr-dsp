// @ts-expect-error when compiled, worklets export their content
import workletObjUrl from "../worklets/double-buffer.js";
import { getContext, isWorkletLoaded, registerWorkletLoaded } from "./context.js";
import {RCSrc} from "./types";

// empty: both buffers are empty, not playing
// half: one buffer is full, playing, waiting for next buffer
// saturated: both buffers filed, playing
export class RCDoubleBufferSrc implements RCSrc {
	readonly ctx: AudioContext;
	readonly channels: number;
	readonly ready: Promise<void>;
	node: undefined | AudioWorkletNode;

	state: "EMPTY" | "HALF" | "SATURATED" = "EMPTY";

	onflip = new Set<() => void>();
	onempty = new Set<() => void>();

	constructor(channels = 2, customCtx?: AudioContext) {
		this.channels = channels;
		this.ctx = getContext(customCtx)
		let internalReady = Promise.resolve();
		if (!isWorkletLoaded("double-buffer", this.ctx)) {
			internalReady = this.ctx.audioWorklet.addModule(workletObjUrl);
			registerWorkletLoaded("double-buffer", this.ctx);
		}

		this.ready = new Promise<void>((res, rej) => {
			internalReady.then(() => {
				this.node = new AudioWorkletNode(this.ctx, "double-buffer", {
					outputChannelCount: [channels],
				});

				this.node.port.onmessage = (ev) => {
					this.state = ev.data;
					(ev.data === "EMPTY" ? this.onempty : this.onflip).forEach((h) => h());
				};

				res();
			}, rej);
		});
	}

	async setBuffer(data: Float32Array[]) {
		if (!data.length) return; // no channels

		for (let i = 1; i < data.length; i++)
			if (data[0].length !== data[i].length)
				throw new Error(
					"[RCDoubleBufferSrc] All channels in a buffer must be the same size.",
				);

		this.state = (this.state === "EMPTY" ? "HALF" : "SATURATED");

		if (!this.node) await this.ready;
		this.node!.port.postMessage(data);
	}

	async connect(dest?: AudioNode) {
		if (!this.node) await this.ready;
		this.node!.connect(dest ?? this.ctx.destination);
	}

	async disconnect(dest?: AudioNode) {
		if (!this.node) await this.ready;
		this.node!.disconnect(dest!);
	}
}
