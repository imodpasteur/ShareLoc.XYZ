<template>
  <div class="viewer">
    <section>
      <h1
        v-if="!value || value.length <= 0"
        style="    text-align: center;
    color: white;
    font-size: 2rem;
    margin-top: 20px;"
      >
        SMLM file viewer
      </h1>
      <b-field
        v-if="!value || value.length <= 0"
        style="margin-top: 20px; margin-left: 20px; margin-right: 20px;"
      >
        <b-upload
          v-model="value"
          @input="updateFiles($event)"
          multiple
          drag-drop
          expanded
        >
          <section class="section">
            <div class="content has-text-centered">
              <b-icon icon="upload" size="is-large"></b-icon>

              <p>Drag and drop files here</p>
              <p>
                For multi-channel image, drag the files for all the channels
                together.
              </p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <!-- <label class="label" v-if="viewer"
          >Take screenshots for the cover</label
        >
        <div
          v-if="viewer || (screenshots && screenshots.length > 0)"
          class="snapshot-container"
        >
          <div v-for="(screenshot, i) in screenshots" :key="i" class="item">
            <b-button
              size="is-small"
              class="close-button"
              icon-left="close"
              v-if="!screenshot.image.startsWith('http')"
              @click="removeScreenshot(i)"
            >
              Remove
            </b-button>
            <img class="image" :src="screenshot.image" alt="Screenshot" />
          </div>
          <a
            v-if="viewer && viewer.captureImage"
            @click="capture"
            style="text-align: center;"
          >
            <img
              class="image"
              style="width:60px;margin-left:50px;margin-right: 50px;"
              src="static/img/add.png"
              alt="Add button"
            />
            Take Screenshot
          </a>
        </div> -->
    </section>
    <div v-if="!value || value.length <= 0" style="margin:20px;">
      <p>
        NOTE: Your data will stay locally in your browser, no data will be sent
        or uploaded to a server, unless you use the upload feature explcitly.
      </p>
      <br />
      <p>
        You can load files with the following formats:
        <a
          href="https://github.com/imodpasteur/smlm-file-format"
          target="_blank"
          >SMLM(.smlm)</a
        >, ThunderSTORM(.csv/.xls), RapidSTROM, ZEISS(ELYRA), Nikon NSTORM(txt),
        .png, .jpg.
      </p>
      <p>
        If you have other file format which is not supported yet, please
        <a
          href="https://www.dropbox.com/request/IyZ7HkzHUpB0t5Mkp46l"
          target="_blank"
          >upload a sample file</a
        >, and
        <a href="https://oeway.typeform.com/to/rdkPmd" target="_blank"
          >send us a message</a
        >
        to describe your file format, we will try to support your file format.
      </p>
    </div>
    <template v-if="!value || value.length <= 0">
      <div
        :id="containerId + '-files'"
        v-for="(file, index) in value"
        :key="index"
        class="tag is-primary"
        style="cursor: pointer"
        @click="previewFile([file])"
      >
        {{ file.name.slice(0, 20) + (file.name.length > 20 ? "..." : "") }}
        <button
          class="delete is-small"
          type="button"
          @click.prevent="removeFile(index)"
        ></button>
      </div>
    </template>
    <div class="viewer-container" :id="containerId"></div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import { fetchFile } from "../utils";

