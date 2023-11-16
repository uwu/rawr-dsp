# Rawr DSP roadmap

Rawr DSP is a pretty big undertaking, so this should help organization.

## Stage 0.1: Proof of concepts

Create proof-of-concepts that our core techniques will work.

 - [x] Proof of concept of (seamless) double-buffering source
	* [x] Chrome
   * [x] Firefox
   * [x] Safari
 - [x] Proof of concept of decoding MP3 frame-by-frame
	 * [x] Chrome
	 * [x] Firefox
	 * [ ] Safari
 - [x] Proof of concept HTTP response streaming into individual MP3 frames
	* [x] Chrome
	* [x] Firefox
	* [x] Safari
 - [x] Proof of concept of decoding Opus frame-by-frame
	 * [x] Chrome
	 * [x] Firefox
	 * [x] Safari

## Stage 1: Implement the core basics

Start building the basics of rawr dsp

- [ ] Shared tools
  * [x] Automatic audio context use and resuming
- [x] Double buffering source
- [x] Queue source
- [ ] Chunking sink
- [x] Codec chunkers
- Decoders for easy or particularly desirable formats
  * [ ] WAV
  * [ ] FLAC
  * [ ] QOA (not common but should be useful for testing)
  * [ ] MP3 (!!!!)
  * [ ] Opus
  * [ ] AAC
  * [ ] Vorbis
- [ ] Chunk aligner
- [ ] Chunk auto combiner
- [ ] Core HTTP streaming implementation

## Stage 2: modular API

- [ ] `RMStream`
- [ ] Wrap all core functions in stream versions
  * [ ] HTTP
  * [ ] Queue source
  * [ ] Decoders
  * [ ] Aligner and other utils

## Stage 3: high level api

- [ ] Audio player that takes a possibly incomplete stream of frames and plays it
  * [ ] Can play back when input is healthy
  * [ ] Automatically wait when input is empty
  * [ ] Seeking (requires buffering past input)
  * [ ] Automatic disposal of input stream
