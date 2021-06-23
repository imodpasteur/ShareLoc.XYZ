import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import ResourceItemList from "../components/ResourceItemList.vue";
import Upload from "../components/Upload.vue";
import Dataset from "../views/Dataset.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/dataset/:resourceId+",
    name: "Dataset",
    component: Dataset,
    props: true
  },
  {
    path: "/p/:resourceId+",
    name: "Package",
    component: Home,
    props: true
  },
  {
    path: "/upload",
    name: "Upload",
    component: Upload
  },
  {
    path: "/app",
    name: "App",
    component: ResourceItemList
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  }
];

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
});

export default router;
