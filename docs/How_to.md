# How to use [ShareLoc.XYZ](shareloc.xyz)
## Overview
* ### [How to upload data](#how-to-upload-data)
* ### [How to view data](#how-to-view-data)
* ### [How to download data](#how-to-download-data)
* ### [How to share data](#how-to-share-data)

# How to upload data

### Check this [tutorial video](https://www.youtube.com/watch?v=tTOkqzr74wg)

### Or this [step-by-step guide](https://slides.imjoy.io/?theme=white&slides=https://github.com/imodpasteur/ShareLoc.XYZ/blob/main/docs/how-to-upload-slides.md)

# How to view data

### There are two ways to visualize SMLM data on ShareLoc: 
1. A first viewer (called [potree](https://github.com/potree/potree)) that allows quick online visualization (i.e. does not require downloading of the full dataset).
2. A second viewer (called FairyDust) that requires access to the localization data but has additional features.

### 1. Potree viewer

* ### Quick visualization

![Eye](https://user-images.githubusercontent.com/56833522/189361693-185ab93e-9bfa-43d5-9480-ec149a4d07ca.png)

* __You can zoom in/out__ 
  * using the mouse wheel on the computer 
  * spread/pinch on the touch-screen of your mobile device
  
* __You can pan the image__ 
  * command + click if you are using macOS
  * left click if you are using Windows of Linux system
  * drag with 3 fingers on the touch-screen of your mobile device

* ### Change point size/opacity/color map

![QuickTuning](https://user-images.githubusercontent.com/56833522/189104817-9916f7dc-213a-4943-8297-f339c7da99bf.png)

* ### Crop image

![CropPotree1](https://user-images.githubusercontent.com/56833522/194925175-6db2907a-5e42-4ad1-8dcd-fea35ad48a77.png)
![CropPotree2](https://user-images.githubusercontent.com/56833522/194925173-0f04ecda-18ee-43ac-814b-0fa7cf27511a.png)
![CropPotree3](https://user-images.githubusercontent.com/56833522/194925170-98c6e4fa-6485-4b84-8a2d-b66670ce0e3e.png)
![CropPotree4](https://user-images.githubusercontent.com/56833522/194925169-77750186-5eef-414e-98d5-a081e74c5352.png)

* ### Color-coded 3D view

![Potree3D1](https://user-images.githubusercontent.com/56833522/191027359-20effa3c-4e68-413f-a60c-8dfb06a49a2c.png)
![Potree3D2](https://user-images.githubusercontent.com/56833522/191027371-d398dbc0-0ffd-402d-ba02-7a582e2dd3ef.png)

* ### View datasets containing multiple fields of view or channels

![ViewMoreData1_10_oct](https://user-images.githubusercontent.com/56833522/194923246-031b5080-5829-43fd-ac35-aa594553193f.png)
![ViewMoreData2](https://user-images.githubusercontent.com/56833522/191019761-d49f5c9f-1920-4e1e-bc93-8d665377b89e.png)
![ViewMoreData3](https://user-images.githubusercontent.com/56833522/191019774-af3a121b-e9c1-4f45-867a-f362e8b406da.png)

### 2. Fairy Dust viewer

![FairyDust1](https://user-images.githubusercontent.com/56833522/191028971-22d513e1-2112-4ec3-bc37-3f1f9736f3c8.png)
![FairyDust2](https://user-images.githubusercontent.com/56833522/191030361-d3b41a17-f85a-4f26-a8ad-e2d7d801be1d.png)


You can load files with the following formats: [SMLM(.smlm)](https://github.com/imodpasteur/smlm-file-format), ThunderSTORM(.csv/.xls), RapidSTROM, ZEISS(ELYRA), Nikon NSTORM(txt).

If your file format is not supported yet, please upload a [sample file](https://www.dropbox.com/request/IyZ7HkzHUpB0t5Mkp46l), and [send us a message](https://oeway.typeform.com/to/rdkPmd?typeform-source=shareloc.xyz) to describe your file format. We will try to support it in the future.

* __You can zoom in/out__ 
  * using the mouse wheel on the computer 
  * spread/pinch on the touch-screen of your mobile device
* __You can pan the image__ 
  * command + click if you are using macOS
  * left click if you are using Windows of Linux system
  * drag with 3 fingers on the touch-screen of your mobile device

* ### Change Scale

![FairyDustChangeScale](https://user-images.githubusercontent.com/56833522/191032636-0ad0b481-4c13-4ef3-9ccb-df2d762fc5e0.png)

* ### Crop

![FairyDustCrop](https://user-images.githubusercontent.com/56833522/191032709-0e107b6c-eec7-441a-baf9-935cffb5ee45.png)

* ### View multi-channel

![FairyDusMultiCh](https://user-images.githubusercontent.com/56833522/191032732-36ccd859-5f85-4aef-8414-57a97844d689.png)
![FairyDusMultiCh2](https://user-images.githubusercontent.com/56833522/191032741-c0776e2d-f54e-49d5-b679-6b6c2e65e37f.png)

# How to download data
### There are two ways to download datasets: 
1. interactive download of individual datasets
2. batch download of multiple data sets with a Python package

### 1. Interactive downloading

![DownLoad](https://user-images.githubusercontent.com/56833522/191034255-9915989c-7fcb-4720-bef8-1c5dc67b6f96.png)
![DownLoad2](https://user-images.githubusercontent.com/56833522/191034266-a0920040-905f-4db7-be1c-edabff700eb6.png)

The dataset should be downloaded to your  "Downloads" folder


### 2. Batch downloading through python [shareloc-utils](https://github.com/imodpasteur/shareloc-utils) package

:warning: :warning: :warning: __Warning:__ this feature has a bug, we are currently trying to fix it.

* Bookmark dataset

![DownLoad3](https://user-images.githubusercontent.com/56833522/191036647-ed94ef13-790d-4fe5-84b3-8f8f3723e39c.png)
![DownLoad4](https://user-images.githubusercontent.com/56833522/191036167-1ab24b9e-0d0c-4b9b-a6d8-3567de1fdfc3.png)

* Copy and run the download command in Python

  [More details on using the shareloc-utils package to download dataset(s)](https://github.com/imodpasteur/shareloc-utils#shareloc-utilities)

# How to share data

![Share1](https://user-images.githubusercontent.com/56833522/191036907-944ca0fa-094b-420e-aa40-d1d3245d80de.png)
![Share2](https://user-images.githubusercontent.com/56833522/191037526-5f8c1f18-10b6-408c-9582-3b1b769a9955.png)

You can now send the link by e-mail or Twitter or whatever. That's it.



