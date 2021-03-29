<template>
  <div class="zenodo-deposition-form">
    <section style="padding: 10px;">
          <b-button v-if="zenodo && !zenodo.credential" style="text-transform:none;" class="button is-primary is-fullwidth" @click="login()">Login</b-button>
          <br>
          
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

          <b-button v-if="zenodo && zenodo.credential && dropFiles && dropFiles.length > 0 && !uploadProgress" @click="uploadFiles()" class="button is-primary is-fullwidth">
            <b-icon icon="upload"></b-icon>
            <span>Click to upload</span>
          </b-button>
          <p v-if="uploadStatus">{{uploadStatus}}</p>
          <b-progress v-if="uploadProgress" type="is-primary" :value="uploadProgress" size="is-small">
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
import axios from "axios";
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";

class ZenodoClient {
  constructor(clientId, useSandbox) {
    this.clientId = clientId;
    this.callbackUrl = encodeURIComponent("https://imjoy.io/login-helper");
    this.credential = null;
    if (useSandbox === undefined) useSandbox = true;
    this.useSandbox = useSandbox;
  }
  login() {
    return new Promise((resolve, reject) => {
      const loginWindow = window.open(
        `https://${
          this.useSandbox ? "sandbox." : ""
        }zenodo.org/oauth/authorize?scope=deposit%3Awrite+deposit%3Aactions&state=CHANGEME&redirect_uri=${
          this.callbackUrl
        }&response_type=token&client_id=${this.clientId}`,
        "Login"
      );
      const timer = setTimeout(() => {
        loginWindow.close();
        // make sure we closed the window
        setTimeout(() => {
          reject(event.data.error);
        }, 1);
      }, 20000);
      const handleLogin = event => {
        // run only once
        window.removeEventListener("message", handleLogin);
        if (loginWindow === event.source) {
          loginWindow.close();
          clearTimeout(timer);
          if (event.data.error) {
            // make sure we closed the window
            setTimeout(() => {
              reject(event.data.error);
            }, 1);
            return;
          }
          console.log("Successfully logged in", event.data);
          this.credential = event.data;
          resolve(event.data);
        }
      };
      window.addEventListener("message", handleLogin, false);
    });
  }

  async createDeposition() {
    let response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions?access_token=${
        this.credential.access_token
      }`
    );
    console.log(await response.json());
    const headers = { "Content-Type": "application/json" };
    // create an empty deposition
    response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions?access_token=${
        this.credential.access_token
      }`,
      { method: "POST", body: JSON.stringify({}), headers }
    );
    const depositionInfo = await response.json();
    return depositionInfo;
  }

  async retrieve(depositionInfo){
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${
        depositionId
      }?access_token=${this.credential.access_token}`,
      { method: "GET" }
    );
    return await response.json();
  }

  async edit(depositionInfo){
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${
        depositionId
      }/actions/edit?access_token=${this.credential.access_token}`,
      { method: "POST", body: JSON.stringify({}), headers }
    );
    return await response.json();
  }

  async discard(depositionInfo){
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${
        depositionId
      }/actions/discard?access_token=${this.credential.access_token}`,
      { method: "POST", body: JSON.stringify({}), headers }
    );
    return await response.json();
  }

  async createNewVersion(depositionInfo){
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${
        depositionId
      }/actions/newversion?access_token=${this.credential.access_token}`,
      { method: "POST", body: JSON.stringify({}), headers }
    );
    return await response.json();
  }

  async updateMetadata(depositionInfo, metadata) {
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${depositionId}?access_token=${
        this.credential.access_token
      }`,
      { method: "PUT", body: JSON.stringify({ metadata }), headers }
    );
    return await response.json();
  }

  async uploadFile(depositionInfo, file, progressCallback) {
    const bucketUrl = depositionInfo.links.bucket;
    const fileName = file.name;
    const url = `${bucketUrl}/${fileName}?access_token=${this.credential.access_token}`;
    if (typeof axios === "undefined") {
      if (progressCallback) progressCallback(0);
      const response = await fetch(url, {
        method: "PUT",
        body: file
      });
      if (progressCallback) progressCallback(file.size);
      return await response.json();
    } else {
      const options = {
        headers: { "Content-Type": file.type },
        onUploadProgress: progressEvent => {
          if (progressCallback) progressCallback(progressEvent.loaded);
          else {
            const progress = Math.round(
              ((1.0 * progressEvent.loaded) / file.size) * 100.0
            );
            console.log(
              "uploading annotation, size: " +
                Math.round(progressEvent.loaded / 1000000) +
                "MB, " +
                progress +
                "% uploaded."
            );
          }
        }
      };
      const response = await axios.put(url, file, options);
      return response.data;
    }
  }

  async publish(depositionInfo) {
    const depositionId = typeof depositionInfo === 'string'? depositionInfo: depositionInfo.id;
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(
      `https://${
        this.useSandbox ? "sandbox." : ""
      }zenodo.org/api/deposit/depositions/${
        depositionId
      }/actions/publish?access_token=${this.credential.access_token}`,
      { method: "POST", body: JSON.stringify({}), headers }
    );
    return await response.json();
  }
}


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
    },
  },
  components: { "form-json": formJson },
  mounted(){
    this.dropFiles = null;
    this.uploadStatus = "";
    this.uploadProgress = 0;
    this.zenodo = new ZenodoClient(
      this.siteConfig.zenodo_client_id,
      this.siteConfig.zenodo_use_sandbox
    );
  },
  data(){
    return {
      zenodo: null,
      dropFiles: null,
      uploadProgress: 0,
      uploadStatus: "",
      jsonFields: []
    }
  },
  methods:{
    async login() {
      try {
        await this.zenodo.login();
        this.$forceUpdate();
      } catch (e) {
        alert(`Failed to login: ${e}`);
      }
    },
    async uploadFiles() {
      try{
        let depositionInfo
        if(this.depositId){
          depositionInfo = await this.zenodo.retrieve(this.depositId);
          // enter edit mode
          await this.zenodo.edit(this.depositId)
        }
        else depositionInfo = await this.zenodo.createDeposition();

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
        await this.zenodo.updateMetadata(depositionInfo, metadata);
        for (let i=0; i<this.dropFiles.length; i++) {
          await this.zenodo.uploadFile(depositionInfo, this.dropFiles[i], (size)=>{
            this.uploadProgress = Math.round(size/this.dropFiles[i].size*100);
            this.uploadStatus = `Uploading ${i+1}/${this.dropFiles.length}(${this.uploadProgress}%): ${this.dropFiles[i].name.slice(0, 40)}... `;
            this.$forceUpdate();
          });
        }
        this.uploadProgress = 0
        this.uploadStatus = `Successfully uploaded ${this.dropFiles.length} files.`
        this.dropFiles = null;
        // const result = await this.zenodo.publish(depositionInfo);
        // console.log("Published successfully: ", result);
      }
      catch(e){
        alert(`Failed to upload file: ${e}`)
      }
    },
  }
};
</script>
<style scoped>

</style>
