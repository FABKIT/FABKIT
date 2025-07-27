import {createApp} from 'vue'
import './style.css'
import {createRouter, createWebHashHistory} from "vue-router";
import Home from "./components/Home.vue";
import App from "./App.vue";
import Roadmap from "./components/Roadmap.vue";
import Contact from "./components/Contact.vue";
import VueKonva from 'vue-konva';
import WorkInProgress from "./components/WorkInProgress.vue";

const routes = [
    {path: '/', name:'home', component: Home},
    {path: '/roadmap', name: 'roadmap', component: Roadmap},
    {path: '/contact', name: 'contact', component: Contact},
]

const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
})

const app = createApp(App)

app.use(router)
app.use(VueKonva);
app.mount('#app')
