<script>
  import { useSvelteFlow } from "@xyflow/svelte";
  import { nodes, auto, doFit } from "./stores.js";

  const { zoomIn, zoomOut, setZoom, fitView, setCenter, setViewport, getViewport, viewport } =
    useSvelteFlow();

  nodes.subscribe((n) => {
    if ($auto) fitView();
  });

  doFit.subscribe(() => {
    fitView();
  });
</script>
