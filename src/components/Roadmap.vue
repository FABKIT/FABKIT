<script setup>
import { ref, computed } from 'vue'
import { ClockIcon, LightBulbIcon } from '@heroicons/vue/24/outline'
import { currentWorkItems as currentWorkData, futurePlans as futurePlansData } from '../config/roadmapData.js'
import '../css/roadmap.css'

const currentWorkItems = ref(currentWorkData)
const futurePlans = ref(futurePlansData)

// Priority sorting function
const sortByPriorityAndTitle = (items) => {
  const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 }

  return [...items].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // If priorities are equal, sort alphabetically by title
    return a.title.localeCompare(b.title)
  })
}

// Computed properties for sorted lists
const sortedCurrentWorkItems = computed(() => sortByPriorityAndTitle(currentWorkItems.value))
const sortedFuturePlans = computed(() => sortByPriorityAndTitle(futurePlans.value))


const getStatusColor = (status) => {
  switch(status) {
    case 'completed': return 'text-white bg-primary border-primary'
    case 'in-progress': return 'text-white bg-secondary border-secondary'
    case 'planned': return 'text-white bg-tertiary border-tertiary'
    case 'idea': return 'text-idea bg-idea-light border-idea-light'
    default: return 'text-white bg-primary border-primary'
  }
}

const getPriorityColor = (priority) => {
  switch(priority) {
    case 'high': return 'bg-secondary-dark text-secondary-light border-secondary-light'
    case 'medium': return 'bg-tertiary-dark text-tertiary-light border-tertiary-light'
    case 'low': return 'bg-primary-dark text-primary-light border-primary-light'
    default: return 'bg-primary-dark text-primary-light border-primary-light'
  }
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-dark">
    <!-- Header -->
    <div class="bg-white dark:bg-dark border-b border-primary/20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="py-8">
          <h1 class="text-3xl font-bold text-primary dark:text-white">Development Roadmap</h1>
          <p class="mt-2 text-primary/70 dark:text-white/70">
            Track our progress and see what's coming next for FABKIT
          </p>
        </div>
      </div>
    </div>

    <!-- Timeline Animation - Insert this between the header and main content -->
    <div class="relative overflow-hidden bg-primary/5 dark:bg-primary/10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div class="relative">
      <div class="timeline-animation">
        <div class="timeline-container">
          <svg class="timeline-path" viewBox="0 0 800 80" xmlns="http://www.w3.org/2000/svg">
            <!-- Visible sine wave -->
            <path class="sine-wave"
                  d="M0,40 C44.4,40 44.4,20 88.9,20 C133.3,20 133.3,40 177.8,40 C222.2,40 222.2,60 266.7,60 C311.1,60 311.1,40 355.6,40 C400,40 400,20 444.4,20 C488.9,20 488.9,40 533.3,40 C577.8,40 577.8,60 622.2,60 C666.7,60 666.7,40 711.1,40 C755.6,40 755.6,20 800,20"
                  id="sine-path" />

            <!-- Invisible path above the sine wave for the circle to follow -->
            <path d="M0,32 C44.4,32 44.4,12 88.9,12 C133.3,12 133.3,32 177.8,32 C222.2,32 222.2,52 266.7,52 C311.1,52 311.1,32 355.6,32 C400,32 400,12 444.4,12 C488.9,12 488.9,32 533.3,32 C577.8,32 577.8,52 622.2,52 C666.7,52 666.7,32 711.1,32 C755.6,32 755.6,12 800,12"
                  id="circle-path" fill="none" stroke="none" />

            <!-- Circle that follows the path above the wave -->
            <circle class="timeline-dot" r="6">
              <animateMotion dur="4s" begin="3s" repeatCount="indefinite">
                <mpath href="#circle-path"/>
              </animateMotion>
            </circle>
          </svg>
        </div>
      </div>
        </div>
      </div>
    </div>
    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Top row: Two main boards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Currently Working On Board -->
        <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
          <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
            <h2 class="text-xl font-semibold text-primary dark:text-white flex items-center gap-2">
              <ClockIcon class="h-5 w-5" />
              Currently Working On
            </h2>
            <p class="text-sm text-primary/70 dark:text-white/70 mt-1">
              Active development tasks and recently completed features
            </p>
          </div>
          <div class="p-6 space-y-4">
            <div
                v-for="(item, index) in sortedCurrentWorkItems"
                :key="index"
                class="border border-primary/20 rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 bg-white dark:bg-dark"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <component
                        :is="item.icon"
                        class="h-4 w-4 text-primary"
                    />
                    <h3 class="font-medium text-white dark:text-white">{{ item.title }}</h3>
                  </div>
                  <p class="text-sm text-white/80 dark:text-white/80 mb-3">{{ item.description }}</p>
                  <div class="flex items-center gap-2">
                <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                    :class="getStatusColor(item.status)"
                >
                  {{ item.status.replace('-', ' ') }}
                </span>
                    <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                        :class="getPriorityColor(item.priority)"
                    >
                  {{ item.priority }} priority
                </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Future Plans Board -->
        <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
          <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
            <h2 class="text-xl font-semibold text-primary dark:text-white flex items-center gap-2">
              <LightBulbIcon class="h-5 w-5" />
              Future Plans & Ideas
            </h2>
            <p class="text-sm text-primary/70 dark:text-white/70 mt-1">
              Planned features and ideas we're considering for future development
            </p>
          </div>
          <div class="p-6 space-y-4">
            <div
                v-for="(item, index) in sortedFuturePlans"
                :key="index"
                class="border border-primary/20 rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 bg-white dark:bg-dark"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <component
                        :is="item.icon"
                        class="h-4 w-4 text-primary"
                    />
                    <h3 class="font-medium text-white dark:text-white">{{ item.title }}</h3>
                  </div>
                  <p class="text-sm text-white/80 dark:text-white/80 mb-3">{{ item.description }}</p>
                  <div class="flex items-center gap-2">
                <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                    :class="getStatusColor(item.status)"
                >
                  {{ item.status }}
                </span>
                    <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                        :class="getPriorityColor(item.priority)"
                    >
                  {{ item.priority }} priority
                </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row: Support sections stacked vertically, full width -->
      <div class="space-y-8">
        <!-- Buy Me a Coffee Section -->
        <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
          <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
            <h2 class="text-xl font-semibold text-primary dark:text-white">
              Support FABKIT
            </h2>
            <p class="text-sm text-primary/70 dark:text-white/70 mt-1">
              Help us keep building awesome features
            </p>
          </div>
          <div class="p-6">
            <!-- Embedded Buy Me a Coffee iframe -->
            <iframe id='kofiframe' src='https://ko-fi.com/fabkit/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='575' title='fabkit'></iframe>
          </div>
        </div>

        <!-- Suggestions Section -->
        <div class="bg-primary/10 dark:bg-primary/15 rounded-lg p-6 border border-primary/20">
          <h3 class="text-lg font-semibold text-primary dark:text-white mb-2">
            Have suggestions or feedback?
          </h3>
          <p class="text-primary/70 dark:text-white/70 mb-4">
            We'd love to hear from you! Let us know what features you'd like to see.
          </p>
          <router-link
              :to="{name: 'contact'}"
              class="inline-flex items-center px-4 py-2 border-2 border-primary text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors duration-200"
          >
            Get in Touch
          </router-link>
        </div>
      </div>
    </div>
    </div>
</template>