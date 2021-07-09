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
        <b-button
          size="is-small"
          class="is-primary"
          icon-left="plus"
          @click="addNewSample"
        >
          New Sample
        </b-button>
        <b-tabs
          v-model="activeSample"
          @input="currentSample = samples[activeSample]"
          multiline
        >
          <template v-for="(sample, k) in samples">
            <b-tab-item :key="k" :value="k" :label="sample.name">
              <template #header>
                <b-input
                  class="input-title"
                  v-if="currentSample === sample"
                  v-model="sample.name"
                  placeholder="Sample Name"
                ></b-input>
                <a v-else @click="currentSample = sample">
                  {{ sample.name }}
                </a>
                <button
                  v-if="currentSample === sample"
                  class="delete is-small"
                  type="button"
                  @click.stop="removeSample(sample, k)"
                ></button>
              </template>
              <p>Files</p>
              <div
                v-for="(file, index) in sample.files"
                :key="index"
                class="tag is-info"
                style="cursor: pointer;margin:2px;"
                @click="previewSample({ files: [file], name: file.name })"
              >
                {{
                  file.name.slice(0, 20) + (file.name.length > 20 ? "..." : "")
                }}
                <button
                  class="delete is-small"
                  type="button"
                  @click.stop="removeFile(sample.files, index)"
                ></button>
              </div>
              <b-upload
                v-if="!sample.files || sample.files.length <= 0"
                v-model="sample.files"
                @input="updateFiles(sample)"
                multiple
                drag-drop
                expanded
              >
                <section class="section">
                  <div class="content has-text-centered">
                    <b-icon icon="upload" size="is-large"></b-icon>

                    <p>Drag and drop files here</p>
                    <p>
                      For multi-channel image, drag the files for all the
                      channels together.
                    </p>
                  </div>
                </section>
              </b-upload>
              <p v-if="sample.files && sample.files.length > 0">Screenshots</p>
              <div
                class="snapshot-container"
                v-if="sample.files && sample.files.length > 0"
              >
                <div
                  v-for="(view, i) in sample.views || []"
                  :key="i"
                  class="item"
                >
                  <b-button
                    size="is-small"
                    class="close-button"
                    icon-left="close"
                    v-if="!view.image || !view.image.startsWith('http')"
                    @click="removeScreenshot(sample.views, i)"
                  >
                  </b-button>
                  <img class="image" :src="view.image" alt="Screenshot" />
                </div>
                <a @click="previewSample(sample)" style="text-align: center;">
                  <img
                    class="image"
                    style="width:100px;margin-left:50px;margin-right: 50px;"
                    src="static/img/preview-screenshot.png"
                    alt="Add button"
                  />
                  Preview & Screenshot
                </a>
              </div>
            </b-tab-item>
          </template>
        </b-tabs>

        <b-field>
          <b-switch :value="enableConversion">
            Convert to SMLM format (Recommended)
          </b-switch>
        </b-field>
      </section>
      <p v-if="isDatasetValid" class="help is-danger">
        You should add at least one same and take some screenshots for the
        cover.
      </p>
      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
