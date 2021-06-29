<template>
  <div
    class="about"
    :style="{ 'background-image': 'url(' + siteConfig.background_image + ')' }"
  >
    <p class="version-number">v{{ version }}</p>
    <section class="hero">
      <markdown
        url="https://raw.githubusercontent.com/imodpasteur/ShareLoc.XYZ/main/README.md"
      ></markdown>
    </section>
    <br />
    <div class="columns is-mobile is-centered" v-if="siteConfig.footer">
      <div
        v-for="item in siteConfig.footer"
        :key="item.label"
        class="column is-one-quarter"
        style="text-align: center"
      >
        <b-tooltip :label="item.tooltip" position="is-top"
          ><a :href="item.url" target="_blank">
            <figure>
              <img :src="item.logo" style="max-height: 55px;" />
              <figcaption class="hide-on-small-screen">
                {{ item.label }}
              </figcaption>
            </figure>
          </a>
        </b-tooltip>
      </div>
    </div>

    <div style="text-align: center" v-if="siteConfig.footnote">
      <p>{{ siteConfig.footnote }}</p>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import { version } from "../../package.json";
import Markdown from "@/components/Markdown.vue";
export default {
  name: "About",
  components: {
    markdown: Markdown
  },
  computed: {
    ...mapState({
      siteConfig: state => state.siteConfig
    })
  },
  data() {
    return {
      version
    };
  }
};
</script>
<style scoped>
.about {
  height: calc(100% - 40px);
  background-repeat: no-repeat;
  background-position: bottom;
}
.hero {
  max-width: 100%;
  width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.background-img {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 90%;
  max-height: 50%;
  max-width: 100%;
  object-fit: contain;
}
.version-number {
  text-align: right;
  font-size: 20px !important;
  margin: 10px;
}
</style>
