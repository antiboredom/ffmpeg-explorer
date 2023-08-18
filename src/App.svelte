<script>
  import FILTERS from "./filters.json";
  import { inputs, output, filters } from "./stores.js";
  import Input from "./Input.svelte";
  import Output from "./Output.svelte";
  import Filter from "./Filter.svelte";
  import FilterPicker from "./FilterPicker.svelte";
  import Modal from "./Modal.svelte";

  let showFilterModal = false;

  function newInput() {
    $inputs = [...$inputs, ""];
  }

  function newFilter() {
    showFilterModal = true;
  }

  let command = "";

  inputs.subscribe(updateCommand);
  output.subscribe(updateCommand);
  filters.subscribe(updateCommand);

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
</script>

<main>
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
    <p>{$output}</p>
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
