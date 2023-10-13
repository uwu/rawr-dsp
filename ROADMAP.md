# Rawr DSP roadmad

Rawr DSP is a pretty big undertaking, so this should help organization.

## Stage 0.1: Proof of concepts

Create proof-of-concepts that our core techniques will work.

 - [x] Proof of concept of (seamless) double-buffering source
 - [ ] Proof of concept of decoding MP3 frame-by-frame
 - [ ] Proof of concept HTTP response streaming into individual MP3 frames

## Stage 1: Implement the basics

Start building the basics of rawr dsp

- [ ] Shared tools
  * [ ] Automatic audio context use and resuming
- [ ] Double buffering source
- [ ] Sequential decoding of easy OR particularly desirable formats
  * [ ] WAV
  * [ ] FLAC
  * [ ] QOA (not common but should be useful for testing)
  * [ ] MP3 (!!!!)
  * [ ] Opus *on non-Apple browsers*
- [ ] Core HTTP streaming implementation
- [ ] Audio player that takes a possibly incomplete stream of frames and plays it
  * [ ] Can play back when input is healthy
  * [ ] Automatically wait when input is empty
  * [ ] Seeking (requires buffering past input)
  * [ ] Automatic disposal of input stream

## Stage 2: Build out the library

- [ ] Add codec that need remuxing
  * [ ] AAC (on Firefox too)
  * [ ] Opus on Apple browsers too
  * [ ] Vorbis on all except iOS
- [ ] Build a nice API over everything
- [ ] Secondary core utilities
  * [ ] double buffered *sink*