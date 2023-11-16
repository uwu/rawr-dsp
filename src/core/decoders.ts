import {CodecFrame, OggPage} from "codec-parser";
import {getContext} from "./context.js";
import {joinBufs} from "./bufferutils.js";
import {RCDecoder} from "./types.js";
import {OpusDecoder} from "opus-decoder";

// decodes a set of chunks using the browser's decodeAudioData method
// often requires additional processing to work!!!!!
// TODO: test with FLAC
// TODO: test with AAC
class RCBrowserDecoder implements RCDecoder<ArrayBuffer> {
	async next(chunk: ArrayBuffer[]) {
		const ab = await getContext().decodeAudioData(joinBufs(chunk), (r) => {});
		const data: Float32Array[] = [];
		for (let i = 0; i < ab.numberOfChannels; i++)
			data[i] = ab.getChannelData(i);

		return data;
	}
}

// uses opus-parser
class RCOpusDecoder implements RCDecoder<OggPage | CodecFrame> {
	// decoder
	private readonly d = new OpusDecoder();
	// has been freed
	private f = false;

	async next(chunk: (OggPage | CodecFrame)[]) {
		if (this.f)
			throw new Error("[RCOpusDecoder] Cannot use decoder after free()d, see opus-decoder docs for more info.");

		await this.d.ready;

		const data = chunk.flatMap(c => "codecFrames" in c ? c.codecFrames.map(f => f.data) : c.data);

		return this.d.decodeFrames(data).channelData;
	}

	reset() { return this.d.reset(); }

	free() {
		this.d.free();
		this.f = true;
	}
}