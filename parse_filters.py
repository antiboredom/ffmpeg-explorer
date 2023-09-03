import json
import re
from subprocess import run

MAXES = ["INT_MAX", "FLT_MAX", "DBL_MAX", "I64_MAX", "UINT32_MAX"]

MINS = [
    "INT_MIN",
    "FLT_MIN",
    "DBL_MIN",
    "-DBL_MAX",
    "I64_MIN",
    "-FLT_MAX",
]

OPTION_OVERRIDES = {
    "drawtext": {
        "fontfile": [
            {"value": "", "desc": ""},
            {"value": "times.ttf", "desc": "Times"},
            {"value": "arial.ttf", "desc": "Arial"},
            {"value": "courier.ttf", "desc": "Courier"},
            {"value": "comic.ttf", "desc": "Comic Sans"},
        ]
    }
}


def get_names():
    filters = []

    with open("./filternames_wasm.txt", "r") as infile:
        input = infile.readlines()
        input = [l.strip() for l in input]

    for index, l in enumerate(input):
        parts = re.split(r" +", l)
        filter_meta = parts[0]
        filter_name = parts[1]
        filter_type = parts[2]
        description = " ".join(parts[3:])

        item = {
            "id": index,
            "meta": filter_meta,
            "name": filter_name,
            "type": filter_type,
            "description": description,
        }
        filters.append(item)

    return filters


def get_params(f):
    help_text = run(
        ["ffmpeg", "-hide_banner", "-h", f"filter={f['name']}"],
        text=True,
        capture_output=True,
    )

    text = help_text.stdout

    input_channels, output_channels = f["type"].split("->")
    f["inputs"] = list(input_channels.lower().strip())
    f["outputs"] = list(output_channels.lower().strip())

    try:
        text = text.split("AVOptions:")[1]
    except Exception as e:
        return f
    
    lines = text.split("\n")

    params = []

    for l in lines:
        if not l.startswith("   "):
            continue
        issub = l.startswith("     ")
        parts = re.split(r" +", l)[1:]
        if not issub:
            item = {
                "name": parts[0],
                "type": re.sub("[<>]", "", parts[1]),
                "desc": " ".join(parts[3:]),
                "min": None,
                "max": None,
                "default": None,
            }

            search = re.search(r"\(from (.*?) to (.*?)\)", item["desc"])
            if search:
                item["min"] = search.group(1)
                item["max"] = search.group(2)

            search = re.search(r"\(default (.*?)\)", item["desc"])
            if search:
                item["default"] = search.group(1)

            params.append(item)

            if item.get("max", 0) in MAXES:
                item["max"] = 2000

            if item.get("min", 0) in MINS:
                item["min"] = -2000

            if item.get("default", 0) in MAXES:
                item["default"] = 2000

            if item.get("default", 0) in MINS:
                item["default"] = -2000

            if item["default"] == "nan":
                item["default"] = None

            if item["type"] == "float" or item["type"] == "double":
                item["min"] = float(item["min"])
                item["max"] = float(item["max"])
                if item["default"]:
                    item["default"] = float(item["default"])

            if item["type"] in ["int", "int64", "int32"]:
                try:
                    item["min"] = int(item["min"])
                    item["max"] = int(item["max"])
                    if item["default"]:
                        item["default"] = int(item["default"])
                except Exception as e:
                    pass

            if type(item["default"]) == str:
                item["default"] = item["default"].replace("'", "").replace('"', "")

            if item["name"] == "inputs" and item["default"]:
                f["inputs"] = [f["outputs"][0]] * item["default"]

            if item["name"] == "outputs" and item["default"]:
                f["outputs"] = [f["inputs"][0]] * item["default"]

        else:
            item = {"value": parts[0], "desc": " ".join(parts[3:])}
            if "options" not in params[-1]:
                params[-1]["options"] = []
            params[-1]["options"].append(item)

    f["params"] = params

    if f["name"] in OPTION_OVERRIDES:
        for key, val in OPTION_OVERRIDES[f["name"]].items():
            for p in f["params"]:
                if p["name"] == key:
                    p["options"] = val
                    p["default"] = val[0]["value"]

    return f


filters = get_names()
filters = [get_params(f) for f in filters]
with open("./src/filters.json", "w") as outfile:
    json.dump(filters, outfile, indent=2)
