import { v4 as uuidv4 } from "uuid";
import { writable, derived, get } from "svelte/store";

export const nodes = writable([]);
export const edges = writable([]);
export const auto = writable(true);
export const selectedFilter = writable();

export const INPUTNAMES = [
  { name: "punch.mp4", url: "/punch.mp4", ext: "mp4", outputs: ["v", "a"], inputs: [] },
  { name: "shoe.mp4", url: "/shoe.mp4", ext: "mp4", outputs: ["v", "a"], inputs: [] },
];

export const OUTPUTNAMES = [
  { name: "out.mp4", ext: "mp4", inputs: ["v", "a"], outputs: [] },
  { name: "out.gif", ext: "gif", inputs: ["v"], outputs: [] },
];

export const inputNames = writable(INPUTNAMES);
export const outputNames = writable(OUTPUTNAMES);

addNode({ ...INPUTNAMES[0] }, "input");
addNode({ ...OUTPUTNAMES[0] }, "output");

export function makeFilterArgs(f) {
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

export const previewCommand = derived([edges, nodes], ([$edges, $nodes]) => {
  let finalCommand = [];
  let filtergraph = [];
  let labelIndex = 1;
  const edgeIds = {};
  const inputIdMap = {};

  const inputs = $nodes.filter((n) => n.nodeType === "input");
  const inputIds = inputs.map((n) => n.id);
  const inputEdges = $edges.filter((e) => inputIds.includes(e.source));
  const outputs = $nodes.filter((n) => n.nodeType === "output");

  // create edge labels for each input
  inputs.forEach((inp, i) => (inputIdMap[inp.id] = i));

  // create edge labels for each filter
  function traverseEdges(edg, type) {
    const outEdges = $edges.filter((e) => e.source === edg.target && e.sourceHandle.includes(type));

    let label;

    const inNode = $nodes.find((n) => n.id === edg.source);
    const outNode = $nodes.find((n) => n.id === edg.target);

    if (inNode && outNode) {
      if (inNode.nodeType === "input" && outNode.nodeType === "filter") {
        label = inputIdMap[inNode.id] + ":" + edg.sourceHandle[0];
      } else if (inNode.nodeType === "filter" && outNode.nodeType === "filter") {
        label = labelIndex;
        labelIndex++;
      } else if (inNode.nodeType === "filter" && outNode.nodeType === "output") {
        label = "out_" + type;
      } else if (inNode.nodeType === "input" && outNode.nodeType === "output") {
        label = "FILTERLESS_" + inputIdMap[inNode.id] + ":" + type;
      } else {
        label = "UNKNOWN";
      }

      edgeIds[edg.id] = label;
    }

    for (let e2 of outEdges) {
      traverseEdges(e2, type);
    }
  }

  for (let inp of inputEdges) {
    for (let t of ["v", "a"]) {
      if (inp.sourceHandle.includes(t)) {
        traverseEdges(inp, t);
      }
    }
  }

  for (let n of $nodes.filter((n) => n.nodeType == "filter")) {
    let cmd = { weight: 0, in: [], out: [], cmd: "" };

    const outs = $edges.filter((e) => e.source == n.id);
    const ins = $edges.filter((e) => e.target == n.id);

    if (outs.length == 0 && ins.length == 0) continue;

    for (let i of ins) {
      const eid = edgeIds[i.id];
      if (typeof eid == "string" && eid.includes(":")) cmd.weight = -1000;
      cmd.in.push(eid);
    }

    cmd.cmd = makeFilterArgs(n.data);

    for (let o of outs) {
      const eid = edgeIds[o.id];
      if (typeof eid == "string" && eid.includes("out")) cmd.weight = 1000;
      else cmd.weight = eid;
      cmd.out.push(eid);
    }

    filtergraph.push(cmd);
  }

  filtergraph.sort((a, b) => {
    return a.weight - b.weight;
  });

  filtergraph = filtergraph.map((c) => {
    return c.in.map((i) => `[${i}]`).join("") + c.cmd + c.out.map((i) => `[${i}]`).join("");
  });

  finalCommand.push("ffmpeg");

  for (let inp of inputs) {
    finalCommand.push("-i");
    finalCommand.push(inp.data.name);
  }

  let hasVid = false;
  let hasAud = false;

  let mediaMaps = Object.values(edgeIds)
    .map((eid) => {
      if (String(eid).includes("FILTERLESS")) {
        return eid.split("_")[1];
      }
      return null;
    })
    .filter((m) => m !== null);

  if (filtergraph.length > 0) {
    let fg = `"${filtergraph.join(";")}"`;

    // this crazy thing replaces stuff like [1];[1] with a comma!
    fg = fg.replaceAll(/(\[\d+\]);\1(?!\[)/g, ",");

    hasVid = fg.includes(":v]");
    hasAud = fg.includes(":a]");

    finalCommand.push("-filter_complex", fg);

    if (hasAud) {
      finalCommand.push("-map", '"[out_a]"');
    }

    if (hasVid) {
      finalCommand.push("-map", '"[out_v]"');
    }

    for (let m of mediaMaps) {
      finalCommand.push("-map", m);
    }
  }

  for (let out of outputs) {
    finalCommand.push(out.data.name);
  }

  return finalCommand;
});

export const inputs = derived(nodes, ($nodes) => {
  return $nodes.filter((n) => n.nodeType === "input").map((n) => n.data);
});

export const outputs = derived(nodes, ($nodes) => {
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

  edges.set(newEdges);
});

export function addNode(_data, type) {
  const data = JSON.parse(JSON.stringify(_data));

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

export function resetNodes() {
  nodes.set([]);
  addNode({ name: "punch.mp4" }, "input");
  addNode({ name: "out.mp4" }, "output");
}

export function removeNode(id) {
  nodes.update((_nodes) => {
    const index = _nodes.findIndex((n) => n.id === id);
    _nodes.splice(index, 1);
    return _nodes;
  });
}

export function removeEdge(id) {
  edges.update((_edges) => {
    const index = _edges.findIndex((e) => e.id === id);
    _edges.splice(index, 1);
    return _edges;
  });
}
