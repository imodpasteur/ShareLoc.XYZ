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
      <b-taginput
        :id="item.label"
        v-model="value"
        :data="filteredTags"
        :allow-new="item.allow_new !== false"
        :open-on-focus="item.options && item.options.length > 0"
        autocomplete
        @input="$emit('input', value)"
        :icon="item.icon || 'label'"
        :placeholder="item.placeholder"
        @typing="getFilteredTags"
      >
      </b-taginput>
      <p v-if="error" class="help is-danger">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script>
import { debounce } from "../utils";

async function getCompletion(text) {
  const url = `https://www.ebi.ac.uk/ols/api/suggest?q=${text}`;
  let response = await fetch(url);
  if (response.ok) {
    const ret = await response.json();
    let results = [];
    if (ret.response.numFound > 0) {
      results = ret.response.docs.map(d => d.autosuggest);
    }
    const url = `https://www.ebi.ac.uk/ols/api/select?q=${text}`;
    response = await fetch(url);
    if (response.ok) {
      const ret = await response.json();
      if (ret.response.numFound > 0) {
        results = results.concat(ret.response.docs.map(d => d.label));
      }
    }
    // results = results.map(r => r.toLowerCase())
    results = results.filter(function(item, pos) {
      return results.indexOf(item) == pos;
    });
    return results;
  } else {
    console.error(`Failed to fetch compeltion from ebi ols: ${url}`, response);
  }
}
export default {
  name: "tags",
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
    this.item.value && this.$emit("input", this.item.value);
  },
  methods: {
    getFilteredTags(text) {
      debounce(async () => {
        this.filteredTags = await getCompletion(text);
        // this.filteredTags = this.filteredTags.concat(newTags);
        this.$forceUpdate();
      }, 500)();

      this.filteredTags =
        this.item.options &&
        this.item.options.filter(option => {
          return (
            option
              .toString()
              .toLowerCase()
              .indexOf(text.toLowerCase()) >= 0
          );
        });
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
