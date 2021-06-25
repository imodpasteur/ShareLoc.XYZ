<template>
  <div>
    <label :for="item.label" class="label">
      {{ item.label }}
      <sup
        class="has-text-grey-light is-size-7"
        v-if="item.isRequired !== false"
        >*</sup
      >
    </label>
    <div class="control">
      <section>
        <b-field>
          <b-upload
            :id="item.label"
            v-model="value"
            @input="updateFiles()"
            multiple
            drag-drop
            expanded
          >
            <section class="section">
              <div class="content has-text-centered">
                <b-icon icon="upload" size="is-large"></b-icon>

                Drop additional files here
              </div>
            </section>
          </b-upload>
        </b-field>
        <span
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
            @click.prevent="removeFile(item.label, index)"
          ></button>
        </span>
        <div :id="containerId"></div>
        <span v-if="smlmPlugin">
          <b-button
            style="text-transform:none;display:inline-block;"
            class="button is-primary is-small"
            @click="capture"
            icon-left="camera"
            >Take screenshot</b-button
          >
        </span>
        <span>(You need to set at least one screenshot)</span>

        <b-carousel
          v-if="screenshots && screenshots.length > 0"
          :progress="false"
          :autoplay="false"
          progress-type="is-primary"
        >
          <b-carousel-item v-for="(screenshot, i) in screenshots" :key="i">
            <b-button
              style="position: absolute;"
              type="is-danger is-small"
              @click.prevent="removeScreenshot(i)"
              icon-left="delete"
            >
              Remove
            </b-button>
            <img
              style="width:100%;height:100%;"
              :src="screenshot"
              alt="Screenshot"
            />
          </b-carousel-item>
        </b-carousel>
      </section>

      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
export default {
  name: "file-preview",
  props: {
    error: {
      type: String,
      default: null
    },
    item: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    smlmPlugin: null,
    value: undefined,
    screenshots: [],
    containerId:
      "preview-container-" +
      Math.random()
        .toString(36)
        .substr(2, 9)
  }),
  created() {
    this.value = this.item.value;
    this.item.value && this.$emit("input", this.item.value);
    const api = window.imjoy.api;
    const baseUrl = window.location.origin + window.location.pathname;
    api.getPlugin(baseUrl + "SMLMFileIO.imjoy.html");
  },
  methods: {
    removeScreenshot(index) {
      this.screenshots.splice(index, 1);
      // this.selectedScreenshot = this.screenshots.length-1;
      this.$emit("input", this.value);
    },
    async capture() {
      const img = await this.smlmPlugin.capture();
      if (!this.screenshots.includes(img)) this.screenshots.push(img);
      this.value.screenshots = this.screenshots;
      // this.selectedScreenshot = this.screenshots.length-1;
      this.$emit("input", this.value);
    },
    removeFile(label, index) {
      this.value.splice(index, 1);
      this.$forceUpdate();
    },
    clearFiles() {
      this.value = null;
      this.$emit("input", null);
      this.$forceUpdate();
    },
    updateFiles() {
      this.$emit("input", this.value);
      // we need this because otherwise we cannot update the list on the interface
      this.$forceUpdate();
      if (this.value && this.value.length > 0)
        this.previewFile(this.value[this.value.length - 1]);
    },
    trimEllip(str, length) {
      if (!str) return str;
      if (typeof str === "object") str = str.toString();
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    async previewFile(file) {
      const api = window.imjoy.api;
      const smlmPlugin = await api.getPlugin("SMLM File IO");
      const container = document.getElementById(this.containerId);
      const w = container.getBoundingClientRect().width;
      container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider
      const loadingComponent = this.$buefy.loading.open({
        container
      });
      try {
        await smlmPlugin.show(file, this.containerId);
        this.smlmPlugin = smlmPlugin;
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
