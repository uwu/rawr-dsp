/** @typedef {[[number, number, number, number], [number, number, number, number]][]} LMSState */

/**
 * @typedef {Object} QOAFrame
 * @property {number} numChannels
 * @property {number} sampleRate in Hz
 * @property {number} sampleCount per channel, for this frame
 * @property {number} frameSize in bytes, including the header
 * @property {LMSState} lmsState one per channel, [history, weights]
 * @property {ArrayBuffer} encodedAudioData 256 QOA slices per channel
 * */

/** @param {ArrayBuffer} data
 * @returns {[number, QOAFrame[]]} samples per channel, frames (header decoded, audio raw) */
export function decodeFormat(data) {

	const view = new DataView(data);

	if (view.getUint32(0, false) !== 0x71_6F_61_66)
		throw new Error("the data does not start with 'qoaf', not a valid QOA file.");

	const totalSamplesPerChannel = view.getUint32(4, false); // idx 4-7

	if (totalSamplesPerChannel === 0)
		throw new Error("this is a streaming QOA file, which is impossible when you've passed me an ArrayBuffer!");

	const numFrames = Math.ceil(totalSamplesPerChannel / (256 * 20));

	// moving offset to use in all buffer reads
	let oset = 8;

	/** @type QOAFrame[] */
	const frames = [];

	for (let i = 0; i < numFrames; i++)
	{
		const numChannels = view.getUint8(oset);
		const sampleRate = view.getUint32(oset, false) & 0x0FFF;
		const fSamplesPerChan = view.getUint16(oset + 4, false);
		const frameSize = view.getUint16(oset + 6, false);
		oset += 8;

		/** @type LMSState */
		const lmsState = [];
		for (let ci = 0; ci < numChannels; ci++) {
			const h = [0, 2, 4, 6].map(o => view.getUint16(oset + o, false));
			const w = [8, 10, 12, 14].map(o => view.getUint16(oset + o, false));
			lmsState.push([h, w]);
			oset += 16;
		}

		// per channel:
		// 	256 of:
		//			qoa slice: 64 bits, 20 samples
		const encodedAudioData = data.slice(oset, oset + (numChannels * 256 * 64));

		frames.push({
			numChannels,
			sampleRate,
			sampleCount: fSamplesPerChan,
			frameSize,
			lmsState,
			encodedAudioData
		});
	}


	return [totalSamplesPerChannel, frames];
}

/** @param {QOAFrame} frame
 * @returns {Uint16Array[]} one raw sample array per channel */
export function decodeFrame(frame) {
	const outputs = Array(frame.numChannels).map(() => new Uint16Array(frame.sampleCount));

	for (let si = 0; si < 256 * frame.numChannels; si++)
	{
		const slice = new Uint8Array(frame.encodedAudioData.slice(si * 8, (si + 1) * 8));

		// ┌─ qoa_slice_t ── 64 bits, 20 samples ────────────/ /────────────┐
		// |         Byte[0]        |        Byte[1]         \ \  Byte[7]   |
		// | 7  6  5  4  3  2  1  0 | 7  6  5  4  3  2  1  0 / /    2  1  0 |
		// ├────────────┼────────┼──┴─────┼────────┼─────────\ \──┼─────────┤
		// |  sf_quant  │  qr00  │  qr01  │  qr02  │  qr03   / /  │  qr19   |
		// └────────────┴────────┴────────┴────────┴─────────\ \──┴─────────┘

		const quantizedScaleFactor = slice[0] >> 4;

		let pieces = [];
		for (let bit = 4; bit < 64; bit + 3)
		{
			let byteNum = ~~(bit / 8);
			let bitNum = bit % 8;
			// doesn't handle reading across byte boundaries yet :(
			// TODO
			pieces.push()
		}
	}
}