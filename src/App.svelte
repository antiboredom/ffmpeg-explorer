<script>
  import { onMount } from "svelte";
  import { selectedFilter, nodes, inputs, previewCommand } from "./stores.js";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import Graph from "./Graph.svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from "@ffmpeg/util";

  const isChrome = navigator.userAgent.match(/chrome|chromium|crios/i);
  const baseURL = `https://unpkg.com/@ffmpeg/core${!isChrome ? "-mt" : ""}@0.12.2/dist/esm`;
  // const baseURL = "";
  const TIMEOUT = 40000;

  const ffmpeg = new FFmpeg();

  let videoValue = "/" + $inputs[0].name;
  let ffmpegLoaded = false;
  let rendering = false;
  let log = "";
  let logbox;
  let commandRef;

  function render() {
    transcode();
  }

  function copyCommand() {
    commandRef.select();
    document.execCommand("copy");
  }

  async function transcode() {
    videoValue = null;
    rendering = true;
    try {
      for (let vid of $inputs) {
        await ffmpeg.writeFile(vid.name, await fetchFile("/" + vid.name));
      }
      let clist = $previewCommand
        .replaceAll('"', "")
        .replace("ffmpeg", "")
        .split(" ")
        .filter((i) => i.trim() != "");
			clist.splice(clist.length-1, 0, "-pix_fmt")
			clist.splice(clist.length-1, 0, "yuv420p")
      console.log("command", clist);
      await ffmpeg.exec(clist, TIMEOUT);
      const data = await ffmpeg.readFile("out.mp4");
      rendering = false;
      videoValue = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    } catch (e) {
      console.log(e);
      log += "Failed";
    }
    rendering = false;
  }

  async function loadFFmpeg() {
    ffmpeg.on("log", ({ message: msg }) => {
      log += msg + "\n";
      logbox.scrollTop = logbox.scrollHeight;
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
    ffmpegLoaded = true;
  }

  onMount(async () => {
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
        <li>Click on filters in the center panel to edit options.</li>
        <li>Hit "render" to preview the output in browser.</li>
        <li>For more complex filtergraphs, disable "automatic layout."</li>
      </ol>
      <p>
        Note: this is a work in progress, many things may still be broken! If it hangs/crashes
        refresh the page. Post issues/feedback to
        <a href="https://github.com/antiboredom/ffmpeg-explorer/" target="_blank">GitHub</a>. By
        <a href="https://lav.io" target="_blank">Sam Lavigne</a>.
      </p>
    </div>
  </section>
  <!-- {message} -->
  <section class="command">
    <h3>Output Command</h3>
    <div class="inner-command">
      <textarea
        readonly
        class="actual-command"
        bind:this={commandRef}
        on:click={() => commandRef.select()}>{$previewCommand}</textarea
      >
      <div>
        <button on:click={copyCommand}>Copy Command</button>
      </div>
    </div>
  </section>

  <section class="log">
    <h3>FFmpeg Log</h3>
    <textarea readonly class="the-log" bind:this={logbox}>{log}</textarea>
  </section>

  <section class="preview">
    <div class="vid-holder">
      {#if rendering}
        <div class="rendering-video"><span>Rendering...</span></div>
      {/if}
      <video controls src={videoValue} />
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
    <Graph />
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
    /* grid-template-rows: 16% 17% 77%; */
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

  .preview video {
    width: 100%;
    /* object-fit: contain; */
    flex: 1;
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
  }

  .actual-command {
    border: none;
    margin-right: 10px;
    flex: 1;
    font: inherit;
    padding: 5px;
    height: 100%;
  }
  .the-log {
    border: none;
    resize: none;
    padding: 5px;
    flex: 1;
  }
  .rendering-video {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
    background-color: rgba(255, 255, 255, 0.8);
    top: 0;
    left: 0;
    display: grid;
    align-items: center;
    justify-content: center;
  }

  .help {
    font-size: 0.9em;
  }
  ol {
    margin: 5px 0px;
    padding-left: 20px;
  }
  ol li {
    margin-bottom: 5px;
  }

  @media only screen and (max-width: 1400px) {
  }

  @media only screen and (max-width: 600px) {
    main {
      grid-template-areas:
        "hdr hdr hdr"
        "cmd cmd cmd"
        "prv prv prv"
        "log log log"
        "flt flt flt"
        "gra gra gra"
        "edt edt edt";
      grid-gap: 5px;
      padding: 10px;
      height: auto;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto;
    }
    .graph {
      height: 50vh;
    }
    .command {
      margin: 0;
      margin-bottom: 10px;
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
