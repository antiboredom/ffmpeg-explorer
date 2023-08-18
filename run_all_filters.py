import json
from subprocess import run
import os

INP = "./video/example.mp4"

with open("./src/filters.json", "r") as infile:
    filters = json.load(infile)

for f in filters:
    outfile = f'./video/{f["name"]}.mp4'
    if os.path.exists(outfile):
        continue

    params = None
    if f.get("params"):
        params = []
        for p in f.get("params"):
            if p.get("default"):
                out = f'{p["name"]}={p["default"]}'
                params.append(out)
        params = ":".join(params)

    filter_command = f["name"]

    if params:
        filter_command += "=" + params

    command = ["ffmpeg", "-i", INP, "-y", "-filter_complex", filter_command, outfile]

    run(command)
