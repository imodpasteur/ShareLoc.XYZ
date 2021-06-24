<template>
  <div class="dataset">
    <section class="sidebar-layout">
      <b-sidebar
        position="static"
        mobile="hide"
        :expand-on-hover="expandOnHover"
        :reduce="false"
        :delay="expandWithDelay ? 500 : null"
        type="is-light"
        open
      >
        <div class="p-1">
          <div class="block">
            <img
              src="https://raw.githubusercontent.com/buefy/buefy/dev/static/img/buefy-logo.png"
              alt="Lightweight UI components for Vue.js based on Bulma"
            />
          </div>
          <b-menu class="is-custom-mobile">
            <b-menu-list label="Menu">
              <b-menu-item
                icon="information-outline"
                label="Info"
              ></b-menu-item>
              <b-menu-item
                active
                expanded
                icon="settings"
                label="Administrator"
              >
                <b-menu-item icon="account" label="Users"></b-menu-item>
                <b-menu-item
                  icon="cellphone-link"
                  label="Devices"
                ></b-menu-item>
                <b-menu-item
                  icon="cash-multiple"
                  label="Payments"
                  disabled
                ></b-menu-item>
              </b-menu-item>
              <b-menu-item icon="account" label="My Account">
                <b-menu-item
                  icon="account-box"
                  label="Account data"
                ></b-menu-item>
                <b-menu-item
                  icon="home-account"
                  label="Addresses"
                ></b-menu-item>
              </b-menu-item>
            </b-menu-list>
            <b-menu-list>
              <b-menu-item label="Expo" icon="link"></b-menu-item>
            </b-menu-list>
            <b-menu-list label="Actions">
              <b-menu-item icon="logout" label="Logout"></b-menu-item>
            </b-menu-list>
          </b-menu>
        </div>
        <section style="padding: 20px;">
          <form-json
            v-if="jsonFields && jsonFields.length > 0"
            :btnReset="{ value: 'Reset' }"
            :btnSubmit="{ value: 'OK' }"
            :camelizePayloadKeys="false"
            :formFields="jsonFields"
            :formName="'metadata'"
            @formSubmitted="formSubmitted"
            :components="components"
          >
          </form-json>
        </section>
      </b-sidebar>

      <div class="p-1">
        {{ resourceId }}
      </div>
    </section>
  </div>
</template>
<script>
import "vue-form-json/dist/vue-form-json.css";
import formJson from "vue-form-json/dist/vue-form-json.common.js";
// import Markdown from "@/components/Markdown.vue";
import TagInputField from "@/components/tagInputField.vue";
import DropFilesField from "@/components/dropFilesField.vue";
// import marked from "marked";
// import DOMPurify from "dompurify";

export default {
  name: "dataset",
  props: ["resourceId"],
  components: {
    "form-json": formJson,
    // markdown: Markdown,
    // eslint-disable-next-line vue/no-unused-components
    TagInputField,
    // eslint-disable-next-line vue/no-unused-components
    DropFilesField
  },
  computed: {
    components: () => ({ TagInputField, DropFilesField })
  },
  data() {
    return {
      jsonFields: [],
      expandOnHover: false,
      expandWithDelay: false,
      reduce: false
    };
  },
  methods: {
    formSubmitted() {
      // const docstring = DOMPurify.sanitize(marked(docstring));
    }
  }
};
</script>
<style>
.dataset {
  margin-top: 72px;
  height: 100%;
}
.p-1 {
  padding: 1em;
}
.sidebar-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
}
.sidebar-layout {
  display: flex;
  flex-direction: row;
  min-height: 100%;
}
.sidebar-content {
  height: 100% !important;
}
</style>
