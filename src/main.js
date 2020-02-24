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

const app = new Vue({
  el: '#app',
  data: {
    models: [],
    allLabels: [],
    filters: [],
    selected_model: {}
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
        const repository_url = `https://raw.githubusercontent.com/${repo}/master/manifest.model.json`
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
    }
  }
});