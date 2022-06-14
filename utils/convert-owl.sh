mkdir -p output
./robot template --template src/shareloc.tsv \
--prefix "shareloc: https://shareloc.xyz/#/ontology/vocabulary/" \
--output output/shareloc_template.owl


./robot annotate --input output/shareloc_template.owl \
--ontology-iri "https://raw.githubusercontent.com/imodpasteur/ShareLoc.XYZ/ontology/shareloc.owl" \
--annotation dc:description "ShareLoc defines terms to annotate data sets from single molecule localization microscopy, including but not limited to: imaging technique, biological structures or molecules of interest, cell types, experimental condition, labeling method, fixation protocol, etc." \
--annotation dc:title "ShareLoc" \
--output output/shareloc.owl
