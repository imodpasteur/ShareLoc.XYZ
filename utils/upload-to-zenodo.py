import json
import click
import requests
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import collections
import yaml
import os

base_url = "https://sandbox.zenodo.org"  #base_url = "https://zenodo.org"
access_token= "XXX"     # ${{ secrets.ZNODO_TOKEN }} or ${{ secrets.ZENODO_SANDBOX_TOKEN }}

# create deposit 
params = {'access_token': access_token}
headers = { "Content-Type": "application/json" }
reponse = requests.post('{}/api/deposit/depositions'.format(base_url),
                        params=params, json={}, headers=headers) 

# get deposit info
deposition_id = reponse.json()['id']
deposition_doi = reponse.json()['metadata']['prereserve_doi']['doi']



# Here is code for csv/txt

samples = []
covers = []
channel = ['data.csv','wf.tif']  

# Load data 
data_dir = './'
sample_name = [f.split('.')[0] for f in os.listdir(data_dir) if 'csv' in f or 'txt' in f]
count = 0
for s in sample_name:
    sfile = [f for f in os.listdir(data_dir) if s in f]
    print(sfile, 'is processing')
    with open(os.path.join(data_dir,[n for n in sfile if 'csv' in n or 'txt' in n][0]), "r") as f:
        header = f.readline().split(',')
        fi = [i for i, j in enumerate(header) if 'frame' in j][0]
        xi = [i for i, j in enumerate(header) if 'x[nm]' in j or 'x' in j and 'uncertainty' not in j][0]
        yi = [i for i, j in enumerate(header) if 'y[nm]' in j or 'y' in j and 'uncertainty' not in j][0]

    locTable = np.loadtxt(open(os.path.join(data_dir,[n for n in sfile if 'csv' in n][0]), "r"), delimiter=",", skiprows=1)
    xyfArr = locTable[:, [xi, yi, fi]]
    xyfArr = xyfArr.astype('int32')
    x = xyfArr[:, 0]
    y = xyfArr[:, 1]
    locs = len(xyfArr) # localization number
    xmin, xmax, ymin, ymax = x.min(), x.max(), y.min(), y.max()
    xedges = np.arange(xmin, xmax+0.5, 20)
    yedges = np.arange(ymin, ymax+0.5, 20)
    H, xedgesO, yedgesO = np.histogram2d(y, x, bins=(yedges, xedges))
    H = H.clip(0, 255)  # histogramme rendering
    img = H[:, :, None]

    # Plot Screenshot
    plt.figure()
    plt.imshow(img, cmap='hot', vmin=0, vmax=40)
    plt.axis('off')
    plt.savefig(os.path.join(data_dir, 'screenshot-{}.png'.format(count)))
    plt.figure(figsize=(3.5,3.5))
    plt.imshow(img, cmap='hot', vmin=0, vmax=40)
    plt.axis('off')
    plt.savefig('{}screenshot-{}_thumbnail.png'.format(data_dir,count))
    #count+=1
    url = reponse.json()["links"]["bucket"]
    # Upload localization table
    for f in sfile : 
        with open(os.path.join(data_dir,f), "rb") as fp:
            r = requests.put(
                "%s/%s/%s" % (url, s, [c for c in channel if f.split('.')[-1] in c][0]),
                data=fp,
                params=params)
        print(f,"has been loaded")

    # umpload sceenshots
    with open(os.path.join(data_dir, 'screenshot-{}.png'.format(count)), "rb") as fp:
        r = requests.put(
            "%s/%s/%s" % (url, s,'screenshot-{}.png'.format(count)),
            data=fp,
            params=params
        )
    with open(os.path.join(data_dir, 'screenshot-{}_thumbnail.png'.format(count)), "rb") as fp:
        r = requests.put(
            "%s/%s/%s" % (url, s,'screenshot-{}_thumbnail.png'.format(count)),
            data=fp,
            params=params
        )


