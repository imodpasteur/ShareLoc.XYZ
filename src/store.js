import Vue from "vue";
import Vuex from "vuex";
import { randId, ZenodoClient } from "./utils";
import siteConfig from "../site.config.json";
import spdxLicenseList from "spdx-license-list/full";
import { setupBioEngine } from "./bioEngine";

Vue.use(Vuex);

// set default values for table_view
siteConfig.table_view = siteConfig.table_view || {
  columns: ["name", "authors", "badges", "apps"]
};

const tagCates = siteConfig.resource_categories.filter(
  c => c.type === "dataset"
)[0].tag_categories;
let allTags = [];
for (let cat in tagCates) {
  allTags = allTags.concat(tagCates[cat]);
}

const zenodoBaseURL = siteConfig.zenodo_config.use_sandbox
  ? "https://sandbox.zenodo.org"
  : "https://zenodo.org";

function normalizeItem(item) {
  if (item.config && item.config._normalized) return;
  item.config = item.config || {};
  item.covers = item.covers || [];
  item.authors = item.authors || [];
  item.description = item.description || "";
  if (item.config._deposit) item.root_url = item.config._deposit.links.bucket;
  if (item.covers && !Array.isArray(item.covers)) {
    item.covers = [item.covers];
  }
  if (item.icon === "extension") item.icon = "puzzle";
  item.cover_images = [];
  for (let cover of item.covers) {
    // if (cover.includes("(") || cover.includes(")")) {
    //   console.error("cover image file name cannot contain brackets.");
    //   continue;
    // }
    if (!cover.startsWith("http")) {
      item.cover_images.push(new URL(cover, item.root_url).href);
    } else {
      if (cover.includes(" ")) {
        item.cover_images.push(encodeURI(cover));
      } else item.cover_images.push(cover);
    }
  }

  item.allLabels = item.labels || [];
  if (item.license) {
    item.allLabels.push(item.license);
  }
  if (item.applications) {
    item.allLabels = item.allLabels.concat(item.applications);
  }
  if (item.tags) {
    item.tags = item.tags.filter(
      tag => typeof tag === "string" && !siteConfig.excluded_tags.includes(tag)
    );
    item.allLabels = item.allLabels.concat(
      item.tags.map(tag => tag.toLowerCase())
    );
  }

  // make it lower case and remove duplicates
  item.allLabels = Array.from(
    new Set(item.allLabels.map(label => label.toLowerCase()))
  );

  item.apps = item.apps || [];
  if (item.download_url)
    item.apps.unshift({
      name: "Download",
      icon: "download",
      url: item.download_url,
      show_on_hover: true
    });
  if (item.git_repo)
    item.apps.unshift({
      name: "Git Repository",
      icon: "github",
      url: item.git_repo,
      show_on_hover: true
    });

  item.badges = item.badges || [];
  item.attachments = item.attachments || {};

  if (item.license) {
    item.badges.unshift({
      label: "license",
      ext: item.license,
      ext_type: "is-info",
      url: spdxLicenseList[item.license] && spdxLicenseList[item.license].url
    });
  }

  if (item.size) {
    item.badges.unshift({
      label: "size",
      label_type: "is-dark",
      ext:
        item.size > 1000000
          ? Math.round(item.size / 1000000) + "MB"
          : Math.round(item.size / 1000) + "kB",
      ext_type: "is-primary"
    });
  }

  if (item.type === "model" && item.co2) {
    item.badges.unshift({
      label: "CO2",
      ext: item.co2,
      ext_type: "is-success",
      run() {
        alert(
          `SAVE THE EARTH: The carbon footprint for training this model is around ${item.co2} lbs, reusing existing models can help save the earth from climate change.`
        );
      }
    });
  }
  if (item.error) {
    if (item.error.spec) {
      item.badges.unshift({
        label: "spec",
        label_type: "is-dark",
        ext: "failing",
        ext_type: "is-danger",
        run() {
          alert(
            "This model failed the specification checks, here are the errors: \n" +
              JSON.stringify(item.error.spec, null, "  ")
          );
        }
      });
    } else {
      item.badges.unshift({
        label: "spec",
        label_type: "is-dark",
        ext: "passing",
        ext_type: "is-success",
        run() {
          alert("🎉 This model passed the specification checks!");
        }
      });
    }
  }
  item.config._normalized = true;
}

let notifyImJoyReady = null;
let notifyImJoyFailed = null;
const imjoyReady = new Promise((resolve, reject) => {
  notifyImJoyReady = resolve;
  notifyImJoyFailed = reject;
});

