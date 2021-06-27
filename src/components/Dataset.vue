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
import JSZip from "jszip";
import spdxLicenseList from "spdx-license-list/full";
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";
// import Markdown from "@/components/Markdown.vue";
import TagInputField from "@/components/TagInputField.vue";
import DropFilesField from "@/components/DropFilesField.vue";
import FilePreviewField from "@/components/FilePreviewField.vue";
// import marked from "marked";
// import DOMPurify from "dompurify";
import { mapState } from "vuex";
import yaml from "js-yaml";
import { randId, dataURLtoFile, resizeImage } from "../utils";

export default {
  name: "dataset",
  props: ["resourceId", "initRdf", "files"],
  components: {
    "form-json": formJson,
    // markdown: Markdown,
    // eslint-disable-next-line vue/no-unused-components
    TagInputField,
    // eslint-disable-next-line vue/no-unused-components
    DropFilesField,
    // eslint-disable-next-line vue/no-unused-components
    FilePreviewField
  },
  computed: {
    components: () => ({ TagInputField, DropFilesField, FilePreviewField }),
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
      fileField: {},
      rdf: null
    };
  },
  mounted() {
    this.initializeRdfForm(this.initRdf, this.files);
    this.fileField = {
      name: "Files",
      value: this.files
    };
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
      const rdfNameMapping = {
        type: "Type",
        name: "Name",
        description: "Description",
        // version: "Version",
        license: "License",
        authors: "Authors",
        // source: "Source",
        // git_repo: "Git Repository",
        tags: "Tags",
        links: "Links"
      };
      const values = result.values;
      this.rdf = {};
      for (let k in rdfNameMapping) {
        this.rdf[k] = values[rdfNameMapping[k]];
      }
      let rdfFileName = "rdf.yaml";

      this.rdf.type = "dataset";
      this.rdf.links = this.rdf.links || [];
      this.rdf.tags = this.rdf.tags || [];
      this.rdf.config = this.rdf.config || {};
      this.rdf.config._rdf_file = "./" + rdfFileName;
      this.rdf.config._docstring = values["Documentation"];
      this.rdf.authors = this.rdf.authors.split(",").map(name => {
        return { name: name.trim() };
      });

      if (!this.rdf.tags.includes("smlm")) this.rdf.tags.push("smlm");

      const editedFiles = values["Files"];
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
      // Add screenshots
      if (editedFiles.screenshots) {
        this.rdf.covers = this.rdf.covers || [];
        this.rdf.config = this.rdf.config || {};
        for (let screenshoot of editedFiles.screenshots) {
          const { image, config } = screenshoot;
          // skip adding remote screenshot
          if (image.startsWith("http")) {
            const tmp = image.split("?")[0].split("/");
            this.rdf.covers.push("./" + tmp[tmp.length - 1]);
            continue;
          }
          const blob = dataURLtoFile(image);
          const fileName = "screenshot-" + randId();
          const file = new File([blob], fileName + ".png", {
            type: blob.type
          });
          editedFiles.push(file);

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
          editedFiles.push(fileSmall);
          // save view config for screenshots
          this.rdf.config.view_config = this.rdf.config.view_config || {};
          this.rdf.config.view_config[fileName + "_thumbnail.png"] = config;
          this.rdf.covers.push("./" + fileName + "_thumbnail.png");
        }
        // TODO: handle removed screenshots
        delete editedFiles.screenshots;
      }

      // TODO: fix attachments.files for the packager
      const rdf = Object.assign({}, this.rdf);
      delete rdf._metadata;
      console.log("RDF: ", rdf);
      const rdfYaml = yaml.dump(rdf);
      // Add rdf.yaml
      const blob = new Blob([rdfYaml], {
        type: "application/yaml"
      });
      const file = new File([blob], rdfFileName);
      editedFiles.push(file);

      const dataFiles = editedFiles.filter(
        file => file.name.endsWith(".smlm") || file.name.endsWith(".csv")
      );
      this.rdf.attachments = this.rdf.attachments || {};
      if (dataFiles.length > 0)
        this.rdf.attachments.datasets = dataFiles.map(file => {
          return { name: file.name };
        });
      // save the files to zip
      const zipPackage = new JSZip();
      editedFiles.map(file => {
        if (file.type !== "remote") zipPackage.file(file.name, file);
      });

      this.rdf.config._zip = zipPackage;
      this.rdf.config._yaml = rdfYaml;
      this.$emit("submit", this.rdf);
    },
    initializeRdfForm(rdf, files) {
      this.rdf = rdf || {};
      // this.rdf.links = this.rdf.links || [];
      this.rdf.config = this.rdf.config || {};
      this.rdf.license = this.rdf.license || "CC-BY-4.0";
      if (rdf.covers) {
        files.screenshots = rdf.covers.map(c => {
          const baseUrl = `${this.client.baseURL}/record/${this.rdf.config._deposit.id}/files/`;
          const coverUrl = c.startsWith("http") ? c : new URL(c, baseUrl).href;
          return {
            image: coverUrl,
            config:
              this.rdf.config.view_config && this.rdf.config.view_config[c]
          };
        });
      }
      this.jsonFields = this.transformFields([
        {
          label: "Files",
          type: "file-preview",
          value: files,
          isRequired: true
        },
        {
          label: "Name",
          placeholder: "name",
          value: this.rdf.name
        },
        {
          label: "Description",
          placeholder: "description",
          value: this.rdf.description,
          help: "A short description in one sentence"
        },
        {
          label: "Authors",
          placeholder: "authors (Full name, separated by comma)",
          value:
            this.rdf.authors &&
            this.rdf.authors.map(author => author.name.split(";")[0]).join(",")
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
          label: "License",
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
          placeholder: "Add a tag",
          options: this.allTags,
          allow_new: true,
          icon: "label",
          isRequired: true
        },
        {
          label: "Documentation",
          placeholder: "",
          type: "textarea",
          value: this.rdf.config._docstring,
          help: "Documentation in markdown format",
          isRequired: false
        },
        {
          label: "Links",
          type: "tags",
          value: this.rdf.links,
          placeholder: "Add a link (resource item ID)",
          options: this.resourceItems.map(item => item.id),
          allow_new: true,
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
