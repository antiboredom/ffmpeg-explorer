import { writable } from 'svelte/store';

export const inputs = writable(["punch.mp4"]);
export const output = writable("out.mp4");
export const filters = writable([]);
