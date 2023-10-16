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
		const sampleRate = view.getUint32(oset, false) & 0x00FFFFFF;
		const fSamplesPerChan = view.getUint16(oset + 4, false);
		// 8 + (16 * chans) + (256 * 8 * chans)
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
		const readSize = numChannels * 256 * 8;
		const encodedAudioData = data.slice(oset, oset + readSize);
		oset += readSize;

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

/** @param {QOAFrame} frame */
export function decodeFrame(frame) {
	const outputs = Array(frame.numChannels).fill().map(() => new Int16Array(frame.sampleCount));

	/** @type LMSState */
	// clone it so we don't mutate the input frame
	const lmsState = frame.lmsState.map(s => [s[0].slice(), s[1].slice()]);

	for (let si = 0; si < 256 * frame.numChannels; si++)
	{
		const slice = new Uint8Array(frame.encodedAudioData.slice(si * 8, (si + 1) * 8));
		const channelIdx = si % frame.numChannels;
		const siInChannel = ~~(si / frame.numChannels);

		// ┌─ qoa_slice_t ── 64 bits, 20 samples ────────────/ /────────────┐
		// |         Byte[0]        |        Byte[1]         \ \  Byte[7]   |
		// | 7  6  5  4  3  2  1  0 | 7  6  5  4  3  2  1  0 / /    2  1  0 |
		// ├────────────┼────────┼──┴─────┼────────┼─────────\ \──┼─────────┤
		// |  sf_quant  │  qr00  │  qr01  │  qr02  │  qr03   / /  │  qr19   |
		// └────────────┴────────┴────────┴────────┴─────────\ \──┴─────────┘

		// slow.
		/*const residuals = new DataView(slice.slice(0, 8).buffer).getBigUint64(0, false);

		const quantizedResiduals = [];
		for (let i = 57n; i >= 0; i -= 3n)
			quantizedResiduals.push(Number((residuals >> i) & 0b111n));*/

		// JS does not support u64, so this is harder than it must be :(
		// top half, in a u32                  bottom half, in a u32
		// 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000
		// >>> 25 22  19 16  13 10 7   4  1  |   27 24  21 18 15  12 9  6   3  0
		//                                   \ (<< 2 & 0b100) | (>> 30)

		const quantizedScaleFactor = slice[0] >> 4;
		const dequantizedScaleFactor = Math.round(Math.pow(quantizedScaleFactor + 1, 2.75));
		const dv = new DataView(slice.slice(0, 8).buffer);
		const residuals1 = dv.getUint32(0, false);
		const residuals2 = dv.getUint32(4, false);

		const quantizedResiduals = [];
		for (let i = 25; i >= 1; i -= 3)
			quantizedResiduals.push((residuals1 >>> i) & 0b111);

		quantizedResiduals.push(((residuals1 << 2) & 0b100) | (residuals2 >> 30));

		for (let i = 27; i >= 0; i -= 3)
			quantizedResiduals.push((residuals2 >>> i) & 0b111);

		const dequantizedScaledResiduals = quantizedResiduals.map(qr => {
			const r = dequantizedScaleFactor * [0.75, -0.75, 2.5, -2.5, 4.5, -4.5, 7, -7][qr];
			return r < 0 ? Math.ceil(r - 0.5) : Math.floor(r + 0.5);
		});

		for (let i = 0; i < dequantizedScaledResiduals.length; i++)
		{
			let predicted = 0;
			for (let j = 0 ; j < 4; j++)
				predicted += lmsState[channelIdx][0][j] * lmsState[channelIdx][1][j];

			predicted >>= 13;

			//debugger;
			const sample = Math.max(-32768, Math.min(predicted + dequantizedScaledResiduals[i], 32767));
			outputs[channelIdx][i + (siInChannel * 20)] = sample;

			// update LMS state

			const weightDelta = dequantizedScaledResiduals[i] >> 4;
			for (let j = 0; j < 4; j++)
				lmsState[channelIdx][1][j] += (lmsState[channelIdx][0][j] < 0) ? -weightDelta : weightDelta;

			lmsState[channelIdx][0].shift();
			lmsState[channelIdx][0].push(sample);
		}

	}

	return outputs;
}