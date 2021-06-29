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
import { fetchFile } from "../utils";

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
          const baseUrl = window.location.origin + window.location.pathname;
          this.viewer = await api.createWindow({
            name: file.name,
            src: baseUrl + "3DHistogram.imjoy.html",
            window_id: this.containerId
          });
          for (let f of smlm.files) {
            this.viewer.show(f);
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
