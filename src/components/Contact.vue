<template>
  <div class="min-h-screen bg-white dark:bg-dark">
    <!-- Header -->
    <div class="bg-white dark:bg-dark border-b border-primary/20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="py-8">
          <h1 class="text-3xl font-bold text-primary dark:text-white">Contact us</h1>
          <p class="mt-2 text-primary/70 dark:text-white/70">
            Give your feedback on FABKIT
          </p>
        </div>
      </div>
    </div>

    <div class="relative overflow-hidden bg-primary/5 dark:bg-primary/10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div class="flex justify-center items-center py-1">
          <div
              ref="lottieContainer"
              class="w-24 h-24"
          ></div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div class="space-y-8">
          <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
            <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
              <h2 class="text-xl font-semibold text-primary dark:text-white">
                Get in Touch
              </h2>
              <p class="text-sm text-primary/70 dark:text-white/70 mt-1">
                Connect with us through these platforms
              </p>
            </div>
            <div class="p-6 space-y-4">
              <a
                  href="https://github.com/FABKIT/FABKIT"
                  target="_blank"
                  class="flex items-center gap-4 p-4 border-2 border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-primary dark:text-white">GitHub Repository</h3>
                  <p class="text-sm text-primary/70 dark:text-white/70">Report issues, contribute code, or check our latest updates</p>
                </div>
              </a>

              <a
                  href="https://discord.gg/4twcdby9xp"
                  target="_blank"
                  class="flex items-center gap-4 p-4 border-2 border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-primary dark:text-white">Discord Community</h3>
                  <p class="text-sm text-primary/70 dark:text-white/70">Join our server for support, discussions and showing off your custom cards!</p>
                </div>
              </a>
            </div>
          </div>

          <!-- About Section -->
          <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
            <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
              <h2 class="text-xl font-semibold text-primary dark:text-white">
                About FABKIT
              </h2>
            </div>
            <div class="p-6">
              <p class="text-primary/80 dark:text-white/80 leading-relaxed mb-4">
                Our goal is simple: creating high-quality tools that the Flesh and Blood TCG community actually wants to use. As passionate FaB players ourselves, we saw opportunities to build something meaningful for fellow enthusiasts.
              </p>
              <p class="text-primary/80 dark:text-white/80 leading-relaxed mb-4">
                Our flagship tool, the Custom Card Creator, reflects our commitment to authenticity. We've invested considerable effort into making custom cards that look as close to real Flesh and Blood cards as possible – complete with official fonts, proper symbols, and meticulously crafted templates. The result? Custom cards that genuinely feel like they belong in the FaB universe.
              </p>
              <p class="text-primary/80 dark:text-white/80 leading-relaxed mb-4">
                We believe great tools should be accessible to everyone, which is why FABKIT runs entirely in your browser without requiring downloads. Our commitment to the community extends to making the platform open source, allowing players to contribute and help shape our future.
              </p>
              <p class="text-primary/80 dark:text-white/80 leading-relaxed">
                This project is a labor of love that we develop in our spare time, driven purely by our passion for the game and a desire to contribute to this amazing community. We're not sponsored or backed by anyone – just some friends who wanted to build something awesome for fellow players. Any  <a href="https://ko-fi.com/fabkit" style="color:#A6864A; text-decoration:underline;">support</a>  helps us dedicate more time to bringing new features to life and keeping everything free for the community.
              </p>
            </div>
          </div>
        </div>

        <!-- Right Section: Our Team -->
        <div class="bg-white dark:bg-dark rounded-lg shadow-lg border-2 border-primary/20">
          <div class="px-6 py-4 border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
            <h2 class="text-xl font-semibold text-primary dark:text-white">
              Our Team
            </h2>
            <p class="text-sm text-primary/70 dark:text-white/70 mt-1">
              The people behind FABKIT
            </p>
          </div>
          <div class="p-6 space-y-6">
            <!-- Team Member 1 -->
            <div class="bg-primary/5 dark:bg-primary/10 rounded-lg p-6 border border-primary/20">
              <div class="flex items-center gap-6">
                <div class="w-24 h-24 flex items-center justify-center relative">
                  <img src="../../public/img/Thencros.svg"/>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-primary dark:text-white">@Thencros</h3>
                  <p class="text-primary/70 dark:text-white/70">UI/UX Designer, Creative Director</p>
                  <p class="text-sm text-primary/60 dark:text-white/60 mt-1">Product concept, graphic design & UI development</p>
                </div>
              </div>
              <div class="mt-3 text-right">
                <p class="text-xs text-primary/40 dark:text-white/40">Avatar by Diana Johanna Velasquez</p>
              </div>
            </div>

            <!-- Team Member 2 -->
            <div class="bg-primary/5 dark:bg-primary/10 rounded-lg p-6 border border-primary/20">
              <div class="flex items-center gap-6">
                <div class="w-24 h-24 flex items-center justify-center relative">
                  <img src="../../public/img/Lambstream.svg"/>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-primary dark:text-white">@Lambstream</h3>
                  <p class="text-primary/70 dark:text-white/70">Lead Developer</p>
                  <p class="text-sm text-primary/60 dark:text-white/60 mt-1">Frontend development & application architecture</p>
                </div>
              </div>
              <div class="mt-3 text-right">
                <p class="text-xs text-primary/40 dark:text-white/40">Avatar by Diana Johanna Velasquez</p>
              </div>
            </div>

            <!-- Optional: Add more team members here -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import lottie from 'lottie-web'
import animationData from '../assets/mailanimation.json'

export default {
  name: 'Contact',
  data() {
    return {
      animation: null
    }
  },
  mounted() {
    this.loadAnimation()
  },
  beforeUnmount() {
    if (this.animation) {
      this.animation.destroy()
    }
  },
  methods: {
    loadAnimation() {
      try {
        this.animation = lottie.loadAnimation({
          container: this.$refs.lottieContainer,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animationData
        })

        // Speed up the animation (2x faster)
        this.animation.setSpeed(0.5)

      } catch (error) {
        console.error('Failed to load animation:', error)
      }
    }
  }
}
</script>