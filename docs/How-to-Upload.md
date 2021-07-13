# Upload SMLM data on [Shareloc.xyz](https://shareloc.xyz)
### How to:
- [__Check version__](#Check-version)
- [__Login and authorize shareLoc.xyz to upload files to zenodo on your behalf__](#Login-and-authorize-shareLoc.xyz-to-upload-files-to-zenodo-on-your-behalf)
- [__Upload samples__](#Upload-samples)    
- [__Enter the information__](#Enter-the-information)
- [__Publish Deposit__](#Publish-Deposit)
- [__Link one deposit to another one__](#)



## Check version
Please make sure you are navigating the latest version `v0.X.X`
![aboutversion](https://user-images.githubusercontent.com/56833522/125454777-925bc61e-ab72-4e8d-b6bb-34d66911fe68.gif)

## Login and authorize shareLoc.xyz to upload files to zenodo on your behalf
### 1. Sign up for a [Zenodo](https://sandbox.zenodo.org) account if you don't have one
### 2. Click on the "+ Upload" button
![UploadButton](https://user-images.githubusercontent.com/56833522/125454254-6e675ab8-06e3-410f-90ff-03424d086e4d.gif)

### 3. Click on "Login to Zenodo"
![login_zenodo](https://user-images.githubusercontent.com/56833522/125456157-48b225f4-1ec0-4516-bc0a-63a15800a56b.gif)

### 4. Go back to shareloc.xyz tab and click again on "Login to Zenodo", authorize shareLoc.xyz to upload files to zenodo on your behalf
![authorize](https://user-images.githubusercontent.com/56833522/125457536-e8fc428d-6879-4456-8686-9b1662f2afa1.gif)

## Upload samples
### 1. Click on "+ Start Upload" to create a new deposit
![newdeposit](https://user-images.githubusercontent.com/56833522/125461318-cd9d4012-1b57-49e2-97bf-c158072debcc.gif)

### 2. Click on "+ NEW SAMPLE" to add sample to the deposit
![NewSample](https://user-images.githubusercontent.com/56833522/125461773-7d629ac3-2a95-4809-b408-42d17669e302.gif)

### 3. Drag and drop file/files     
* __Upload localisation table only__
![UploadFile](https://user-images.githubusercontent.com/56833522/125463862-74e69b5f-11d1-4065-bd83-5671d7a9ab77.gif)
    
* __Upload localization table with corresponding widefield image__

    __If you want to upload multiple files for the same sample, please select them by pressing `Ctrl` on your keyboard__
    ![UploadWfAvec](https://user-images.githubusercontent.com/56833522/125464663-1380481f-7f88-4dd0-8db6-15960007eb07.gif)

### 4. Click on "Preview & Screenshot" 
![TakeScreenshotx2](https://user-images.githubusercontent.com/56833522/125471072-984aea9f-f423-4fc3-a63d-be85120166d0.gif)

### 5. Click on "Take a screenshot", the screenshot will be displayed on shareloc.xyz as the cover of sample
![Screenshot](https://user-images.githubusercontent.com/56833522/125472521-689366b9-b989-4fa2-a365-d1644e6b21fa.gif)

__You could take many screenshots and choose the best one__
![selectScreenShoot](https://user-images.githubusercontent.com/56833522/125481864-be819680-4510-405b-a510-fcf193a10016.gif)

### 6. Repeat step 2-4 if you have more than 1 sample for the same experiment
__[Click on "+ NEW SAMPLE"](#2-click-on--new-sample-to-add-sample-to-the-dataset) >> [Drag and drop file/files](#2-click-on--new-sample-to-add-sample-to-the-dataset) >> [Take a screenshot](#4-click-on-preview--screenshot)__
![redo2to4x2](https://user-images.githubusercontent.com/56833522/125484624-51039a23-64ba-410f-b61b-00d38538caaa.gif)

###  :exclamation: If the total size exceeds 50 GB, please separate the dataset into serval deposits, [and link to uploaded datasets](#)

## Enter the information
Once you drop and drag all the files, enter the related information below
![image](https://user-images.githubusercontent.com/56833522/125502838-5cee131f-6006-462d-83b2-ae200727608c.png)

### 1. Dataset name (mandatory)
Your dataset name that will appear in the gallery while you browse SMLM data on shareloc.xyz. 

Example: `fixed microtubules Alexa647 MSINGH exmperiment-1`

### 2. Description (mandatory)
A short description in one sentence. 

Example: `dSTORM images of microtubules with widefield images, Alpha-tubulin immuno-labeled with Alexa 647 in U373 cells, reconstructed by ThunderSTORM plugin.`

### 3. Authors (mandatory)
The authors who contributed to this dataset.

### 4. Contact Email (mandatory)
A contact email for anwsering enquiry of the dataset, or potential change request from the admin from ShareLoc team.

### 5. License (mandatory)
Choose the license that fits you most, we recommend to use `CC-BY-4.0` (free to share and adapt under the condition of attribution). 
For other license options, please visit [here](https://spdx.org/licenses)

### 6. Tags (mandatory)
Tags describing imaging modality, cell line, imaged structure(s), fluorophore, labeling strategy, target protein, dimension, camera, buffer, fixation etc. 

Example: `dSTORM`, `U373`, `microtubule`, `Alexa-647`, `secondary antibody`, `alpha-tub`,`2D`,`EM-CCD`,`GluOx`,`PFA+Gluta`, `ThunderSTORM`.

You can also enter your customized tag and press `Enter` to confirm.

### Documentation (Change to Description ?)
In [markdown](https://guides.github.com/features/mastering-markdown/) format, covering how the dataset is obtained and link to publications etc.
You can create your description from this [template](https://github.com/imodpasteur/ShareLoc.XYZ/blob/main/docs/Template-description.md#dstorm-images-of-microtubules-with-widefield-images).

### Citation 
Indicate how this dataset should be cited.

### Links 
You can [link to other uploaded datasets](#Link-one-deposit-to-another-one) or applications.
For example when you have many sample from one experiment however the deposit size exceeds 50 GB

## Publish Deposit
After you [enter the information of deposit](#Enter-the-information):
### 1. Click on "OK"
![OktoUpload](https://user-images.githubusercontent.com/56833522/125510034-b23446aa-e104-4a6d-8145-71120ae02304.gif)

### 2. Click on "+ UPLOAD AS NEW DEPOSIT"
This may take long time
![upload-as-new-depositx2](https://user-images.githubusercontent.com/56833522/125514526-15f92b7e-ffc2-49bb-8a72-08d5e2536fa5.gif)

### 3. Click on ""


## Link one deposit to another one
After upload a new [deposit](#Upload-samples), enter the doi of other related deposit(example: `xx.xxxx/zenodo.xxxxxx`) in [`Links`](#Links)
