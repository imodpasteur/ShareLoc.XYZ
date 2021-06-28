<template>
  <div>
    <label :for="item.label" class="label">
      {{ item.label }}
      <span
        class="helpLabel has-text-grey-light is-size-7 is-italic"
        style="margin-left: .5rem;font-weight: 400;"
        >{{ item.help }}</span
      >
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
        <div
          :id="containerId + '-files'"
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
        </div>
        <div :id="containerId"></div>
        <label class="label" v-if="viewer"
          >Take screenshots for the cover</label
        >
        <div
          v-if="viewer || (screenshots && screenshots.length > 0)"
          class="snapshot-container"
        >
          <div v-for="(screenshot, i) in screenshots" :key="i" class="item">
            <b-button
              size="is-small"
              class="close-button"
              icon-left="close"
              v-if="!screenshot.image.startsWith('http')"
              @click="removeScreenshot(i)"
            >
              Remove
            </b-button>
            <img class="image" :src="screenshot.image" alt="Screenshot" />
          </div>
          <a
            v-if="viewer && viewer.captureImage"
            @click="capture"
            style="text-align: center;"
          >
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
      <p
        v-if="
          value.length <= 0 ||
            !value.screenshots ||
            value.screenshots.length <= 0
        "
        class="help is-danger"
      >
        You should select at least one file and take screenshots for the cover.
      </p>
      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
import { fetchFile } from "../utils";
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
    fileCache: {},
    containerId:
      "preview-container-" +
      Math.random()
        .toString(36)
        .substr(2, 9)
  }),
  created() {
    this.value = this.item.value;
    this.screenshots = (this.item.value && this.item.value.screenshots) || [];
    this.item.value && this.$emit("input", this.item.value);
    const api = window.imjoy.api;
    const baseUrl = window.location.origin + window.location.pathname;
    api.getPlugin(baseUrl + "SMLM-File-IO.imjoy.html");
  },
  methods: {
    removeScreenshot(index) {
      this.screenshots.splice(index, 1);
      // this.selectedScreenshot = this.screenshots.length-1;
      this.value.screenshots = this.screenshots;
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
      this.value.screenshots = this.screenshots;
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
      const loadingComponent = this.$buefy.loading.open({
        container
      });
      const container = document.getElementById(this.containerId);
      const w = container.getBoundingClientRect().width;
      const fn = file.name.toLowerCase();

      // fetch remote file
      if (file.type === "remote") {
        try {
          if (!this.fileCache[file.url]) {
            const newFile = await fetchFile(file.url, file.name);
            file = newFile;
            // replace the file with the actual one
            this.fileCache[file.url] = file;
          } else {
            file = this.fileCache[file.url];
          }
        } catch (e) {
          console.error(e);
          alert(`Failed to fetch file from ${file.url}: ${e}`);
          return;
        }
      }

      // display image
      if (fn.endsWith(".png") || fn.endsWith(".jpeg") || fn.endsWith(".jpg")) {
        try {
          this.viewer = await api.createWindow({
            name: file.name.slice(0, 40),
            src: "https://kaibu.org/#/app",
            window_id: this.containerId,
            config: { open_sidebar: false }
          });
          // encode the file using the FileReader API
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              // use a regex to remove data url part
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider

          await this.viewer.view_image(base64);

          return;
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          loadingComponent.close();
        }
      }
      // display SMLM file
      try {
        const smlmPlugin = await api.getPlugin("SMLM File IO");
        const smlm = await smlmPlugin.load(file);
        const baseUrl = window.location.origin + window.location.pathname;
        this.viewer = await api.createWindow({
          name: file.name.slice(0, 40),
          src: baseUrl + "3DHistogram.imjoy.html",
          window_id: this.containerId,
          data: smlm.files
        });
        container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider
        if (this.screenshots.length <= 0) {
          setTimeout(() => {
            this.capture();
          }, 1000);
        }
        document.getElementById(this.containerId + "-files").scrollIntoView();
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
