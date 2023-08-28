import { expect, test, describe } from "vitest";
import { makeFilterArgs } from "../../src/stores.js";

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
});
