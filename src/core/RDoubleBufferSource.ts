// @ts-expect-error when compiled, worklets export their content
import workletObjUrl from "../worklets/double-buffer";
import {getContext, isWorkletLoaded, registerWorkletLoaded} from "./context";

// empty: both buffers are empty, not playing
// half: one buffer is full, playing, waiting for next buffer
// saturated: both buffers filed, playing
export type DoubleBufferState = "EMPTY" | "HALF" | "SATURATED";

// TODO: finish the impl

export class RDoubleBufferSource extends AudioNode {
    readonly #ctx: AudioContext;
    readonly #node: AudioWorkletNode;
    readonly #channels: number;
    readonly #ready: Promise<void>;

    get ready() { return this.#ready; }
    get channels() { return this.#channels; }

    #state: DoubleBufferState = "EMPTY";
    get state() { return this.#state; }

    onflip = new Set<() => void>();
    onempty = new Set<() => void>();

    // await src.untilFlip();
    get untilFlip() {
        return new Promise<void>(res => {
            const handler = () => {
                this.onflip.delete(handler);
                res();
            };
            this.onflip.add(handler);
        })
    }

    constructor(channels = 2, customCtx?: AudioContext) {
        super();

        this.#channels = channels;
        this.#ctx = getContext(customCtx);
        if (!isWorkletLoaded("double-buffer", this.#ctx))
        {
            this.#ready = this.#ctx.audioWorklet.addModule(workletObjUrl);
            registerWorkletLoaded("double-buffer", this.#ctx);
        }
        else this.#ready = Promise.resolve();

        this.#node = new AudioWorkletNode(this.#ctx, "double-buffer", {outputChannelCount:[channels]});
        this.#node.connect(this.#ctx.destination);

        this.#node.port.onmessage = (ev) => {
            this.#state = ev.data;
            (ev.data === "EMPTY" ? this.onempty : this.onflip).forEach(h => h());
        }
    }

    setBuffer(data: Float32Array[]) {
        this.#state = "SATURATED";
        this.#node.port.postMessage(data);
    }
}
