<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";

  export let data = { name: "", inputs: [], outputs: [], onChange: () => {} };
</script>

<div class="node">
  {data.name}
</div>
{#each data.inputs as inp, index}
  <Handle type="target" position={Position.Left} id={inp + "_" + index} style="top: {index*10}px; background-color: {inp == 'v' ? 'blue' : 'red'}"  />
{/each}
{#each data.outputs as out, index}
  <Handle type="source" id={out + "_" + index} position={Position.Right} style="top: {index*10}px; background-color: {out == 'v' ? 'blue' : 'red'}"  />
{/each}
<!-- <Handle type="source" position={Position.Right} id="a" style="top: 10px;" on:connect /> -->
<!-- <Handle -->
<!--   type="source" -->
<!--   position={Position.Right} -->
<!--   id="b" -->
<!--   style="top: auto; bottom: 10px;" -->
<!--   on:connect -->
<!-- /> -->
<style>
	.node {
		padding: 5px;
	}
</style>
