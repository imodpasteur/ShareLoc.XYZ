<template>
  <div id="app">
    <!-- Navigation bar -->
    <nav class="navbar is-link is-fixed-top" v-if="showNavbar">
      <div class="navbar-brand">
        <a href="#/">
          <img
            style="width: 264px; margin-left:8px; margin-top: 6px;"
            :src="siteConfig.site_logo"
          />
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
            v-if="siteConfig.contribute_url && $route.name !== 'Upload'"
            href="#/upload"
          >
            <b-icon icon="plus"></b-icon>
            <span>Upload</span>
          </a>
          <a
            class="navbar-item"
            href="#/viewer"
            v-if="$route.name !== 'Viewer'"
          >
            <b-icon icon="eye-outline"></b-icon>
            <span>Viewer</span>
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
    <router-view :style="{ marginTop: showNavbar ? '72px' : '0px' }" />
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
      showNavbar: state => state.showNavbar,
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
