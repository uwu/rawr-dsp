import CodecParser, {CodecFrame, MimeType, OggPage} from "codec-parser";
import {RCChunker} from "./types.js";

class CpChunker<T> implements RCChunker<T> {

	private readonly p: CodecParser;
	constructor(mt: MimeType) {
		this.p = new CodecParser(mt);
	}

	next(chunk: Uint8Array) {
		return [...this.p.parseChunk(chunk) as IterableIterator<T>];
	}

}

export class RCMp3Chunker extends CpChunker<CodecFrame> { constructor() { super("audio/mpeg") } }
export class RCAacChunker extends CpChunker<CodecFrame> { constructor() { super("audio/aac") } }
export class RCFlacChunker extends CpChunker<CodecFrame> { constructor() { super("audio/flac") } }
export class RCOggChunker extends CpChunker<OggPage> { constructor() { super("audio/ogg") } }