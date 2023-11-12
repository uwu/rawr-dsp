// @ts-expect-error when compiled, worklets export their content
import workletObjUrl from "../worklets/double-buffer";
import { getContext, isWorkletLoaded, registerWorkletLoaded } from "./context";

// empty: both buffers are empty, not playing
// half: one buffer is full, playing, waiting for next buffer
// saturated: both buffers filed, playing
export class RCDoubleBufferSrc {
	readonly ctx: AudioContext;
	readonly node: AudioWorkletNode;
	readonly channels: number;
	readonly ready: Promise<void>;

	state: "EMPTY" | "HALF" | "SATURATED" = "EMPTY";

	onflip = new Set<() => void>();
	onempty = new Set<() => void>();

	constructor(channels = 2, customCtx?: AudioContext) {
		this.channels = channels;
		this.ctx = getContext(customCtx);
		if (!isWorkletLoaded("double-buffer", this.ctx)) {
			this.ready = this.ctx.audioWorklet.addModule(workletObjUrl);
			registerWorkletLoaded("double-buffer", this.ctx);
		} else this.ready = Promise.resolve();

		this.node = new AudioWorkletNode(this.ctx, "double-buffer", {
			outputChannelCount: [channels],
		});

		this.node.port.onmessage = (ev) => {
			this.state = ev.data;
			(ev.data === "EMPTY" ? this.onempty : this.onflip).forEach((h) => h());
		};
	}

	setBuffer(data: Float32Array[]) {
		if (data.length)
			for (let i = 1; i < data.length; i++)
				if (data[0].length !== data[i].length)
					throw new Error(
						"[RCDoubleBufferSrc] All channels in a buffer must be the same size.",
					);

		this.state = "SATURATED";
		this.node.port.postMessage(data);
	}

	connect(dest?: AudioNode) {
		this.node.connect(dest ?? this.ctx.destination);
	}

	disconnect(dest?: AudioNode) {
		this.node.disconnect(dest!);
	}
}
