<template>
  <div class="dataset">
    <!-- <b-sidebar
      position="static"
      mobile="fullwidth"
      :expand-on-hover="true"
      :reduce="false"
      :delay="500"
      type="is-light"
      open
    >
      <div class="p-1">
        <b-menu class="is-custom-mobile">
          <b-menu-list label="Menu">
            <b-menu-item active expanded icon="settings" label="Files">
              <b-menu-item icon="file" label="file"></b-menu-item>
            </b-menu-item>
          </b-menu-list>
        </b-menu>
      </div>
    </b-sidebar> -->
    <div style="width: 100%; height: 100%;">
      <div class="viewer block" :id="containerId"></div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import axios from "axios";

export default {
  name: "dataset",
  props: ["resourceId"],
  data() {
    return {
      containerId:
        "preview-container-" +
        Math.random()
          .toString(36)
          .substr(2, 9)
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    ...mapState({
      siteConfig: state => state.siteConfig,
      loadedUrl: state => state.loadedUrl,
      resourceItems: state => state.resourceItems
    })
  },
  methods: {
    async init() {
      const loadingComponent = this.$buefy.loading.open();
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
          const file = await this.fetchFile(resourceItem.download_url);
          const api = window.imjoy.api;
          const baseUrl = window.location.origin + window.location.pathname;
          api.getPlugin(baseUrl + "SMLM File IO.imjoy.html").then(() => {
            this.previewFile(file);
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
    },
    async fetchFile(url) {
      const response = await axios({
        url,
        method: "GET",
        responseType: "blob",
        onDownloadProgress: progressEvent => {
          const status = `Downloading file ${progressEvent.loaded /
            1000}kB (${progressEvent.total &&
            Math.round((progressEvent.loaded / progressEvent.total) * 100)}%)`;
          if (window.imjoy) window.imjoy.api.showMessage(status);
          else {
            console.log(status);
          }
        }
      });
      const filename = url
        .split("/")
        .pop()
        .split("#")[0]
        .split("?")[0];
      const blob = new Blob([response.data]);
      const file = new File([blob], filename, {
        type: "application/octet-stream",
        lastModified: Date.now()
      });
      return file;
    },
    async previewFile(file, type) {
      const api = window.imjoy.api;
      const smlmPlugin = await api.getPlugin("SMLM File IO");
      const container = document.getElementById(this.containerId);
      // const w = container.getBoundingClientRect().width;
      container.style.height = "100%"; //w / 2 + 111 + "px"; // add 111px for the plane slider
      const loadingComponent = this.$buefy.loading.open({
        container
      });
      try {
        const smlm = await smlmPlugin.load(file);
        if (type === "itk-vtk-viewer") {
          const viewer = await api.createWindow({
            src: "https://kitware.github.io/itk-vtk-viewer/app/",
            window_id: this.containerId
          });
          const sets = [];
          let is3d = false;
          for (let f of smlm.files) {
            sets.push(this.toNdArray(f));
            if (f.data.headers.includes("z")) {
              is3d = true;
            }
          }
          await viewer.setPointSets(sets);
          await viewer.setBackgroundColor([0, 0, 0]);
          await viewer.setAxesEnabled(false);
          if (is3d) await viewer.setViewMode("Volume");
          else await viewer.setViewMode("ZPlane");
          this.viewer = viewer;
        } else {
          for (let f of smlm.files) {
            this.viewer = await api.createWindow({
              name: file.name,
              src: "http://127.0.0.1:8080/3DHistogram.imjoy.html",
              data: f.data,
              window_id: this.containerId
            });
          }
        }
        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e;
      } finally {
        loadingComponent.close();
      }
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
