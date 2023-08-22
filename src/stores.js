import { v4 as uuidv4 } from "uuid";
import { writable } from 'svelte/store';

export const inputs = writable([{name: "punch.mp4", id: uuidv4()}]);
export const output = writable("out.mp4");
export const filters = writable([]);

export function addFilter(f) {
	const newFilter = { ...f, filterId: f.id, id: uuidv4() };
	if (f.params) {
		newFilter.params = f.params.map((p) => {
			p.value = null;
			if (p.default != null) p.value = p.default;
			return p;
		});
	}
	filters.update((filts) => {
		filts.push(newFilter)
		return filts;
	})
}

export function removeFilter(id) {
	filters.update((filts) => {
		const index = filts.findIndex((f) => f.id === id);
		filts.splice(index, 1);
		return filts;
	});
}

export function addOutput(f) {

}

export function removeOutput(f) {

}

export function addInput(f) {
	const newInput = {name: f, id: uuidv4()}
	inputs.update((inps) => {
    inps.push(newInput);
		return inps;
	});

}

export function removeInput(id) {
	inputs.update((inps) => {
		const index = inps.findIndex((f) => f.id === id);
		inps.splice(index, 1);
		return inps;
	});

}
