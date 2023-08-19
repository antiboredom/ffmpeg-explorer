<script>
  import { inputs } from "./stores.js";
  export let filename = "punch.mp4";
  export let index;

  function remove() {
    $inputs.splice(index, 1);
    $inputs = $inputs;
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
