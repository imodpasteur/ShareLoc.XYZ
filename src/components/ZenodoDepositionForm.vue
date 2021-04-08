<template>
  <div class="zenodo-deposition-form">
    <section style="padding: 10px;">
      <b-button
        v-if="zenodo && !zenodo.credential"
        style="text-transform:none;"
        class="button is-primary is-fullwidth"
        @click="login()"
        >Login</b-button
      >
      <br />

      <b-field>
        <b-upload v-model="dropFiles" multiple drag-drop expanded>
          <section class="section">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large"></b-icon>
              </p>
              <p>Drop your files here or click to upload</p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <div class="tags">
        <span
          v-for="(file, index) in dropFiles"
          :key="index"
          class="tag is-primary"
        >
          {{ file.name }}
          <button
            class="delete is-small"
            type="button"
            @click="dropFiles.splice(index, 1)"
          ></button>
        </span>
      </div>

      <b-button
        v-if="
          zenodo &&
            zenodo.credential &&
            dropFiles &&
            dropFiles.length > 0 &&
            !uploadProgress
        "
        @click="uploadFiles()"
        class="button is-primary is-fullwidth"
      >
        <b-icon icon="upload"></b-icon>
        <span>Click to upload</span>
      </b-button>
      <p v-if="uploadStatus">{{ uploadStatus }}</p>
      <b-progress
        v-if="uploadProgress"
        type="is-primary"
        :value="uploadProgress"
        size="is-small"
      >
      </b-progress>
    </section>
    <form-json
      v-if="jsonFields && jsonFields.length > 0"
      :btnReset="{ value: 'Reset' }"
      :btnSubmit="{ value: 'Save' }"
      :camelizePayloadKeys="true"
      :formFields="jsonFields"
      :formName="'metadata'"
    >
    </form-json>
  </div>
</template>

<script>
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";
import { ZenodoClient } from "../utils";

export default {
  name: "zenodo-deposition-form",
  props: {
    siteConfig: {
      type: Object,
      default: null
    },
    depositId: {
      type: String,
      default: null
    }
  },
  components: { "form-json": formJson },
  mounted() {
    this.dropFiles = null;
    this.uploadStatus = "";
    this.uploadProgress = 0;
    this.client = new ZenodoClient(
      this.siteConfig.zenodo_client_id,
      this.siteConfig.zenodo_use_sandbox
    );
  },
  data() {
    return {
      zenodo: null,
      dropFiles: null,
      uploadProgress: 0,
      uploadStatus: "",
      jsonFields: []
    };
  },
  methods: {
    async login() {
      try {
        await this.client.login();
        this.$forceUpdate();
      } catch (e) {
        alert(`Failed to login: ${e}`);
      }
    },
    async uploadFiles() {
      try {
        let depositionInfo;
        if (this.depositId) {
          depositionInfo = await this.client.retrieve(this.depositId);
          // enter edit mode
          await this.client.edit(this.depositId);
        } else depositionInfo = await this.client.createDeposition();

        const metadata = {
          title: "This is a test",
          description: "<p>test</p>\n",
          access_right: "open",
          license: "CC-BY-4.0",
          upload_type: "dataset",
          creators: [{ name: "wei", affiliation: "" }],
          communities: [],
          publication_type: "article",
          publication_date: "2021-02-03",
          keywords: [],
          notes: ""
        };
        await this.client.updateMetadata(depositionInfo, metadata);
        for (let i = 0; i < this.dropFiles.length; i++) {
          await this.client.uploadFile(
            depositionInfo,
            this.dropFiles[i],
            size => {
              this.uploadProgress = Math.round(
                (size / this.dropFiles[i].size) * 100
              );
              this.uploadStatus = `Uploading ${i + 1}/${
                this.dropFiles.length
              }(${this.uploadProgress}%): ${this.dropFiles[i].name.slice(
                0,
                40
              )}... `;
              this.$forceUpdate();
            }
          );
        }
        this.uploadProgress = 0;
        this.uploadStatus = `Successfully uploaded ${this.dropFiles.length} files.`;
        this.dropFiles = null;
        // const result = await this.client.publish(depositionInfo);
        // console.log("Published successfully: ", result);
      } catch (e) {
        alert(`Failed to upload file: ${e}`);
      }
    }
  }
};
</script>
<style scoped></style>
