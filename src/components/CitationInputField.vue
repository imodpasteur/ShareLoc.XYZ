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
      <div v-for="(citation, i) in value" :key="i">
        <b-field>
          <b-input
            @input="commitValue"
            type="text"
            placeholder="Citation text"
            v-model="citation.text"
            maxlength="1000"
          >
          </b-input>
          <b-input
            @input="commitValue"
            type="text"
            placeholder="DOI (optional)"
            v-model="citation.doi"
            maxlength="100"
          >
          </b-input>
          <b-input
            @input="commitValue"
            type="text"
            placeholder="URL (optional)"
            v-model="citation.url"
            maxlength="1000"
          >
          </b-input>
          <b-button
            v-if="i === value.length - 1"
            style="text-transform:none;"
            class="button"
            icon-left="plus"
            @click="addNewCitation"
            :disabled="!citation.text || citation.text === ''"
          ></b-button>
        </b-field>
      </div>
      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
export default {
  name: "citation",
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
    value: undefined,
    filteredTags: []
  }),
  mounted() {
    this.filteredTags = this.item.options;
  },
  created() {
    this.value = this.item.value;
    this.value = this.value || [];
    if (this.value.length <= 0) {
      this.value.push({
        text: "",
        doi: "",
        url: ""
      });
    }
    this.commitValue();
  },
  methods: {
    commitValue() {
      if (this.value.length <= 0) this.$emit("input", null);
      else {
        if (this.value[this.value.length - 1].text === "")
          this.$emit("input", this.value.slice(0, this.value.length - 1));
      }
    },
    addNewCitation() {
      if (this.value[this.value.length - 1].text !== "") {
        this.value.push({
          text: "",
          doi: "",
          url: ""
        });
      }
      this.commitValue();
    }
  }
};
</script>
<style>
.autocomplete > .dropdown-menu > .dropdown-content {
  display: block !important;
  width: 100%;
}
</style>
