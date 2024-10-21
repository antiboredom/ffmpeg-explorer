<script>
  import uFuzzy from "@leeoniya/ufuzzy";
  import FILTERS from "./filters.json";
  import { addNode } from "./stores.js";
  import DynamicFilterModal from "./DynamicFilterModal.svelte";

  export let select = "video";
  $: selectedFilters = selectFilters(select);
  $: allfilters = [...selectedFilters];
  let q = "";

  let selectedFilter = null;
  let showModal = false;

  const uf = new uFuzzy();

  function selectFilters(sel) {
    if (sel == "video") {
      // add support to N->N inputs
      return FILTERS.filter(
        (f) => f.type[0] === "V" || f.type === "N->V" || f.type === "N->N"
      );
    } else if (sel == "audio") {
      // add support to N->N inputs
      return FILTERS.filter(
        (f) => f.type[0] === "A" || f.type === "N->A" || f.type === "N->N"
      );
    } else {
      return [...FILTERS];
    }
  }

  function reset() {
    q = "";
  }

  function add(f) {
    addNode(f, "filter");
  }

  function update() {
    let newFilters = [];
    const [idxs, info, order] = uf.search(
      selectedFilters.map((m) => m.name + " " + m.description),
      q
    );
    if (idxs) {
      for (let i of idxs) {
        newFilters.push(selectedFilters[i]);
      }
      allfilters = newFilters;
    } else {
      allfilters = [...selectedFilters];
    }
  }
</script>

<div class="holder">
  <div class="search">
    <input placeholder="Search Filters" on:keyup={update} bind:value={q} type="text" /><button
      on:click={() => {
        reset();
        update();
      }}>X</button
    >
    <select on:change={reset} bind:value={select}>
      <option value="video">Video Filters</option>
      <option value="audio">Audio Filters</option>
    </select>
  </div>
  <div class="all-filters">
    {#each allfilters as f}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="filter"
        on:click={() => {
          // if input or output is N (dynamic) show modal
          if (
            f.type.startsWith("N") ||
            f.type.endsWith("N") ||
            f.type === "N"
          ) {
            // deep copy current filter data so when overwriting it, it doesn't affect the original
            selectedFilter = {...f, inputs: [...f.inputs], outputs: [...f.outputs]};
            showModal = true;
          } else {
            add(f);
          }
        }}
      >
        <div class="name">
          {f.name} <span class="type">{f.type.replace("->", "⇒")}</span>
        </div>
        <div class="desc">{f.description}</div>
      </div>
    {/each}
  </div>
</div>

{#if showModal}
  <DynamicFilterModal 
    bind:showModal
    selectedFilter={selectedFilter}
  />
{/if}

<style>
  .holder {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    border: 1px solid var(--b1);
  }
  .search {
    display: flex;
    justify-content: stretch;
  }
  input {
    width: 100%;
    flex: 1;
  }
  button {
    margin-left: 1px;
    margin-right: 10px;
  }
  .type {
    color: #999;
    font-size: 0.8em;
  }

  .filter {
    border-bottom: 1px solid var(--b1);
    padding: 10px 0px;
    cursor: pointer;
  }

  .filter:hover {
    background-color: var(--b2);
  }

  .all-filters {
    flex: 1;
    overflow: scroll;
  }
  .desc {
    font-size: 0.9em;
  }
</style>