export default {
  name: "viewer",
  props: ["resourceId"],
  data() {
    return {
      containerId:
        "preview-container-" +
        Math.random()
          .toString(36)
          .substr(2, 9),
      viewer: null,
      value: undefined,
      fileCache: {},
      currentFiles: null
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    ...mapState({
      imjoyReady: state => state.imjoyReady,
      imjoy: state => state.imjoy,
      siteConfig: state => state.siteConfig,
      loadedUrl: state => state.loadedUrl,
      resourceItems: state => state.resourceItems
    })
  },
  created() {
    this.resourceId = this.resourceId && this.resourceId.toLowerCase();
    this.value = [];
    this.views = [];
    this.commitValue();
  },
  methods: {
    commitValue() {
      this.value.views = this.views;
      this.$emit("input", this.value);
      // if(!this.value || this.value.length<=0){
      //   this.$store.dispatch("toggleNavbar", true);
      // }
      // else{
      //   this.$store.dispatch("toggleNavbar", false);
      // }
    },
    // removeScreenshot(index) {
    //   this.views.splice(index, 1);
    //   // this.selectedScreenshot = this.views.length-1;
    //   this.commitValue();
    // },
    async capture() {
      const img = await this.viewer.captureImage();
      const config = await this.viewer.getViewConfig();
      config["_file"] = this.currentFiles && this.currentFiles.map(f => f.name);
      if (this.views.filter(s => s.image === img).length <= 0)
        this.views.push({ config, image: img });
      else
        this.imjoy.api.showMessage(
          "Please change the image to another view and try again."
        );
      // this.selectedScreenshot = this.views.length-1;
      this.commitValue();
    },
    removeFile(index) {
      const file = this.value[index];
      // TODO remove one only?
      if (this.currentFiles.includes(file)) this.currentFile = null;
      this.value.splice(index, 1);
      this.$forceUpdate();
    },
    async updateFiles(files) {
      try {
        await this.previewFile(files);
      } catch (e) {
        await this.imjoy.api.showMessage(`Failed to preview file: ${e}`);
        this.value = [];
        console.error(e);
      }
      this.commitValue();
    },
    trimEllip(str, length) {
      if (!str) return str;
      if (typeof str === "object") str = str.toString();
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    async previewFile(files) {
      const api = this.imjoy.api;
      const loadingComponent = this.$buefy.loading.open({
        container
      });
      const container = document.getElementById(this.containerId);
      for (let file of files) {
        // fetch remote file
        if (file.type === "remote") {
          try {
            if (!this.fileCache[file.url]) {
              const newFile = await fetchFile(
                file.url,
                file.name,
                this.imjoy && this.imjoy.api.showMessage
              );
              file = newFile;
              // replace the file with the actual one
              this.fileCache[file.url] = file;
            } else {
              file = this.fileCache[file.url];
            }
          } catch (e) {
            console.error(e);
            alert(`Failed to fetch file from ${file.url}: ${e}`);
            return;
          }
        }
      }

      this.currentFiles = files;
      let smlmFiles = [];
      const smlmPlugin = await api.getPlugin("SMLM File IO");
      for (let file of files) {
        // display SMLM file
        try {
          const smlm = await smlmPlugin.load(file);
          smlmFiles = smlmFiles.concat(smlm.files);
          container.style.height = "calc( 100vh - 72px)";
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          loadingComponent.close();
        }
      }
      const baseUrl = window.location.origin + window.location.pathname;
      this.viewer = await api.createWindow({
        name: "Fairy Dust",
        src: baseUrl + "FairyDust.imjoy.html",
        window_id: this.containerId,
        data: smlmFiles
      });
    },
    async init() {
      const loadingComponent = this.$buefy.loading.open();
      if (!this.resourceId) {
        this.imjoyReady
          .then(imjoy => {
            const api = imjoy.api;
            const baseUrl = window.location.origin + window.location.pathname;
            api.getPlugin(baseUrl + "SMLM-File-IO.imjoy.html");
          })
          .finally(() => {
            loadingComponent.close();
          });

        return;
      }
      if (!this.loadedUrl) {
        const repo = this.siteConfig.rdf_root_repo;
        let manifest_url = this.siteConfig.manifest_url;
        await this.$store.dispatch("fetchResourceItems", {
          repo,
          manifest_url
        });
      }

      const resourceItem = this.resourceItems.filter(item => {
        return item.id === this.resourceId;
      })[0];
      if (!resourceItem) {
        alert("Item not found: " + this.resourceId);
        return;
      }

      if (resourceItem.download_url) {
        try {
          const file = await fetchFile(
            resourceItem.download_url,
            resourceItem.name,
            this.imjoy && this.imjoy.api.showMessage
          );
          const api = this.imjoy.api;
          const baseUrl = window.location.origin + window.location.pathname;
          await api
            .getPlugin(baseUrl + "SMLM-File-IO.imjoy.html")
            .then(async () => {
              await this.previewFile([file]);
            });
        } catch (e) {
          alert("Failed to download file: " + resourceItem.download_url);

          console.error(e);
          throw e;
        } finally {
          loadingComponent.close();
        }
      }
      console.log(resourceItem);
    }
  }
};
</script>
<style scoped>
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
.viewer-container {
  width: 100%;
}
.viewer {
  color: #9e9a9a;
  background-color: black;
  height: 100vh;
}
</style>
