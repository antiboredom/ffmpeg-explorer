import { writable } from 'svelte/store';

export const inputs = writable(["input.mp4"]);
export const output = writable("output.mp4");
export const filters = writable([]);
