<script>
  import uFuzzy from "@leeoniya/ufuzzy";
	import { v4 as uuidv4 } from 'uuid';
  import FILTERS from "./filters.json";
  import { filters } from "./stores.js";

	export let select = "video";
	$: selectedFilters = selectFilters(select);
  $: allfilters = [...selectedFilters];
  let q = "";

  const uf = new uFuzzy();

	function selectFilters(sel) {
		if (sel == "video") {
			return FILTERS.filter(f => f.type[0] === "V")
		} else if (sel == "audio") {
			return FILTERS.filter(f => f.type[0] === "A")
		} else {
			return [...FILTERS];
		}
	}

	function reset() {
		console.log('ressetting', select)
		selectedFilters = selectFilters(select);
		q = "";
	}

  function add(f) {
    const newFilter = { ...f, filterId: f.id, id: uuidv4()  };
		if (f.params) {
			newFilter.params = f.params.map((p) => {
				p.value = null;
				if (p.default != null) p.value = p.default;
				return p;
			});
		}
    $filters = [...$filters, newFilter];
    console.log(newFilter);
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
    <input placeholder="Search Filters" on:keyup={update} bind:value={q} />
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
  }
	.type {
		color: #999;
		font-size: 0.8em;
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
