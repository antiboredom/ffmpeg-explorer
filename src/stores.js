import { v4 as uuidv4 } from "uuid";
import { writable, derived, get } from "svelte/store";

// export const inputs = writable([]);
// export const output = writable("out.mp4");
// export const filters = writable([]);
export const nodes = writable([]);
export const edges = writable([]);

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

export const command = derived(edges, ($edges) => {
  console.log($edges);
  return $edges;
});

export const previewCommand = derived(nodes, ($nodes) => {
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

  let x = 0;
  let y = 0;

  const w = 100;
  const h = 50;
  const margin = 10;

  const existing = get(nodes);

  if (type === "input") {
    const inps = existing.filter((n) => n.nodeType === "input");
    y = inps.length * h;
  } else if (type === "filter") {
    const flts = existing.filter((n) => n.nodeType === "filter");
    x = (flts.length + 1) * w;
  } else if (type === "output") {
    x = 500;
  }

  data.inputs = ins;
  data.outputs = outs;

  let node = {
    id: uuidv4(),
    type: "ffmpeg",
    data: data,
    nodeType: type,
    position: { x, y },
  };

  nodes.update((n) => {
    n.push(node);
    return n;
  });

  edges.update((_edges) => {
		console.log('EXISTING', existing);
		const target = existing[existing.length -2];
		if (!target) return _edges;
    const newEdge = {
      id: uuidv4(),
      type: "default",
      source: node.id,
      target: target.id,
    };
		console.log("NEW EDGE", newEdge);
    _edges.push(newEdge);
    return _edges;
  });
}

export function removeNode(id) {
  nodes.update((_nodes) => {
    const index = _nodes.findIndex((n) => n.id === id);
    _nodes.splice(index, 1);
    return _nodes;
  });
}
