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

  let downloadLink;
  let savedData;

  function onClick(e) {
    if (e.detail.nodeType === "filter") {
      const newSelected = $nodes.findIndex((n) => n.id === e.detail.id);
      if (newSelected > -1) {
        $selectedFilter = newSelected;
      }
    }
  }

  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      const out = JSON.stringify({ nodes: $nodes, edges: $edges }, null, 2);
      savedData = "data:text/json;charset=utf-8," + encodeURIComponent(out);
      setTimeout(() => {
        downloadLink.click();
      }, 600);
    }
  }
</script>

<svelte:window on:keydown={onKey} />

<a style="display:none;" download="graph.json" href={savedData} bind:this={downloadLink}>Download</a
>

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
