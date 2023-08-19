<script>
  import { onMount } from "svelte";
  import { inputs, output, filters } from "./stores.js";
  import Input from "./Input.svelte";
  import Output from "./Output.svelte";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import Modal from "./Modal.svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from "@ffmpeg/util";

  const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.2/dist/esm";
  // const baseURL = "";
  // const videoURL = "https://ffmpegwasm.netlify.app/video/video-15s.avi";
  const videoURL = "/example.mp4";
  const TIMEOUT = 40000;

  const ffmpeg = new FFmpeg();

  let showFilterModal = false;
  let command = "";
  let message = "";
  let videoValue = null;
  let ffmpegLoaded = false;
  let rendering = false;

  function newInput() {
    $inputs = [...$inputs, ""];
  }

  function newFilter() {
    showFilterModal = true;
  }

  function render() {
    transcode();
  }

  async function transcode() {
    // try {
    message = "Start transcoding";
    videoValue = null;
    rendering = true;
    await ffmpeg.writeFile("example.mp4", await fetchFile(videoURL));
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

    const cFilters = $filters
      .map((f) => {
        let fCommand = f.name;
        if (f.params && f.params.length > 0) {
          let params = f.params
            .map((p) => {
              if (p.value === "" || p.value === null) return null;
              return `${p.name}=${p.value}`;
            })
            .filter((p) => p !== null)
            .join(":");
          fCommand += "=" + params;
        }
        return fCommand;
      })
      .join(",");

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
      fCommand += "=" + params;
    }
    return fCommand;
  }

  function commandList() {
    let command = ["-i", "example.mp4"];

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
      // message = msg;
    });
    await ffmpeg.load({
      // coreURL: `${baseURL}/ffmpeg-core.js`,
      // wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      // workerURL: `${baseURL}/ffmpeg-core.worker.js`,
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    });
    console.log(ffmpeg);
    ffmpegLoaded = true;
  });
</script>

<main>
  {message}
  <section class="command">{command}</section>
  <section class="inputs">
    <h3>Inputs</h3>
    {#each $inputs as inp, index}
      <Input bind:filename={inp} {index} />
    {/each}
    <button on:click={newInput}>New Input</button>

    {#each $inputs as inp}
      <p>{inp}</p>
    {/each}
  </section>

  <section class="filters">
    <!-- {JSON.stringify($filters)} -->
    <h3>Filters</h3>
    <button on:click={newFilter}>Add Filter</button>
    <Modal bind:showModal={showFilterModal}>
      <FilterPicker bind:showFilterModal />
    </Modal>
    <div class="filters-holder">
      {#each $filters as f, index}
        <div class="filter">
          <Filter bind:filter={f} {index} />
        </div>
      {/each}
    </div>
  </section>

  <section class="output">
    <h3>Output</h3>
    <Output bind:filename={$output} />
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
    {#if videoValue}
      <video controls src={videoValue} />
    {/if}
  </section>
</main>

<style>
  .filters-holder {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .filter {
    margin: 10px;
  }
</style>
