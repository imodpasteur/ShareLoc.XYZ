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
          <b-dropdown
            style="margin-top: 6px;"
            v-if="bookmarks && bookmarks.length > 0"
            class="navbar-item"
            :scrollable="true"
            :max-height="200"
            aria-role="list"
          >
            <template #trigger>
              <a class="navbar-item">
                <b-icon style="color:white;" icon="bookmark"></b-icon>
              </a>
            </template>

            <b-dropdown-item
              v-for="(rdf, index) in bookmarks"
              :key="index"
              aria-role="listitem"
              @click="showResourceItemInfo(rdf)"
            >
              <div class="media">
                <b-icon class="media-left" icon="database"></b-icon>
                <div class="media-content">
                  <h3>{{ rdf.name }}</h3>
                </div>
              </div>
            </b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="uploadBookmarks()">
              <div class="media">
                <b-icon class="media-left" icon="upload"></b-icon>
                <div class="media-content">
                  <h3>Upload All</h3>
                </div>
              </div>
            </b-dropdown-item>
            <b-dropdown-item
              :disabled="true"
              aria-role="listitem"
              @click="downloadBookmarks()"
            >
              <div class="media">
                <b-icon class="media-left" icon="cloud-download"></b-icon>
                <div class="media-content">
                  <h3>Download All</h3>
                </div>
              </div>
            </b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="clearBookmarks()">
              <div class="media">
                <b-icon class="media-left" icon="close"></b-icon>
                <div class="media-content">
                  <h3>Clear All</h3>
                </div>
              </div>
            </b-dropdown-item>
          </b-dropdown>

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
      siteConfig: state => state.siteConfig,
      bookmarks: state => state.bookmarks,
      eventBus: state => state.eventBus
    })
  },
  methods: {
    showResourceItemInfo(item) {
      this.eventBus.$emit("showResourceItemInfo", item);
    },
    clearBookmarks() {
      this.$store.commit("clearBookmarks");
    },
    uploadBookmarks() {
      this.$router.push({
        name: "Update",
        params: { updateDepositId: "bookmarks" }
      });
    },
    async downloadBookmarks() {
      for (let item of this.bookmarks) {
        try {
          if (typeof item.download === "function") {
            await item.download();
            this.eventBus.$emit(
              "showMessage",
              "Successfully downloaded " + item.name
            );
          } else this.eventBus.$emit("showMessage", "Skipping " + item.name);
        } catch (e) {
          console.error(e);
          this.eventBus.$emit(
            "showMessage",
            `Failed to download ${item.name}: ${e}`
          );
        }
      }
    }
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
.vm--modal {
  overflow: auto !important;
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
/* used in the upload preview */
.snap-button {
  left: 50%;
  transform: translate(-50%, 0) !important;
  background: #f0f8ff42 !important;
  color: white !important;
  position: absolute !important;
  bottom: 0px;
  font-weight: 400 !important;
}

.snap-button:hover {
  background: white !important;
  color: black !important;
}

.input-title > input {
  box-shadow: none !important;
}
</style>
