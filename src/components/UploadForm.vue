<template>
  <div class="dataset">
    <form-json
      v-if="jsonFields && jsonFields.length > 0"
      :btnReset="{ value: 'Reset' }"
      :btnSubmit="{ value: 'OK' }"
      :camelizePayloadKeys="false"
      :formFields="jsonFields"
      :formName="'metadata'"
      @formSubmitted="formSubmitted"
      :components="components"
    >
    </form-json>
    <!-- <b-menu class="is-custom-mobile">
            <b-menu-list label="Menu">
              <b-menu-item
                icon="information-outline"
                label="Info"
              ></b-menu-item>
              <b-menu-item
                active
                expanded
                icon="settings"
                label="Administrator"
              >
                <b-menu-item icon="account" label="Users"></b-menu-item>
                <b-menu-item
                  icon="cellphone-link"
                  label="Devices"
                ></b-menu-item>
                <b-menu-item
                  icon="cash-multiple"
                  label="Payments"
                  disabled
                ></b-menu-item>
              </b-menu-item>
              <b-menu-item icon="account" label="My Account">
                <b-menu-item
                  icon="account-box"
                  label="Account data"
                ></b-menu-item>
                <b-menu-item
                  icon="home-account"
                  label="Addresses"
                ></b-menu-item>
              </b-menu-item>
            </b-menu-list>
            <b-menu-list>
              <b-menu-item label="Expo" icon="link"></b-menu-item>
            </b-menu-list>
            <b-menu-list label="Actions">
              <b-menu-item icon="logout" label="Logout"></b-menu-item>
            </b-menu-list>
          </b-menu> -->
  </div>
</template>
<script>
import spdxLicenseList from "spdx-license-list/full";
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";
// import Markdown from "@/components/Markdown.vue";
import TagInputField from "@/components/TagInputField.vue";
import DropFilesField from "@/components/DropFilesField.vue";
import FilePreviewField from "@/components/FilePreviewField.vue";
import CitationInputField from "@/components/CitationInputField.vue";
import AuthorInputField from "@/components/AuthorInputField.vue";
// import marked from "marked";
// import DOMPurify from "dompurify";
import { mapState } from "vuex";

import { dataURLtoFile, resizeImage } from "../utils";

