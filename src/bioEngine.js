import { store } from "./store";

export async function setupBioEngine() {
  return new Promise((resolve, reject) => {
    window
      .loadImJoyBasicApp({
        process_url_query: true,
        show_window_title: false,
        show_progress_bar: true,
        show_empty_window: true,
        hide_about_imjoy: true,
        menu_style: {},
        window_style: {
          width: "100%",
          height: "100%"
        },
        main_container: null,
        menu_container: "imjoy-menu",
        window_manager_container: null,
        imjoy_api: {} // override some imjoy API functions here
      })
      .then(async app => {
        const baseUrl = window.location.origin + window.location.pathname;
        // FIXME: This is a temporary fix for the sending file from shareloc.xyz to imjoy.io
        // Without this, the file object won't be able to perform .slice operation
        // In Chrome, this issue only happens if the file size exceed some size
        app.imjoy.pm.default_base_frame = baseUrl + "default_base_frame.html";
        app.imjoy.pm.init();
        // get the api object from the root plugin
        const api = app.imjoy.api;
        window.imjoy = app.imjoy;
        store.commit("setImJoy", app.imjoy);
        app.$on("window-size-pos-changing", changing => {
          const iframes = document.querySelectorAll(".reveal iframe");
          for (let iframe of iframes) {
            iframe.style.pointerEvents = changing ? "none" : "all";
          }
        });
        // if you want to let users to load new plugins, add a menu item
        app.addMenuItem({
          label: "➕ Load Plugin",
          callback() {
            const uri = prompt(`Please type a ImJoy plugin URL`, "");
            if (uri) app.loadPlugin(uri);
          }
        });
        // expose global variables
        window.api = api;
        window.imjoy = app.imjoy;
        window.app = app;
        // TODO: hacky solution, need further investigation
        // imjoy.event_bus.on("add_window", w => {
        //   if(imjoy.wm.windows.indexOf(w)<0){
        //     imjoy.wm.windows.push(w);
        //   }
        // });

        await app.loadPlugin(baseUrl + "SMLM-File-IO.imjoy.html");
        await app.loadPlugin(baseUrl + "FairyDust.imjoy.html");
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const engine = urlParams.get("engine");
        const spec = urlParams.get("spec");

        app.imjoy.pm
          .reloadPluginRecursively({
            // uri: "http://localhost:9090/Jupyter-Engine-Manager.imjoy.html"
            uri:
              "https://imjoy-team.github.io/jupyter-engine-manager/Jupyter-Engine-Manager.imjoy.html"
          })
          .then(enginePlugin => {
            if (engine) {
              enginePlugin.api
                .createEngine({
                  name: "MyCustomEngine",
                  nbUrl: engine,
                  url: engine.split("?")[0]
                })
                .then(() => {
                  console.log("Jupyter Engine connected!");
                })
                .catch(e => {
                  console.error("Failed to connect to Jupyter Engine", e);
                });
            } else {
              enginePlugin.api
                .createEngine({
                  name: "MyBinder Engine",
                  url: "https://mybinder.org",
                  spec: spec || "oeway/imjoy-binder-image/master"
                })
                .then(() => {
                  console.log("Binder Engine connected!");
                })
                .catch(e => {
                  console.error("Failed to connect to MyBinder Engine", e);
                });
            }
          });

        app.addMenuItem({
          label: "ℹ️ Github",
          callback() {
            window.open("https://github.com/imodpasteur/shareLoc.xyz");
          }
        });
        resolve(app);
      })
      .catch(e => {
        console.error(e);
        reject(e);
      });
  });
}

export async function runAppForAllItems(context, config, allItems) {
  console.log(config, allItems);
  context.showLoader(true);
  try {
    if (config.passive) {
      await window.api.createWindow({ src: config.source, passive: true });
      return;
    }
    const plugin = await window.api.getPlugin({ src: config.source });
    await plugin.run({
      config: {
        referer: window.location.href,
        mode: "all",
        type: "shareloc.xyz"
      },
      data: allItems
    });
    context.showLoader(false);
  } catch (e) {
    console.error(e);
    window.api.showMessage(`${e.message}`);
  } finally {
    context.showLoader(false);
  }
  // }
}

export async function runAppForItem(context, config, item) {
  console.log(config, item);
  context.showLoader(true);
  try {
    if (config.passive) {
      const plugin = await window.api.createWindow({
        src: config.source,
        passive: true
      });
      if (plugin.cancel) {
        context.showLoader(true, () => {
          plugin.cancel();
        });
      }
      return;
    }

    const plugin = await window.api.getPlugin({ src: config.source });
    context.showLoader(false);
    if (plugin.cancel) {
      context.showLoader(true, () => {
        plugin.cancel();
      });
    } else {
      context.showLoader(true);
    }
    await plugin.run({
      config: {
        referer: window.location.href,
        mode: "one",
        type: "shareloc.xyz"
      },
      data: item
    });
  } catch (e) {
    console.error(e);
    window.api.showMessage(`${e.message}`);
  } finally {
    context.showLoader(false);
  }
}
