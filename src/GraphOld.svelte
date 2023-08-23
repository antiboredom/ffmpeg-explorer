<script>
  import { v4 as uuidv4 } from "uuid";
  import { nodes, edges } from "./stores.js";
  import { Anchor, Node, Svelvet, Minimap, Controls } from "svelvet";

  function onConnect(e) {
    console.log(e);
    const sourceAnchor = e.detail.sourceAnchor;
    const targetAnchor = e.detail.targetAnchor;
    const sourceNode = e.detail.sourceNode;
    const targetNode = e.detail.targetNode;
    // console.log(e);
    // console.log(sourceNode.id, "->", targetNode.id)
    // console.log(sourceAnchor.id, "->", targetAnchor.id)
    edges.update((eds) => {
      eds.push({
        id: uuidv4(),
        sourceAnchor: sourceAnchor.id,
        targetAnchor: targetAnchor.id,
        source: sourceNode.id,
        target: targetNode.id,
      });
      return eds;
    });
  }

  function onDisconnect(e) {
    const sourceAnchor = e.detail.sourceAnchor.id;
    const targetAnchor = e.detail.targetAnchor.id;
    const source = e.detail.sourceNode.id;
    const target = e.detail.targetNode.id;

    // console.log(sourceNode.id, "-/>", targetNode.id)
    // console.log(sourceAnchor.id, "-/>", targetAnchor.id)

    edges.update((eds) => {
      const index = eds.findIndex(
        (e) => e.sourceAnchor === sourceAnchor && e.targetAnchor === targetAnchor
      );
      eds.splice(index, 1);
      return eds;
    });
  }
</script>

<Svelvet
  id="my-canvas"
  width={800}
  height={500}
  snapTo={25}
  on:disconnection={onDisconnect}
  on:connection={onConnect}
>
  {#each $nodes as n, index}
    <Node
      inputs={n.data.inputs.length}
      outputs={n.data.outputs.length}
      id={n.id}
      bind:position={n.position}
    >
      <div class="node">
        <div class="header">
          {n.data.name}
        </div>
        <slot />
      </div>
      <div class="input-anchors">
        {#each n.data.inputs as inp, index}
          <Anchor id={inp + "_" + index} let:linked let:connecting let:hovering input>
            <div class:linked class:hovering class:connecting class="anchor in {inp}">{inp}</div>
          </Anchor>
        {/each}
      </div>
      <div class="output-anchors">
        {#each n.data.outputs as out}
          <Anchor id={out + "_" + index} let:linked let:connecting let:hovering output>
            <div class:linked class:hovering class:connecting class="anchor in {out}">{out}</div>
          </Anchor>
        {/each}
      </div>
    </Node>
  {/each}
  <Controls />
</Svelvet>

<style>
  .node {
    box-sizing: border-box;
    width: fit-content;
    height: fit-content;
    position: relative;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 10px;
    background-color: #fff;
    border: 1px solid var(--b1);
    font: 12px Times, serif;
    box-shadow: none !important;
  }
  .output-anchors {
    position: absolute;
    right: -16px;
    top: 0px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .input-anchors {
    position: absolute;
    left: -16px;
    top: 0px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .anchor {
    background-color: #fff;
    font-size: 12px;
    text-align: center;
    line-height: 12px;
    width: 14px;
    height: 14px;
    font-family: Times, serif;
    border: solid 1px white;
    border-color: var(--b1);
  }
  .hovering {
    scale: 1.2;
  }
  .linked {
    background-color: rgb(17, 214, 17) !important;
  }
  .connecting {
    background-color: goldenrod;
  }
</style>
