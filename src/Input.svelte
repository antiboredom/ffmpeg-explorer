<script>
	import { inputs } from './stores.js';
	export let filename="";
	export let index;

	function remove() {
		$inputs.splice(index, 1);
		$inputs = $inputs;
	}
</script>

<div>
	<input bind:value={filename} />
	<button on:click={remove}>Remove</button>
</div>
