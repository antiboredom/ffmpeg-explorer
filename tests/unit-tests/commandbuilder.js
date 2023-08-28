import { expect, test, describe } from "vitest";
import { get } from "svelte/store";
import { nodes, edges, addNode, resetNodes, makeFilterArgs, previewCommand } from "../../src/stores.js";

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
		expect(get(previewCommand)).toBe("ffmpeg -i punch.mp4 out.mp4");
	});

	test("Simple video filter", () => {
		resetNodes();
		addNode({ name: "filter", type: "V->V" }, "filter");
		expect(get(previewCommand)).toBe(
			`ffmpeg -i punch.mp4 -filter_complex "[0:v]filter[vid_out]" -map 0:a -map "[vid_out]" out.mp4`
		);
	});

	test("Simple audio filter", () => {
		resetNodes();
		addNode({ name: "filter", type: "A->A" }, "filter");
		expect(get(previewCommand)).toBe(
			`ffmpeg -i punch.mp4 -filter_complex "[0:a]filter[aud_out]" -map "[aud_out]" -map 0:v out.mp4`
		);
	});
});
