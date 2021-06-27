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
          <input
            ref="fileInput"
            type="file"
            @input="updateFiles()"
            multiple
            style="position: relative;display:block;z-index: 100;opacity:1;"
          />
          <!-- <b-upload
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
          </b-upload> -->
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
        <span v-if="viewer">
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
    api.getPlugin(baseUrl + "SMLM File IO.imjoy.html");
  },
  methods: {
    removeScreenshot(index) {
      this.screenshots.splice(index, 1);
      // this.selectedScreenshot = this.screenshots.length-1;
      this.$emit("input", this.value);
    },
    async capture() {
      const img = await this.viewer.captureImage();
      if (!this.screenshots.includes(img)) this.screenshots.push(img);
      this.value.screenshots = this.screenshots;
      // this.selectedScreenshot = this.screenshots.length-1;
      this.$emit("input", this.value);
    },
    removeFile(label, index) {
      this.value.splice(index, 1);
      this.$forceUpdate();
    },
    updateFiles() {
      this.value = this.$refs.fileInput.files;
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
        //         file = new File(
        //           [
        //             `"frame"	"x [nm]"	"y [nm]"	"z [nm]"	"uncertainty_xy [nm]"	"uncertainty_z [nm]"
        // 1	22720.3	13546.8	-228	1.3	2.6
        // 1	22305.9	25354.2	-376	1.4	2.7
        // 1	22429	26580.5	36	4.5	9.1
        // 1	20848.3	1742.4	-361	5.1	10.2
        // 1	22269.5	12820.5	-146	2.3	4.6
        // 1	22166.9	27517.8	165	3.7	7.3
        // 1	21467.8	2985.8	95	7.4	14.8
        // 1	22909.8	11994.2	-120	4.2	8.4
        // 1	21464.5	3614	52	2	4.1`
        //           ],
        //           "myfile.xls"
        //         );
        // const fileElem = document.getElementById("file")
        // file = fileElem.files[0]

        const smlm = await smlmPlugin.load(file);
        this.viewer = await api.createWindow({
          name: file.name,
          src: "http://127.0.0.1:8080/3DHistogram.imjoy.html",
          window_id: this.containerId,
          data: smlm.files
        });
        // for (let f of smlm.files) {
        //   await this.viewer.show(f);
        // }
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
