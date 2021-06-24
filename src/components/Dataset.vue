<template>
  <div class="dataset">
    <section class="sidebar-layout">
      <b-sidebar
        position="static"
        mobile="hide"
        :expand-on-hover="expandOnHover"
        :reduce="false"
        :delay="expandWithDelay ? 500 : null"
        type="is-light"
        open
      >
        <div class="p-1">
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
        
      </b-sidebar>
      <div style="width: 100%;">
        <drop-files-field class="block" :item="fileField"></drop-files-field>
        <div class="viewer block" id="preview-container"></div>
      </div>
    </section>
  </div>
</template>
<script>
import JSZip from "jszip";
import yaml from "js-yaml";
import spdxLicenseList from "spdx-license-list/full";
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";
// import Markdown from "@/components/Markdown.vue";
import TagInputField from "@/components/tagInputField.vue";
import DropFilesField from "@/components/dropFilesField.vue";
// import marked from "marked";
// import DOMPurify from "dompurify";

export default {
  name: "dataset",
  props: ["resourceId", "rdf", "files"],
  components: {
    "form-json": formJson,
    // markdown: Markdown,
    // eslint-disable-next-line vue/no-unused-components
    TagInputField,
    // eslint-disable-next-line vue/no-unused-components
    DropFilesField
  },
  computed: {
    components: () => ({ TagInputField, DropFilesField })
  },
  data() {
    return {
      jsonFields: [],
      expandOnHover: false,
      expandWithDelay: false,
      reduce: false,
      fileField: {}
    };
  },
  mounted(){
    this.initializeRdfForm(this.rdf, this.files);
    this.fileField = {
        name: "Files",
        value: this.files,
      }
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
        version: "Version",
        license: "License",
        authors: "Authors",
        // source: "Source",
        // git_repo: "Git Repository",
        tags: "Tags"
        // links: "Links"
      };
      const values = result.values;
      for (let k in rdfNameMapping) {
        this.rdf[k] = values[rdfNameMapping[k]];
      }
      this.zipPackage = new JSZip();
      // Fix files
      if (this.zipPackage) {
        const packageFiles = Object.values(this.zipPackage.files);
        for (let file of values["Files"]) {
          if (packageFiles.includes(file)) continue;
          if (file instanceof Blob) {
            this.zipPackage.file(file.name, file);
          } else {
            console.error("Invalid file type", file);
          }
        }
        // remove files
        for (let file of packageFiles) {
          if (!values["Files"].includes(file)) {
            delete this.zipPackage.files[file.name];
          }
        }
      } else {
        this.editedFiles = values["Files"];
      }
      let rdfFileName = "rdf.yaml";

      this.rdf.type = "dataset";
      this.rdf.tags = this.rdf.tags || [];
      this.rdf.config = this.rdf.config || {};
      this.rdf.config._rdf_file = "./" + rdfFileName;
      this.rdf.authors = this.rdf.authors.split(",").map(name => {
        return { name: name.trim() };
      });

      // TODO: fix attachments.files for the packager
      const rdf = Object.assign({}, this.rdf);
      delete rdf._metadata;
      console.log("RDF: ", rdf);
      this.rdfYaml = yaml.dump(rdf);
      const blob = new Blob([this.rdfYaml], {
        type: "application/yaml"
      });

      if (this.zipPackage) {
        delete this.zipPackage.files[rdfFileName];
        this.zipPackage.file(rdfFileName, blob);
      } else {
        const file = new File([blob], rdfFileName);
        this.editedFiles = this.editedFiles.filter(
          item => item.name !== rdfFileName
        );
        this.editedFiles.push(file);
      }

      this.similarDeposits = await this.client.getResourceItems({
        sort: "bestmatch",
        query: rdf.name
      });
      console.log("Similar deposits:", this.similarDeposits);
      // if there is any similar items, we can try to login first
      if (this.similarDeposits.length > 0)
        await this.client.getCredential(true);
      this.stepIndex = 2;
    },
    initializeRdfForm(rdf) {
      this.rdf = rdf || {};
      this.rdf.links = this.rdf.links || [];
      this.rdf.config = this.rdf.config || {};
      this.jsonFields = this.transformFields([
        // {
        //   label: "Files",
        //   type: "files",
        //   value: files,
        //   isRequired: true
        // },
        {
          label: "Name",
          placeholder: "name",
          value: this.rdf.name
        },
        {
          label: "Description",
          placeholder: "description",
          value: this.rdf.description,
          help: 'A short description in one sentence' 
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
        {
          label: "Version",
          placeholder: "Version in MAJOR.MINOR.PATCH format(e.g. 0.1.0)",
          isRequired: false,
          value: this.rdf.version || "0.1.0"
        },
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
          isRequired: false
        },
        {
          label: "Detailed Descrription",
          placeholder: "",
          type: 'textarea',
          value: this.rdf.config._details,
          help: 'Detailed description in markdown format' 
        },
        // {
        //   label: "Links",
        //   type: "tags",
        //   value: this.rdf.links,
        //   placeholder: "Add a link (resource item ID)",
        //   options: this.resourceItems.map(item => item.id),
        //   allow_new: true,
        //   icon: "vector-link",
        //   isRequired: false
        // }
      ]);
    },
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
.viewer{
  width: 100%;
  height: 100%;
}
</style>
