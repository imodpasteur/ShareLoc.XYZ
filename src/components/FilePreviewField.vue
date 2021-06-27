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

                Drag and drop files here
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
        <label class="label">Take screenshots for the cover</label>
        <div
          v-if="viewer || (screenshots && screenshots.length > 0)"
          class="snapshot-container"
        >
          <div v-for="(screenshot, i) in screenshots" :key="i" class="item">
            <b-button
              size="is-small"
              class="close-button"
              icon-left="close"
              @click="removeScreenshot(i)"
            >
              Remove
            </b-button>
            <img class="image" :src="screenshot.image" alt="Screenshot" />
          </div>
          <a v-if="viewer" @click="capture" style="text-align: center;">
            <img
              class="image"
              style="width:60px;margin-left:50px;margin-right: 50px;"
              src="static/img/add.png"
              alt="Add button"
            />
            Take Screenshot
          </a>
        </div>
        <!-- <b-carousel
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
              :src="screenshot.image"
              alt="Screenshot"
            />
          </b-carousel-item>
        </b-carousel> -->
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
    viewer: null,
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
      const img = await this.viewer.captureImage();
      const config = await this.viewer.getViewConfig();
      if (this.screenshots.filter(s => s.image === img).length <= 0)
        this.screenshots.push({ config, image: img });
      else
        window.imjoy.api.showMessage(
          "Please change the image to another view and try again."
        );
      this.value.screenshots = this.screenshots;
      // this.selectedScreenshot = this.screenshots.length-1;
      this.$emit("input", this.value);
    },
    removeFile(label, index) {
      this.value.splice(index, 1);
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
        const smlm = await smlmPlugin.load(file);
        const baseUrl = window.location.origin + window.location.pathname;
        this.viewer = await api.createWindow({
          name: file.name.slice(0, 40),
          src: baseUrl + "3DHistogram.imjoy.html",
          window_id: this.containerId,
          data: smlm.files
        });
        if (this.screenshots.length <= 0) {
          await this.capture();
        }
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        loadingComponent.close();
      }
    }
  }
};
</script>
<style scoped>
.snapshot-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.snapshot-container .item {
  flex: 1;
  max-width: 20%;
  margin: 3px;
  min-width: 120px;
}

.snapshot-container .item > .image {
  border-radius: 6px;
}
.close-button {
  opacity: 0;
  position: absolute;
  z-index: 1;
  background: #ffffff8f;
}

.snapshot-container:hover .close-button {
  opacity: 1;
}
</style>
