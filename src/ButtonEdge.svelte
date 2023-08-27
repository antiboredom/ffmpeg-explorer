<script>
  import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/svelte";
  import { auto, removeEdge } from "./stores.js";

  export let id;
  export let sourceX;
  export let sourceY;
  export let targetX;
  export let targetY;
  export let sourcePosition;
  export let targetPosition;
	export let markerEnd;

  $: positions = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  $: edgePath = positions[0];
  $: labelX = positions[1];
  $: labelY = positions[2];

  function onClick(e) {
    e.stopPropagation();
    removeEdge(id);
  }
</script>

<BaseEdge path={edgePath} {markerEnd} />
<EdgeLabelRenderer>
  <div
    style="position: absolute; transform: translate(-50%, -50%) translate({labelX}px,{labelY}px); fontSize: 12; pointer-events: all"
    class="nodrag nopan"
  >
    {#if !$auto}
      <button class="edgebutton" on:click={onClick}>×</button>
    {/if}
  </div>
</EdgeLabelRenderer>

<style>
  .edgebutton {
    padding: 0;
    top: -3px;
    position: relative;
    width: 8px;
    height: 8px;
    background: pink;
    border: none;
    cursor: pointer;
    font-size: 8px;
    line-height: 1;
    box-shadow: none;
  }
	.edgebutton:active {
		top: -3px;
		left: 0px;
	}
	.edgebutton:hover {
		box-shadow: 0px 0px 1px #000;
	}
</style>
