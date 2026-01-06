import {createApp} from 'vue'
import {createPinia} from 'pinia'
import './styles/index.scss'
import {createRouter, createWebHashHistory} from "vue-router";
import Home from "./components/Home.vue";
import App from "./App.vue";
import VueKonva from 'vue-konva';
import CardCreator from "./components/CardCreator.vue";

const routes = [
  {path: '/', name: 'home', component: Home},
  {path: '/card-creator', name: 'card-creator', component: CardCreator},
  {path: '/card-preview/:uuid', name: 'card-preview', component: () => import('./components/CardPreview.vue')},
  {path: '/roadmap', name: 'roadmap', component: () => import('./components/Roadmap.vue')},
  {path: '/contact', name: 'contact', component: () => import('./components/Contact.vue')},
]

const router = createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHashHistory(),
  routes, // short for `routes: routes`
})

const pinia = createPinia();
const app = createApp(App)

app.use(router)
app.use(VueKonva);
app.use(pinia);
app.mount('#app')