# compute metadata
    files=[]
    for f in sfile:
        
        files.append({'name': [c for c in channel if f.split('.')[-1] in c][0],
                      'size': os.stat(os.path.join(data_dir, f)).st_size,
                      'originalName': [f]})  

    samples.append({'name': s,
                    'views': [{'config': {'scaleX': 1,
                                          'scaleY': 1,
                                          'scaleZ': 1,
                                          'pointSize': 5,
                                          'distance': 4,
                                          'fov': 16,
                                          'pointSizeMin': 0,
                                          'pointSizeMax': 12,
                                          '# of locs': locs,
                                          'x': 1,'y': 1,'z': 1,
                                          'point size': 3,
                                          'x min': 0,'x max': 1,
                                          'y min': 0,'y max': 1,
                                          'z min': 0,'z max': 1,
                                          'active 0': True,
                                          'color 0': [255, 28, 14],
                                          'alpha 0': 0.85,
                                          'Fps': 36,
                                          'files': [e['name'] for e in files],
                                          'viewer_type': 'window'},
                               'image_name': 'screenshot-{}.png'.format(count)}],
                    'files': files})
    covers.append('./{}/screenshot-{}_thumbnail.png'.format(s, count))
    count+=1
attach_dict = {'samples': samples}    
dict_file = {'name': 'dataset name',
             'description': 'descroption of the dataset test',
             'license': 'CC-BY-4.0',
             'authors': [{'name': 'Jiachuan BAI',
                          'affiliation': 'Institut Pasteur',
                          'orcid': '0000-0001-5087-0344'}],
             'uploaded_by': 'Jiachuan Bai',
             'contact_email': 'jibai@pasteur.fr',
             'tags': ['dstorm'],
             'cite': [{'text': '', 'doi': '', 'url': ''}],
             'links': [],
             'type': 'dataset',
             'documentation': './README.md',
             'covers': covers,
             'attachments':attach_dict,
             'id': deposition_doi}
# write metadata to rdf.yaml
with open(os.path.join(data_dir, 'rdf.yaml'), 'w') as file:
    documents = yaml.dump(dict_file, file , sort_keys=False)
# update rdf.yaml
with open(os.path.join(data_dir, 'rdf.yaml'), 'rb') as fp:
          r = requests.put(
            "%s/%s" % (url,'rdf.yaml'),
            data=fp,
            params=params)

# update READEME.md (description)
with open(os.path.join(data_dir, 'README.md'), 'rb') as fp:
          r = requests.put(
            "%s/%s" % (url,'README.md'),
            data=fp,
            params=params)


# metadata update on zenodo
cover_identifier = [base_url+'record/'+str(deposition_id)+'/files/'+l[2:] for l in dict_file['covers']]
cover_identifier_dict = []
for c in cover_identifier :
     cover_identifier_dict.append({'relation': 'hasPart',
                                   'identifier': c,
                                   'resource_type': 'image-figure'})
additionalNote = " (Uploaded via https://shareloc.xyz)"
url = f'{base_url}/api/deposit/depositions/{deposition_id}'
des = f'<a href="https://shareloc.xyz/#/r/zenodo:{deposition_id}"><span class="label label-success">Open in Shareloc.XYZ</span></a><br>'
#des = 'test'
cover = [base_url+'record/'+str(deposition_id)+'/files/'+l[2:] for l in dict_file['covers']]
data = {'metadata': {'title': dict_file['name'],
                     'communities' : [{'identifier':'shareloc'}],
                     'upload_type': 'other',
                     'description': des,
                     'access_right': "open", 
                     'license': dict_file['license'],
                     'creators': dict_file['authors'],
                     'keywords':["shareloc.xyz:" + dict_file['type'], "shareloc.xyz"] + dict_file['tags'],
                     'notes': dict_file['description']+additionalNote,
                     'prereserve_doi': True,
                     'related_identifiers':cover_identifier_dict+
                     [
                         {'relation': 'isCompiledBy', 
                          'identifier': base_url+'record/'+str(deposition_id)+'/files/rdf.yaml',
                          'resource_type': 'other'},
                         {'relation': 'isDocumentedBy',
                          'identifier': base_url+'record/'+str(deposition_id)+'/files/README.md',
                          'resource_type': 'publication-technicalnote'}
                     ]
                    }
       }

reponse = requests.put(url, params=params, data=json.dumps(data), headers=headers)

# publish 
p = requests.post('%sapi/deposit/depositions/%s/actions/publish' % (base_url,deposition_id),
                    params=params )