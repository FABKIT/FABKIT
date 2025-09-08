<script setup>
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
import { CheckIcon } from '@heroicons/vue/20/solid'

const props = defineProps({
  modelValue: String,
  label: String,
  inputId: String,
  placeholder: { type: String, default: 'None' },
  options: { type: Array, required: true },
  allowCustom: { type: Boolean, default: true },
  show: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const query = ref('')
const comboboxButtonRef = ref(null)

const updateValue = (value) => {
  emit('update:modelValue', value)
}

const handleInputFocus = () => {
  if (comboboxButtonRef.value) {
    comboboxButtonRef.value.$el?.click()
  }
}

const filteredOptions = computed(() => {
  if (!query.value) {
    return props.options
  }
  return props.options.filter((option) =>
      option.label.toLowerCase().includes(query.value.toLowerCase())
  )
})
</script>

<template>
  <div v-if="show">
    <label
        :for="inputId"
        class="block text-sm/6 font-medium text-primary dark:text-white"
    >
      {{ label }}
    </label>
    <div class="mt-2 grid grid-cols-1">
      <Combobox :model-value="modelValue" @update:model-value="updateValue" nullable>
        <div class="relative">
          <ComboboxInput
              :id="inputId"
              :display-value="(value) => value || ''"
              :placeholder="placeholder"
              @change="query = $event.target.value"
              @focus="handleInputFocus"
              class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
          />
          <ComboboxButton
              ref="comboboxButtonRef"
              class="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <!-- Empty button for opening dropdown -->
          </ComboboxButton>
          <ComboboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <ComboboxOption
                v-for="option in filteredOptions"
                :key="option.value"
                :value="option.value"
                v-slot="{ selected, active }"
            >
              <li :class="[
                'relative cursor-default select-none py-2 pl-3 pr-9',
                active ? 'bg-primary text-white' : 'text-primary dark:text-white'
              ]">
                <span :class="[
                  'block truncate',
                  selected ? 'font-semibold' : 'font-normal'
                ]">
                  {{ option.label }}
                </span>
                <span
                    v-if="selected"
                    :class="[
                    'absolute inset-y-0 right-0 flex items-center pr-4',
                    active ? 'text-white' : 'text-primary'
                  ]"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
            <!-- Custom option -->
            <ComboboxOption
                v-if="allowCustom && query && !options.some(opt => opt.label.toLowerCase() === query.toLowerCase())"
                :key="'custom-' + query"
                :value="query"
                v-slot="{ selected, active }"
            >
              <li :class="[
                'relative cursor-default select-none py-2 pl-3 pr-9',
                active ? 'bg-primary text-white' : 'text-primary dark:text-white'
              ]">
                <span :class="[
                  'block truncate',
                  selected ? 'font-semibold' : 'font-normal'
                ]">
                  Custom: "{{ query }}"
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  </div>
</template>