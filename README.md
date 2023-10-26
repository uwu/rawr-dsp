# Rawr DSP

A powerful and easy to hack on JS audio API.

It extends the Web Audio API, builds a nicer, lightweight API on top of it, and adds sorely missing features
to the audio capabilities of the web.

## Why?

Audio in Javascript kind of sucks.
You have two choices: the Web Audio API, and HTML5 Audio.

HTML5 Audio handles all the network nitty-gritty for you, such as streaming and cancelling reqs for unneeded audio.
It also supports live streaming.

HTML5 Audio is also a gigantic pain in the ass to control from JS.
Ever tried to reliably play a stream *from a given seek position?* It's painful as hell.

It also has format support issues.
AAC only works within MP4 on Firefox, OGG formats need to be in a CoreAudio CAF container,
and Vorbis doesn't work on iOS.

The Web Audio API is pretty easy to control by comparison, but has some flaws.
Let's take the most basic case: playing back audio from the network.

Arguably you should use an HTMLAudioElement and a MediaElementAudioSourceNode, but this has all the control issues of
HTML5 audio.

What about using an AudioBuffer then?
Well you can totally decode a compressed audio format to raw audio and play it with WAAPI! Sure!
The downsides are:
 - no streaming, so you must have a discrete file, and it must finish loading entirely.
 - RAM use: you need to keep your entire audio file as uncompressed float32 audio in ram
 - The browser isn't taking care of the network for you anymore, so if you don't need your audio anymore, you need to cancel yourself
 - You're still bound to the browser's supported audio formats

Let's say you made a load of small buffers to play in sequence, somehow.
What's playing that back like?

It pops. It sounds bad. Javascript has really, *really* inaccurate timing tools, and the playback end event is too slow.

Wouldn't it be nice if we could have something nicer?
What if we could have...
 - A way to use any formats we liked
 - A way to play an asynchronous sequence of buffers from the main thread with *zero gap*
 - A sane API for simple audio playback that is easy to use, and works every time
 - Streaming media without HTML5 audio

I wonder if thats possible...
Wait, this is a readme for a library.
I bet this library does exactly that...

It does! :)

## What we're still stuck with

Audio Contexts.
Rawr DSP builds on top of the Web Audio API, so you still have to deal with most browsers (especially Webkit ones)
being incredibly strict about needing user interaction for audio playback.

Luckily, once you've got your context resumed once, you're good, just like Web Audio API.
(because, at the end of the day, Rawr DSP is all built on top of WAAPI,
just with many pre-provided features entirely replaced!)

## A quick note on main thread audio processing

Rawr DSP provides the tools for making processing audio on the main thread viable.
This is usually quite a bad idea.

If you're processing an audio stream, use a worklet.

If you're using this to connect two processing workers / worklets together, try to use the `connect()` method of the
Web Audio API instead.

What this functionality is for is when you need to continuously feed data from the main thread into a Worklet,
for example, the streaming functionality of Rawr DSP uses this under the hood.

## API structure & conventions

There are three kinds of API in Rawr:
 - `core`: APIs that are very basic and upon which the other functionality is built. Expect no consistency.
 - `modular`: Very consistent pick-and-choose pieces to put together to build your audio workflow.
 - name TBA: easy-to-use things that are the JS audio api I wish we had, and should just work:tm:.

Some common conventions for `modular`:
 - Use of `RMStream<TC, T1, T2>` everywhere
 - Bring your own audio context, or don't, we'll provide one
 - No automatic connections
 - No need to manually register worklets and stuff

Some common conventions for the high level API:
 - Audio context as with modular
 - Everything connects to everything else automatically