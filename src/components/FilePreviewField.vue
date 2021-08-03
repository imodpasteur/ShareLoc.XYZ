<template>
  <div>
    <label v-if="item.showLabel" :for="item.label" class="label">
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

        <b-button
          style="margin-left:10px;"
          v-if="samples && samples.length > 0"
          size="is-small"
          icon-left="plus"
          @click="addNewChannel()"
        >
          Add Channel or Modality
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
              <!-- <p>Files</p> -->
              <!-- <div
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
              </div> -->
              <b-table :data="sample.channels" checkbox-position="left">
                <template slot-scope="props">
                  <b-table-column field="name" label="Channel/Modality">
                    <span>{{ props.row.name }}</span>
                  </b-table-column>
                  <b-table-column field="files" label="Files">
                    <span
                      style="color: #f39f07;"
                      v-if="!props.row.files || props.row.files.length <= 0"
                      >Not selected</span
                    >
                    <span v-else
                      >{{ props.row.files.length }} files ({{
                        totalSize(props.row.files)
                      }})</span
                    >
                  </b-table-column>
                  <b-table-column field="actions" label="Actions">
                    <span
                      class="file-cta"
                      style="display: inline-block;width: 50px;"
                      @click.stop="props.row.files = []"
                    >
                      <b-icon
                        class="file-icon"
                        style="margin-top: 4px;"
                        icon="close"
                      ></b-icon>
                    </span>
                    <b-upload
                      v-model="props.row.files"
                      multiple
                      style="display: inline-block;"
                      class="file-label"
                      @input="fileSelected(sample, props.row, $event)"
                    >
                      <span class="file-cta">
                        <b-icon class="file-icon" icon="upload"></b-icon>
                        <span
                          class="file-label"
                          v-if="!props.row.files || props.row.files.length <= 0"
                          >Select File(s)</span
                        >
                        <span class="file-label" v-else>Add File(s)</span>
                      </span>
                    </b-upload>
                  </b-table-column>
                </template>

                <template #empty>
                  <div class="has-text-centered">No file selected</div>
                </template>
              </b-table>

              <!-- <b-upload
                :drag-drop="!sample.files || sample.files.length <= 0"
                v-model="sample.files"
                @input="updateFiles(sample)"
                multiple
                expanded
              >
                <section v-if="!sample.files || sample.files.length <= 0" class="section">
                  <div class="content has-text-centered">
                    <b-icon icon="upload" size="is-large"></b-icon>

                    <p>Drag and drop files here</p>
                    <p>
                      For multi-channel image, drag the files for all the
                      channels together.
                    </p>
                  </div>
                </section>
                <span v-else class="file-cta">
                    <b-icon class="file-icon" icon="upload"></b-icon>
                    <span class="file-label">Add new file</span>
                </span>
              </b-upload> -->
              <p v-if="sample.files && sample.files.length > 0">
                Screenshots
              </p>
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
        You should add at least one sample and take some screenshots for the
        cover.
      </p>
      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import { fetchFile, randId } from "../utils";
