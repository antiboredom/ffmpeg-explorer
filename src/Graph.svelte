<script>
  import { nodes, edges, command } from "./stores.js";
  import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from "@xyflow/svelte";
  import Node from "./nodes/Node.svelte";

  const nodeTypes = {
    ffmpeg: Node,
  };

	console.log($nodes);

  // const nodes = writable([
  //   {
  //     id: "1",
  //     type: "ffmpeg",
  //     data: { label: "test.mp4", inputs: [], outputs: ["v", "a"] },
  //     position: { x: 0, y: 0 },
  //   },
  //   {
  //     id: "2",
  //     type: "ffmpeg",
  //     data: { label: "filter", inputs: ["v"], outputs: ["v"] },
  //     position: { x: 0, y: 150 },
  //   },
  //   {
  //     id: "3",
  //     type: "ffmpeg",
  //     data: { label: "output.mp4", inputs: ["v", "a"], outputs: [] },
  //     position: { x: 100, y: 20 },
  //   },
  // ]);

  // same for edges
  // const edges = writable([
  //   {
  //     id: "1-2",
  //     type: "default",
  //     source: "1",
  //     sourceHandle: "v_0",
  //     targetHandle: "v_0",
  //     target: "2",
  //     label: "Edge Text",
  //   },
  //   {
  //     id: "2-3",
  //     type: "default",
  //     source: "2",
  //     target: "3",
  //     sourceHandle: "v_0",
  //     targetHandle: "v_0",
  //     label: "Edge Text",
  //   },
  // ]);

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
	function onConnect(e){
		console.log('connect', e);
	}
</script>


<div style="width: 900px; height: 500px;">
  <SvelteFlow
    {nodeTypes}
    {nodes}
    {edges}
		snapGrid={[10, 10]}
    fitView
  >
    <Controls />
    <Background variant={BackgroundVariant.Dots} />
  </SvelteFlow>
</div>

<div>
	{JSON.stringify(command)}
</div>