import { fetchFile, randId, longestCommonSubstring } from "../utils";
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
    activeSample: 0,
    samples: [],
    fileCache: {},
    currentFile: null,
    enableConversion: true,
    currentSample: null
  }),
  created() {
    this.samples = this.item.value || [];
    this.commitValue();
    // const api = window.imjoy.api;
    // const baseUrl = window.location.origin + window.location.pathname;
    // api.getPlugin(baseUrl + "SMLM-File-IO.imjoy.html");
  },
  computed: {
    isDatasetValid() {
      if (this.samples.length <= 0) return false;
      let screenshots = [];
      for (let sample of this.samples) {
        if (sample.views) {
          screenshots = screenshots.concat(sample.views);
        }
      }
      return screenshots.length > 0;
    }
  },
  watch: {
    activeSample(newVal) {
      this.currentSample = this.samples[newVal];
      this.$forceUpdate();
    }
  },
  methods: {
    addNewSample() {
      this.samples.push({ name: "Untitled Sample" });
      this.activeSample = this.samples.length - 1;
      this.currentSample = this.samples[this.samples.length - 1];
    },
    commitValue() {
      const samples = this.samples.filter(
        sample => sample.files && sample.files.length > 0
      );
      samples.enableConversion = this.enableConversion;
      this.$emit("input", samples);
    },
    removeScreenshot(screenshots, index) {
      screenshots.splice(index, 1);
      // this.selectedScreenshot = screenshots.length-1;
      this.commitValue();
      this.$forceUpdate();
    },
    async capture() {
      const img = await this.viewer.captureImage();
      const config = await this.viewer.getViewConfig();
      config["files"] = this.currentFiles && this.currentFiles.map(f => f.name);
      config["viewer_type"] = this.viewer.config.type;
      this.currentSample.views = this.currentSample.views || [];
      if (this.currentSample.views.filter(s => s.image === img).length <= 0)
        this.currentSample.views.push({ config, image: img });
      else
        window.imjoy.api.showMessage(
          "Please change the image to another view and try again."
        );
      // this.selectedScreenshot = this.currentSample.views.length-1;
      this.commitValue();
      window.imjoy.api.showMessage("New screenshot added!");
      this.$forceUpdate();
    },
    removeSample(sample, index) {
      // if (this.currentSample && this.currentSample === sample)
      //   this.currentSample = null;
      this.samples.splice(index, 1);
      this.activeSample = index - 1;
      this.$forceUpdate();
    },
    removeFile(files, index) {
      const file = files[index];
      if (this.currentFiles && this.currentFiles.includes(file))
        this.currentFiles = null;
      files.splice(index, 1);
      this.$forceUpdate();
    },
    async updateFiles(sample) {
      let comm = sample.files[0].name;
      comm = comm.split(".")[0];
      for (let i = 1; i < sample.files.length; i++) {
        comm = longestCommonSubstring(comm, sample.files[i].name);
      }
      if (comm.length > 2) sample.name = comm;
      else sample.name = "Sample-" + Date.now();
      this.commitValue();
    },
    trimEllip(str, length) {
      if (!str) return str;
      if (typeof str === "object") str = str.toString();
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    async displayImage(file, dialogID) {
      const loadingComponent = this.$buefy.loading.open({
        container: this.$el,
        canCancel: true
      });
      try {
        this.viewer = await window.imjoy.api.showDialog({
          name: file.name.slice(0, 40),
          src: "https://kaibu.org/#/app",
          w: 10,
          h: 5,
          config: { open_sidebar: false },
          window_id: dialogID
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

        await this.viewer.view_image(base64);

        return;
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        loadingComponent.close();
      }
    },
    async fetchRemoteFile(file) {
      // fetch remote file
      try {
        if (!this.fileCache[file.url]) {
          const newFile = await fetchFile(file.url, file.name);
          // remember the remote file
          newFile.remote = file;
          // replace the file with the actual one
          this.fileCache[file.url] = newFile;
          file = newFile;
        } else {
          file = this.fileCache[file.url];
        }
      } catch (e) {
        console.error(e);
        alert(`Failed to fetch file from ${file.url}: ${e}`);
      }
      return file;
    },
    markFileConversion(sample) {
      let saveFileName = "data";
      if (!saveFileName.endsWith(".smlm"))
        saveFileName = saveFileName + ".smlm";

      sample.convert = async () => {
        const smlmPlugin = await window.imjoy.api.getPlugin("SMLM File IO");
        const smlm = await smlmPlugin.load(sample.files);
        const zip = await smlm.save(saveFileName);
        return zip;
      };
      sample.convertFileName = saveFileName;
    },
    async previewSample(sample) {
      this.currentSample = sample;
      sample.files.forEach(file => (file.sampleName = sample.name));
      const files = sample.files;
      const api = window.imjoy.api;
      const loadingComponent = this.$buefy.loading.open({
        canCancel: true,
        container: this.$el
      });
      // const container = document.getElementById(this.containerId);
      // const w = container.getBoundingClientRect().width;
      // container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider
      const dialogID = randId();
      const normalizedFiles = [];
      for (let file of files) {
        if (file.type === "remote") {
          normalizedFiles.push(await this.fetchRemoteFile(file));
        } else {
          normalizedFiles.push(file);
        }
      }
      this.currentFiles = normalizedFiles;

      // display SMLM file
      try {
        let smlmFiles = [];
        const locFiles = normalizedFiles.filter(
          file =>
            file.name.endsWith(".smlm") ||
            file.name.endsWith(".csv") ||
            file.name.endsWith(".tsv") ||
            file.name.endsWith(".xls") ||
            file.name.endsWith(".txt")
        );
        if (locFiles.length <= 0) {
          // display image
          // TODO: how to display the image sample with multiple images
          const fn = normalizedFiles[0].name.toLowerCase();
          if (
            fn.endsWith(".png") ||
            fn.endsWith(".jpeg") ||
            fn.endsWith(".jpg")
          ) {
            this.displayImage(normalizedFiles[0], dialogID);
            loadingComponent.close();
            return;
          } else
            alert(
              "No localization file found (only support .csv, .tsv, .txt files)"
            );
          return;
        }
        const smlmPlugin = await api.getPlugin("SMLM File IO");
        for (let file of locFiles) {
          // display SMLM file
          try {
            const smlm = await smlmPlugin.load(file);
            smlmFiles = smlmFiles.concat(smlm.files);
          } catch (e) {
            console.error(e);
            throw e;
          } finally {
            loadingComponent.close();
          }
        }

        // this will mark the file conversion
        // the convert function will be called during upload
        this.markFileConversion(sample);
        const baseUrl = window.location.origin + window.location.pathname;
        this.viewer = await api.showDialog({
          name: sample.name.slice(0, 40),
          src: baseUrl + "FairyDust.imjoy.html",
          data: smlmFiles,
          window_id: dialogID
        });

        // inject take screenshot button
        if (this.viewer.captureImage) {
          const windowContainer = document.getElementById(dialogID);
          const snapButton = document.createElement("button");
          snapButton.innerHTML = "Take a screenshot";
          snapButton.classList.add("button");
          snapButton.classList.add("snap-button");
          snapButton.onclick = () => {
            this.capture();
          };
          windowContainer.appendChild(snapButton);
        }
        await api.showMessage(
          "Done! To add a new channel, hold the SHIFT key and click or drop another file."
        );
        // container.style.height = w / 2 + 111 + "px"; // add 111px for the plane slider
        if (!this.currentSample.views || this.currentSample.views.length <= 0) {
          setTimeout(() => {
            this.capture();
          }, 1000);
        }
        // document.getElementById(this.containerId + "-files").scrollIntoView();
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

.tab-content {
  margin: 0;
}
</style>
