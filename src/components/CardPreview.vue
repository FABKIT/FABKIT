<script setup>
import {useSavedCardsStore} from "../stores/savedCardsStore.js";
import {useRoute, useRouter} from "vue-router";
import {DocumentArrowDownIcon, PrinterIcon, ArrowLeftIcon} from "@heroicons/vue/24/solid/index.js";
import {computed, ref} from "vue";

const savedCardsStore = useSavedCardsStore();

const savedCard = savedCardsStore.getCard(useRoute().params.uuid);

if (!savedCard) {
  useRouter().push({name: 'home'})
}

const printing = ref(false);
const previewClasses = computed(() => {
  return {
    'w-full sm:max-w-[450px]': !printing.value,
    'w-[238.11px]': printing.value,
  }
});

const printPage = function () {
  printing.value = true;
  setTimeout(() => {
    window.print();
    printing.value = false;
  }, 100);
}
</script>

<template>
  <div class="flex flex-col mx-auto max-w-7xl px-2 pb-1 sm:px-6 lg:px-8 gap-3">
    <div class="flex static sm:absolute print:hidden">
      <button
        class="inline-flex justify-center items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
        @click="$router.push({name: 'card-creator'})"
      >
        <ArrowLeftIcon aria-hidden="true" class="-mr-0.5 size-5"/>
        Back
      </button>
    </div>
    <div v-if="savedCard" class="flex flex-col gap-3 w-auto justify-center items-center">
      <img :class="previewClasses" :src="savedCard.src" :alt="savedCard.name">
    </div>
    <div class="flex flex-col gap-3 justify-center print:hidden sm:flex-row sm:gap-2">
      <a
        class="inline-flex justify-center items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
        :href="savedCard.src"
        download="card.png"
      >
        Save
        <DocumentArrowDownIcon aria-hidden="true" class="-mr-0.5 size-5"/>
      </a>

      <button
        class="inline-flex justify-center items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
        type="button"
        @click="printPage"
      >
        Print
        <PrinterIcon aria-hidden="true" class="-mr-0.5 size-5"/>
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>
