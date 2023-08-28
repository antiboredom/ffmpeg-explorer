# Interactive FFMPEG Command Generator

A work in progress web tool to explore FFmpeg. Please log [issues/suggestions](https://github.com/antiboredom/ffmpeg-explorer/issues). Made with [svelte](https://svelte.dev/), [xyflow](https://github.com/wbkd/react-flow/tree/xyflow), and [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

To run in dev mode:

```bash
npm install
npm run dev
```

## Known Issues

- Combining audio and video filters can fail
- Rendering on chrome doesn't work in multi-threading mode (it seems to fail on mp4s)

## Todo

- [x] Rendering progress bar
- [ ] "Cancel Render" button
- [ ] Disable/enable filters without removing them
- [ ] Deal with duplicate parameters in filters (sometimes filters have a long and short option)
- [ ] Add more help/documentation in the filters (there is more on FFmpeg's site that I could incorporate)
- [ ] Add input options like seek and trim
- [x] Somehow figure out how to deal with complex filtergraphs
- [ ] Add more sample inputs (at least need an image and an audio file)
- [x] Put filter options in a separate panel
- [ ] Add filters that generate content
- [ ] Handle audio and image output.
- [ ] Allow command to be editable
- [ ] Use commas to separate filters when possible
- [ ] Include some default fonts so text works. Example -> [here](https://github.com/ffmpegwasm/ffmpeg.wasm-core/blob/n4.3.1-wasm/wasm/examples/browser/freetype2.html)
- [ ] Allow gif as output
- [ ] MAYBE allow users to upload their own videos
- [ ] MAYBE make each part of the output command clickable, to highlight the corresponding nodes
- [ ] MAYBE add previews in the filter list itself

## Inspiration / Alternatives

- [ffmpeg.guide](https://ffmpeg.guide)
- [ffmpeg.app](https://ffmpeg.app)
- [this nice screenshot](https://fosstodon.org/@wader/110855089546846001)
