<script>
  import { nodes, edges, auto, selectedFilter } from "./stores.js";
  import {
    SvelteFlowProvider,
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
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
</script>

<SvelteFlowProvider>
  <FitComp />
  <div class="flow">
    <div style="height: 100%; width: 100%">
      <SvelteFlow
        nodesDraggable={!$auto}
        nodesConnectable={!$auto}
        panOnDrag={!$auto}
        edgesUpdatable={!$auto}
        connectOnClick={true}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        nodesSelectable={!$auto}
        zoomOnScroll={!$auto}
        deleteKey={0}
        multiSelectionKeyCode={null}
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
</SvelteFlowProvider>

<style>
  .flow {
    flex: 1;
    margin-top: 10px;
  }
</style>