export default {
  name: "upload-form",
  props: ["resourceId", "initRdf"],
  components: {
    "form-json": formJson,
    // markdown: Markdown,
    // eslint-disable-next-line vue/no-unused-components
    TagInputField,
    // eslint-disable-next-line vue/no-unused-components
    DropFilesField,
    // eslint-disable-next-line vue/no-unused-components
    FilePreviewField,
    // eslint-disable-next-line vue/no-unused-components
    CitationInputField,
    // eslint-disable-next-line vue/no-unused-components
    AuthorInputField
  },
  computed: {
    components: () => ({
      TagInputField,
      DropFilesField,
      FilePreviewField,
      CitationInputField,
      AuthorInputField
    }),
    ...mapState({
      client: state => state.zenodoClient,
      resourceItems: state => state.resourceItems,
      allTags: state => state.allTags
    })
  },
  data() {
    return {
      jsonFields: [],
      expandOnHover: false,
      expandWithDelay: false,
      reduce: false,
      rdf: null
    };
  },
  mounted() {
    this.initializeRdfForm(this.initRdf);
    this.$root.$on("formSubmitted", this.formSubmitted);
  },
  methods: {
    transformFields(fields) {
      const typeMapping = {};
      for (let k in this.components) {
        typeMapping[this.components[k].name] = k;
      }
      // mapping type to component name
      for (let field of fields) {
        if (typeMapping[field.type]) {
          field.is = typeMapping[field.type];
          delete field.type;
        }
      }
      return fields;
    },
    async formSubmitted(result) {
      const editedFiles = [];
      const rdfNameMapping = {
        // type: "Type",
        name: "Dataset Name",
        description: "Description",
        // version: "Version",
        license: "License",
        authors: "Authors",
        uploaded_by: "Uploaded by",
        contact_email: "Contact Email",
        // source: "Source",
        // git_repo: "Git Repository",
        tags: "Tags",
        cite: "Citation",
        links: "Links"
      };
      const values = result.values;
      this.rdf = {};
      for (let k in rdfNameMapping) {
        this.rdf[k] = values[rdfNameMapping[k]];
      }
      try {
        // save it for next time
        localStorage.setItem("license", this.rdf.license);
        localStorage.setItem("uploaded_by", this.rdf.uploaded_by);
        localStorage.setItem("contact_email", this.rdf.contact_email);
      } catch (e) {
        console.error(e);
      }
      let rdfFileName = "rdf.yaml";
      this.rdf.type = "dataset";
      this.rdf.links = this.rdf.links || [];
      this.rdf.tags = this.rdf.tags || [];
      this.rdf.config = this.rdf.config || {};
      this.rdf.config._rdf_file = "./" + rdfFileName;
      this.rdf.config._docstring = values["Documentation"];
      const samples = values["Samples"];

      if (!this.rdf.tags.includes("smlm")) this.rdf.tags.push("smlm");

      // Add documentation
      if (this.rdf.config._docstring) {
        const blob = new Blob([this.rdf.config._docstring], {
          type: "text/markdown"
        });
        const file = new File([blob], "README.md");
        this.rdf.documentation = "./README.md";
        editedFiles.push(file);
        delete this.rdf.config._docstring;
      }
      // Add views and screenshots
      if (samples && samples.length > 0) {
        this.rdf.covers = this.rdf.covers || [];
        this.rdf.config = this.rdf.config || {};
        let maxScreenshotCount = 10;
        for (let sample of samples) {
          // we add a file generator
          if (samples.enableConversion && sample.convert) {
            editedFiles.push({
              type: "generator",
              name: sample.convertFileName,
              sampleName: sample.name,
              generate: sample.convert
            });
          }
          // we will also add all the files here
          // note that after conversion, some files will be removed
          for (let file of sample.files) {
            if (file.type !== "remote") {
              editedFiles.push(file);
            }
          }
          let count = 0;
          if (!sample.views) {
            alert("Please take screenshots for " + sample.name);
            throw new Error("No screenshot found for " + sample.name);
          }
          const baseURL = this.rdf.config?._deposit?.links?.bucket;
          for (let screenshot of sample.views) {
            const { image } = screenshot;
            let blob;
            // skip adding remote screenshot
            if (image.startsWith("http")) {
              // extract file name from URL
              const filename = image
                .split("?")[0]
                .split("/")
                .pop();

              if (
                baseURL &&
                image === `${baseURL}/${sample.name}/${filename}`
              ) {
                this.rdf.covers.push(`./${sample.name}/${filename}`);
                continue;
              } else {
                blob = await (await fetch(image)).blob();
              }
            } else blob = dataURLtoFile(image);
            const existingNames = editedFiles.map(f => f.name);
            // check for naming colision
            while (
              existingNames.includes("screenshot-" + count + ".png") ||
              existingNames.includes("screenshot-" + count + "_thumbnail.png")
            ) {
              count++;
            }
            const fileName = "screenshot-" + count;
            const file = new File([blob], fileName + ".png", {
              type: blob.type
            });
            file.sampleName = sample.name;
            editedFiles.push(file);

            // delete screenshot.image;
            screenshot.image_name = fileName + ".png";

            // limit the cover image number
            if (maxScreenshotCount >= 0) {
              // generate thumbnail for the cover
              const resizedImage = await resizeImage({
                file,
                maxSize: 256
              });

              const fileSmall = new File(
                [resizedImage],
                fileName + "_thumbnail.png",
                {
                  type: resizedImage.type
                }
              );
              fileSmall.sampleName = sample.name;
              editedFiles.push(fileSmall);

              this.rdf.covers.push(
                `./${sample.name}/${fileName}_thumbnail.png`
              );
              maxScreenshotCount--;
            }
          }
        }
      }

      this.rdf.attachments = this.rdf.attachments || {};
      this.rdf.attachments.samples = samples.map(sample => {
        return {
          name: sample.name,
          views: sample.views,
          files: sample.files.map(file => {
            return {
              name: file.name,
              size: file.size,
              checksum: file.checksum
            };
          })
        };
      });

      // TODO: fix attachments.files for the packager
      const rdf = Object.assign({}, this.rdf);
      delete rdf._metadata;
      console.log("RDF: ", rdf);

      this.rdf.config._files = editedFiles;
      this.$emit("submit", this.rdf);
    },
    initializeRdfForm(rdf) {
      this.rdf = rdf || {};
      this.rdf.type = "dataset";
      // this.rdf.links = this.rdf.links || [];
      this.rdf.config = this.rdf.config || {};

      this.rdf.attachments = this.rdf.attachments || {};
      try {
        this.rdf.license = this.rdf.license || localStorage.getItem("license");
        this.rdf.uploaded_by =
          this.rdf.uploaded_by || localStorage.getItem("uploaded_by");
        this.rdf.contact_email =
          this.rdf.contact_email || localStorage.getItem("contact_email");
      } catch (e) {
        // eslint-disable-next-line no-empty
      }
      // clear license if not valid
      if (!Object.keys(spdxLicenseList).includes(this.rdf.license))
        this.rdf.license = null;
      this.rdf.license = this.rdf.license || "CC-BY-4.0";
      this.jsonFields = this.transformFields([
        // {
        //   label: "Type",
        //   type: "select",
        //   placeholder: "Select resource type",
        //   help:
        //     "If you want to upload data, choose `dataset`; For uploading tools, choose `application`.",
        //   options: ["dataset", "application"].map(opt => {
        //     return {
        //       text: opt,
        //       value: opt,
        //       selected: this.rdf.type === opt
        //     };
        //   })
        // },
        {
          label: "Dataset Name",
          placeholder: "dataset name",
          value: this.rdf.name,
          help:
            "A human-readable descriptive name for your dataset to be uploaded. Example: `Xenopus NPC exmperiment-1`."
        },
        {
          html: `<p class='label'>Samples<span
        class="helpLabel has-text-grey-light is-size-7 is-italic"
        style="margin-left: .5rem;font-weight: 400;"
        >Add samples to the dataset. A dataset contains multiple samples, each sample may contain one or more files for the same field of view, with single or multiple channels/modalities. Click "NEW SAMPLE" to add a new sample. If you want to add more channels, widefield, or raw tif stack for each sample, click "ADD CHANNEL OR MODALITY". The total file size for one dataset should be less than 50GB, otherwise please split into several datasets. Each sample should contain at lease one supported localization file (.smlm, .csv, .tsv, .xls and .txt), and you can test whether they are supported with the preview button. If you have other localization file format which is not supported yet, please <a href="https://www.dropbox.com/request/IyZ7HkzHUpB0t5Mkp46l" target="_blank">upload a sample file</a>, and <a href="https://oeway.typeform.com/to/rdkPmd" target="_blank">send us a message</a> to describe your file format, we will try to support your file format.</span><sup class='has-text-grey-light is-size-7'> *</sup></p>`
        },
        {
          label: "Samples",
          type: "file-preview",
          showLabel: false,
          value: this.rdf.attachments.samples,
          isRequired: true
        },
        {
          label: "Description",
          placeholder: "description of the dataset",
          value: this.rdf.description,
          help:
            "A short description in one sentence. Example: `Nuclear pore protein gp120 in extracted nuclear envelope of Xenopus eggs.`"
        },
        {
          label: "Authors",
          type: "author",
          value: this.rdf.authors,
          help: "The authors who contributed to this dataset"
        },
        {
          label: "Uploaded by",
          value: this.rdf.uploaded_by,
          placeholder: "Full Name",
          help: "The name of person who is uploading this dataset"
        },
        {
          label: "Contact Email",
          type: "email",
          value: this.rdf.contact_email,
          help:
            "A contact email for anwsering enquiry of the dataset, or potential change request from the admin from ShareLoc team."
        },
        // {
        //   label: "Source",
        //   placeholder: "A doi or URL to the source of the item",
        //   isRequired: false,
        //   value: this.rdf.version
        // },
        // {
        //   label: "Version",
        //   placeholder: "Version in MAJOR.MINOR.PATCH format(e.g. 0.1.0)",
        //   isRequired: false,
        //   value: this.rdf.version || "0.1.0"
        // },
        {
          html: `<p class='label'>License<span
        class="helpLabel has-text-grey-light is-size-7 is-italic"
        style="margin-left: .5rem;font-weight: 400;"
        >Choose the license that fits you most, we recommend to use <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/">CC-BY-4.0</a> (free to share and adapt under the condition of attribution). For other license options, please visit here <a target="_blank" href="https://spdx.org/licenses">https://spdx.org/licenses<a></span><sup class='has-text-grey-light is-size-7'> *</sup></p>`
        },
        {
          label: "License",
          showLabel: false,
          type: "select",
          placeholder: "Select your license",
          options: Object.keys(spdxLicenseList).map(opt => {
            return {
              text: opt,
              value: opt,
              selected: this.rdf.license === opt
            };
          })
        },
        {
          label: "Tags",
          type: "tags",
          value: this.rdf.tags,
          placeholder:
            "Add a tag and press ENTER to confirm (lower case, no space, numbers, or any of +*#;./%@)",
          options: this.allTags.map(tag =>
            tag.toLowerCase().replace(/ /g, "-")
          ),
          allow_new: true,
          pattern: /^[-0-9a-z+*#;./%@:]*$/,
          icon: "label",
          help:
            "Tags should contain only lower case letters with no space, numbers, or the following characters: +*#;./%@, please use multiple tags to describe imaging modality, cell line, imaged structure(s), fluorophore, labeling strategy, target protein, dimension, camera, buffer, fixation etc. Here are some examples: `dstorm`, `u373`, `microtubules`, `alexa-647`, `secondary-antibody`, `alpha-tubulin`,`2d`,`em-ccd`,`pfa+gluta`, `thunderstorm`. ",
          isRequired: true
        },
        {
          label: "Documentation",
          placeholder: "",
          type: "textarea",
          value: this.rdf.config._docstring,
          help:
            "Full documentation in markdown format, covering how the dataset is obtained and link to publications etc.",
          isRequired: false
        },
        {
          label: "Citation",
          type: "citation",
          value: this.rdf.cite,
          placeholder: "Add a citation",
          help: "Indicate how this dataset should be cited",
          isRequired: false
        },
        {
          label: "Links",
          type: "tags",
          value: this.rdf.links,
          placeholder: "Add a link (resource item ID)",
          options: this.resourceItems.map(item => item.id),
          allow_new: true,
          help:
            "Optinally, you can link to other uploaded datasets or applications",
          icon: "vector-link",
          isRequired: false
        }
      ]);
    }
  }
};
</script>
<style>
.dataset {
  height: 100%;
}
.p-1 {
  padding: 1em;
}
.sidebar-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
}
.sidebar-layout {
  display: flex;
  flex-direction: row;
  min-height: 100%;
}
.sidebar-content {
  height: 100% !important;
}
.viewer {
  width: 100%;
  height: 100%;
}
</style>
