<script>
  import { onMount } from "svelte";
  import {
    selectedFilter,
    nodes,
    edges,
    inputs,
    outputs,
    auto,
    addNode,
    inputNames,
    previewCommand,
    doFit,
  } from "./stores.js";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import Graph from "./Graph.svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from "@ffmpeg/util";

  const isChrome = navigator.userAgent.match(/chrome|chromium|crios/i);
  const baseURL = `https://unpkg.com/@ffmpeg/core${!isChrome ? "-mt" : ""}@0.12.2/dist/esm`;
  const TIMEOUT = 40000;
  const ffmpeg = new FFmpeg();
  const examples = [
    { name: "Cross Fade", url: "/examples/xfade.json" },
    { name: "Crop & Trim", url: "/examples/crop_trim.json" },
    { name: "Scale & Overlay", url: "/examples/scale_overlay.json" },
    { name: "Text", url: "/examples/text.json" },
    { name: "Speed Up", url: "/examples/speedup.json" },
    { name: "Slow Down Smoothly", url: "/examples/smooth_slow.json" },
    { name: "Video Grid", url: "/examples/grid.json" },
  ];

  let videoValue = "/" + $inputs[0].name;
  let ffmpegLoaded = false;
  let rendering = false;
  let log = "";
  let logbox;
  let commandRef;
  let vidPlayerRef;
  let renderProgress = 0;
  let fileinput;
  let fit;

  function addInput() {
    addNode({ ...$inputNames[$inputNames.length - 1] }, "input");
  }

  async function loadExample(url) {
		if (!url) return;
    $auto = false;
    const response = await fetch(url);
    const example = await response.json();
    $nodes = example.nodes;
    $edges = example.edges;
    $doFit++;
  }

  async function onFileSelected(e) {
    let vid = e.target.files[0];
    await ffmpeg.writeFile(vid.name, await fetchFile(vid));
    $inputNames.push({ name: vid.name, url: vid.name });
    addInput();
  }

  function copyCommand() {
    commandRef.select();
    document.execCommand("copy");
  }

  async function render() {
    renderProgress = 0;
    videoValue = null;
    rendering = true;

    const outname = $outputs[0].name;

    try {
      if (log.trim() != "") log += "\n\n";

      const fontNames = [
        ...new Set([...$previewCommand.join(" ").matchAll(/\W([a-z]+\.ttf)/g)].map((f) => f[1])),
      ];

      for (let f of fontNames) {
        await ffmpeg.writeFile(f, await fetchFile("/" + f));
      }

      let clist = [...$previewCommand];
      clist.shift(); // remove "ffmpeg" from start of command
      clist.unshift("-hide_banner", "-loglevel", "error");
      clist = clist.map((c) => c.replaceAll('"', ""));
      if (outname.endsWith("mp4")) {
        clist.splice(clist.length - 1, 0, "-pix_fmt");
        clist.splice(clist.length - 1, 0, "yuv420p");
        clist.splice(clist.length - 1, 0, "-preset");
        clist.splice(clist.length - 1, 0, "ultrafast");
      }
      await ffmpeg.exec(clist, TIMEOUT);
      const data = await ffmpeg.readFile(outname);
      videoValue = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
      if (outname.endsWith("mp4")) {
        setTimeout(() => {
          vidPlayerRef.seekToNextFrame();
        }, 100);
      }
    } catch (e) {
      log += e + "\n";
    }
    rendering = false;
  }

  async function loadFFmpeg() {
    ffmpeg.on("log", ({ type, message }) => {
      if (message.trim() === "Aborted()") return;

      log += message + "\n";
      logbox.scrollTop = logbox.scrollHeight;
    });
    ffmpeg.on("progress", ({ progress }) => {
      if (progress > 1) progress = 0;
      renderProgress = progress;
    });
    if (isChrome) {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      });
    } else {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      });
    }
    for (let vid of $inputNames) {
      await ffmpeg.writeFile(vid.name, await fetchFile(vid.url));
    }
    ffmpegLoaded = true;
  }

  onMount(async () => {
    vidPlayerRef.volume = 0.5;
    loadFFmpeg();
  });
