<template>
  <div class="dataset">
    <div style="width: 100%;">
      <div class="viewer block" :id="containerId"></div>
    </div>
  </div>
</template>
<script>
export default {
  name: "dataset",
  props: ["file"],
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
    const api = window.imjoy.api;
    const baseUrl = window.location.origin + window.location.pathname;
    api.getPlugin(baseUrl + "SMLMFileIO.imjoy.html").then(() => {
      this.previewFile(this.file);
    });
  },
  methods: {}
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
