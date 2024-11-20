import fsspec

S3_ENDPOINT_URL = "https://imjoy-s3.pasteur.fr/"
fs = fsspec.filesystem(
    "s3",
    key="",
    secret="",
    use_listings_cache=False,
    skip_instance_cache=True,
    client_kwargs={"endpoint_url": S3_ENDPOINT_URL, "region_name": "EU"},
)


import zipfile
import json
import struct
import io
import logging

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

dtype2struct = {"uint8": "B", "uint32": "I", "float64": "d", "float32": "f"}
dtype2length = {"uint8": 1, "uint32": 4, "float64": 8, "float32": 4}


def readSmlmFile(file_path):
    zf = zipfile.ZipFile(file_path, "r")
    file_names = zf.namelist()
    if "manifest.json" in file_names:
        manifest = json.loads(zf.read("manifest.json"))
        assert manifest["format_version"] == "0.2"
        for file_info in manifest["files"]:
            format_key = file_info["format"]
            file_format = manifest["formats"][format_key]
            if file_info["type"] == "table":
                logger.info("loading table...")

                if file_format["mode"] == "binary":
                    try:
                        table_file = zf.read(file_info["name"])
                        logger.info(file_info["name"])
                    except KeyError:
                        logger.error(
                            "ERROR: Did not find %s in zip file", file_info["name"]
                        )
                        continue
                    else:
                        logger.info("loading table file: %s bytes", len(table_file))
                        logger.info("headers: %s", file_format["headers"])
                        headers = file_format["headers"]
                        dtype = file_format["dtype"]
                        shape = file_format["shape"]
                        cols = len(headers)
                        rows = file_info["rows"]
                        logger.info("rows: %s, columns: %s", rows, cols)
                        assert len(headers) == len(dtype) == len(shape)
                        rowLen = 0
                        for i, h in enumerate(file_format["headers"]):
                            rowLen += dtype2length[dtype[i]]

                        tableDict = {}
                        byteOffset = 0
                        try:
                            import numpy as np

                            for i, h in enumerate(file_format["headers"]):
                                tableDict[h] = np.ndarray(
                                    (rows,),
                                    buffer=table_file,
                                    dtype=dtype[i],
                                    offset=byteOffset,
                                    order="C",
                                    strides=(rowLen,),
                                )
                                byteOffset += dtype2length[dtype[i]]
                        except ImportError:
                            logger.warning(
                                "Failed to import numpy, performance will drop dramatically. Please install numpy for the best performance."
                            )
                            st = ""
                            for i, h in enumerate(file_format["headers"]):
                                st += str(shape[i]) + dtype2struct[dtype[i]]

                            unpack = struct.Struct(st).unpack
                            tableDict = {h: [] for h in headers}
                            for i in range(0, len(table_file), rowLen):
                                unpacked_data = unpack(table_file[i : i + rowLen])
                                for j, h in enumerate(headers):
                                    tableDict[h].append(unpacked_data[j])
                            tableDict = {
                                h: np.array(tableDict[h]) for i, h in enumerate(headers)
                            }
                        data = {}
                        data["min"] = [tableDict[h].min() for h in headers]
                        data["max"] = [tableDict[h].max() for h in headers]
                        data["avg"] = [tableDict[h].mean() for h in headers]
                        data["tableDict"] = tableDict
                        file_info["data"] = data
                        logger.info("table file loaded: %s", file_info["name"])
                else:
                    raise Exception(
                        "format mode {} not supported yet".format(file_format["mode"])
                    )
            elif file_info["type"] == "image":
                if file_format["mode"] == "binary":
                    try:
                        # FIXEME: this is a hack for a bug
                        file_info["name"] = file_info["name"].replace(".jpg", ".jpeg")
                        image_file = zf.read(file_info["name"])
                        logger.info("image file loaded: %s", file_info["name"])
                    except KeyError:
                        logger.error(
                            "ERROR: Did not find %s in zip file", file_info["name"]
                        )
                        continue
                    else:
                        from PIL import Image

                        image = Image.open(io.BytesIO(image_file))
                        data = {}
                        data["image"] = image
                        file_info["data"] = data
                        logger.info("image file loaded: %s", file_info["name"])

            else:
                logger.info("ignore file with type: %s", file_info["type"])
    else:
        raise Exception("invalid file: no manifest.json found in the smlm file")
    return manifest, manifest["files"]


