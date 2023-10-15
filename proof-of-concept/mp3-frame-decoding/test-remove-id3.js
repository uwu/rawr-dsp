// remove the ID3v2.4.0 header

const rawData = new Uint8Array(await (await fetch("kshmr.mp3")).arrayBuffer());

let onlyMp3Data = rawData;

// check for ID3
if (rawData[0] !== 0x49 || rawData[1] !== 0x44 || rawData[2] !== 0x33)
{
	console.log("not ID3");
}
else {
	console.log("ID3 magic bytes present");
	// thx chatgpt
	let tagSize = 0;
	for (let i = 6; i < 10; i++)
		tagSize = (tagSize << 7) | (rawData[i] & 0x7F);

	console.log("parsed tag size: ", tagSize);

	if (rawData[5])
		throw new Error("out of scope of POC: an ID3 flag exists (extended header, footer, etc.)");

	onlyMp3Data = rawData.slice(tagSize + 10); // 10 bytes for header
}

console.log("raw (excerpt)", rawData.slice(0, 50));
console.log("trimmed (excerpt)", onlyMp3Data.slice(0, 50));

if (onlyMp3Data[0] === 0xFF && onlyMp3Data[1] & 0xF0)
	console.log("trimmed data starts with FFF sync word :D");
else console.log("nuts; trimmed data does not start with FFF sync word.")

const ctx = new AudioContext();

// try decode both
const rawDec = await ctx.decodeAudioData(rawData.slice().buffer);
const trimDec = await ctx.decodeAudioData(onlyMp3Data.slice().buffer);

console.log("decoded both:", rawDec, trimDec);

export {onlyMp3Data};