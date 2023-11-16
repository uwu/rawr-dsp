export interface RCSrc {
	readonly ctx: AudioContext;
	readonly channels: number;
	readonly ready: Promise<void>;
	node: undefined | AudioNode;

	connect(dest?: AudioNode): Promise<void>;
	disconnect(dest?: AudioNode): Promise<void>;
}

export interface RCChunker<T> {
	next(chunk: Uint8Array): T[];
}