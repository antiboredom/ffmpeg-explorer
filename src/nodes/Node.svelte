<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import { removeNode } from "../stores.js";

  export let data = { nodeType: "", name: "", inputs: [], outputs: [] };
  export let id;

  function remove() {
    removeNode(id);
  }
</script>

<div class="node {data.nodeType}">
  <div class="head">
    <div class="node-type">{data.nodeType}</div>
    <button on:click={remove}>X</button>
  </div>
  <div class="body">
    {#if data.nodeType == "input"}
      <select bind:value={data.name}>
        <option value="punch.mp4">punch.mp4</option>
        <option value="shoe.mp4">shoe.mp4</option>
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
    style="top: {index * 12 + 4}px; left: -7px;">{inp}</Handle
  >
{/each}
{#each data.outputs as out, index}
  <Handle
    type="source"
    id={out + "_" + index}
    position={Position.Right}
    class="handle {out}"
    style="top: {index * 12 + 4}px; left: 107%;">{out}</Handle
  >
{/each}

<style>
  :global(:root) {
    --edge-color: var(--b1) !important;
    --edge-color-selected: black;
  }
  :global(.svelte-flow__node) {
    box-shadow: 2px 2px 0px var(--b2);
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
  }
  :global(.handle.a) {
    /* border: 1px solid var(--b2) !important; */
  }
  .node {
    padding: 5px;
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
