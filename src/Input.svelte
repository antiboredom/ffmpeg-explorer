<script>
  import { removeNode } from "./stores.js";
  export let filename = "punch.mp4";
	export let id;
  export let index;

  function remove() {
		removeNode(id);
  }
</script>

<div>
  <select bind:value={filename}>
    <option value="punch.mp4">punch.mp4</option>
    <option value="shoe.mp4">shoe.mp4</option>
  </select>
  <button on:click={remove}>X</button>
</div>

<style>
  div {
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
  }
  select {
    flex: 1;
		margin-right: 10px;
  }
</style>
