# Interactive FFMPEG Command Generator

**~~~~> [ffmpeg.lav.io](https://ffmpeg.lav.io) <~~~~**

A work in progress web tool to explore FFmpeg. Please log [issues/suggestions](https://github.com/antiboredom/ffmpeg-explorer/issues). Made with [svelte](https://svelte.dev/), [xyflow](https://github.com/wbkd/react-flow/tree/xyflow), and [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

Contributions are welcome! Take a look at the todo list below if you'd like to add a new feature, or the issues page if you want to try to fix a bug.

To run in dev mode:

```bash
npm install
npm run dev
```

**I'm also looking for good FFmpeg examples. If you make a nice filtergraph in the tool, just hit cmd-s (or ctrl-s on windows/linux), and it will export a json file of your graph. Feel free to post those to the issues page for possible inclusion in the tool.**

## Known Issues

- Rendering on chrome doesn't work in multi-threading mode (it seems to fail on mp4s)

## Todo

- [x] Rendering progress bar
- [x] "Cancel Render" button (thanks to @jwetzell)
- [x] Disable/enable filters without removing them (thanks to @jwetzell) 
- [ ] Deal with duplicate parameters in filters (sometimes filters have a long and short option)
- [ ] Add more help/documentation in the filters (there is more on FFmpeg's site that I could incorporate)
- [ ] Add input options like seek and trim
- [x] Somehow figure out how to deal with complex filtergraphs
- [ ] Add more sample inputs (at least need an image and an audio file)
- [x] Put filter options in a separate panel
- [ ] Add filters that generate content
- [ ] Handle audio and image output.
- [ ] Allow command to be editable
- [x] Use commas to separate filters when possible
- [x] Include some default fonts so text works.
- [x] Allow gif as output
- [ ] Add more tests!
- [x] MAYBE allow users to upload their own videos
- [ ] MAYBE make each part of the output command clickable, to highlight the corresponding nodes
- [ ] MAYBE add previews in the filter list itself

## Inspiration / Alternatives

- [ffmpeg.guide](https://ffmpeg.guide)
- [ffmpeg.app](https://ffmpeg.app)
- [this nice screenshot](https://fosstodon.org/@wader/110855089546846001)
