<script setup>
import {ref, watch} from 'vue'
import {Dialog, DialogPanel, TransitionChild, TransitionRoot} from '@headlessui/vue'
import {
  Bars3Icon,
  XMarkIcon,
  PaintBrushIcon,
  MapIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
} from '@heroicons/vue/24/outline'
import {useRoute} from "vue-router";


const navigation = [
  {name: 'Home', route: 'home', icon: HomeIcon},
  {name: 'Card Creator', route: 'card-creator', icon: PaintBrushIcon},
  {name: 'Roadmap', route: 'roadmap', icon: MapIcon},
  {name: 'Contact', route: 'contact', icon: ChatBubbleLeftRightIcon},
];

const route = useRoute();
const currentRouteName = ref('');
const sidebarOpen = ref(false);

watch(route, (oldValue, newValue) => {
      currentRouteName.value = navigation.find(v => v.route === newValue.name).name;
    },
    {deep: true}
);

</script>

<template>
  <div>
    <TransitionRoot :show="sidebarOpen" as="template">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity ease-linear duration-300" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-900/80"/>
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild as="template" enter="transition ease-in-out duration-300 transform" enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0" leave-to="-translate-x-full">
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0">
                <div class="absolute top-0 left-full flex w-16 justify-center pt-5">
                  <button class="-m-2.5 p-2.5" type="button" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" class="size-6 text-white"/>
                  </button>
                </div>
              </TransitionChild>
              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-dark px-6 pb-2">
                <div class="flex h-16 gap-1 shrink-0 items-center text-primary">
                  <img alt="FABKIT" class="h-8 w-auto" src="/src/assets/Fabkitlogo_notext.svg"/>
                  <h1 class="text-sm/6 font-semibold text-primary">FaBKit</h1>
                </div>
                <nav class="flex flex-1 flex-col">
                  <ul class="flex flex-1 flex-col gap-y-7" role="list">
                    <li>
                      <ul class="-mx-2 space-y-1" role="list">
                        <li v-for="item in navigation" :key="item.name">
                          <router-link :class="[item.route === route.name ? 'bg-gray-50 dark:bg-primary text-primary dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-primary hover:text-primary dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']" :to="{name: item.route}" @click="sidebarOpen = false">
                            <component :is="item.icon" :class="[item.route === route.name ? 'text-primary dark:text-white' : 'text-gray-400 group-hover:text-primary dark:group-hover:text-white', 'size-6 shrink-0']" aria-hidden="true"/>
                            {{ item.name }}
                          </router-link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div class="flex grow flex-col border-r border-gray-200 bg-white dark:bg-dark px-6">
        <div class="flex h-48 justify-center items-center">
          <img alt="FABKIT Logo" class="h-30 w-auto" src="/src/assets/Fabkitlogo.svg"/>
        </div>
        <hr class="h-px bg-gray-200 border-0 dark:bg-gray-200">
        <nav class="flex flex-1 flex-col mt-5">
          <ul class="flex flex-1 flex-col gap-y-7" role="list">
            <li>
              <ul class="-mx-2 space-y-1" role="list">
                <li v-for="item in navigation" :key="item.name">
                  <router-link :class="[item.route === route.name ? 'bg-gray-50 dark:bg-primary text-primary dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-primary hover:text-primary dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']" :to="{name: item.route}" @click="sidebarOpen = false">
                    <component :is="item.icon" :class="[item.route === route.name ? 'text-primary dark:text-white' : 'text-gray-400 group-hover:text-primary dark:group-hover:text-white', 'size-6 shrink-0']" aria-hidden="true"/>
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="sticky top-0 z-40 flex items-center gap-x-6 bg-white dark:bg-dark px-4 py-4 shadow-xs sm:px-6 lg:hidden">
      <button class="-m-2.5 p-2.5 text-primary lg:hidden" type="button" @click="sidebarOpen = true">
        <span class="sr-only">Open sidebar</span>
        <Bars3Icon aria-hidden="true" class="size-6"/>
      </button>
      <div class="flex flex-row items-center text-sm/6 font-semibold text-primary"> <img src="/src/assets/Fabkitlogo_notext.svg" alt="FABKIT Logo" class="h-8 pr-2"> FaBKit - {{ currentRouteName }}</div>
    </div>
  </div>
</template>

<style scoped>

</style>
