<script setup>
import ButtonDropdown from "./ButtonDropdown.vue";
import FeaturedArtist from "./FeaturedArtist.vue";
import useTypes from "../config/types.js";
import {useFieldsStore} from "../stores/fieldStore.js";

const types = useTypes();
const fields = useFieldsStore();
</script>

<template>
  <div>
    <div class="relative isolate overflow-hidden min-h-[100vh]">
      <div>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-4xl font-semibold tracking-tight text-balance text-primary dark:text-white sm:text-5xl">Start creating!</h2>
          <div class="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd relative z-1">
            <div class="w-full max-w-xs mx-auto">
              <ButtonDropdown
                  :options="types.sort((a, b) => a.label.localeCompare(b.label)).map((t) => {
                    return {
                     title: t.label,
                     type: t.type,
                     selected: t.type === fields.cardType,
                     disabled: t.disabled,
                    }
                  })"
                  placeholder="Select Card Type"
                  @update:modelValue="fields.cardType = $event.type; $router.push({name: 'card-creator'});"
              >
                <div slot="icon"></div>
              </ButtonDropdown>
            </div>
          </div>
        </div>
        <div class="mt-10 mb-5 mx-auto xl:mx-24 fade-in-fwd">
          <FeaturedArtist />
        </div>
      </div>
      <svg aria-hidden="true" class="absolute top-1/2 left-1/2 -z-10 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)] fade-in-bottom" viewBox="0 0 1024 1024">
        <circle cx="512" cy="512" fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fill-opacity="0.7" r="512"/>
        <defs>
          <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
            <stop stop-color="#A6864A"/>
            <stop offset="1" stop-color="#A6864A"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  </div>
</template>
