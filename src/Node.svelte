<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import { removeNode, nodes, INPUTNAMES, OUTPUTNAMES, selectedFilter } from "./stores.js";

  export let data = { ext: "", nodeType: "", name: "", inputs: [], outputs: [] };
  export let id;

	$: isSelected = $selectedFilter && $nodes[$selectedFilter] && $nodes[$selectedFilter].id === id;

  function remove() {
    removeNode(id);
  }

	function resetNode() {
		// hack to deselect node and apply changes on chrome
		$nodes.find(n => n.id === id).selected = false;
		$nodes = $nodes
	}

  function changeFile() {
    const newFile = OUTPUTNAMES.find((n) => n.name === data.name);
    data.inputs = [...newFile.inputs];
    data.outputs = [...newFile.outputs];
    data.ext = newFile.ext;
    data = data;

		resetNode();
  }
</script>

<div class="node {data.nodeType} {isSelected ? 'selected' : ''}">
  <div class="head">
    <div class="node-type">{data.nodeType}</div>
    {#if data.nodeType != "output"}
      <button on:click={remove}>X</button>
    {/if}
  </div>
  <div class="body">
    {#if data.nodeType == "input"}
      <select bind:value={data.name} on:change={resetNode}>
        {#each INPUTNAMES as inp}
          <option value={inp.name}>{inp.name}</option>
        {/each}
      </select>
    {:else if data.nodeType == "output"}
      <select bind:value={data.name} on:change={changeFile}>
        {#each OUTPUTNAMES as out}
          <option value={out.name}>{out.name}</option>
        {/each}
      </select>
    {:else}
      {data.name}
    {/if}
  </div>
</div>
{#each data.inputs as inp, index}
  <Handle
    type="target"
    position={Position.Left}
    id={inp + "_" + index}
    class="handle {inp}"
    style="top: {index * 12 + 4}px; left: -13px;">{inp}</Handle
  >
{/each}
{#each data.outputs as out, index}
  <Handle
    type="source"
    id={out + "_" + index}
    position={Position.Right}
    class="handle {out}"
    style="top: {index * 12 + 4}px; right: -13px; left: auto;">{out}</Handle
  >
{/each}

<style>
  :global(:root) {
    --edge-stroke-default: var(--b1) !important;
    --edge-stroke: var(--b1) !important;
    --edge-color: var(--b1) !important;
    --edge-color-selected: black;
  }
  :global(.svelte-flow__node) {
    box-shadow: 2px 2px 0px var(--b2);
		background-color: #fff;
  }
  :global(.svelte-flow__node.selected) {
    outline: 1px solid var(--b1) !important;
  }
  :global(.handle) {
    width: 10px !important;
    height: 10px !important;
    border: 1px solid var(--b1) !important;
    border-radius: 0px !important;
    background-color: white !important;
    font-size: 10px;
    line-height: 6px;
		text-align: center;
  }
  :global(.handle.a) {
    /* border: 1px solid var(--b2) !important; */
  }
  .node {
    padding: 5px;
  }
	.selected {
    outline: 2px solid var(--b1);
		background-color: var(--b2);
	}
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .head button {
    font-size: 10px;
    line-height: 8px;
    padding: 2px 2px;
    margin-left: 10px;
  }
  .node-type {
    font-size: 0.8em;
    color: #999;
  }
  .node.input {
  }
  .node.filter {
  }
  .node.output {
  }
</style>
