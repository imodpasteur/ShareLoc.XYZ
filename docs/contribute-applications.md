# Contribute applications to ShareLoc.XYZ

The viewers and applications running in ShareLoc.XYZ are built with [ImJoy](https://imjoy.io), which also means developers can submit new plugins, e.g. for enhance the visualization, do analysis.


## What is an application

An application can be simply be any software tools that used for facilitate the acquisition and data analysis of localization microscopy data. Especially when you have datasets that are produced for a tool or generated with a tool, you can create an application card so other datasets can link to it. In most cases, an application is simply card with basic information. But we also support "runnable" applications which are essentially ImJoy plugins.


## How to add a new application

You need to prepare a set of information written in JSON format. See an example below:
```json
{
    "id": "itk-vtk-viewer",
    "type": "application",
    "source": "https://shareloc.xyz/ITK-VTK-Viewer.imjoy.html",
    "icon": "https://kitware.github.io/itk-vtk-viewer/app/favicon-32x32.png",
    "name": "ITK VTK Viewer",
    "git_repo": "https://github.com/Kitware/itk-vtk-viewer",
    "version": "0.1.0",
    "api_version": "0.1.8",
    "description": "ITK VTK viewer for displaying point cloud data",
    "requirements": [],
    "dependencies": [],
    "env": "",
    "tags": [],
    "documentation": "",
    "covers": [],
    "badges": [],
    "authors": [
        "Wei OUYANG"
    ]
},
```

We following the so-called `Resource Description File` specification defined at BioImage.IO ([see here](https://github.com/bioimage-io/spec-bioimage-io/blob/gh-pages/rdf_spec_latest.md)), please change the fields accordingly.

Specifically, the `source` field should the ImJoy plugin file, or `null` for other type of applications.

Once you have this JSON object, you can add it to [this file](https://github.com/imodpasteur/ShareLoc.XYZ/blob/main/public/manifest.shareloc.json) and submit a pull request to from Github.