import os

os.makedirs("/data/wei/imod-data-pasteur", exist_ok=True)

samples = fs.listdir("/imod-data-pasteur")
samples = [p["Key"] for p in samples]


import re
import base64
from tqdm import tqdm

# sample_dir = '/imod-data-pasteur/0c2af8d7c1272f4c62771d0bbc4d5866'#samples[0]

rdfs = []

for sample_dir in tqdm(samples):
    for file_path in [p["Key"] for p in fs.listdir(sample_dir)]:
        if not file_path.endswith(".smlm"):
            continue
        _, name = os.path.split(file_path)
        #         print(file_path)
        if not os.path.exists("/data/wei/imod-data-pasteur/" + name):
            fs.download("/" + file_path, "/data/wei/imod-data-pasteur/" + name)
        manifest, files = readSmlmFile("/data/wei/imod-data-pasteur/" + name)
        # url = https://imjoy-s3.pasteur.fr/imod-data-pasteur/0c2af8d7c1272f4c62771d0bbc4d5866/0c2af8d7c1272f4c62771d0bbc4d5866.smlm
        rdf = dict(
            type="dataset",
            download_url=f"https://imjoy-s3.pasteur.fr/{file_path}",
            id=name.split(".")[0],
            name=name,
            description=manifest["description"],
            hash=manifest["hash"],
            tags=manifest["tags"],
            license=manifest.get("license"),
            cite={"text": manifest.get("citeAs", "")},
            attachments={"files": [f["name"] for f in manifest["files"]]},
        )

        thumbnail = manifest.get("thumbnail")
        if thumbnail:
            thumbnail = re.sub("^data:image/.+;base64,", "", thumbnail)
            imgdata = base64.b64decode(thumbnail)
            filename = (
                "./thumbnail.png"  # I assume you have a way of picking unique filenames
            )
            with open(filename, "wb") as f:
                f.write(imgdata)
            fdir = os.path.dirname(file_path)
            fkey = os.path.join(fdir, "thumbnail.png")
            fs.upload("./thumbnail.png", fkey)
            rdf["covers"] = [f"https://imjoy-s3.pasteur.fr/{fkey}"]
        #         print(rdf)
        rdfs.append(rdf)


manifest = {
    "id": "shareloc",
    "name": "ShareLoc.XYZ",
    "tags": [],
    "logo": "🔬",
    "icon": "🔬",
    "splash_title": "",
    "splash_subtitle": "ShareLoc.XYZ: An open platform for sharing single molecule localization microscopy data",
    "splash_feature_list": [],
    "resource_types": [
        "dataset",
    ],
    "default_type": "dataset",
    "url_root": "https://raw.githubusercontent.com/imodpasteur/shareLoc.xyz/master",
    "resources": [
        {
            "id": "smlm-viewer",
            "type": "application",
            "source": "https://shareloc.xyz/SMLM-Viewer.imjoy.html",
            "icon": "extension",
            "name": "SMLM-Viewer",
            "version": "0.1.0",
            "api_version": "0.1.8",
            "description": "SMLM Viewer",
            "requirements": [],
            "dependencies": [],
            "env": "",
            "tags": [],
            "documentation": "",
            "covers": [],
            "badges": [],
            "authors": ["Wei OUYANG"],
        },
    ] + rdfs,
}

import json

with open("manifest.shareloc.json", "w") as f:
    f.write(json.dumps(manifest))
