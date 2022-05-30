# Visualize SMLM data stored on ShareLoc through Napari

### 1. Install [Napari](https://napari.org/#) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.6573868.svg)](https://doi.org/10.5281/zenodo.6573868)

Example: Install in a clean virtual conda environment (recommended by napari team) 

Open a terminal, run:
```
    conda create -y -n napari-env -c conda-forge python=3.9
    conda activate napari-env
    pip install "napari[all]"
```
### 2. install [shareloc-utils](https://github.com/imodpasteur/shareloc-utils) package


__Make sure "napari-env" is activated if you followed the step 1__
```
    conda activate napari-env

```
In the terminal, run:
```
    pip install shareloc-utils

```
### 3. In the terminal, switch to the source code folder.

```
    mkdir shareloc
    cd shareloc
```
In shareloc folder we have smlm_napari.py, __we can merge with shareloc-utlis if tested OK__
### 4. From [ShareLoc](https://shareloc.xyz) website, chose the Zenodo ID of SMLM to visualize

![Capture d’écran de 2022-05-25 15-05-32](https://user-images.githubusercontent.com/56833522/170296369-6d71dfad-b056-42b3-8c4c-8cbb89b50927.png)

For this dataset, the ID is 5783066

### 5. Visualize SMLM data
In a Python interpreter
```
    python smlm_napari.py --output_dir="./datasets" --datasets=5783066
```
You can replace `--datasets=5783066` by any Zenodo ID on shareloc website
