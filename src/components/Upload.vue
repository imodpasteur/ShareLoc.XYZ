<template>
  <div class="upload">
    <b-notification
      v-if="client.isSandbox"
      type="is-warning"
      has-icon
      aria-close-label="Close notification"
      role="alert"
    >
      You are using the development mode of the upload feature, this means files
      will be uploaded the sandbox version of Zenodo
      (https://sandbox.zenodo.org). The uploaded files can be removed from
      Zenodo at anytime without notice.
    </b-notification>
    <b-steps
      position="left"
      :has-navigation="false"
      v-model="stepIndex"
      label-position="right"
    >
      <b-step-item :disabled="rdfYaml" label="Start" icon="file">
        <b-field label="Option 1: Create a new deposit" expanded>
          <b-button
            style="text-transform:none;"
            class="button is-fullwidth"
            @click="startUpload"
            expanded
            >Start Upload</b-button
          >
        </b-field>
        <b-field
          label="Option 2: Update an existing deposit"
          message="A URI can be a Zenodo DOI, Zenodo URL or Github URL to the RDF file"
        >
          <b-input
            type="url"
            placeholder="Type a DOI or URL here"
            v-model="URI4Load"
          >
          </b-input>
        </b-field>

        <b-button
          style="text-transform:none;"
          class="button is-fullwidth"
          @click="loadRdfFromURL(URI4Load)"
          expanded
          >Load</b-button
        >
      </b-step-item>

      <b-step-item label="Edit" icon="pencil" :disabled="!rdfYaml">
        <section v-if="stepIndex == 1">
          <dataset
            @submit="submitRDF"
            :init-rdf="rdf"
            :files="rdfFiles"
          ></dataset>
        </section>
      </b-step-item>

      <b-step-item label="Upload" icon="upload">
        <b-field
          label="RDF content"
          style="height: 260px; overflow: auto;"
          v-if="rdfYaml"
        >
          <markdown
            v-if="rdfYaml"
            baseUrl=""
            :content="formatedModelYaml"
          ></markdown>
        </b-field>
        <b-field v-if="zipPackage" label="Files">
          <b-taglist attached rounded>
            <b-tag
              v-for="(file, name) in zipPackage.files"
              :key="name"
              rounded
              >{{ name }}</b-tag
            >
          </b-taglist>
        </b-field>
        <b-field v-else-if="editedFiles" label="Files">
          <b-taglist attached rounded>
            <b-tag v-for="file in editedFiles" :key="file.name" rounded>{{
              file.name
            }}</b-tag>
          </b-taglist>
        </b-field>
        <div class="column">
          <b-button
            v-if="zipPackage || editedFiles"
            style="text-transform:none;"
            class="button is-fullwidth"
            @click="exportPackage()"
            expanded
            icon-left="download"
            >Export package locally (Optional)</b-button
          >
        </div>
        <br />
        <div v-if="similarDeposits && similarDeposits.length > 0">
          <label class="label">Similar Existing Items</label>
          <p>
            The following published deposit(s) are similar to yours (matched by
            name), please make sure you are using distinctive names to avoid
            confusion to the users.
          </p>
          <b-notification
            v-for="item in similarDeposits"
            :key="item.id"
            :type="item.name === rdf.name ? 'is-danger' : null"
            aria-close-label="Close notification"
          >
            <h1>
              <a :href="item.config._deposit.links.html" target="_blank">{{
                item.name
              }}</a>
            </h1>
            <p>{{ item.description.slice(0, 200) }}</p>

            <p>
              Authors:
              {{
                item.authors &&
                  item.authors
                    .map(author => author.name.split(";")[0])
                    .join(",")
              }}
            </p>
            <p>Uploaded: {{ item.config._deposit.updated }}</p>
            <br />
            <div class="columns">
              <b-button
                v-if="
                  userId &&
                    item.config._deposit &&
                    item.config._deposit.owners.includes(userId)
                "
                @click="createOrUpdateDeposit(item.config._deposit.id, false)"
                class="column button is-primary is-light is-fullwidth"
                expanded
                icon-left="autorenew"
              >
                <span>Update as a new version</span>
              </b-button>
            </div>
          </b-notification>
          <b-button
            style="text-transform:none;"
            class="button is-fullwidth"
            @click="stepIndex = 1"
            expanded
            :class="{
              'is-primary': sameNameDeposits && sameNameDeposits.length > 0
            }"
            icon-left="arrow-left"
            >Go back to rename</b-button
          >
        </div>
        <br />
        <b-field>
          <b-switch v-model="requestedJoinCommunity">
            Apply for listing in the
            <a
              :href="client.baseURL + '/communities/shareloc-xyz/'"
              target="_blank"
              >ShareLoc.XYZ community list</a
            >
          </b-switch>
        </b-field>
        <p v-if="uploadStatus">{{ uploadStatus }}</p>
        <b-progress
          v-if="uploadProgress"
          type="is-primary"
          :value="uploadProgress"
          size="is-small"
          expanded
        >
        </b-progress>
        <div class="columns">
          <div v-if="client && (zipPackage || editedFiles)" class="column">
            <b-button
              :disabled="
                uploadProgress ||
                  (sameNameDeposits && sameNameDeposits.length > 0)
              "
              @click="createOrUpdateDeposit()"
              class="button is-primary is-light is-fullwidth"
              expanded
              icon-left="plus"
            >
              <span>Upload as new deposit</span>
            </b-button>
          </div>
          <div
            v-if="client && (zipPackage || editedFiles) && depositId"
            class="column"
          >
            <b-button
              :disabled="uploadProgress"
              @click="createOrUpdateDeposit(depositId, false)"
              class="button is-primary is-light is-fullwidth"
              expanded
              icon-left="autorenew"
            >
              <span>Add new version to deposit</span>
            </b-button>
          </div>
        </div>
      </b-step-item>
      <b-step-item label="Publish" icon="share-variant" disabled>
        <b-notification
          v-if="publishedUrl"
          type="is-success"
          has-icon
          aria-close-label="Close notification"
        >
          <h1>Published on Zenodo</h1>
          <h2>DOI: {{ publishedDOI }}</h2>
          <h2>
            <a :href="publishedUrl" target="_blank">{{ publishedUrl }}</a>
          </h2>
          <p>
            Note: Newly uploaded item may not appear immediately in the resource
            list.
          </p>
          <p v-if="requestedJoinCommunity">
            To be listed as part of the verified ShareLoc.XYZ community list, a
            notification will be sent to the admin team aand we will review
            request soon.
          </p>
        </b-notification>
        <b-notification
          v-else-if="prereserveDOI"
          has-icon
          aria-close-label="Close notification"
        >
          <h1>Ready to publish</h1>
          <h2>Preserved DOI: {{ prereserveDOI.doi }}</h2>
          <h2>
            You can also review and add additional information on Zenodo:
            <a :href="prereserveUrl" target="_blank">{{ prereserveUrl }}</a>
          </h2>
          <p>
            Note: Please check carefully before publishing, it won't be easy to
            remove items after made public. New changes will be added as a new
            version.
          </p>
        </b-notification>

        <b-button
          v-if="client && client.credential && uploaded && !publishedUrl"
          @click="publishDeposition()"
          class="button is-primary is-fullwidth"
          expanded
        >
          <b-icon icon="upload"></b-icon>
          <span>Publish</span>
        </b-button>
      </b-step-item>
    </b-steps>

    <section style="padding: 10px;"></section>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { saveAs } from "file-saver";

