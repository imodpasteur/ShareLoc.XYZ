<template>
  <div id="app">
    <!-- Navigation bar -->
    <nav class="navbar is-link is-fixed-top">
      <div class="navbar-brand">
        <a href="#/">
          <span class="site-icon" style="cursor: pointer;">
            {{ siteConfig.site_icon }}</span
          >
          <span class="site-title" style="cursor: pointer;">
            {{ siteConfig.site_name }}
          </span>
        </a>
        <div
          class="navbar-burger burger"
          :class="{ 'is-active': showMenu }"
          data-target="navbarExampleTransparentExample"
          @click="showMenu = !showMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div
        id="navbarExampleTransparentExample"
        :class="{ 'is-active': showMenu }"
        class="navbar-menu"
      >
        <div class="navbar-end">
          <a
            class="navbar-item"
            v-if="siteConfig.contribute_url"
            href="#/upload"
          >
            <b-icon icon="plus"></b-icon>
            <span>Upload</span>
          </a>
          <a class="navbar-item" href="#/about">
            <b-icon icon="information-outline"></b-icon>
            <span>About</span>
          </a>
          <a class="navbar-item" id="imjoy-menu"> </a>
        </div>
      </div>
    </nav>
    <!-- Header -->
    <router-view style="margin-top:72px;" />
  </div>
</template>
<script>
import { mapState } from "vuex";

export default {
  name: "App",
  data() {
    return {
      showMenu: false
    };
  },
  computed: {
    ...mapState({
      siteConfig: state => state.siteConfig
    })
  }
};
</script>

<style>
html,
body {
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  background: #dcdcdc;
  overscroll-behavior-y: none;
}
#app {
  height: calc(100vh - 72px);
}
.card {
  margin-bottom: 3rem;
}
.content-wrapper {
  margin-top: 3rem;
}
.card-footer-item {
  font-size: 12px;
  font-weight: normal;
}
.card-header-title {
  display: block;
}
.card-content p {
  margin-bottom: 2rem;
}
.container {
  max-width: 95%;
}
.fa-code,
.fa-search {
  margin-right: 0.5vw;
}
</style>
