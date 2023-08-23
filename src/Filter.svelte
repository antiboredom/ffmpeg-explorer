<script>
  import { filters, removeNode } from "./stores.js";

  export let filter = {
    name: "",
    params: [],
    description: "",
  };

  let show = false;

  function remove() {
		removeNode(filter.id);
  }

  function reset() {
    for (let p of filter.params) {
      p.value = null;
      if (p.default != null) p.value = p.default;
    }
    filter = filter;
  }

  $: url = `https://ffmpeg.org/ffmpeg-filters.html#${filter.name}`;
</script>

<div class="filter-holder">
  <div class="head">
    <div class="name"><h3>{filter.name}</h3></div>
    <div>
      {#if filter.params && filter.params.length > 0}
        <button on:click={() => (show = !show)}>{show ? "Hide" : "Show"} Options</button>
      {/if}
      <button on:click={remove}>X</button>
    </div>
  </div>

  <div class="description">
    {filter.description}
    <a href={url} target="_blank">Full documentation.</a>
  </div>

  {#if filter.params && filter.params.length > 0 && show}
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
                <input
                  step={p.type == "int" ? 1 : 0.01}
                  type="range"
                  min={p.min}
                  max={p.max}
                  bind:value={p.value}
                />
                <input bind:value={p.value} />
              {:else}
                <input bind:value={p.value} />
              {/if}
            </span>
          </div>
          <div class="p-description">{p.desc}</div>
        </div>
      {/each}
      <div class="param-holder">
        <button on:click={reset}>Reset to Defaults</button>
      </div>
    </div>
  {/if}
</div>

<style>
  h3 {
    font-weight: normal;
    margin: 0;
    padding: 0;
    font-size: 18px;
  }
  .filter-holder {
    background-color: #fff;
    padding: 10px;
    /* border: 1px solid #999; */
    border: 1px solid var(--b1);
    /* box-shadow: 5px 5px 0px #000; */
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
  .param {
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .param-holder {
    border-top: 1px solid var(--b1);
    padding: 10px 0px;
  }
  .param-holder:last-child {
    padding-bottom: 0;
  }
  .p-value {
    display: flex;
  }
  input[type="range"] {
    margin-right: 5px;
  }
  .p-description {
    opacity: 0.8;
    font-size: 0.9em;
  }
</style>
