# Rawr DSP examples

IMPORTANT: these examples are targets for development, may change, and are not final.

Play an audio url with streaming, seeking, etc.

```js
const audio = new RWebStream("/assets/vine_boom.mp3") // optional ctx param
  //.preload()
  .seek(50) //s
  .play();

audio.pause();
audio.seek(90);
audio.node; // returns a Web Audio API node
audio.play({ connect: false }); // if you're doing custom signal routing with audio.node
```

Decode frames of a codec without the whole file

```js
const buf = rDecodeFrames(RCodec.MP3, mp3Frames);
```
The beating heart of rawr dsp - double buffering: seamlessly play back a series of buffers

```js
// can pass ctx
const node = new RCDoubleBufferSrc();

for (const piece of inputData) {
    const buffer = doSomeProcessing(piece);
    if (node.empty) {
        // fills active buffer, and starts playback
        node.setBuffer(buffer);
        continue;
    }
    // sets idle buffer because non-empty
    node.setBuffer(buffer);
    // node.saturated == true
    await node.untilFlip();
    // node.saturated == false
    // await node.untilFlip();
    // node.empty == true
}
```