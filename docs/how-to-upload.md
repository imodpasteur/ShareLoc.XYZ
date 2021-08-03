# Upload dataset to [Shareloc.xyz](https://shareloc.xyz)

### Overview

- [Login](#login)
- [Prepare dataset](#prepare-dataset)    
- [Enter meta information](#enter-meta-information)
- [Review and upload](#review-and-upload)
- [Publish the dataset](#publish-the-dataset)


## Login

To upload a new dataset, you need to first login to Zenodo and authorize shareLoc.xyz to upload files to zenodo on your behalf.

 1. Sign up for a [Zenodo](https://sandbox.zenodo.org) account if you don't have one
 2. Click the "+ Upload" button
![UploadButton](https://user-images.githubusercontent.com/56833522/125454254-6e675ab8-06e3-410f-90ff-03424d086e4d.gif)

 3. Click "Login to Zenodo"
![login_zenodo](https://user-images.githubusercontent.com/56833522/125456157-48b225f4-1ec0-4516-bc0a-63a15800a56b.gif)

 4. Go back to shareloc.xyz tab and click again on "Login to Zenodo", authorize shareLoc.xyz to upload files to zenodo on your behalf
![authorize](https://user-images.githubusercontent.com/56833522/125457536-e8fc428d-6879-4456-8686-9b1662f2afa1.gif)

 5. Click "+ Start Upload" to create a new deposit
![newdeposit](https://user-images.githubusercontent.com/56833522/125461318-cd9d4012-1b57-49e2-97bf-c158072debcc.gif)

## Prepare dataset
 A dataset are typically consists of many samples and one sample can contain several or more files for different channels or image modality of the same biological sample under the same field of view. ShareLoc.xyz allows you to upload files that belongs to the same sample and have multiple samples in the same dataset.
 

 1. Click "+ NEW SAMPLE" to add sample to the deposit
![NewSample](https://user-images.githubusercontent.com/56833522/125461773-7d629ac3-2a95-4809-b408-42d17669e302.gif)

 1. Drag and drop file/files     
    * __Upload localisation table only__
    ![UploadFile](https://user-images.githubusercontent.com/56833522/125463862-74e69b5f-11d1-4065-bd83-5671d7a9ab77.gif)
    
    * __Upload localization table with corresponding widefield image__

    __If you want to upload multiple files for the same sample, please select them by pressing `Ctrl` on your keyboard__
    ![UploadWfAvec](https://user-images.githubusercontent.com/56833522/125464663-1380481f-7f88-4dd0-8db6-15960007eb07.gif)

 1. Click "Preview & Screenshot" 
  ![TakeScreenshotx2](https://user-images.githubusercontent.com/56833522/125471072-984aea9f-f423-4fc3-a63d-be85120166d0.gif)

 1. Click "Take a screenshot", the screenshot will be displayed on shareloc.xyz as the cover of sample
  ![Screenshot](https://user-images.githubusercontent.com/56833522/125472521-689366b9-b989-4fa2-a365-d1644e6b21fa.gif)

  __You could take many screenshots and choose the best one__
  ![selectScreenShoot](https://user-images.githubusercontent.com/56833522/125481864-be819680-4510-405b-a510-fcf193a10016.gif)

 1. Repeat step 2-4 if you have more than 1 sample for the same experiment
__[Click "+ NEW SAMPLE"](#2-click-on--new-sample-to-add-sample-to-the-deposit) >> [Drag and drop file/files](#3-drag-and-drop-filefiles) >> [Take a screenshot](#4-click-on-preview--screenshot)__
![redo2to4x2](https://user-images.githubusercontent.com/56833522/125484624-51039a23-64ba-410f-b61b-00d38538caaa.gif)

###  :exclamation: If the total size exceeds 50 GB, please separate the dataset into serval deposits, [and link to uploaded datasets](#)

## Enter meta information
Once you drop and drag all the files, enter the related information below
![image](https://user-images.githubusercontent.com/56833522/125502838-5cee131f-6006-462d-83b2-ae200727608c.png)

 * Dataset name (mandatory)
Your dataset name that will appear in the gallery while you browse SMLM data on shareloc.xyz. 

Example: `fixed microtubules Alexa647 MSINGH exmperiment-1`

 * Description (mandatory)
A short description in one sentence. 

Example: `dSTORM images of microtubules with widefield images, Alpha-tubulin immuno-labeled with Alexa 647 in U373 cells, reconstructed by ThunderSTORM plugin.`

 * Authors (mandatory)
The authors who contributed to this dataset.

 * Uploaded by
The name of the person who uploaded the dataset

 * Contact Email (mandatory)
A contact email for anwsering enquiry of the dataset, or potential change request from the admin from ShareLoc team.

 * License (mandatory)
Choose the license that fits you most, we recommend to use `CC-BY-4.0` (free to share and adapt under the condition of attribution). 
For other license options, please visit [here](https://spdx.org/licenses)

 * Tags (mandatory)
Tags describing imaging modality, cell line, imaged structure(s), fluorophore, labeling strategy, Target molecule, dimension, camera, buffer, fixation etc. 

Example: `dstorm`, `u373`, `microtubules`, `alexa-647`, `secondary antibody`, `alpha-tubulin`,`2d`,`em-ccd`,`gluox`,`pfa+gluta`, `thunderstorm`.

You can also enter your customized tag and press `Enter` to confirm.

 * Documentation
A full comprehensive description of the dataset written in [markdown](https://guides.github.com/features/mastering-markdown/) format, covering how the dataset is obtained and link to publications etc.

As a referene, you can check [an example dataset documentation](https://github.com/imodpasteur/ShareLoc.XYZ/blob/main/docs/example-dataset-documentation.md).

 * Citation 
Indicate how this dataset should be cited by others.

 * Links 
You can [link to other uploaded datasets](#link-one-deposit-to-another-one) or applications.
For example when you have many sample from one experiment however the deposit size exceeds 50 GB

## Review and upload
After you [enter the information of deposit](#Enter-the-information), click "OK" and you will see the upload page
![OktoUpload](https://user-images.githubusercontent.com/56833522/125510034-b23446aa-e104-4a6d-8145-71120ae02304.gif)

Click "+ UPLOAD AS NEW DEPOSIT" and the upload will start, this may take some time depending on your files and internet speed.
![upload-as-new-depositx2](https://user-images.githubusercontent.com/56833522/125514526-15f92b7e-ffc2-49bb-8a72-08d5e2536fa5.gif)


## Publish the dataset

After uploading, you can click "PUBLISH"
A doi like `xx.xxxx/zenodo.xxxxxx` will be generated, this doi could also be used to link deposits
![Publish](https://user-images.githubusercontent.com/56833522/125517947-7fa785ab-8dc5-4afd-b901-96641d7eef66.gif)

 Note: Please check carefully before publishing. It is generally not possible to remove items after they have been published. Changes will be added as a new version, but will not erase the previous version. For some reason if you really want to remove some published item, you can contact Zenodo support.
