<script setup>
import {ref, onMounted, onUnmounted} from 'vue'
import {ChevronLeftIcon, ChevronRightIcon, StarIcon} from '@heroicons/vue/24/solid'

const artist = {
  name: 'Artist name',
  collection: 'Collection Title',
  description: `
        <p class="text-primary/80 dark:text-white/80 leading-relaxed">
          Winner of our Custom Card Contest hosted on the <a href="https://discord.gg/fabdb" target="_blank" class="text-primary dark:text-white underline hover:no-underline">Flesh and Blood TCG Discord</a>! These stunning cards showcase the incredible creativity possible with FABKIT's card creator.
        </p>

        <p class="text-primary/80 dark:text-white/80 leading-relaxed">
          [Add 1-2 more sentences about the artist's style, their inspiration, or what makes their cards special]
        </p>

        <div class="pt-2">

          <a href="https://discord.gg/4twcdby9xp"
          target="_blank"
          class="inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-white hover:underline"
          >
          Join our Discord to participate in future contests
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
          </a>
        </div>`,
  images: [
    '/src/assets/featuredartist/Featured_Artist_1.png',
    '/src/assets/featuredartist/Featured_Artist_2.png',
    '/src/assets/featuredartist/Featured_Artist_3.png',
    '/src/assets/featuredartist/Featured_Artist_4.png',
    '/src/assets/featuredartist/Featured_Artist_5.png',
    '/src/assets/featuredartist/Featured_Artist_6.png',
    '/src/assets/featuredartist/Featured_Artist_7.png',
  ],
};

const currentSlide = ref(0)
let intervalId = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % artist.images.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + artist.images.length) % artist.images.length
}

const goToSlide = (index) => {
  currentSlide.value = index
}

onMounted(() => {
  // Auto-advance slides every 4 seconds
  intervalId = setInterval(nextSlide, 4000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

</script>

<template>
  <div class="rounded-lg shadow-lg border-2 border-primary/20 overflow-hidden max-w-[1600px] mx-auto backdrop-blur-sm bg-white/20 dark:bg-dark/50">
    <div class="flex flex-col xl:flex-row gap-6 lg:gap-8 p-6 items-start">
      <!-- Left side: Image slideshow with header on mobile/tablet -->
      <div class="flex flex-col gap-4 w-full xl:w-auto">
        <!-- Featured Artist header - shows above card on mobile/tablet -->
        <div class="xl:hidden space-y-2 text-center">
          <div class="inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-white">
            <StarIcon class="w-5 h-5"/>
            <span>Featured Artist</span>
          </div>
          <h3 class="text-2xl font-bold text-primary dark:text-white">
            {{ artist.name }}
          </h3>
          <p class="text-sm text-primary/70 dark:text-white/70 italic">
            "{{ artist.collection }}"
          </p>
        </div>

        <div class="flex items-center gap-3 justify-center">
          <!-- Left Arrow -->
          <button
            aria-label="Previous slide"
            class="flex-shrink-0 bg-white dark:bg-dark p-2 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-primary/20"
            @click="prevSlide"
          >
            <ChevronLeftIcon class="w-6 h-6 text-primary"/>
          </button>

          <div class="relative w-full max-w-[450px] lg:w-[450px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-450/628">
            <div class="relative w-full h-full">
              <transition-group name="fade">
                <img
                  v-for="(image, index) in artist.images"
                  v-show="currentSlide === index"
                  :key="index"
                  :alt="`Custom card ${index + 1}`"
                  :src="image"
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </transition-group>
            </div>
          </div>

          <button
            aria-label="Next slide"
            class="flex-shrink-0 bg-white dark:bg-dark p-2 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-primary/20"
            @click="nextSlide"
          >
            <ChevronRightIcon class="w-6 h-6 text-primary"/>
          </button>
        </div>

        <div class="flex justify-center gap-2">
          <button
            v-for="index in artist.images.keys()"
            :key="`dot-${index}`"
            :aria-label="`Go to slide ${index + 1}`"
            :class="[
              'w-2 h-2 rounded-full transition-all',
              currentSlide === index
                ? 'bg-primary w-6'
                : 'bg-gray-400 hover:bg-gray-500'
            ]"
            @click="goToSlide(index)"
          />
        </div>
      </div>
      <div class="flex flex-col justify-center space-y-4 xl:flex-1 xl:min-w-0">
        <div class="hidden xl:block space-y-2">
          <div class="inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span>Featured Artist</span>
          </div>
          <h3 class="text-2xl font-bold text-primary dark:text-white">
            {{ artist.name }}
          </h3>
          <p class="text-sm text-primary/70 dark:text-white/70 italic">
            "{{ artist.collection }}"
          </p>
        </div>
        <div v-html="artist.description"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