function getSampleFiles(sample) {
  const files = [];
  for (let ch of sample.channels) {
    for (let fn = 0; fn < ch.files.length; fn++) {
      const file = ch.files[fn];
      let newFile;
      // rename local file
      if (file instanceof Blob) {
        newFile = new File(
          [file],
          (ch.files.length > 1 ? ch.name + "-" + fn : ch.name) +
            "." +
            file.name.split(".")[1],
          { type: file.type, lastModified: file.lastModified }
        );
      } else {
        // don't change remote file
        newFile = Object.assign({}, file);
      }
      newFile.sampleName = sample.name;
      files.push(newFile);
    }
  }
  return files;
}
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
    currentSample: null,
    sampleChannels: []
  }),
  created() {
    this.samples = this.item.value || [];
    for (let sample of this.samples) {
      if (sample.files) {
        const files = sample.files;
        sample.channels = [];
        for (let file of files) {
          const name = file.name.split("-")[0].split(".")[0];
          if (!sample.channels.map(ch => ch.name).includes(name)) {
            sample.channels.push({ name, files: [file] });
          } else {
            const channel = sample.channels.find(ch => ch.name === name);
            channel.files.push(file);
          }
        }
      }
    }
    this.commitValue();

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
    },
    ...mapState({
      imjoyReady: state => state.imjoyReady,
      imjoy: state => state.imjoy
    })
  },
  watch: {
    activeSample(newVal) {
      this.currentSample = this.samples[newVal];
      this.$forceUpdate();
    }
  },
  methods: {
    fileSelected(sample, channel, files) {
      if (!files[0] || !files[0].name) {
        alert(
          "Invalid file(s)! If you are uploading network shared files, please copy them to a local folder."
        );
        channel.files = [];
        return;
      }
      if (sample.name.match(/$sample-[0-9]+/)) {
        sample.name = files[0].name.split(/[-, .|:_]+/)[0];
        if (sample.name.length < 3) {
          sample.name = sample.name + "-" + this.samples.length;
        }
      }
      this.commitValue();
    },
    totalSize(files) {
      const size =
        files.reduce((size, file) => size + file.size, 0) / 1024 / 1024; // unit: MB
      if (isNaN(size)) return "unkown";
      else return (size > 1 ? Math.round(size) : size.toFixed(1)) + "MB";
    },
    addNewChannel(name) {
      if (!name) {
        name = prompt(
          "Please give a unique name for the new channel or modality in lower case, e.g. smlm, raw, actin, widefield, alpha-tubulin.",
          "default"
        );
        if (name && name.includes("-")) {
          alert(
            `"Hyphen(-) is not allowed in the name, please remove it or use underscore instead.`
          );
          return;
        }
        if (name && this.sampleChannels.includes(name.toLowerCase())) {
          alert(
            `"${name.toLowerCase()}" already exists, please choose another name.`
          );
          return;
        }
      }
      if (name) {
        name = name.toLowerCase();
        if (this.sampleChannels.includes(name)) {
          alert(`"${name}" already exists, please choose another name.`);
          return;
        }
        this.sampleChannels.push(name);
        for (let sample of this.samples) {
          sample.channels = sample.channels || [];
          if (!sample.channels.find(ch => ch.name === name))
            sample.channels.push({ name, files: [] });
        }
      } else {
        throw new Error("Empty channel name");
      }
    },
    addNewSample() {
      if (!this.sampleChannels || this.sampleChannels.length <= 0) {
        this.addNewChannel();
      }
      this.samples.push({
        name: "sample-" + this.samples.length,
        channels: this.sampleChannels.map(ch => {
          return { name: ch, files: [] };
        })
      });
      this.activeSample = this.samples.length - 1;
      this.currentSample = this.samples[this.samples.length - 1];
    },
    commitValue() {
      for (let sample of this.samples) {
        sample.files = getSampleFiles(sample);
      }

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
        this.imjoy.api.showMessage(
          "Please change the image to another view and try again."
        );
      // this.selectedScreenshot = this.currentSample.views.length-1;
      this.commitValue();
      this.imjoy.api.showMessage("New screenshot added!");
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
    // async updateFiles(sample) {
    //   // If the user drag and drop a samba shared file, it won't work
    //   if (!sample.files[0] || !sample.files[0].name) {
    //     alert(
    //       "Invalid file(s)! If you are uploading network shared files, please copy them to a local folder."
    //     );
    //     return;
    //   }
    //   let comm = sample.files[0].name; // FIXME:
    //   comm = comm.split(".")[0];
    //   for (let i = 1; i < sample.files.length; i++) {
    //     comm = longestCommonSubstring(comm, sample.files[i].name);
    //   }
    //   if (comm.length > 2) sample.name = comm;
    //   else sample.name = "sample-" + this.samples.length;
    //   this.commitValue();
    // },
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
        this.viewer = await this.imjoy.api.showDialog({
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
          const newFile = await fetchFile(
            file.url,
            file.name,
            this.imjoy && this.imjoy.api.showMessage
          );
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
    markFileConversion(sample, locFiles) {
      let saveFileName = "data";
      if (!saveFileName.endsWith(".smlm"))
        saveFileName = saveFileName + ".smlm";

      sample.convert = async () => {
        const smlmPlugin = await this.imjoy.api.getPlugin("SMLM File IO");
        const smlm = await smlmPlugin.load(locFiles);
        const zip = await smlm.save(saveFileName);
        zip.sampleName = sample.name;
        zip.converted = locFiles;
        return zip;
      };
      sample.convertFileName = saveFileName;
    },
    async previewSample(sample) {
      this.currentSample = sample;
      const files = getSampleFiles(sample);
      files.forEach(file => (file.sampleName = sample.name));
      const api = this.imjoy.api;
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
        } else if (file.type === "generator") {
          normalizedFiles.push(await file.generate());
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
            try {
              await this.displayImage(normalizedFiles[0], dialogID);
            } catch (e) {
              alert(`${e}`);
            }
            loadingComponent.close();
            return;
          } else
            alert(
              "No localization file found (only support .smlm, .csv, .tsv, .xls and .txt files)"
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
            alert(`${e}`);
          } finally {
            loadingComponent.close();
          }
        }

        // this will mark the file conversion
        // the convert function will be called during upload
        this.markFileConversion(sample, locFiles);
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
          "Done! Please use the 'Take a screenshot' button to create more cover images."
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
        alert(`${e}`);
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
