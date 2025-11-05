<template>
  <div v-if="editor" class="border rounded-lg p-3 border-white min-h-12 bg-white dark:bg-[#2A2A2A] shadow-sm">
    <div class="flex flex-wrap gap-2">
      <div class="inline-flex rounded-lg bg-[#2A2A2A]/5 dark:bg-white/5 p-1">
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive('bold'),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive('bold')
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().toggleBold().run()"
        >
          <span class="sr-only">Toggle Bold</span>
          <BoldIcon aria-hidden="true" class="size-4"/>
        </button>
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive('italic'),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive('italic')
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().toggleItalic().run()"
        >
          <span class="sr-only">Toggle Italic</span>
          <ItalicIcon aria-hidden="true" class="size-4"/>
        </button>
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive('underline'),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive('underline')
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().toggleUnderline().run()"
        >
          <span class="sr-only">Toggle Underline</span>
          <UnderlineIcon aria-hidden="true" class="size-4"/>
        </button>
      </div>

      <div class="inline-flex rounded-lg bg-[#2A2A2A]/5 dark:bg-white/5 p-1">
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive('bulletList'),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive('bulletList')
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().toggleBulletList().run()"
        >
          <span class="sr-only">Toggle bullet list</span>
          <ListBulletIcon aria-hidden="true" class="size-4"/>
        </button>
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive('orderedList'),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive('orderedList')
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <span class="sr-only">Toggle ordered list</span>
          <NumberedListIcon aria-hidden="true" class="size-4"/>
        </button>
      </div>

      <div class="inline-flex rounded-lg bg-[#2A2A2A]/5 dark:bg-white/5 p-1">
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive({ textAlign: 'left' }),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive({ textAlign: 'left' })
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <span class="sr-only">Left</span>
          <Bars3BottomLeftIcon aria-hidden="true" class="size-4"/>
        </button>
        <button
            :class="{
              'bg-[#A6864A] text-white shadow-md': editor.isActive({ textAlign: 'center' }),
              'text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20': !editor.isActive({ textAlign: 'center' })
            }"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1"
            type="button"
            @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <span class="sr-only">Center</span>
          <Bars3BottomCenterIcon aria-hidden="true" class="size-4"/>
        </button>
      </div>

      <div class="inline-flex rounded-lg bg-[#2A2A2A]/5 dark:bg-white/5 p-1">
        <button
            v-for="emoji in customEmojis"
            :key="emoji.name"
            class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#A6864A] focus:ring-offset-1 text-[#2A2A2A] dark:text-white hover:bg-[#A6864A]/10 dark:hover:bg-[#A6864A]/20"
            type="button"
            @click="editor.chain().focus().setEmoji(emoji.name).run()"
        >
          <span class="sr-only">Add {{ emoji.name }} icon</span>
          <img v-if="emoji.fallbackImage" :src="emoji.fallbackImage" aria-hidden="true" :alt="emoji.name" class="size-4"/>
        </button>
      </div>
    </div>

    <div class="mt-3 min-h-32 focus-within:ring-1 focus-within:ring-[#A6864A]/50 rounded-md transition-all duration-150">
      <editor-content :editor="editor"/>
    </div>
  </div>
</template>

<script>
import {Editor, EditorContent} from '@tiptap/vue-3'
import StarterKit from "@tiptap/starter-kit";
import {BulletList, ListItem, OrderedList} from "@tiptap/extension-list";
import Bold from "@tiptap/extension-bold";
import {BoldIcon, ListBulletIcon, ItalicIcon, NumberedListIcon, UnderlineIcon, Bars3BottomLeftIcon} from "@heroicons/vue/24/solid/index.js";
import { Bars3BottomCenterIcon } from  "@sidekickicons/vue/24/solid";

import Emoji from "@tiptap/extension-emoji";
import suggestion from "./suggestion.js";
import TextAlign from "@tiptap/extension-text-align";

const customEmojis = [
  {
    name: 'cost',
    shortcodes: ['cost'],
    tags: ['cost'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_cost.svg',
  },
  {
    name: 'power',
    shortcodes: ['power'],
    tags: ['power'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_pwr.svg',
  },
  {
    name: 'defense',
    shortcodes: ['defense'],
    tags: ['defense'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_def.svg',
  },
  {
    name: 'life',
    shortcodes: ['life'],
    tags: ['life'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_hp.svg',
  },
  {
    name: 'intellect',
    shortcodes: ['intellect'],
    tags: ['intellect'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_int.svg',
  },
  {
    name: 'tap',
    shortcodes: ['tap'],
    tags: ['tap'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_t.svg',
  },
  {
    name: 'untap',
    shortcodes: ['untap'],
    tags: ['untap'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_u.svg',
  },
  {
    name: 'chi',
    shortcodes: ['chi'],
    tags: ['chi'],
    group: 'General',
    fallbackImage: '/img/symbols/icon_chi.svg',
  },
]

export default {
  components: {
    EditorContent,
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    ListBulletIcon,
    NumberedListIcon,
    Bars3BottomCenterIcon,
    Bars3BottomLeftIcon,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editor: null,
      customEmojis,
    }
  },
  watch: {
    modelValue(value) {
      const isSame = this.editor.getHTML() === value

      if (isSame) {
        return
      }

      this.editor.commands.setContent(value)
    },
  },

  mounted() {
    this.editor = new Editor({
      extensions: [
        StarterKit.configure({
          bold: false,
          listItem: false,
          orderedList: false,
          bulletList: false,
        }),
        Bold,
        ListItem,
        BulletList.configure({
          HTMLAttributes: {
            class: "list-disc ml-2",
          },
        }),
        OrderedList.configure({
          HTMLAttributes: {
            class: "list-decimal ml-2",
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Emoji.configure({
          HTMLAttributes: {
            class: "fab-icon",
          },
          emojis: customEmojis,
          suggestion,
        })
      ],
      content: this.modelValue,
      onUpdate: () => {
        this.$emit('update:modelValue', this.editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-3 focus:outline-none',
        },
      }
    })
  },

  beforeUnmount() {
    this.editor.destroy()
  },
}
</script>

<style lang="scss">

.tiptap {
  min-height: 8rem;
  cursor: text;
  [data-type='emoji'] {
    img {
      display: inline;
      height: 1em;
      width: 1em;
    }
  }

  font-family: 'palatino_lt_stdroman', serif;

  @media (prefers-color-scheme: light) {
    color: #2A2A2A !important;
  }

  @media (prefers-color-scheme: dark) {
    color: white !important;
  }

  strong, b {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  p strong, p b {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  span[style*="font-weight: bold"],
  span[style*="font-weight: bolder"] {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  :first-child {
    margin-top: 0;
  }
  .fab-icon {
    display: inline-block !important;
    width: 0.9em !important;
    height: 0.9em !important;
    max-width: 0.9em !important;
    max-height: 0.9em !important;
    background-size: 88% !important;
    background-repeat: no-repeat !important;
    background-position: bottom !important;
    vertical-align: 0.05em !important;
    cursor: pointer !important;
    user-select: all !important;
    -webkit-user-select: all !important;
    -moz-user-select: all !important;
    -ms-user-select: all !important;
    pointer-events: none !important;
  }

  // Also target any nested emoji containers
  [data-type='emoji'] .fab-icon {
    display: inline-block !important;
    width: 0.9em !important;
    height: 0.9em !important;
    max-width: 0.9em !important;
    max-height: 0.9em !important;
    vertical-align: 0.05em !important;
  }
}
</style>
