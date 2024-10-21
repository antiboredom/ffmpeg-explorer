<script>
  import Modal from "./Modal.svelte";
  import { addNode } from "./stores.js";

  export let selectedFilter = null;
  export let showModal = false;
  let modalInputs = [];
  let modalOutputs = [];

  function add(f) {
    addNode(f, "filter");
  }
</script>

{#if showModal}
  <Modal
    bind:showModal
    onConfirm={() => {
     // force update the ui
      modalInputs = [
        ...selectedFilter.inputs.filter((i) => i === "v" || i === "a"),
        ...modalInputs,
      ];
      modalOutputs = [
        ...selectedFilter.outputs.filter((i) => i === "v" || i === "a"),
        ...modalOutputs,
      ];

      selectedFilter.inputs = modalInputs;
      selectedFilter.outputs = modalOutputs;
      selectedFilter.isCustom = true; // for handling the ordering of the inputs in the previewCommand in store.js

      add(selectedFilter);
      selectedFilter = null;
      showModal = false;
    }}
  >
    <h2 slot="header">
      {selectedFilter.name}
      <i
        style="
          color: #999;
          font-size: 0.8em;
          margin-left: 10px;
        "
        >(Either the input or output can have dynamic types or a variable number
        of streams, and the order in which they are entered is important.)</i
      >
      <p>{selectedFilter.description}</p>
    </h2>

    <div slot="body" class="flex-row-start">
      <div style="margin: 0.5em;" class="flex-col-center">
        <label for="input">Input</label>
        <hr style="width: 100%;" />

        <ul>
          {#if selectedFilter.inputs.length === 0}
            <li>None</li>
          {:else}
            {#each selectedFilter.inputs as input}
              {#if input === "v"}
                <li>Video</li>
              {:else if input === "a"}
                <li>Audio</li>
              {:else}
                <button
                  on:click={() => {
                    modalInputs = [...modalInputs, "v"];
                  }}
                >
                  +
                </button>
              {/if}
            {/each}
          {/if}

          {#each modalInputs as customInput, i}
            <li>
              <select
                on:change={(e) => {
                  modalInputs[i] = e.target.value;
                }}
              >
                <option value="v" selected={customInput === "v"}>Video</option>
                <option value="a" selected={customInput === "a"}>Audio</option>
              </select>
            </li>
          {/each}
        </ul>
      </div>
      <!-- vertical line -->
      <div
        style="
            border-left: 1px solid #999;
            height: 100px;
            margin: 0.5em;
          "
      ></div>

      <div style="margin: 0.5em;" class="flex-col-center">
        <label for="output">Output</label>
        <hr style="width: 100%;" />
        <ul class="reset">
          {#if selectedFilter.outputs.length === 0}
            <li>None</li>
          {:else}
            {#each selectedFilter.outputs as output}
              {#if output === "v"}
                <li>Video</li>
              {:else if output === "a"}
                <li>Audio</li>
              {:else}
                <button
                  on:click={() => {
                    modalOutputs = [...modalOutputs, "v"];
                  }}
                >
                  +
                </button>
              {/if}
            {/each}
          {/if}

          {#each modalOutputs as customOutput, i}
            <li>
              <select
                on:change={(e) => {
                  modalOutputs[i] = e.target.value;
                }}
              >
                <option value="v" selected={customOutput === "v"}>Video</option>
                <option value="a" selected={customOutput === "a"}>Audio</option>
              </select>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </Modal>
{/if}

<style>
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
  li {
    margin: 0.5em 0;
    padding: 0;
  }

  .flex-row-start {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
  }
  .flex-col-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  button {
    margin-left: 1px;
    margin-right: 10px;
  }
</style>
