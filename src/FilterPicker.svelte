<script>
  import uFuzzy from "@leeoniya/ufuzzy";
  import FILTERS from "./filters.json";
  import { addNode } from "./stores.js";

  export let select = "video";
  $: selectedFilters = selectFilters(select);
  $: allfilters = [...selectedFilters];
  let q = "";

  const uf = new uFuzzy();

  function selectFilters(sel) {
    if (sel == "video") {
      // return FILTERS.filter((f) => f.type.startsWith("V")  || f.type.endsWith("V"));
      return FILTERS.filter((f) => f.type[0] === "V" || f.type === "N->V");
    } else if (sel == "audio") {
      // return FILTERS.filter((f) => f.type.startsWith("A")  || f.type.endsWith("A"));
      return FILTERS.filter((f) => f.type[0] === "A" || f.type === "N->A");
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
      <div class="filter" on:click={() => add(f)}>
        <div class="name">{f.name} <span class="type">{f.type.replace("->", "⇒")}</span></div>
        <div class="desc">{f.description}</div>
      </div>
    {/each}
  </div>
</div>

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