import { rdfToMetadata, resolveDOI, getFullRdfFromDeposit } from "../utils";
import JSZip from "jszip";
import Markdown from "@/components/Markdown.vue";
import TagInputField from "./tagInputField.vue";
import DropFilesField from "./dropFilesField.vue";
import Dataset from "./Dataset.vue";
import doiRegex from "doi-regex";
import marked from "marked";
import DOMPurify from "dompurify";

export default {
  name: "upload",
  components: {
    markdown: Markdown,
    // eslint-disable-next-line vue/no-unused-components
    TagInputField,
    // eslint-disable-next-line vue/no-unused-components
    DropFilesField,
    Dataset
  },
  mounted() {
    this.dropFiles = null;
    this.uploadStatus = "";
    this.uploadProgress = 0;
    this.$root.$on("formSubmitted", this.formSubmitted);
  },
  computed: {
    sameNameDeposits() {
      return (
        this.similarDeposits &&
        this.similarDeposits.filter(item => item.name === this.rdf.name)
      );
    },
    formatedModelYaml() {
      return this.rdfYaml && "```yaml\n" + this.rdfYaml + "\n```\n";
    },
    prereserveUrl() {
      if (this.prereserveDOI) {
        return `${this.$store.state.zenodoBaseURL}/deposit/${this.prereserveDOI.recid}`;
      } else {
        return null;
      }
    },
    userId() {
      return (
        this.client && this.client.credential && this.client.credential.user_id
      );
    },
    ...mapState({
      imjoy: state => state.imjoy,
      resourceItems: state => state.resourceItems,
      client: state => state.zenodoClient
    })
  },
  data() {
    return {
      rdfFiles: null,
      dropFiles: null,
      uploadProgress: 0,
      uploadStatus: "",
      uploaded: false,
      jsonFields: null,
      rdfYaml: null,
      rdf: null,
      stepIndex: 0,
      publishedUrl: null,
      publishedDOI: null,
      requestedJoinCommunity: true,
      rdfType: "model",
      zipPackage: null,
      editedFiles: null,
      prereserveDOI: null,
      URI4Load: null,
      similarDeposits: null,
      depositId: null
    };
  },
  methods: {
    startUpload() {
      this.rdf = {};
      this.rdfFiles = [];
      this.stepIndex = 1;
    },
    // async parseFile(file) {
    //   const loadingComponent = this.$buefy.loading.open({
    //     container: this.$el
    //   });
    //   try {
    //     var new_zip = new JSZip();
    //     this.zipPackage = await new_zip.loadAsync(file);
    //     console.log(this.zipPackage.files);
    //     if (
    //       !this.zipPackage.files["model.yaml"] &&
    //       !this.zipPackage.files["rdf.yaml"]
    //     ) {
    //       alert(
    //         "Invalid file: no model.yaml or rdf.yaml found in the model package."
    //       );
    //       return;
    //     }
    //     const configFile =
    //       this.zipPackage.files["rdf.yaml"] ||
    //       this.zipPackage.files["model.yaml"];
    //     this.rdfYaml = await configFile.async("string");
    //     const rdf = yaml.load(this.rdfYaml);
    //     rdf.type = rdf.type || "model";
    //     rdf.config = rdf.config || {};
    //     rdf.config._rdf_file = "./" + configFile.name; // assuming we will add the rdf.yaml/model.yaml to the zip
    //     if (rdf.type === "model") {
    //       rdf.links = rdf.links || [];
    //       rdf.links.push("imjoy/BioImageIO-Packager");
    //     }
    //     this.initializeRdfForm(rdf, Object.values(this.zipPackage.files));
    //   } catch (e) {
    //     console.error(e);
    //     throw e
    //   } finally {
    //     loadingComponent.close();
    //   }
    // },
    submitRDF(rdf) {
      this.$nextTick(async () => {
        this.rdfYaml = rdf.config._yaml;
        delete rdf.config._yaml;
        this.zipPackage = rdf.config._zip;
        delete rdf.config._zip;
        this.rdf = rdf;

        this.similarDeposits = await this.client.getResourceItems({
          sort: "bestmatch",
          query: rdf.name
        });
        console.log("Similar deposits:", this.similarDeposits);
        // if there is any similar items, we can try to login first
        if (this.similarDeposits.length > 0)
          await this.client.getCredential(true);

        this.stepIndex = 2;
      });
    },
    async loadRdfFromURL(url) {
      try {
        const doiURLRegex = doiRegex.resolvePath();
        if (doiURLRegex.test(url)) {
          url = await resolveDOI(url.match(doiURLRegex)[4]);
        } else if (doiRegex().test(url)) {
          url = await resolveDOI(url);
        }
        const zenodoRegex = /zenodo.org\/(record|deposit)\/([0-9]+)/g;
        const m = zenodoRegex.exec(url);
        if (m) {
          this.depositId = parseInt(m[2]);
          let depositionInfo;
          if (url.includes("/record/"))
            depositionInfo = await this.client.getDeposit(this.depositId);
          else {
            await this.client.getCredential(true);
            depositionInfo = await this.client.retrieve(this.depositId);
          }
          console.log("orcid matched: " + this.depositId, depositionInfo);
          this.rdf = await getFullRdfFromDeposit(depositionInfo);
          this.zipPackage = null;
          this.files = depositionInfo.files.map(item => {
            return {
              type: "remote",
              name: item.filename || item.key, // depending on what api we use, it may be in two different format
              size: item.filesize || item.size,
              url: item.links.self,
              checksum: item.checksum
            };
          });
          // load files
          this.rdfFiles = depositionInfo.files.map(item => {
            return {
              type: "remote",
              name: item.filename || item.key, // depending on what api we use, it may be in two different format
              size: item.filesize || item.size,
              url: item.links.self,
              checksum: item.checksum
            };
          });
          this.stepIndex = 1;
        }
      } catch (e) {
        alert(`Failed to fetch RDF from ${url}, error: ${e}`);
      }
    },

    async publishDeposition() {
      if (
        !confirm(
          "Are you sure about publish your RDF now? Please note that after publishing you won't be able to remove it. Changes to existing published deposit can only be made by publishing new versions."
        )
      )
        return;
      const loadingComponent = this.$buefy.loading.open({
        container: this.$el
      });
      try {
        const result = await this.client.publish(this.depositId);
        console.log("Published", result);
        this.publishedDOI = result.doi;
        this.publishedUrl = `${this.$store.state.zenodoBaseURL}/record/${this.depositId}`;
      } finally {
        loadingComponent.close();
      }
    },
    async exportPackage() {
      let zipPackage = this.zipPackage;
      if (!zipPackage) {
        zipPackage = new JSZip();
        let i = 0;
        for (let item of this.editedFiles) {
          this.uploadProgress = (i / this.editedFiles.length) * 100;
          i++;
          if (item.type === "remote") {
            this.uploadStatus = "Download fille " + item.name;
            const response = await fetch(item.url);
            if (response.ok) {
              const blob = await response.blob();
              zipPackage.file(item.name, blob);
            } else {
              throw new Error("Failed to download file: " + item.url);
            }
          } else if (item instanceof Blob) {
            zipPackage.file(item.name, item);
          }
        }
      }
      console.log("downloading", zipPackage);
      const zipBlob = await zipPackage.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 9
          }
        },
        mdata => {
          this.uploadProgress = mdata.percent;
          this.uploadStatus = "Zipping package...";
        }
      );
      this.uploadStatus = "Exporting zip package...";
      saveAs(zipBlob, this.rdf.name + ".zip");
      this.uploadStatus = "Done!";
    },
    async createOrUpdateDeposit(depositId, skipUpload) {
      try {
        await this.client.getCredential(true);
        this.$forceUpdate();
      } catch (e) {
        alert(`Failed to login: ${e}`);
        return;
      }
      const loadingComponent = this.$buefy.loading.open({
        container: this.$el
      });
      this.similarDeposits = null;
      try {
        this.uploadProgress = 1;
        let depositionInfo;
        if (depositId) {
          try {
            depositionInfo = await this.client.retrieve(depositId);

            // enter edit mode if submitted
            // if deposit.state == 'inprogress', the metadata can be updated
            // if deposit.submitted == false files can be updated as well.
            if (!skipUpload) {
              // The response body of this action is NOT the new version deposit, but the original resource.
              // The new version deposition can be accessed through the "latest_draft" under "links" in the response body.
              const deposit = await this.client.createNewVersion(
                depositionInfo
              );
              // e.g. https://sandbox.zenodo.org/api/deposit/depositions/868929
              const tmp = deposit.links.latest_draft.split("/");
              depositId = parseInt(tmp[tmp.length - 1]);
              depositionInfo = await this.client.retrieve(depositId);
            }
            if (
              depositionInfo.state !== "inprogress" &&
              depositionInfo.state !== "unsubmitted"
            )
              await this.client.edit(depositId);
          } catch (e) {
            console.error(e);
            if (
              !confirm(
                `Failed to retrieve existing deposit (id: ${depositId}), would you like to create a new deposit instead?`
              )
            ) {
              return;
            }
          }
        } else depositionInfo = await this.client.createDeposition();

        this.depositId = depositionInfo.id;
        const baseUrl = `${this.client.baseURL}/record/${this.depositId}/files/`; //"file:///"; //depositionInfo.links.bucket + "/";

        let docstring = null;
        if (
          this.rdf.documentation &&
          !this.rdf.documentation.startsWith("http") &&
          this.rdf.documentation.endsWith(".md")
        ) {
          const file = this.zipPackage.files[
            this.rdf.documentation.replace("./", "")
          ];
          if (file) {
            docstring = await file.async("string"); // get markdown
            docstring = DOMPurify.sanitize(marked(docstring));
          }
        }
        this.rdf.config = this.rdf.config || {};
        this.rdf.config._deposit = depositionInfo;
        const metadata = rdfToMetadata(this.rdf, baseUrl, docstring);
        // this will send a email request to the admin of bioimgae-io team
        if (this.requestedJoinCommunity) {
          metadata.communities.push({ identifier: "shareloc-xyz" });
        }
        metadata.prereserve_doi = true; // we will generate the doi and store it in the model yaml file
        depositionInfo = await this.client.updateMetadata(
          depositionInfo,
          metadata
        );

        // transform the RDF here
        this.prereserveDOI = depositionInfo.metadata.prereserve_doi;
        this.rdf.id = depositionInfo.metadata.prereserve_doi.doi; //doi and recid
        this.rdf.config._doi = depositionInfo.metadata.prereserve_doi.doi;
        if (skipUpload) {
          this.stepIndex = 3;
          return depositionInfo;
        }
        const zipFiles = Object.values(this.zipPackage.files);
        // sort the files so we will upload the covers in the end
        // this allows zenodo to display it as preview
        if (this.rdf.covers && this.rdf.covers.length > 0) {
          const covers = this.rdf.covers;
          zipFiles.sort((a, b) => {
            if (
              covers.includes("./" + a.name) &&
              !covers.includes("./" + b.name)
            )
              return 1;
            else if (
              !covers.includes("./" + a.name) &&
              covers.includes("./" + b.name)
            )
              return -1;
            else return 0;
          });
        }

        for (let i = 0; i < zipFiles.length; i++) {
          if (zipFiles[i].dir) {
            console.warn("Skipping directory: " + zipFiles[i].name);
            continue;
          }
          const blob = await zipFiles[i].async("blob");
          const file = new File([blob], zipFiles[i].name);
          await this.client.uploadFile(depositionInfo, file, size => {
            this.uploadProgress = Math.round((size / file.size) * 100);
            this.uploadStatus = `Uploading ${i + 1}/${zipFiles.length}(${
              this.uploadProgress
            }%): ${file.name.slice(0, 40)}... `;
            this.$forceUpdate();
          });
        }
        this.uploadProgress = 0;
        this.uploadStatus = `Successfully uploaded ${zipFiles.length} files.`;
        this.uploaded = true;
        this.stepIndex = 3;
      } catch (e) {
        console.error(e);
        alert(`Failed to upload file: ${e}`);
      } finally {
        this.uploadProgress = 0;
        loadingComponent.close();
      }
    }
  }
};
</script>
<style scoped>
.upload {
  padding: 10px;
  width: 100%;
  overflow: auto;
  height: calc(100% - 48px);
  display: block;
  max-width: 1080px;
  margin-left: auto !important;
  margin-right: auto !important;
  float: none !important;
}
</style>
