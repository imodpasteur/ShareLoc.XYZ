# dSTORM images of microtubules with widefield images
>## Alpha-tubulin immuno-labeled with Alexa 647 in U373 cells
>__Acquired by Manish SINGH, Imaging and Modeling Unit, Institut Pasteur, France__
 
# Sample preparation
 
- ## Cell line
__U-373 MG (Uppsala)__

Cells were cultured in Dulbecco’s Modified Eagle Medium (DMEM) supplemented with 10% (v/v) fetal bovine serum (FBS; Gibco), 1% (v/v) penicillin-streptomycin (Gibco), and 1% Sodium Pyruvate in a 5% CO2 environment at 37 °C on 25-mm cleaned coverslips in 6-well plates.
 
- ## Fixation 
Cells were pre-extracted for 10 s in 0.25% (v/v) Triton X-100 (Triton) in BRB80 (80 mM PIPES, 1 mM MgCl2, 1 mM EGTA, adjusted to pH 6.8 with KOH) supplemented with 4 mM EGTA.
Then immediately fixed for 10 min with 0.25% (v/v) Triton + 0.5% glutaralde- hyde in BRB80, followed by reduction for 7 min with 0.1% NaBH4 solution in PBS and another washing step in PBS.
 
- ## Labeling
Cells were directly incubated for 1 h at room temperature in PBS with 1:500 rat alpha-tubulin antibodies (Bio-Rad MCA77G), followed by three washing steps with PBS, and then incubated for 45 min in PBS with 1:500 anti-rat Alexa-647 conjugated secondary antibodies from donkey (Jackson ImmunoResearch Laboratories, ref. 712-605-153).

- ## Photoswitching buffer
Composed of 50 mM Tris-HCl + 10 mM NaCl + 10% (w/v) glucose + 168 AU/mL glucose-oxidase + 1,404 AU/mL catalase + 1% 2-mercaptoethanol.

- ## Fluorophore
__Alexa-647__
 
# Microscopy
custom built microscopy system based on an inverted microscope body (Nikon Ti Eclipse) equipped with a 100 × 1.45 NA oil immersion objective (Nikon) and with the Perfect Focus System active.
 
- ## Camera

__EMCCD (Andor IXON ULTRA 897)__

Controlled by MicroManager software (Edelstein, A. et al. 2010)

The ffective pixel size was __106 nm__
 
- ## Laser power
642-nm wavelength laser with 500 mW power, an AOTF (AA Opto Electronic) modulates laser excitation.
 
- ## Exposure time
__30 ms__
 
- ## Number of frames
__60,000 frames__
 
# Localization reconstruction
 __ThunderSTORM plugin (version1.3) of ImageJ (version 1.53c)__

- ## Filters
100 < sigma < 200

0 < uncertainty < 75
    
- ## Drift correction
__Beads drift correction__
