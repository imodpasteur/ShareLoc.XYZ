<template>
  <div class="control">
    <section>
      <b-field v-if="!value || value.length <= 0" style="margin-top: 30%;">
        <b-upload
          v-model="value"
          @input="updateFiles()"
          multiple
          drag-drop
          expanded
        >
          <section class="section">
            <div class="content has-text-centered">
              <b-icon icon="upload" size="is-large"></b-icon>

              Drag and drop files here
            </div>
          </section>
        </b-upload>
      </b-field>
      <template v-if="!value || value.length <= 0">
        <div
          :id="containerId + '-files'"
          v-for="(file, index) in value"
          :key="index"
          class="tag is-primary"
          style="cursor: pointer"
          @click="previewFile(file)"
        >
          {{ file.name.slice(0, 20) + (file.name.length > 20 ? "..." : "") }}
          <button
            class="delete is-small"
            type="button"
            @click.prevent="removeFile(index)"
          ></button>
        </div>
      </template>
      <div :id="containerId"></div>
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
      screenshots: [],
      fileCache: {},
      currentFile: null,
      convertToSmlm: true,
      validConversions: null
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    ...mapState({
      imjoyReady: state => state.imjoyReady,
      siteConfig: state => state.siteConfig,
      loadedUrl: state => state.loadedUrl,
      resourceItems: state => state.resourceItems
    })
  },
  created() {
    this.resourceId = this.resourceId && this.resourceId.toLowerCase();
    this.value = [];
    this.validConversions = [];
    this.screenshots = [];
    this.commitValue();
    const api = window.imjoy.api;
    const baseUrl = window.location.origin + window.location.pathname;
    api.getPlugin(baseUrl + "SMLM-File-IO.imjoy.html");
  },
  methods: {
    commitValue() {
      if (this.convertToSmlm) {
        this.value.conversions = this.validConversions;
      } else {
        this.value.conversions = null;
      }
      this.value.screenshots = this.screenshots;
      this.$emit("input", this.value);
      // if(!this.value || this.value.length<=0){
      //   this.$store.dispatch("toggleNavbar", true);
      // }
      // else{
      //   this.$store.dispatch("toggleNavbar", false);
      // }
    },
    removeScreenshot(index) {
      this.screenshots.splice(index, 1);
      // this.selectedScreenshot = this.screenshots.length-1;
      this.commitValue();
    },
    async capture() {
      const img = await this.viewer.captureImage();
      const config = await this.viewer.getViewConfig();
      config["_file"] = this.currentFile && this.currentFile.name;
      if (this.screenshots.filter(s => s.image === img).length <= 0)
        this.screenshots.push({ config, image: img });
      else
        window.imjoy.api.showMessage(
          "Please change the image to another view and try again."
        );
      // this.selectedScreenshot = this.screenshots.length-1;
      this.commitValue();
    },
    removeFile(index) {
      const file = this.value[index];
      if (file === this.currentFile) this.currentFile = null;
      if (this.validConversions.includes(file))
        this.validConversions.splice(this.validConversions.indexOf(file), 1);
      this.value.splice(index, 1);
      this.$forceUpdate();
    },
    updateFiles() {
      this.$nextTick(async () => {
        // we need this because otherwise we cannot update the list on the interface
        this.$forceUpdate();
        if (this.value && this.value.length > 0) {
          try {
            await this.previewFile(this.value[this.value.length - 1]);
          } catch (e) {
            await window.imjoy.api.showMessage(`Failed to preview file: ${e}`);
            console.error(e);
          }
        }
        this.commitValue();
      });
    },
    trimEllip(str, length) {
      if (!str) return str;
      if (typeof str === "object") str = str.toString();
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    async previewFile(file) {
      const api = window.imjoy.api;
      const loadingComponent = this.$buefy.loading.open({
        container
      });
      const container = document.getElementById(this.containerId);
      const w = container.getBoundingClientRect().width;
      const fn = file.name.toLowerCase();

      // fetch remote file
      if (file.type === "remote") {
        try {
          if (!this.fileCache[file.url]) {
            const newFile = await fetchFile(file.url, file.name);
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

      this.currentFile = file;
      // display image
      if (fn.endsWith(".png") || fn.endsWith(".jpeg") || fn.endsWith(".jpg")) {
        try {
          this.viewer = await api.createWindow({
            name: file.name.slice(0, 40),
            src: "https://kaibu.org/#/app",
            window_id: this.containerId,
            config: { open_sidebar: false }
          });
          // encode the file using the FileReader API
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              // use a regex to remove data url part
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          container.style.height = "100vh";

          await this.viewer.view_image(base64);

          return;
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          loadingComponent.close();
        }
      }
      // display SMLM file
      try {
        const smlmPlugin = await api.getPlugin("SMLM File IO");
        const smlm = await smlmPlugin.load(file);
        const baseUrl = window.location.origin + window.location.pathname;
        this.viewer = await api.createWindow({
          name: file.name.slice(0, 40),
          src: baseUrl + "FairyDust.imjoy.html",
          window_id: this.containerId,
          data: smlm.files
        });
        file.convert = async () => {
          const smlmPlugin = await window.imjoy.api.getPlugin("SMLM File IO");
          const smlm = await smlmPlugin.load(file);
          const zip = await smlm.save(file.name);
          return zip;
        };
        // add it for potentila conversion later
        if (!this.validConversions.includes(file))
          this.validConversions.push(file);
        container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider
        if (this.screenshots.length <= 0) {
          setTimeout(() => {
            this.capture();
          }, 1000);
        }
        document.getElementById(this.containerId + "-files").scrollIntoView();
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        loadingComponent.close();
      }
    },
    async init() {
      const loadingComponent = this.$buefy.loading.open();
      if (!this.resourceId) {
        this.imjoyReady
          .then(() => {
            const api = window.imjoy.api;
            api.createWindow({
              name: "SMLM Viewer",
              type: "3D Histogram",
              window_id: this.containerId
            });
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
            resourceItem.name
          );
          const api = window.imjoy.api;
          const baseUrl = window.location.origin + window.location.pathname;
          api.getPlugin(baseUrl + "SMLM-File-IO.imjoy.html").then(async () => {
            await this.previewFile(file);
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
