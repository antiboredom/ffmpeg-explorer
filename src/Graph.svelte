<script>
  import { nodes, edges, auto } from "./stores.js";
  import {
    SvelteFlowProvider,
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";
  import Node from "./nodes/Node.svelte";
  import FitComp from "./FitComp.svelte";

  const nodeTypes = {
    ffmpeg: Node,
  };

  const defaultEdgeOptions = {
    deletable: true,
  };

  function onEdgeUpdate(e) {
    console.log(e);
  }

  function onEdgeUpdateStart(e) {
    console.log(e);
  }

  function onEdgeUpdateEnd(e) {
    console.log(e);
  }
  function onMoveStart(e) {
    console.log(e);
  }
  function onConnect(e) {
    console.log("connect", e);
  }
</script>

<SvelteFlowProvider>
	<FitComp/>
  <label for="auto"><input id="auto" type="checkbox" bind:checked={$auto} />Automatic Layout</label>
  <div style="width: 900px; height: 500px;">
    <SvelteFlow {nodeTypes} {nodes} {edges} snapGrid={[10, 10]} fitView>
      <Controls />
      <Background variant={BackgroundVariant.Dots} />
    </SvelteFlow>
  </div>
</SvelteFlowProvider>
