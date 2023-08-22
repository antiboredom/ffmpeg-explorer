<script>
  import { inputs, output, filters } from "./stores.js";
  import { Anchor, Node, Svelvet, Minimap, Controls } from "svelvet";
  import { generateInput, generateOutput } from "svelvet";

  function countInputs(f) {
    const [ins, outs] = f.type.split("->");
    if (ins == "N") return 1;
    return ins.length;
  }

  function countCons(f) {
    const [ins, outs] = f.type.split("->");
    return { in: ins.split(""), out: outs.split("") };
  }

  function countOutputs(f) {
    const [ins, outs] = f.type.split("->");
    if (outs == "N") return 1;
    return outs.length;
  }

  function onConnect(e) {
		const sourceAnchor = e.detail.sourceAnchor;
		const targetAnchor = e.detail.targetAnchor;
		const sourceNode = e.detail.sourceNode;
		const targetNode = e.detail.targetNode;
		console.log(sourceNode.id, "->", targetNode.id)
		console.log(sourceAnchor.id, "->", targetAnchor.id)
  }
  function onDisconnect(e) {
		const sourceAnchor = e.detail.sourceAnchor;
		const targetAnchor = e.detail.targetAnchor;
		const sourceNode = e.detail.sourceNode;
		const targetNode = e.detail.targetNode;
		console.log(sourceNode.id, "-/>", targetNode.id)
		console.log(sourceAnchor.id, "-/>", targetAnchor.id)
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
  {#each $inputs as inp, index}
    <Node inputs={0} outputs={2}>
      <div class="node">
        <div class="header">
          {inp}
        </div>
        <slot />
      </div>
      <div class="output-anchors">
        <Anchor id={"v" + index} let:linked let:connecting let:hovering output>
          <div class:linked class:hovering class:connecting class="anchor video">v</div>
        </Anchor>
        <Anchor id={"a" + index} let:linked let:connecting let:hovering output>
          <div class:linked class:hovering class:connecting class="anchor audio">a</div>
        </Anchor>
      </div>
    </Node>
  {/each}

  {#each $filters as f, index}
    <Node inputs={countInputs(f)} outputs={countOutputs(f)}>
      <div class="node">
        <div class="header">
          {f.name}
        </div>
        <slot />
      </div>
      <div class="input-anchors">
        {#each countCons(f).in as inp}
          <Anchor let:linked let:connecting let:hovering input>
            <div class:linked class:hovering class:connecting class="anchor in {inp}">{inp}</div>
          </Anchor>
        {/each}
      </div>
      <div class="output-anchors">
        {#each countCons(f).out as out}
          <Anchor let:linked let:connecting let:hovering output>
            <div class:linked class:hovering class:connecting class="anchor in {out}">{out}</div>
          </Anchor>
        {/each}
      </div>
    </Node>
  {/each}

  <Node inputs={2} outputs="0" position={{ x: 600, y: 250 }}>
    <div class="node">
      <div class="header">
        {$output}
      </div>
      <slot />
    </div>
    <div class="input-anchors">
      <Anchor id={"output_video"} let:linked let:connecting let:hovering input>
        <div class:linked class:hovering class:connecting class="anchor video">v</div>
      </Anchor>
      <Anchor id={"output_audio"} let:linked let:connecting let:hovering input>
        <div class:linked class:hovering class:connecting class="anchor audio">a</div>
      </Anchor>
    </div>
  </Node>
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
