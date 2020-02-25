Vue.component('label-selector', {
  props: ['all-labels'],
  template: document.getElementById('label-selector'),
});


function getThumbnail(url, tsize) {
  return new Promise((resolve, reject) => {
    var myCan = document.createElement('canvas');
    var img = new Image();
    img.src = url;
    img.crossorigin = "anonymous";
    img.onload = function () {
      myCan.width = Number(tsize);
      myCan.height = Number(tsize);
      if (myCan.getContext) {
        var cntxt = myCan.getContext("2d");
        cntxt.drawImage(img, 0, 0, myCan.width, myCan.height);
        var dataURL = myCan.toDataURL();
        resolve(dataURL)
      } else {
        reject('unable to get context')
      }
    }
    img.onerror = reject
  })

}

function randId() {
  return Math.random()
    .toString(36)
    .substr(2, 10);
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const app = new Vue({
  el: '#app',
  data: {
    models: [],
    apps_source: [],
    apps: {},
    allLabels: [],
    filters: [],
    selected_model: {},
    windows: [],
    imjoy: null,
    dialog_window: null,
    plugins: [],
    loading: false
  },
  computed: {
    filteredModels: function () {
      const covered = this.models.filter((model) => model.cover_image);
      const models = covered.concat(this.models.filter((model) => !model.cover_image))

      return models.filter((model) =>
        this.filters.every((label) =>
          model.allLabels.includes(label)
        )
      );

    }
  },
  created: async function () {
    const that = this;
    const repos = [
      'bioimage-io/models'
    ]
    that.models = []
    for (let repo of repos) {
      try {

        const repository_url = location.hostname === 'bioimage.io'?`https://raw.githubusercontent.com/${repo}/master/manifest.model.json`: `/manifest.model.json`
        const response = await fetch(repository_url + '?' + randId())
        const repo_manifest = JSON.parse(await response.text());
        const models = repo_manifest.models;
        for (let model of models) {
          model.repo = repo;
          model.url = model.url;
          model.model_uri = `${repo}:${model.name}`;
          model.source_url = model.url;
        }
        that.models = that.models.concat(models);
        that.apps_source = repo_manifest.applications;
      } catch (e) {
        console.error(e)
      }
    }
    that.models.forEach((model) => {
      model.allLabels = model.labels || [];
      if (!!model.license) {
        model.allLabels.push(model.license);
      }
      if (model.tags) {
        model.allLabels = model.allLabels.concat(model.tags);
      }
      if (model.covers) {
        model.cover_image = model.covers[0]
      } else {
        model.cover_image = ''
      }
    });
    that.models.forEach((model) => {
      model.allLabels.forEach((label) => {
        if (that.allLabels.indexOf(label) === -1) {
          that.allLabels.push(label);
        }
      });
    });
    that.allLabels.sort((a, b) =>
      a.toLowerCase() < b.toLowerCase() ? -1 : 1
    );
    
    if (!this.$refs.model_info_dialog.showModal) {
      dialogPolyfill.registerDialog(this.$refs.model_info_dialog);
    }

    if (!this.$refs.window_dialog.showModal) {
      dialogPolyfill.registerDialog(this.$refs.window_dialog);
    }

    document.addEventListener('DOMContentLoaded', (event) => {
      this.loadImJoy();
    })

  },
  methods: {
    etAl: (authors) => {
      authors = authors.map((author)=>{
        return author.split(';')[0]
      })
      if (authors.length < 3) {
        return authors.join(", ");
      } else {
        return authors.slice(0, 3).join(", ") + " et al.";
      }
    },
    async getDocs(model) {
      if (model.docs) return;
      model.docs = '@loading...';
      this.$forceUpdate();
      const response = await fetch(model.source_url)
      const source_code = await response.text();
      const modelComp = window.parseComponent(source_code);
      const raw_docs = modelComp.docs && modelComp.docs[0] && modelComp.docs[0].content;
      if (raw_docs && window.marked && window.DOMPurify) {
        model.docs = window.DOMPurify.sanitize(window.marked(raw_docs))
        model.source_code = source_code;
      } else {
        model.docs = null;
        model.source_code = null;
      }
      this.$forceUpdate();
    },
    async download(model) {
      let filename = model.name + '_' + randId() + '.model.html'
      const response = await fetch(model.source_url)
      const model_source = await response.text();
      var blob = new Blob([model_source], {type: "text/plain;charset=utf-8"});
      saveAs(blob, filename);
    },
    share(model) {
      prompt('Please copy and paste following URL for sharing:', 'https://bioimage.io/?model=' + model.model_uri)
    },
    showInfo(model) {
      this.selected_model = model;
      this.$refs.model_info_dialog.showModal();
      this.getDocs(model)
    },
    closeInfo() {
      this.$refs.model_info_dialog.close();
    },
    addRemoveToFilters(label) {
      if (this.filters.indexOf(label) === -1) {
        this.filters.push(label);
      } else {
        this.filters = this.filters
          .filter((x) => x !== label);
      }
    },
    checkActive(label) {
      return this.filters.indexOf(label) > -1;
    },
    clearAllFilters() {
      this.filters = [];
    },
    getLabelCount(label) {
      return this.filteredModels
        .filter((models) => models.allLabels.includes(label))
        .length;

    },
    getModelsCount() {
      return this.filteredModels.length
    },
    addWindow(w){
      this.dialog_window = w;
      this.$refs.window_dialog.showModal();
      this.selectWindow(w)
    },
    removeWindow(w){
      w.close()
    },
    selectWindow(w){
      
    },
    closeDialog(){
      this.$refs.window_dialog.close()
      this.dialog_window.close()
      this.dialog_window = null
    },
    loadImJoy(){
      var imjoy_api = {
        showMessage(plugin, info, duration){
            console.log(info)
        },
        showProgress(plugin, progress){
            if (progress < 1) progress =  progress * 100;
            document.getElementById('progress').value = progress
        },
        showDialog(_plugin, config) {
            return new Promise((resolve, reject) => {
                if (config.ui) {
                  this.$refs.window_dialog.showModal();
                  const joy_config = {
                      container:  document.getElementById('window-dialog-container'),
                      init: config.ui || "", //"{id:'localizationWorkflow', type:'ops'} " + // a list of ops
                      data: config.data, // || Joy.loadFromURL(),
                      modules: config.modules || ["instructions", "math"],
                      onexecute: config.onexecute,
                      onupdate: config.onupdate,
                  };
                  try {
                      new imjoyLib.Joy(joy_config);
                  } catch (e) {
                      console.error("error occured when loading the workflow", e);
                      joy_config.data = "";
                      new imjoyLib.Joy(joy_config);
                      throw e;
                  }
          
              } else if (config.type) {
                  this.$refs.window_dialog.showModal();
                  config.window_container = "window-dialog-container";
                  config.standalone = true;
                  if (config.type.startsWith("imjoy/")) {
                      config.render = wconfig => {
                      };
                  }
                  setTimeout(() => {
                      imjoy.pm.createWindow(null, config)
                      .then(api => {
                          const _close = api.close;
                          api.close = async () => {
                              await _close();
                              closeDialog();
                          };
                          resolve(api);
                      })
                      .catch(reject);
                  }, 0);
              } else {
                  alert("Unsupported dialog type.");
              }
            });
        },
      }

      const imjoy = new imjoyLib.ImJoy({
          imjoy_api: imjoy_api,
          show_message_callback: console.log,
          add_window_callback: async (w)=>{
              this.addWindow(w)
          },
          update_ui_callback: ()=>{}
      })
      const workspace = getUrlParameter('workspace') || getUrlParameter('w');
      const engine = getUrlParameter('engine') || getUrlParameter('e');

      imjoy.start({workspace: workspace}).then(async ()=>{
          this.windows = imjoy.wm.windows
          console.log('ImJoy started: ', imjoy)
          if (engine) {

          }
          this.loading = true;
          for(let k in this.apps_source){
            try{
              const p = await imjoy.pm.reloadPluginRecursively({uri: this.apps_source[k]})
              this.apps[k] = p
            }
            catch(e){
              console.error(e)
            }
          }
          this.loading = false;

          let model = getUrlParameter('model');
          let app = getUrlParameter('app');
          if(model && app){
            console.log('loading model with app', model, app)
          }
      })
      .catch((e)=>{
          console.error(e)
          alert('Error: '+ e)
      })

      imjoy.event_bus.on("plugin_loaded", (plugin) => {
        this.plugins.push(plugin)
      })
      this.imjoy = imjoy;
    },
    async runAllModels(plugin){
      await plugin.api.run(this.models)
    },
    async runModel(plugin, model){
      await plugin.api.run(model)
    }
  }
});