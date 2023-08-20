<script>
  import { onMount } from "svelte";
  import { inputs, output, filters } from "./stores.js";
  import Input from "./Input.svelte";
  import Output from "./Output.svelte";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from "@ffmpeg/util";
  import { dndzone } from "svelte-dnd-action";

  const isChrome = navigator.userAgent.match(/chrome|chromium|crios/i);
  const baseURL = `https://unpkg.com/@ffmpeg/core${!isChrome ? "-mt" : ""}@0.12.2/dist/esm`;
  // const baseURL = "";
  const TIMEOUT = 40000;

  const ffmpeg = new FFmpeg();

  let command = "";
  let videoValue = "/" + $inputs[0];
  let ffmpegLoaded = false;
  let rendering = false;
  let log = "";
  let logbox;
  let commandRef;

  function newInput() {
    $inputs = [...$inputs, "punch.mp4"];
  }

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
        await ffmpeg.writeFile(vid, await fetchFile("/" + vid));
      }
      const clist = commandList();
      console.log(clist);
      await ffmpeg.exec(clist, TIMEOUT);
      // await ffmpeg.exec(["-f", "lavfi", "-i", "color=size=1280x720:rate=25:color=red", "-t", "5", "out.mp4"])
      const data = await ffmpeg.readFile("out.mp4");
      rendering = false;
      videoValue = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    } catch (e) {
      log += "Failed";
    }
    rendering = false;
  }

  async function loadFFmpeg() {
    ffmpeg.on("log", ({ message: msg }) => {
      console.log(msg);
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
    console.log(ffmpeg);
    ffmpegLoaded = true;
  }

  function updateCommand() {
    const cInputs = $inputs.map((i) => `-i ${i}`).join(" ");

    const cOutput = $output;

    const cFilters = $filters.map(makeFilterArgs).join(",");

    let out = `ffmpeg ${cInputs}`;

    if (cFilters) out += ` -filter_complex "${cFilters}"`;

    out += ` ${cOutput}`;

    command = out;
    return out;
  }

  function makeFilterArgs(f) {
    let fCommand = f.name;
    if (f.params && f.params.length > 0) {
      let params = f.params
        .map((p) => {
          if (p.value === "" || p.value === null || p.value === p.default) return null;
          return `${p.name}=${p.value}`;
        })
        .filter((p) => p !== null)
        .join(":");
      if (params) fCommand += "=" + params;
    }
    return fCommand;
  }

  function commandList() {
    let command = [];
    for (let vid of $inputs) {
      command.push("-i");
      command.push(vid);
    }
    // let command = ["-i", "example.mp4"];

    // const audioFilters = $filters.filter(f => f.type[0] === "A").map(makeFilterArgs);
    // const videoFilters = $filters.filter(f => f.type[0] === "V").map(makeFilterArgs);

    const cFilters = $filters.map(makeFilterArgs).join(",");

    if (cFilters.length > 0) {
      command.push("-filter_complex");
      command.push(cFilters);
    }

    command.push("-pix_fmt");
    command.push("yuv420p");
    command.push("out.mp4");

    return command;
  }

  function handleFilterSort(e) {
    filters.set(e.detail.items);
  }

  inputs.subscribe(updateCommand);
  output.subscribe(updateCommand);
  filters.subscribe(updateCommand);

  onMount(async () => {
    loadFFmpeg();
  });
</script>

<main>
  <section class="header">
    <h1>FFmpeg Explorer</h1>
    <p>
      A tool to help you explore <a href="https://www.ffmpeg.org/" target="_blank">FFmpeg</a>
      filters and options. To use: select one or more input videos (there are currently two options),
      export and add some filters, and then hit "render" to preview the output in browser. Note: this
      is a work in progress, many things may still be broken! Only audio to audio and video to video
      filters are included. If it hangs/crashes refresh the page. Post issues/feedback to
      <a href="https://github.com/antiboredom/ffmpeg-explorer/ffmpeg-explore" target="_blank"
        >GitHub</a
      >. By <a href="https://lav.io" target="_blank">Sam Lavigne</a>.
    </p>
  </section>
  <!-- {message} -->
  <section class="command">
    <h3>Output Command</h3>
    <div class="inner-command">
      <textarea readonly class="actual-command" bind:this={commandRef}>{command}</textarea>
      <div>
        <button on:click={copyCommand}>Copy Command</button>
      </div>
    </div>
  </section>

  <section class="inputs">
    <div class="section-header">
      <h3>Inputs</h3>
      <button on:click={newInput}>Add Input</button>
    </div>
    {#each $inputs as inp, index}
      <Input bind:filename={inp} {index} />
    {/each}
  </section>

  <section class="log">
    <h3>FFmpeg Log</h3>
    <textarea readonly class="the-log" bind:this={logbox}>{log}</textarea>
  </section>

  <section class="preview">
    {#if rendering}
      <div class="rendering-video"><span>Rendering...</span></div>
    {/if}
    <video controls src={videoValue} />
    <div style="text-align: right;margin-top:5px;">
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

  <section class="output">
    <h3>Output</h3>
    <Output bind:filename={$output} />
  </section>

  <section class="filters">
    <h3>Filters (click to add)</h3>
    <div class="inner-filters">
      <div class="filter-picker">
        <FilterPicker select={"video"} />
      </div>
      <div
        class="filters-holder"
        use:dndzone={{ items: $filters }}
        on:consider={handleFilterSort}
        on:finalize={handleFilterSort}
      >
        {#each $filters as f (f.id)}
          <div class="filter">
            <Filter bind:filter={f} />
          </div>
        {/each}
      </div>
    </div>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      "hdr cmd cmd"
      "inp log prv"
      "out log prv"
      "flt flt flt";
    grid-gap: 20px;
    padding: 20px;
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
  }

  .command {
    grid-area: cmd;
    display: flex;
    flex-direction: column;
  }

  .inputs {
    grid-area: inp;
  }

  .preview {
    grid-area: prv;
    position: relative;
  }

  .output {
    grid-area: out;
  }

  .log {
    grid-area: log;
    display: flex;
    flex-direction: column;
  }

  .inner-filters {
    display: flex;
  }

  .filters {
    grid-area: flt;
  }

  .filter-picker {
    max-height: 500px;
    width: 400px;

    position: sticky;
    top: 0;
    left: 0;
    overflow: scroll;
    background-color: #fff;
  }

  .filters-holder {
    min-height: 500px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    padding-left: 10px;
    flex: 1;
    align-content: start;
  }
  .filter {
    /* width: 33%; */
  }
  h1,
  h2,
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
    margin: 10px 0px;
    flex: 1;
  }

  .actual-command {
    border: none;
    margin-right: 10px;
    resize: none;
    flex: 1;
    font: inherit;
    padding: 5px;
    height: 100%;
  }
  .section-header {
    display: flex;
  }
  .section-header h3 {
    flex: 1;
  }
  .the-log {
    border: none;
    resize: none;
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

  @media only screen and (max-width: 1400px) {
    .filters-holder {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media only screen and (max-width: 600px) {
    main {
      grid-template-areas:
        "hdr hdr hdr"
        "cmd cmd cmd"
        "inp inp inp"
        "out out out"
        "prv prv prv"
        "log log log"
        "flt flt flt";
      grid-gap: 0px;
      padding: 0px;
    }
    .command {
      margin: 0;
      margin-bottom: 10px;
    }
    section {
      box-shadow: none;
      margin-bottom: 10px;
      padding: 10px;
      box-shadow: 2px 2px 0px #000;
    }
    .inner-filters {
      display: block;
    }
    .filter-picker {
      width: 100%;
      margin-bottom: 20px;
      height: 300px;
      position: static;
    }
    .filters-holder {
      grid-template-columns: repeat(1, 1fr);
      grid-gap: 10px;
      flex: 1;
      align-content: start;
      padding: 0;
    }
  }
</style>
