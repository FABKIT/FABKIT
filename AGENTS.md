# AI Development Guidelines for FABKIT

This document provides guidelines for AI agents working on the FABKIT project to ensure consistent, high-quality contributions while maintaining project standards and conventions.

## Project Overview

FABKIT is a Vue.js-based canvas/design tool built with:
- **Frontend**: Vue 3 + TypeScript + Vite
- **Styling**: Tailwind CSS + SCSS
- **Canvas**: Konva.js + Vue-Konva
- **Rich Text**: TipTap editor
- **UI Components**: Headless UI + Heroicons

## Code Standards

### File Structure and Naming
- Use kebab-case for file names: `my-component.vue`, `utility-functions.ts`
- Vue components should be PascalCase in imports: `MyComponent`
- Follow Vue 3 Composition API patterns with `<script setup>`

### Code Style
- Use TypeScript for all new JavaScript code
- Follow Vue 3 style guide and best practices
- Use Tailwind CSS classes for styling
- Custom styles should be written in SCSS
- Run `npm run lint` before committing (stylelint for SCSS)

### Vue Component Guidelines
```vue
<script setup lang="ts">
// Imports first
import { ref, computed } from 'vue'
import MyComponent from './MyComponent.vue'

// Props definition
interface Props {
  title: string
  isVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true
})

// Emits definition
const emit = defineEmits<{
  close: []
  update: [value: string]
}>()

// Reactive state
const isOpen = ref(false)

// Computed properties
const displayTitle = computed(() => props.title.toUpperCase())

// Methods
const handleClick = () => {
  emit('close')
}
</script>

<template>
  <div class="component-container">
    <!-- Use semantic HTML -->
    <!-- Apply Tailwind classes consistently -->
  </div>
</template>

<style lang="scss" scoped>
// Component-specific styles only when Tailwind is insufficient
.component-container {
  // Use SCSS features when needed
}
</style>
```

## Key Dependencies and Usage

### Canvas Operations (Konva.js)
- Use `vue-konva` components: `v-stage`, `v-layer`, `v-rect`, etc.
- Handle canvas events through Vue event handlers
- Maintain canvas state in Vue reactive references

### Rich Text Editor (TipTap)
- Configured extensions: Bold, Italic, Strike, Underline, Lists, Text Align
- Use TipTap's Vue 3 integration for editor instances
- Follow TipTap patterns for custom extensions

### UI Components
- Prefer Headless UI components for accessibility
- Use Heroicons for consistent iconography
- Implement responsive design with Tailwind breakpoints

## Development Workflow

### Before Making Changes
1. Understand the existing code structure and patterns
2. Check for similar implementations in the codebase
3. Ensure changes align with Vue 3 and TypeScript best practices
4. Consider performance implications for canvas operations

### Testing and Quality
- Test canvas interactions thoroughly
- Verify responsive behavior across device sizes
- Ensure accessibility standards are maintained
- Run linting: `npm run lint`
- Test build process: `npm run build`

### File Organization
```
src/
├── components/        # Reusable Vue components
├── views/            # Page-level components
├── composables/      # Vue composition functions
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── styles/          # Global SCSS styles
└── assets/          # Static assets
```

## Common Patterns

### State Management
- Use Vue 3 Composition API with `ref()` and `reactive()`
- Create composables for shared logic
- Avoid global state unless necessary

### Canvas State
- Keep canvas objects in reactive references
- Use Vue's reactivity for canvas updates
- Implement proper cleanup in `onUnmounted()`

### Component Communication
- Use props for parent-to-child data flow
- Use emits for child-to-parent communication
- Consider provide/inject for deep component trees

## Styling Guidelines

### Tailwind CSS
- Use utility classes for layout, spacing, and basic styling
- Prefer responsive utilities: `md:text-lg`, `lg:grid-cols-3`
- Use consistent color palette from Tailwind config

### SCSS
- Use SCSS only when Tailwind is insufficient
- Follow BEM methodology for custom CSS classes
- Scope styles properly with `scoped` attribute

## Performance Considerations

### Canvas Performance
- Minimize canvas redraws
- Use object pooling for frequently created/destroyed objects
- Implement efficient event handling for large numbers of objects

### Vue Performance
- Use `v-memo` for expensive list rendering
- Implement proper key attributes for `v-for`
- Consider `shallowRef()` for large objects that don't need deep reactivity

## Security Guidelines

- Sanitize user inputs, especially in rich text editor
- Validate file uploads and canvas data
- Follow secure coding practices for any server interactions

## AI Agent Specific Notes

### Code Generation
- Always check existing patterns before creating new ones
- Maintain consistency with current TypeScript interfaces
- Use proper Vue 3 Composition API patterns
- Include appropriate type annotations

### File Modifications
- Read existing files to understand current patterns
- Preserve existing code style and formatting
- Add comments only when complex logic requires explanation
- Update related files when making architectural changes

### Testing Changes
- Test canvas functionality after modifications
- Verify responsive design works correctly
- Ensure no TypeScript compilation errors
- Run linting to catch style issues

## Questions and Clarifications

When uncertain about implementation details:
1. Check similar components in the codebase
2. Refer to Vue 3, TipTap, or Konva documentation
3. Ask for clarification on project-specific patterns
4. Propose solutions with alternatives when unsure

Remember: Consistency with existing patterns is more important than perfect adherence to external standards.