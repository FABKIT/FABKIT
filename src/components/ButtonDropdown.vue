<template>
  <Listbox as="div" v-model="selected"  @update:modelValue="value => emit('update:modelValue', value)">
    <ListboxLabel class="sr-only">{{ label }}</ListboxLabel>
    <div class="relative">
      <div class="inline-flex rounded-md outline-hidden">
        <div class="inline-flex items-center gap-x-1.5 rounded-l-md bg-primary px-3 py-2 text-white">
          <template slot="icon">
            <CheckIcon v-if="selected" class="-ml-0.5 size-5" aria-hidden="true" />
          </template>
          <p class="text-sm font-semibold">{{ selected?.title || placeholder }}</p>
        </div>
        <ListboxButton class="inline-flex items-center rounded-l-none rounded-r-md bg-primary p-2 outline-hidden hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <span class="sr-only">{{ label }}</span>
          <ChevronDownIcon class="size-5 text-white forced-colors:text-[Highlight]" aria-hidden="true" />
        </ListboxButton>
      </div>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions class="absolute right-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white dark:bg-dark shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-hidden">
          <ListboxOption as="template" v-for="option in options" :key="option.title" :value="option" v-slot="{ active, selected }">
            <li :class="[active ? 'bg-primary text-white' : 'text-primary dark:text-white', 'cursor-default p-4 text-sm select-none']">
              <div class="flex flex-col">
                <div class="flex justify-between">
                  <p :class="selected ? 'font-semibold' : 'font-normal'">{{ option.title }}</p>
                  <span v-if="selected" :class="active ? 'text-white' : 'text-primary'">
                    <CheckIcon class="size-5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup>
import { ref } from 'vue'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'

const props = defineProps(
    {
      options: {
        type: Array,
        default: []
      },
      selected: {
        type: Object,
        default: null
      },
      label: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: '',
      }
    }
);
const selected = ref(props.selected);
const label = ref(props.label);
const placeholder = ref(props.placeholder);

const emit = defineEmits(['update:modelValue']);
</script>