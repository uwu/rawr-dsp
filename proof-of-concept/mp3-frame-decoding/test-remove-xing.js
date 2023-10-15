// remove the Xing/mp3info/LAME header

import {onlyMp3Data as dataWithXing} from "./test-remove-id3.js";

// http://gabriel.mp3-tech.org/mp3infotag.html

// step 1: find "Xing" string
let xingI = 0;

for (; xingI + 4 < dataWithXing.length; xingI++)
{
	// == 'Xing"
	if (dataWithXing[xingI] === 0x58 && dataWithXing[xingI + 1] === 0x69 && dataWithXing[xingI + 2] === 0x6E && dataWithXing[xingI + 3] === 0x67)
		break;
}

console.log("found Xing header starting at index", xingI);

// skip to next frame

let frameI = xingI;
for (; frameI + 1 < dataWithXing.length; frameI++)
{
	if (dataWithXing[frameI] === 0xFF && (dataWithXing[frameI + 1] & 0xF0))
		break;
}

console.log("Found first frame after Xing header at index", frameI);

const xinglessMp3 = dataWithXing.slice(frameI);

const xingHeader = dataWithXing.slice(0, frameI);

console.log("headerless mp3:", xinglessMp3, "header:", xingHeader);

export {xingHeader, xinglessMp3};