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
    <main class="sm:pt-8 lg:pt-10 lg:pl-72 bg-white dark:bg-dark min-h-screen">
      <RouterView></RouterView>
      <Footer class="print:hidden"></Footer>
    </main>
  </div>
</template>
