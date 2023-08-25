import { v4 as uuidv4 } from "uuid";
import { writable, derived, get } from "svelte/store";

// export const inputs = writable([]);
// export const output = writable("out.mp4");
// export const filters = writable([]);
export const nodes = writable([]);
export const edges = writable([]);
export const auto = writable(true);
export const selectedFilter = writable();

const PREFIX = "";

addNode({ name: "punch.mp4" }, "input");
addNode({ name: "out.mp4" }, "output");

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

export const previewCommandSvelvet = derived([edges, nodes], ([$edges, $nodes]) => {
  // [0:v]f1=val,f2=val[out] -map out
  // [0:v]f1=val,f2=val[1];[1][1:v]overlay[out] -map out`

  let finalCommand = [];

  let filtergraph = [];

  const inputs = $nodes.filter((n) => n.nodeType == "input");
  const outputs = $nodes.filter((n) => n.nodeType == "output");

  const inputIds = {};
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    inputIds[inp.id] = i;
  }

  const edgeIds = {};
  for (let i = 0; i < $edges.length; i++) {
    const e = $edges[i];
    edgeIds[e.id] = i + 1;

    const source = $nodes.find((n) => PREFIX + n.id === e.source);
    const target = $nodes.find((n) => PREFIX + n.id === e.target);

    if (!source || !target) continue;

    if (source.nodeType === "input") {
      if (e.sourceAnchor.startsWith("A-v")) {
        edgeIds[e.id] = inputIds[source.id] + ":v";
      }
      if (e.sourceAnchor.startsWith("A-a")) {
        edgeIds[e.id] = inputIds[source.id] + ":a";
      }
    }

    if (target.nodeType === "output") {
      edgeIds[e.id] = "out";
    }
  }

  for (let n of $nodes.filter((n) => n.nodeType == "filter")) {
    let cmd = "";

    const outs = $edges.filter((e) => e.source == PREFIX + n.id);
    const ins = $edges.filter((e) => e.target == PREFIX + n.id);

    if (outs.length == 0 && ins.length == 0) continue;

    for (let i of ins) {
      const eid = edgeIds[i.id];
      cmd += `[${eid}]`;
    }
    cmd += makeFilterArgs(n.data);
    for (let o of outs) {
      const eid = edgeIds[o.id];
      cmd += `[${eid}]`;
    }
    filtergraph.push(cmd);
  }

  finalCommand.push("ffmpeg");

  for (let inp of inputs) {
    finalCommand.push("-i");
    finalCommand.push(inp.data.name);
  }

  finalCommand.push("-filter_complex");

  finalCommand.push('"' + filtergraph.join(";") + '"');

  for (let out of outputs) {
    finalCommand.push("-map");
    finalCommand.push('"[out]"');
  }

  for (let inp of inputs) {
    finalCommand.push("-map");
    finalCommand.push(inputIds[inp.id] + ":a");
  }

  for (let out of outputs) {
    finalCommand.push(out.data.name);
  }

  const entireCommand = finalCommand.join(" ");
  return entireCommand;
});

export const previewCommand = derived([edges, nodes], ([$edges, $nodes]) => {
  // [0:v]f1=val,f2=val[out] -map out
  // [0:v]f1=val,f2=val[1];[1][1:v]overlay[out] -map out`

  let hasVid = false;
  let hasAud = false;

  let finalCommand = [];

  let filtergraph = [];

  const inputs = $nodes.filter((n) => n.nodeType == "input");
  const outputs = $nodes.filter((n) => n.nodeType == "output");

  const inputIds = {};
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    inputIds[inp.id] = i;
  }

  const edgeIds = {};
  for (let i = 0; i < $edges.length; i++) {
    const e = $edges[i];
    edgeIds[e.id] = i + 1;

    const source = $nodes.find((n) => n.id === e.source);
    const target = $nodes.find((n) => n.id === e.target);

		if (source && target) {

			if (source.nodeType === "input") {
				if (e.sourceHandle.includes("v")) {
					edgeIds[e.id] = inputIds[source.id] + ":v";
				}
				if (e.sourceHandle.includes("a")) {
					edgeIds[e.id] = inputIds[source.id] + ":a";
				}
			}

			if (target.nodeType === "output") {
				const outType = e.targetHandle.includes("a") ? "aud_out" : "vid_out";
				edgeIds[e.id] = outType;
			}
		}
  }

  for (let n of $nodes.filter((n) => n.nodeType == "filter")) {
    let cmd = "";

    const outs = $edges.filter((e) => e.source == n.id);
    const ins = $edges.filter((e) => e.target == n.id);

    if (outs.length == 0 && ins.length == 0) continue;

    for (let i of ins) {
      const eid = edgeIds[i.id];
      cmd += `[${eid}]`;
    }
    cmd += makeFilterArgs(n.data);
    for (let o of outs) {
      const eid = edgeIds[o.id];
      cmd += `[${eid}]`;
    }
    filtergraph.push(cmd);
  }

  finalCommand.push("ffmpeg");

  for (let inp of inputs) {
    finalCommand.push("-i");
    finalCommand.push(inp.data.name);
  }

  if (filtergraph.length > 0) {
    const fg = '"' + filtergraph.join(";") + '"';
    hasVid = fg.includes(":v]");
    hasAud = fg.includes(":a]");

    finalCommand.push("-filter_complex");
    finalCommand.push(fg);

    finalCommand.push("-map");
    if (hasAud) {
      finalCommand.push('"[aud_out]"');
    } else {
      finalCommand.push("0:a");
    }

    if (hasVid) {
      finalCommand.push("-map");
      finalCommand.push('"[vid_out]"');
    }
  }

  // for (let inp of inputs) {
  //   finalCommand.push("-map");
  //   finalCommand.push(inputIds[inp.id] + ":a");
  // }

  for (let out of outputs) {
    finalCommand.push(out.data.name);
  }

  const entireCommand = finalCommand.join(" ");
  return entireCommand;
});

