<script>
  import uFuzzy from "@leeoniya/ufuzzy";
  import FILTERS from "./filters.json";
  import { filters } from "./stores.js";

  let allfilters = [...FILTERS];
  let q = "";
	export let showFilterModal;

  const uf = new uFuzzy();

  function add(f) {
    const newFilter = { ...f };
    newFilter.params = f.params.map((p) => {
      p.value = null;
      if (p.default != null) p.value = p.default;
      return p;
    });
    $filters = [...$filters, newFilter];
		showFilterModal = false;
    console.log(newFilter);
  }

  function update() {
    let newFilters = [];
    const [idxs, info, order] = uf.search(
      FILTERS.map((m) => m.name + " " + m.description),
      q
    );
    if (idxs) {
      for (let i of idxs) {
        newFilters.push(FILTERS[i]);
      }
      allfilters = newFilters;
    } else {
      allfilters = FILTERS;
    }
  }
</script>

<div class="holder">
  <div class="search">
    <input placeholder="Search Filters" on:keyup={update} bind:value={q} />
  </div>
  <div class="all-filters">
    {#each allfilters as f}
      <div class="filter" on:click={() => add(f)}>
        <div class="name">{f.name} <span class="type">{f.type}</span></div>
        <div class="desc">{f.description}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .holder {
    display: flex;
    flex-direction: column;
    height: 400px;
  }

  .filter {
    border-bottom: 1px solid #000;
    padding: 10px 0px;
    cursor: pointer;
  }
  .all-filters {
    flex: 1;
    overflow: scroll;
  }
  .desc {
    font-size: 0.9em;
  }
</style>
