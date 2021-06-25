<template>
  <div class="dataset">
    <b-sidebar
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
            <b-menu-item icon="information-outline" label="Info"></b-menu-item>
            <b-menu-item active expanded icon="settings" label="Administrator">
              <b-menu-item icon="account" label="Users"></b-menu-item>
              <b-menu-item icon="cellphone-link" label="Devices"></b-menu-item>
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
              <b-menu-item icon="home-account" label="Addresses"></b-menu-item>
            </b-menu-item>
          </b-menu-list>
          <b-menu-list>
            <b-menu-item label="Expo" icon="link"></b-menu-item>
          </b-menu-list>
          <b-menu-list label="Actions">
            <b-menu-item icon="logout" label="Logout"></b-menu-item>
          </b-menu-list>
        </b-menu>
      </div>
    </b-sidebar>
    <div style="width: 100%;">
      <div class="viewer block" :id="containerId"></div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";

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
      if (!this.loadedUrl) {
        const repo = this.siteConfig.rdf_root_repo;
        let manifest_url = this.siteConfig.manifest_url;
        await this.$store.dispatch("fetchResourceItems", {
          repo,
          manifest_url
        });
      }
      console.log(this.resourceItems);
      const resourceItem = this.resourceItems.filter(item => {
        return item.id === this.resourceId;
      })[0];
      if (!resourceItem) {
        alert("Item not found: " + this.resourceId);
        return;
      }
      // const file =
      // const api = window.imjoy.api;
      // const baseUrl = window.location.origin + window.location.pathname;
      // api.getPlugin(baseUrl + "SMLMFileIO.imjoy.html").then(() => {
      //   this.previewFile(file);
      // });
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
