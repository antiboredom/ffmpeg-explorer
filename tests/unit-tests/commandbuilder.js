import { expect, test, describe } from "vitest";
import { get } from "svelte/store";
import { addNode, resetNodes, makeFilterArgs, previewCommand } from "../../src/stores.js";

function makeFilter(name, type) {
	const [ins, outs] = type.toLowerCase().split("->");
	return {
		name: name,
		inputs: ins.split(""),
		outputs: outs.split(""),
	}
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
});
