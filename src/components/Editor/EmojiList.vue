<template>
  <div class="dropdown-menu divide-y divide-gray-200 rounded-md bg-white dark:bg-dark shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-hidden">
    <button
        v-for="(item, index) in items"
        :key="index"
        :class="{
          'bg-primary text-white': index === selectedIndex,
          'rounded-t-md': index === 0,
          'rounded-b-md': index === items.length - 1,
        }"
        class="px-2 py-1 flex align-center items-center gap-1 w-full"
        @click="selectItem(index)"
    >
      <img v-if="item.fallbackImage" :src="item.fallbackImage" align="absmiddle"/>
      <template v-else>
        {{ item.emoji }}
      </template>
      :{{ item.name }}:
    </button>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
    command: {
      type: Function,
      required: true,
    },

    editor: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      selectedIndex: 0,
    }
  },
  watch: {
    items() {
      this.selectedIndex = 0
    },
  },
  methods: {
    onKeyDown({event}) {
      if (event.key === 'ArrowUp') {
        this.upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        this.downHandler()
        return true
      }

      if (event.key === 'Enter') {
        this.enterHandler()
        return true
      }

      return false
    },

    upHandler() {
      this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length
    },

    downHandler() {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length
    },

    enterHandler() {
      this.selectItem(this.selectedIndex)
    },

    selectItem(index) {
      const item = this.items[index]

      if (item) {
        this.command({name: item.name})
      }
    },
  },
}
</script>

<style lang="scss">
/* Dropdown menu */
.dropdown-menu {
  button {
    img {
      height: 1em;
      width: 1em;
    }
  }
}
</style>