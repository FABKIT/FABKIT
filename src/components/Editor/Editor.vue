<template>
  <div v-if="editor" class="border rounded-md p-1 border-white min-h-10">
    <div class="pb-1 border-b border-b-white flex flex-wrap gap-1">
      <div class="isolate inline-flex rounded-md shadow-xs dark:shadow-none">
        <button
            :class="{ 'button-primary-active': editor.isActive('bold') }"
            class="relative inline-flex items-center rounded-l-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().toggleBold().run()"
        >
          <span class="sr-only">Toggle Bold</span>
          <BoldIcon aria-hidden="true" class="size-5"/>
        </button>
        <button
            :class="{ 'button-primary-active': editor.isActive('italic') }"
            class="relative inline-flex items-center button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().toggleItalic().run()"
        >
          <span class="sr-only">Toggle Italic</span>
          <ItalicIcon aria-hidden="true" class="size-5"/>
        </button>
        <button
            :class="{ 'button-primary-active': editor.isActive('underline') }"
            class="relative inline-flex items-center rounded-r-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().toggleUnderline().run()"
        >
          <span class="sr-only">Toggle Underline</span>
          <UnderlineIcon aria-hidden="true" class="size-5"/>
        </button>
      </div>
      <div class="isolate inline-flex rounded-md shadow-xs dark:shadow-none">
        <button
            :class="{ 'button-primary-active': editor.isActive('bulletList') }"
            class="relative inline-flex items-center rounded-l-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().toggleBulletList().run()"
        >
          <span class="sr-only">Toggle bullet list</span>
          <ListBulletIcon aria-hidden="true" class="size-5"/>
        </button>
        <button
            :class="{ 'button-primary-active': editor.isActive('orderedList') }"
            class="relative inline-flex items-center rounded-r-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <span class="sr-only">Toggle ordered list</span>
          <NumberedListIcon aria-hidden="true" class="size-5"/>
        </button>
      </div>
      <div class="isolate inline-flex rounded-md shadow-xs dark:shadow-none">
        <button
            :class="{ 'button-primary-active': editor.isActive({ textAlign: 'left' }) }"
            class="relative inline-flex items-center rounded-l-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <span class="sr-only">Left</span>
          <Bars3BottomLeftIcon aria-hidden="true" class="size-5"/>
        </button>
        <button
            :class="{ 'button-primary-active': editor.isActive({ textAlign: 'center' }) }"
            class="relative inline-flex items-center rounded-r-md button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <span class="sr-only">Center</span>
          <Bars3BottomCenterIcon aria-hidden="true" class="size-5"/>
        </button>
      </div>
      <div class="isolate inline-flex rounded-md shadow-xs dark:shadow-none">
        <button
            v-for="(emoji, index) in customEmojis"
            :class="{
              'rounded-l-md': index === 0,
              'rounded-r-md': index === customEmojis.length - 1,
            }"
            class="relative inline-flex items-center button-primary px-2 py-2 focus:z-10"
            type="button"
            @click="editor.chain().focus().setEmoji(emoji.name).run()"
        >
          <span class="sr-only">Add {{ emoji.name }} icon</span>
          <img v-if="emoji.fallbackImage" :src="emoji.fallbackImage" aria-hidden="true" :alt="emoji.name" class="size-5"/>
        </button>
      </div>
    </div>
    <editor-content :editor="editor"/>
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
    // A unique name of the emoji which will be stored as attribute
    name: 'cost',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['cost'],
    // A list of tags that can help for searching emojis
    tags: ['cost'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_cost.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'power',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['power'],
    // A list of tags that can help for searching emojis
    tags: ['power'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_pwr.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'defense',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['defense'],
    // A list of tags that can help for searching emojis
    tags: ['defense'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_def.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'life',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['life'],
    // A list of tags that can help for searching emojis
    tags: ['life'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_hp.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'intellect',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['intellect'],
    // A list of tags that can help for searching emojis
    tags: ['intellect'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_int.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'tap',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['tap'],
    // A list of tags that can help for searching emojis
    tags: ['tap'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_t.svg',
  },
  {
    // A unique name of the emoji which will be stored as attribute
    name: 'untap',
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: ['untap'],
    // A list of tags that can help for searching emojis
    tags: ['untap'],
    // A name that can help to group emojis
    group: 'General',
    // The image to be rendered
    fallbackImage: '/img/symbols/icon_u.svg',
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
      // HTML
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
        StarterKit,
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
        // HTML
        this.$emit('update:modelValue', this.editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
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
/* Basic editor styles */
.tiptap {
  // Emoji extension styles
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

  /* Override default bold behavior */
  strong, b {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  /* Ensure strong inside a paragraph is styled correctly */
  p strong, p b {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  /* Handle cases where editor uses spans with inline styles */
  span[style*="font-weight: bold"],
  span[style*="font-weight: bolder"] {
    font-family: 'palatino_lt_stdmedium', serif !important;
    font-weight: normal !important;
  }

  :first-child {
    margin-top: 0;
  }
}
</style>