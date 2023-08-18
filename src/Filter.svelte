<script>
  import FILTERS from "./filters.json";
  import { filters } from "./stores.js";

  export let filter = {
    name: "",
    params: [],
    description: "",
  };

  export let index;

  function remove() {
    $filters.splice(index, 1);
    $filters = $filters;
  }
</script>

<div class="filter-holder">
  <div class="head">
    <div class="name">{filter.name}</div>
    <button on:click={remove}>X</button>
  </div>

  <div class="description">{filter.description}</div>

  {#if filter.params.length > 0}
    <div class="options">
      {#each filter.params as p}
        <div class="param-holder">
          <div class="param">
            <span class="p-name">{p.name}</span>
            <span class="p-value">
              {#if p.options && p.options.length > 0}
                <select bind:value={p.value}>
                  {#each p.options as o}
                    <option value={o.value}
                      >{o.value}
                      {#if o.desc}({o.desc}){/if}
                    </option>
                  {/each}
                </select>
              {:else if p.type == "float" || p.type == "double" || p.type == "long" || p.type == "int"}
                <input type="range" min={p.min} max={p.max} bind:value={p.value} />
                <input bind:value={p.value} />
              {:else}
                <input bind:value={p.value} />
              {/if}
            </span>
          </div>
          <div class="p-description">{p.desc}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .filter-holder {
    background-color: #fff;
    padding: 10px;
  }
  .filter-holder,
  input,
  select {
    font-size: 14px;
    font-family: "Times New Roman", Times, serif;
  }
  .description {
    margin: 10px 0px;
  }
  .head {
    display: flex;
    justify-content: space-between;
  }
  .options {
    /* margin-top: 10px; */
    /* padding-top: 10px; */
  }
  .param {
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
  }
  .param-holder {
    border-top: 1px solid #999;
    padding: 10px 0px;
  }
  .param-holder:last-child {
    padding-bottom: 0;
  }
  .p-description {
    opacity: 0.8;
    font-size: 0.9em;
  }

  p {
    margin: 0;
  }
</style>
