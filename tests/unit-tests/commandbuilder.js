const fs = require('fs');
import { expect, test, describe } from "vitest";
import { get } from "svelte/store";
import {
  nodes,
  edges,
  addNode,
  resetNodes,
  makeFilterArgs,
  previewCommand,
	auto,
} from "../../src/stores.js";

function makeFilter(name, type) {
  const [ins, outs] = type.toLowerCase().split("->");
  return {
    name: name,
    inputs: ins.split(""),
    outputs: outs.split(""),
  };
}

describe("Filter param builder", () => {
  test("No params", () => {
    const results = makeFilterArgs({
      name: "filter",
    });
    expect(results).toBe("filter");
  });

  test("One param", () => {
    const results = makeFilterArgs({
      name: "filter",
      params: [{ name: "param", value: 10 }],
    });
    expect(results).toBe("filter=param=10");
  });

  test("Param without values", () => {
    const results = makeFilterArgs({
      name: "filter",
      params: [{ name: "param" }],
    });
    expect(results).toBe("filter");
  });

  test("Param with default value", () => {
    const results = makeFilterArgs({
      name: "filter",
      params: [{ name: "param", value: 1, default: 1 }],
    });
    expect(results).toBe("filter");
  });

  test("Lots of params", () => {
    const results = makeFilterArgs({
      name: "filter",
      params: [
        { name: "param1", value: 1, default: 1 }, // should be ignored
        { name: "param2", value: "" }, // should be ignored
        { name: "param3", value: 1, default: 2 },
        { name: "param4", value: 2 },
        { name: "param5", value: "p5" },
      ],
    });
    expect(results).toBe("filter=param3=1:param4=2:param5=p5");
  });
});

describe("Command builder", () => {
  test("Defaults", () => {
    expect(get(previewCommand).join(" ")).toBe("ffmpeg -i punch.mp4 out.mp4");
  });

  test("Simple video filter", () => {
    resetNodes();
    addNode(makeFilter("filter", "V->V"), "filter");
    expect(get(previewCommand).join(" ")).toBe(
      `ffmpeg -i punch.mp4 -filter_complex "[0:v]filter[out_v]" -map "[out_v]" -map 0:a out.mp4`
    );
  });

  test("Simple audio filter", () => {
    resetNodes();
    addNode(makeFilter("filter", "a->a"), "filter");
    expect(get(previewCommand).join(" ")).toBe(
      `ffmpeg -i punch.mp4 -filter_complex "[0:a]filter[out_a]" -map "[out_a]" -map 0:v out.mp4`
    );
  });

  test("One audio, one video filter", () => {
    resetNodes();
    addNode(makeFilter("afilter", "a->a"), "filter");
    addNode(makeFilter("vfilter", "v->v"), "filter");
    expect(get(previewCommand).join(" ")).toBe(
      `ffmpeg -i punch.mp4 -filter_complex "[0:a]afilter[out_a];[0:v]vfilter[out_v]" -map "[out_a]" -map "[out_v]" out.mp4`
    );
  });

  test("video filter chain", () => {
    resetNodes();
    addNode(makeFilter("vfilter", "v->v"), "filter");
    addNode(makeFilter("vfilter2", "v->v"), "filter");
    addNode(makeFilter("vfilter3", "v->v"), "filter");
    expect(get(previewCommand).join(" ")).toBe(
      `ffmpeg -i punch.mp4 -filter_complex "[0:v]vfilter,vfilter2,vfilter3[out_v]" -map "[out_v]" -map 0:a out.mp4`
    );
  });

  test("One audio, two video filters", () => {
    resetNodes();
    addNode(makeFilter("afilter", "a->a"), "filter");
    addNode(makeFilter("vfilter", "v->v"), "filter");
    addNode(makeFilter("vfilter2", "v->v"), "filter");
    expect(get(previewCommand).join(" ")).toBe(
      `ffmpeg -i punch.mp4 -filter_complex "[0:v]vfilter[1];[0:a]afilter[out_a];[1]vfilter2[out_v]" -map "[out_a]" -map "[out_v]" out.mp4`
    );
  });

  test("Examples", () => {
    const examples = [
      [
        "crop_trim.json",
        `ffmpeg -i punch.mp4 -filter_complex "[0:v]crop=out_w=iw/2,trim=start=1.7:duration=0.5[out_v]" -map "[out_v]" out.gif`,
      ],
      [
        "grid.json",
        `ffmpeg -i punch.mp4 -i shoe.mp4 -i shoe.mp4 -i punch.mp4 -filter_complex "[1:v][0:v][3:v][2:v]xstack=inputs=4:grid=2x2:shortest=true[out_v]" -map "[out_v]" out.mp4`,
      ],
      [
        "scale_overlay.json",
        `ffmpeg -i punch.mp4 -i shoe.mp4 -filter_complex "[0:v]scale=w=120:h=120:force_original_aspect_ratio=increase[1];[1:v][1]overlay=x=290:y=50[out_v]" -map "[out_v]" out.mp4`,
      ],
      [
        "smooth_slow.json",
        `ffmpeg -i punch.mp4 -filter_complex "[0:v]setpts=expr=2*PTS,minterpolate=fps=66[out_v];[0:a]asetpts=expr=2*PTS[out_a]" -map "[out_a]" -map "[out_v]" out.mp4`,
      ],
      [
        "speedup.json",
        `ffmpeg -i punch.mp4 -filter_complex "[0:v]setpts=expr=0.5*PTS[out_v]" -map "[out_v]" out.mp4`,
      ],
      [
        "text.json",
        `ffmpeg -i punch.mp4 -filter_complex "[0:v]drawtext=fontfile=comic.ttf:text=LOL:fontcolor=red:bordercolor=white:boxborderw=3:fontsize=100:x=300:y=150:borderw=5[out_v]" -map "[out_v]" -map 0:a out.mp4`,
      ],
      [
        "xfade.json",
        `ffmpeg -i punch.mp4 -i shoe.mp4 -filter_complex "[0:v][1:v]xfade=transition=radial:duration=3[out_v]" -map "[out_v]" -map 0:a out.mp4`,
      ],
    ];

    for (const [filename, output] of examples) {
      const data = JSON.parse(
        fs.readFileSync(`public/examples/${filename}`, "utf8")
      );
      nodes.set(data.nodes);
      edges.set(data.edges);
			expect(get(previewCommand).join(" ")).toBe(output);
    }
  });
});