export async function init() {
  try {
    const imjoy = await setupBioEngine();
    notifyImJoyReady(imjoy);
  } catch (e) {
    notifyImJoyFailed(e);
    console.error(e);
  }
}
export const store = new Vuex.Store({
  state: {
    loadedUrl: null,
    allApps: {},
    allTags: allTags,
    imjoy: null,
    resourceItems: [],
    zenodoClient: siteConfig.zenodo_config.enabled
      ? new ZenodoClient(
          zenodoBaseURL,
          siteConfig.zenodo_config.client_id,
          siteConfig.zenodo_config.use_sandbox
        )
      : null,
    zenodoBaseURL,
    siteConfig,
    imjoyReady,
    showNavbar: true,
    bookmarks: [],
    eventBus: new Vue()
  },
  actions: {
    async toggleNavbar(context, enable) {
      context.state.showNavbar = enable;
    },
    async login(context) {
      try {
        await context.state.client.login();
      } catch (e) {
        alert(`Failed to login: ${e}`);
      }
    },
    async fetchResourceItems(context, { manifest_url, repo, transform }) {
      if (context.state.loadedUrl === manifest_url) {
        console.log("manifest already loaded");
        return;
      }
      const siteConfig = context.state.siteConfig;
      try {
        const items = await context.state.zenodoClient.getResourceItems({
          community: siteConfig.zenodo_config.community
        });
        items.map(item => context.commit("addResourceItem", item));
      } catch (e) {
        console.error(e);
        throw new Error(
          "It appears that we cannot reach to the Zenodo server (https://zenodo.org), please check whether you are connected to the internet, otherwise it might be because the Zenodo server is currently down."
        );
      }

      const response = await fetch(manifest_url + "?" + randId());
      const repo_manifest = JSON.parse(await response.text());
      if (repo_manifest.collections && siteConfig.partners) {
        for (let c of repo_manifest.collections) {
          const duplicates = siteConfig.partners.filter(p => p.id === c.id);
          duplicates.forEach(p => {
            siteConfig.partners.splice(siteConfig.partners.indexOf(p), 1);
          });
          siteConfig.partners.push(c);
        }
      }

      const resourceItems = repo_manifest.resources;
      const rawResourceItems = JSON.parse(JSON.stringify(resourceItems));
      for (let item of rawResourceItems) {
        item.repo = repo;
        // if (item.source && !item.source.startsWith("http"))
        //   item.source = concatAndResolveUrl(item.root_url, item.source);
        context.commit("addResourceItem", item);
      }
      context.commit("normalizeItems", transform);
      if (transform) {
        // only set to load when the items are transformed
        // for the viewer, the items won't be transformed
        context.state.loadedUrl = manifest_url;
      }
      // try to restore bookmarks
      try {
        const bookmarkstr = localStorage.getItem("bookmarks");
        if (bookmarkstr) {
          const bookmarkIds = JSON.parse(bookmarkstr);
          context.state.bookmarks = context.state.resourceItems.filter(item => {
            return bookmarkIds.includes(item.id);
          });
          console.log("bookmarks restored", context.state.bookmarks);
        }
      } catch (e) {
        console.error(e);
      }
    }
  },
  mutations: {
    setImJoy(state, imjoy) {
      state.imjoy = imjoy;
    },
    addBookmark(state, item) {
      const ids = state.bookmarks.map(item => item.id);
      if (!ids.includes(item.id)) state.bookmarks.push(item);
      try {
        localStorage.setItem("bookmarks", JSON.stringify(ids));
      } catch (e) {
        console.error(e);
      }
    },
    removeBookmark(state, item) {
      const ids = state.bookmarks.map(item => item.id);
      const index = ids.indexOf(item.id);
      if (index >= 0) {
        state.bookmarks.splice(index, 1);
      }
      try {
        localStorage.setItem("bookmarks", JSON.stringify(ids));
      } catch (e) {
        console.error(e);
      }
    },
    clearBookmarks(state) {
      state.bookmarks = [];
      const ids = state.bookmarks.map(item => item.id);
      try {
        localStorage.setItem("bookmarks", JSON.stringify(ids));
      } catch (e) {
        console.error(e);
      }
    },
    addResourceItem(state, item) {
      item.id = item.id || randId();
      item.id = item.id.toLowerCase();
      item.links = item.links || [];
      item.links = item.links.map(link => link.toLowerCase());
      item.authors = item.authors || [];
      item.authors = item.authors.map(author =>
        typeof author === "string" ? { name: author } : author
      );
      item.config = item.config || {};
      if (item.config._deposit) {
        const userId = state.zenodoClient && state.zenodoClient.getUserId();
        if (userId && item.config._deposit.owners.includes(userId)) {
          if (!item.tags.includes("editable")) item.tags.push("editable");
        }
      }
      item.config._rdf_file = item.config._rdf_file || item.source; // TODO: some resources current doesn't have a dedicated rdf_file
      if (item.type === "application") state.allApps[item.id] = item;
      state.resourceItems.push(item);
      // index tags
      if (item.tags && item.tags.length > 0)
        item.tags.map(tag => {
          if (!state.allTags.includes(tag)) {
            state.allTags.push(tag);
          }
        });
    },
    removeResourceItem(state, item) {
      if (item.type === "application") delete state.allApps[item.id];
      const index = state.resourceItems.indexOf(item);
      if (index >= 0) state.resourceItems.splice(index, 1);
    },
    normalizeItems(state, transform) {
      // add default links
      state.resourceItems.map(item => {
        normalizeItem(item);
        const setting = siteConfig.resource_categories.filter(
          cat => cat.type === item.type
        )[0];
        if (setting && setting.default_links) {
          item.links = item.links || [];
          for (let link of setting.default_links) {
            if (state.resourceItems.filter(item => item.id === link)[0])
              item.links.push(link);
            else console.warn("Default link item not foud: " + link);
          }
        }
      });
      state.resourceItems = state.resourceItems.map(item => {
        // make sure the id and links are in lowercase
        item.id = item.id || randId();
        item.id = item.id.toLowerCase();
        item.links = item.links || [];
        item.links = item.links.map(link => link.toLowerCase());
        if (transform) transform(item);
        return item;
      });
    }
  }
});