export const previewCommandOld = derived(nodes, ($nodes) => {
  const cInputs = $nodes
    .filter((n) => n.nodeType === "input")
    .map((i) => `-i ${i.data.name}`)
    .join(" ");

  const cOutput = $nodes
    .filter((n) => n.nodeType === "output")
    .map((i) => `${i.data.name}`)
    .join(" ");

  const cFilters = $nodes
    .filter((n) => n.nodeType === "filter")
    .map((n) => n.data)
    .map(makeFilterArgs)
    .join(",");

  let out = `ffmpeg ${cInputs}`;

  if (cFilters) out += ` -filter_complex "${cFilters}"`;

  out += ` ${cOutput}`;
  return out;
});

export const inputs = derived(nodes, ($nodes) => {
  return $nodes.filter((n) => n.nodeType === "input").map((n) => n.data);
});

export const filters = derived(nodes, ($nodes) => {
  return $nodes.filter((n) => n.nodeType === "filter").map((n) => n.data);
});

export const output = derived(nodes, ($nodes) => {
  return $nodes.filter((n) => n.nodeType === "output").map((n) => n.data);
});

nodes.subscribe(($nodes) => {
  const isAuto = get(auto);
  if (!isAuto) return;

  const outputNodes = $nodes.filter((n) => n.nodeType === "output");
  const inputNodes = $nodes.filter((n) => n.nodeType === "input");
  const filterNodes = $nodes.filter((n) => n.nodeType === "filter");
  const orderedNodes = [].concat(filterNodes, outputNodes).filter((n) => n != undefined);

  const filled = [];
  let newEdges = [];

  function connectNode(n1, rest) {
    for (let i = 0; i < n1.data.outputs.length; i++) {
      const edgeType = n1.data.outputs[i];
      for (let j = 0; j < rest.length; j++) {
        let found = false;
        const n2 = rest[j];
        for (let k = 0; k < n2.data.inputs.length; k++) {
          const targetEdgeType = n2.data.inputs[k];
          if (edgeType === targetEdgeType && !filled.includes(n2.id + k)) {
            newEdges.push({
              id: uuidv4(),
              type: "default",
              source: n1.id,
              target: n2.id,
              sourceHandle: edgeType + "_" + i,
              targetHandle: edgeType + "_" + k,
            });
            filled.push(n2.id + k);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    const nextNode = rest.shift();
    if (nextNode) {
      connectNode(nextNode, rest);
    }
  }

  for (let inpNode of inputNodes) {
    connectNode(inpNode, [...orderedNodes]);
  }
  // console.log("new", newEdges);
  edges.set(newEdges);
});

export function addNode(data, type) {
  let ins = [];
  let outs = [];

  if (type === "input") {
    outs = ["v", "a"];
  } else if (type === "output") {
    ins = ["v", "a"];
  } else if (type === "filter") {
    const [_ins, _outs] = data.type.split("->");
    ins = _ins.toLowerCase().split("");
    outs = _outs.toLowerCase().split("");
    if (data.params) {
      data.params = data.params.map((p) => {
        p.value = null;
        if (p.default != null) p.value = p.default;
        return p;
      });
    }
  }

	data.nodeType = type;
  data.inputs = ins;
  data.outputs = outs;

  let node = {
    id: uuidv4(),
    type: "ffmpeg",
    data: data,
    nodeType: type,
    position: { x: 0, y: 0 },
  };

  nodes.update((_nodes) => {
    _nodes.push(node);

    const isAuto = get(auto);

    if (isAuto) {
      const w = 120;
      const h = 50;
      const margin = 50;
      let prev = null;

      for (let n of _nodes) {
        if (n.nodeType === "input") {
          n.position = { x: 0, y: prev ? prev.position.y + h + margin : 0 };
          prev = n;
        }
      }

      for (let n of _nodes) {
        if (n.nodeType === "filter") {
					let _w = prev && prev.width ? prev.width : w;
          n.position = { x: prev ? prev.position.x + _w + margin : 0, y: -50 };
          prev = n;
        }
      }

      for (let n of _nodes) {
        if (n.nodeType === "output") {
					let _w = prev && prev.width ? prev.width : w;
          n.position = { x: prev ? prev.position.x + _w + margin : 0, y: 0 };
        }
      }
    }
		if (node.nodeType === "filter") {
			selectedFilter.set(_nodes.length - 1);
		}
    return _nodes;
  });


}

export function removeNode(id) {
  nodes.update((_nodes) => {
    const index = _nodes.findIndex((n) => n.id === id);
    _nodes.splice(index, 1);
    return _nodes;
  });

  edges.update((_edges) => {
    for (let i = _edges.length - 1; i--; i >= 0) {
      const e = _edges[i];
      if ("N-" + e.source === id || "N-" + e.target === id) {
        _edges.splice(i, 1);
      }
    }
    return _edges;
  });
}