</script>

<main>
  <section class="header">
    <h1>FFmpeg Explorer</h1>
    <div class="help">
      <p>
        A tool to help you explore <a href="https://www.ffmpeg.org/" target="_blank">FFmpeg</a>
        filters. To use:
      </p>
      <ol>
        <li>Add filters from the list on the left.</li>
        <li>Click on filters in the node editor to modify options.</li>
        <li>Hit "render" to preview the output in browser.</li>
        <li>To edit the graph, disable "lock layout."</li>
      </ol>
      <p>
        Note: work in progress, many things may be broken! Refresh if it hangs or crashes. May not
        work on mobile. Post issues/feedback to
        <a href="https://github.com/antiboredom/ffmpeg-explorer/" target="_blank">GitHub</a>. By
        <a href="https://lav.io" target="_blank">Sam Lavigne</a>.
      </p>
    </div>
  </section>
  <!-- {message} -->
  <section class="command">
    <div class="section-head">
      <h3>Output Command</h3>
      <div>
        <button on:click={copyCommand}>Copy Command</button>
      </div>
    </div>

    <div class="inner-command">
      <textarea
        rows="1"
        readonly
        class="actual-command"
        bind:this={commandRef}
        on:click={() => commandRef.select()}>{$previewCommand.join(" ")}</textarea
      >
    </div>
  </section>

  <section class="log">
    <div class="section-head">
      <h3>Error Log</h3>
      <div>
        <button
          on:click={() => {
            log = "";
          }}>Clear Errors</button
        >
      </div>
    </div>
    <textarea rows="1" readonly class="the-log" bind:this={logbox}>{log}</textarea>
  </section>

  <section class="preview">
    <div class="vid-holder">
      {#if rendering}
        <div class="rendering-video">
          <span>Rendering...{(renderProgress * 100).toFixed(2)}%</span>
        </div>
      {/if}
      {#if $outputs[0].name.endsWith("gif") && videoValue && !videoValue.endsWith("mp4")}
        <img src={videoValue} />
      {:else}
        <video bind:this={vidPlayerRef} controls src={videoValue} />
      {/if}
    </div>
    <div style="text-align: right;padding-top:5px;">
      <button on:click={render} disabled={!ffmpegLoaded || rendering}>
        {#if ffmpegLoaded}
          {#if rendering}
            Rendering...
          {:else}
            Render Preview
          {/if}
        {:else}
          Loading ffmpeg
        {/if}
      </button>
    </div>
  </section>

  <section class="filters">
    <h3>Filters (click to add)</h3>
    <div class="filter-picker">
      <FilterPicker select={"video"} />
    </div>
  </section>

  <section class="graph">
    <div class="graph-holder">
      <div class="graph-nav">
        <div>
          <button on:click={addInput}>Add Sample Input</button>
          <button on:click={() => fileinput.click()}>Upload File</button>
          <input
            type="file"
            accept="video/*"
            on:change={(e) => onFileSelected(e)}
            bind:this={fileinput}
            style="display: none;"
          />
          <label for="auto"
            ><input id="auto" type="checkbox" bind:checked={$auto} />Lock Layout</label
          >
        </div>

        <div class="examples">
          <label>Examples</label>
          <select on:change={(e) => loadExample(e.target.value)}>
            <option value="" />
            {#each examples as example}
              <option value={example.url}>{example.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <Graph bind:this={fit} />
    </div>
  </section>

  <section class="filter-editor">
    {#if $selectedFilter && $nodes.length > 0 && $nodes[$selectedFilter]}
      <Filter bind:filter={$nodes[$selectedFilter].data} />
    {/if}
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 300px 1fr 1fr 1fr 1fr 300px;
    grid-template-areas:
      "hdr log log log prv prv"
      "hdr cmd cmd cmd prv prv"
      "flt gra gra gra gra edt";
    grid-template-rows: 15% 15% calc(70% - 40px);
    padding: 10px;
    grid-gap: 20px;
    height: 100vh;
    align-items: stretch;
  }

  section {
    /* border: 1px solid #999; */
    /* box-shadow: 7px 7px 0px rgba(0, 0, 0, 0.7); */
    border: 1px solid var(--b1);
    box-shadow: 7px 7px var(--b2);
    padding: 10px;
    background-color: rgb(245, 245, 245);
  }

  .header {
    grid-area: hdr;
    overflow: scroll;
    display: flex;
    flex-direction: column;
  }

  .command {
    grid-area: cmd;
    display: flex;
    flex-direction: column;
  }

  .preview {
    grid-area: prv;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
  }

  .preview video,
  .preview img {
    width: 100%;
    background-color: #000;
    flex: 1;
  }

  .preview img {
    object-fit: contain;
  }

  .vid-holder {
    flex: 1;
    display: flex;
    width: 100%;
    height: calc(100% - 30px);
  }

  .log {
    grid-area: log;
    display: flex;
    flex-direction: column;
  }

  .filters {
    grid-area: flt;
    display: flex;
    flex-direction: column;
  }

  .graph {
    grid-area: gra;
    display: flex;
  }

  .filter-editor {
    grid-area: edt;
    display: flex;
  }

  .section-head {
    display: flex;
    justify-content: stretch;
  }
  .section-head h3 {
    flex: 1;
  }

  .filter-picker {
    /* max-height: 500px; */
    /* width: 400px; */
    top: 0;
    left: 0;
    overflow: scroll;
    background-color: #fff;
  }

  h1,
  h3 {
    font-weight: normal;
    margin: 0;
    padding: 0;
  }
  h1 {
    margin-bottom: 5px;
  }
  h3 {
    margin-bottom: 10px;
  }
  .header p {
    margin: 0;
  }

  .inner-command {
    display: flex;
    align-items: center;
    flex: 1;
  }

  textarea {
    outline: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    resize: none;
    height: auto;
    font: inherit;
  }

  .actual-command {
    border: none;
    flex: 1;
    padding: 5px;
    height: 100%;
  }
  .the-log {
    color: red;
    border: none;
    resize: none;
    padding: 5px;
    flex: 1;
  }
  .rendering-video {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.97;
    background-color: var(--b2);
    z-index: 2;
    top: 0;
    left: 0;
    display: grid;
    align-items: center;
    justify-content: center;
    align-content: center;
  }

  .help {
    font-size: 0.9em;
    flex: 1;
    overflow: scroll;
  }
  ol {
    margin: 5px 0px;
    padding-left: 20px;
  }
  ol li {
    margin-bottom: 5px;
  }
  .graph-holder {
    flex-direction: column;
    display: flex;
    flex: 1;
  }

  .graph-nav {
    display: flex;
    justify-content: space-between;
  }

  @media only screen and (max-width: 1100px) {
    main {
      grid-template-columns: 250px 1fr 1fr 1fr 1fr 300px;
      grid-template-rows: 40px 15% 15% calc(35% - 25px) calc(35% - 40px);
      grid-template-areas:
        "hdr hdr hdr hdr hdr hdr"
        "log log log log prv prv"
        "cmd cmd cmd cmd prv prv"
        "flt gra gra gra gra gra"
        "edt gra gra gra gra gra";
      grid-gap: 7px;
    }
    .header {
      overflow: hidden;
    }
    section {
      padding: 7px;
      box-shadow: 3px 3px 0px var(--b2);
    }
  }

  @media only screen and (max-width: 700px) {
    main {
      grid-template-areas:
        "hdr hdr hdr"
        "cmd cmd cmd"
        "prv prv prv"
        "log log log"
        "flt flt flt"
        "gra gra gra"
        "edt edt edt";
      grid-gap: 0;
      padding: 10px;
      height: auto;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto;
    }
    .header {
      overflow: scroll;
      height: auto;
    }
    .graph {
      height: 60vh;
    }
    .command {
      margin: 0;
      margin-bottom: 10px;
    }
    .command,
    .log {
      height: 15vh;
    }
    section {
      box-shadow: none;
      margin-bottom: 10px;
      padding: 10px;
      box-shadow: 2px 2px 0px var(--b2);
    }
    .filter-picker {
      width: 100%;
      margin-bottom: 20px;
      height: 300px;
      position: static;
    }
  }
</style>
