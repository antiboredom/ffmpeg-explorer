<script>
  import { onMount } from "svelte";
  import { inputs, output, filters } from "./stores.js";
  import Input from "./Input.svelte";
  import Output from "./Output.svelte";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from "@ffmpeg/util";

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm";
  // const baseURL = "";
  // const videoURL = "https://ffmpegwasm.netlify.app/video/video-15s.avi";
  const TIMEOUT = 40000;

  const ffmpeg = new FFmpeg();

  let command = "";
  let message = "";
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
    // try {
    message = "Start transcoding";
    videoValue = null;
    rendering = true;
    for (let vid of $inputs) {
      await ffmpeg.writeFile(vid, await fetchFile("/" + vid));
    }
    // const infile = await ffmpeg.readFile("example.mp4");
    //    videoValue = URL.createObjectURL(new Blob([infile.buffer], { type: "video/mp4" }));
    // console.log("VIDEO", videoValue);
    const clist = commandList();
    console.log(clist);
    // await ffmpeg.exec(["-hide_banner", "-i", "example.mp4", "-vf", "negate", "out.mp4", "-y"]);
    await ffmpeg.exec(clist, TIMEOUT);
    message = "Complete transcoding";
    const data = await ffmpeg.readFile("out.mp4");
    rendering = false;
    videoValue = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    rendering = false;
    // console.log("VIDEO", videoValue);
    // } catch (error) {
    //   console.log(error);
    // }
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

  inputs.subscribe(updateCommand);
  output.subscribe(updateCommand);
  filters.subscribe(updateCommand);

  onMount(async () => {
    ffmpeg.on("log", ({ message: msg }) => {
      console.log(msg);
      log += msg + "\n";
      logbox.scrollTop = logbox.scrollHeight;
      // message = msg;
    });
    await ffmpeg.load({
      // coreURL: `${baseURL}/ffmpeg-core.js`,
      // wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      // workerURL: `${baseURL}/ffmpeg-core.worker.js`,
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    });
    ffmpegLoaded = true;
  });
</script>

<main>
  <section class="header">
    <h1>FFmpeg Explorer</h1>
    <p>
      A tool to help you explore FFmpeg filters and options. To use: select one or more input videos
      (there are currently two options), export and add some filters, and then hit "render" to
      preview the output in browser.
      Note: this is a work in progress, many things may still be broken! By <a href="https://lav.io"
        >Sam Lavigne</a
      >.
    </p>
  </section>
  <!-- {message} -->
  <section class="command">
    <textarea class="actual-command" bind:this={commandRef}>{command}</textarea>
    <div>
      <button on:click={copyCommand}>Copy</button>
      <button on:click={render} disabled={!ffmpegLoaded}>
        {#if ffmpegLoaded}
          {#if rendering}
            Rendering...
          {:else}
            Render
          {/if}
        {:else}
          Loading ffmpeg
        {/if}
      </button>
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
    <textarea class="the-log" bind:this={logbox}>{log}</textarea>
  </section>

  <section class="preview">
    <video controls src={videoValue} />
  </section>

  <section class="output">
    <h3>Output</h3>
    <Output bind:filename={$output} />
  </section>

  <section class="filters">
    <h3>Filters</h3>
    <div class="inner-filters">
      <div class="filter-picker">
        <FilterPicker select={"video"} />
      </div>
      <div class="filters-holder">
        {#each $filters as f, index}
          <div class="filter">
            <Filter bind:filter={f} {index} />
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
      "hdr hdr hdr"
      "cmd cmd cmd"
      "inp log prv"
      "out log prv"
      "flt flt flt";
    grid-gap: 20px;
  }

  section {
    border: 1px solid #999;
    padding: 10px;
    background-color: rgb(245, 245, 245);
  }

  .header {
    grid-area: hdr;
  }

  .command {
    grid-area: cmd;
  }

  .inputs {
    grid-area: inp;
  }

  .preview {
    grid-area: prv;
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
    max-width: 400px;
    position: sticky;
    top: 0;
    left: 0;
    overflow: scroll;
    background-color: #fff;
  }

  .filters-holder {
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
  h3 {
    margin-bottom: 10px;
  }
  .header p {
    margin: 0;
  }

  .command {
    display: flex;
    align-items: center;
    margin: 10px 0px;
  }

  .actual-command {
    border: none;
    margin-right: 10px;
    resize: none;
    flex: 1;
    font: inherit;
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
</style>
