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

export const previewCommand = derived([edges, nodes], ([$edges, $nodes]) => {
  // [0:v]f1=val,f2=val[out] -map out
  // [0:v]f1=val,f2=val[1];[1][1:v]overlay[out] -map out`

	let finalCommand = [];

  let filtergraph = [];

	const inputs = $nodes.filter(n => n.nodeType == "input");
	const outputs = $nodes.filter(n => n.nodeType == "output");

	const inputIds = {};
	for (let i=0; i<inputs.length; i++) {
		const inp = inputs[i];
		inputIds[inp.id] = i;
	}

	console.log($edges)
	const edgeIds = {};
	for (let i = 0; i < $edges.length; i++) {
		const e = $edges[i];
		edgeIds[e.id] = i + 1;

		const source = $nodes.find(n => "N-" + n.id === e.source);
		const target = $nodes.find(n => "N-" + n.id === e.target);

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

    const outs = $edges.filter((e) => e.source == "N-" + n.id);
    const ins = $edges.filter((e) => e.target == "N-" + n.id);

    if (outs.length == 0 && ins.length == 0) continue;

    for (let i of ins) {
			const eid = edgeIds[i.id];
      cmd += `[${eid}]`
    }
    cmd += makeFilterArgs(n.data);
    for (let o of outs) {
			const eid = edgeIds[o.id];
      cmd += `[${eid}]`
    }
		filtergraph.push(cmd);
  }

	finalCommand.push("ffmpeg");

	for (let inp of inputs) {
		finalCommand.push("-i");
		finalCommand.push(inp.data.name);
	}

	finalCommand.push("-filter_complex")

	finalCommand.push('"' + filtergraph.join(';') + '"');

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

export const previewCommandOld2 = derived([edges, nodes], ([$edges, $nodes]) => {
  // [0:v]f1=val,f2=val[out] -map out
  // [0:v]f1=val,f2=val[1];[1][1:v]overlay[out] -map out`

	let finalCommand = [];

  let filtergraph = [];

	const inputs = $nodes.filter(n => n.nodeType == "input");
	const outputs = $nodes.filter(n => n.nodeType == "output");

	const inputIds = {};
	for (let i=0; i<inputs.length; i++) {
		const inp = inputs[i];
		inputIds[inp.id] = i;
	}

	const edgeIds = {};
	for (let i = 0; i < $edges.length; i++) {
		const e = $edges[i];
		edgeIds[e.id] = i + 1;

		const source = $nodes.find(n => n.id === e.source);
		const target = $nodes.find(n => n.id === e.target);

		if (source.nodeType === "input") {
			if (e.sourceHandle.includes("v")) {
				edgeIds[e.id] = inputIds[source.id] + ":v";
			}
			if (e.sourceHandle.includes("a")) {
				edgeIds[e.id] = inputIds[source.id] + ":a";
			}
		}

		if (target.nodeType === "output") {
			edgeIds[e.id] = "out";
		}
	}


  for (let n of $nodes.filter((n) => n.nodeType == "filter")) {
    let cmd = "";

    const outs = $edges.filter((e) => e.source == n.id);
    const ins = $edges.filter((e) => e.target == n.id);

    if (outs.length == 0 && ins.length == 0) continue;

    for (let i of ins) {
			const eid = edgeIds[i.id];
      cmd += `[${eid}]`
    }
    cmd += makeFilterArgs(n.data);
    for (let o of outs) {
			const eid = edgeIds[o.id];
      cmd += `[${eid}]`
    }
		filtergraph.push(cmd);
  }

	finalCommand.push("ffmpeg");

	for (let inp of inputs) {
		finalCommand.push("-i");
		finalCommand.push(inp.data.name);
	}

	finalCommand.push("-filter_complex")

	finalCommand.push('"' + filtergraph.join(';') + '"');

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

  // edges.update((_edges) => {
  // const target = existing[existing.length - 2];
  // if (!target) return _edges;
  //   const newEdge = {
  //     id: uuidv4(),
  //     type: "default",
  //     source: target.id,
  //     target: node.id,
  //   };
  //   _edges.push(newEdge);
  //   return _edges;
  // });
}

export function removeNode(id) {
  nodes.update((_nodes) => {
    const index = _nodes.findIndex((n) => n.id === id);
    _nodes.splice(index, 1);
    return _nodes;
  });
}
