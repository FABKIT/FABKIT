<script>
import Menu from "./components/Menu.vue";
import Footer from "./components/Footer.vue";

export default {
  components: {Footer, Menu}
}
</script>

<template>
  <div>
    <Menu class="print:hidden"></Menu>
    <main class="p-1 sm:p-6 sm:pt-8 lg:pt-10 lg:pl-72 bg-white dark:bg-dark min-h-screen">
      <div class="sm:px-6 lg:px-8">
        <RouterView></RouterView>
      </div>
      <Footer class="print:hidden"></Footer>
    </main>
  </div>
</template>
