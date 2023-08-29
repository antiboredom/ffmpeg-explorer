<script>
  import { addNode, nodes, edges, auto, selectedFilter } from "./stores.js";
  import {
    SvelteFlowProvider,
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";
	import '@xyflow/svelte/dist/style.css';
  import Node from "./Node.svelte";
  import FitComp from "./FitComp.svelte";
  import ButtonEdge from "./ButtonEdge.svelte";

  const nodeTypes = {
    ffmpeg: Node,
  };

  const edgeTypes = {
    default: ButtonEdge,
  };

  function onClick(e) {
    if (e.detail.nodeType === "filter") {
      const newSelected = $nodes.findIndex((n) => n.id === e.detail.id);
      if (newSelected > -1) {
        $selectedFilter = newSelected;
      }
    }
  }

  function addInput() {
    addNode({ name: "shoe.mp4" }, "input");
  }

</script>

<SvelteFlowProvider>
  <div class="holder">
    <FitComp />
    <div class="nav">
      <button on:click={addInput}>Add Input</button>
      <label for="auto"
        ><input id="auto" type="checkbox" bind:checked={$auto} />Automatic Layout</label
      >
    </div>
    <div class="flow">
      <div style="height: 100%; width: 100%">
        <SvelteFlow
					nodesDraggable={!$auto}
          nodesConnectable={!$auto}
          panOnDrag={!$auto}
          edgesUpdatable={!$auto}
          connectOnClick={true}
          nodesFocusable={!$auto}
          edgesFocusable={!$auto}
					zoomOnScroll={!$auto}
          deleteKey={0}
          on:nodeclick={onClick}
          {nodeTypes}
          {edgeTypes}
          {nodes}
          {edges}
          snapGrid={[10, 10]}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} />
        </SvelteFlow>
      </div>
    </div>
  </div>
</SvelteFlowProvider>

<style>
  .holder {
    flex-direction: column;
    display: flex;
    flex: 1;
  }
  .flow {
    flex: 1;
    margin-top: 10px;
  }
</style>
