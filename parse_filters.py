import json
import re
from subprocess import run


def get_names():
    filters = []

    with open("./filternames.txt", "r") as infile:
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

            if item.get("max", 0) in ["INT_MAX", "FLT_MAX", "DBL_MAX", "I64_MAX"]:
                item["max"] = 2147483647

            if item.get("min", 0) in [
                "INT_MIN",
                "FLT_MIN",
                "DBL_MIN",
                "-DBL_MAX",
                "I64_MIN",
                "-FLT_MAX",
            ]:
                item["min"] = -2147483648

            if item.get("default", 0) in ["INT_MAX", "FLT_MAX", "DBL_MAX", "I64_MAX"]:
                item["default"] = 2147483647

            if item.get("default", 0) in [
                "INT_MIN",
                "FLT_MIN",
                "DBL_MIN",
                "-DBL_MAX",
                "I64_MAX",
            ]:
                item["default"] = -2147483648

            if item["default"] == "nan":
                item["default"] = None

            if item["type"] == "float" or item["type"] == "double":
                item["min"] = float(item["min"])
                item["max"] = float(item["max"])
                if item["default"]:
                    item["default"] = float(item["default"])

            if item["type"] == "int":
                try:
                    item["min"] = int(item["min"])
                    item["max"] = int(item["max"])
                    if item["default"]:
                        item["default"] = int(item["default"])
                except Exception as e:
                    pass

            if type(item["default"]) == str:
                item["default"] = item["default"].replace("'", "").replace('"', "")

        else:
            item = {"value": parts[0], "desc": " ".join(parts[3:])}
            if "options" not in params[-1]:
                params[-1]["options"] = []
            params[-1]["options"].append(item)

    f["params"] = params

    return f


filters = get_names()
filters = [get_params(f) for f in filters]
with open("./src/filters.json", "w") as outfile:
    json.dump(filters, outfile, indent=2)
