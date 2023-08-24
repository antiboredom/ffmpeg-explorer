<script>
  import { useSvelteFlow } from "@xyflow/svelte";
	import {nodes, auto} from './stores.js';

  const { zoomIn, zoomOut, setZoom, fitView, setCenter, setViewport, getViewport, viewport } =
    useSvelteFlow();

	nodes.subscribe((n) => {
		if ($auto) fitView();
	});
</script>
<button>Fit</button>
