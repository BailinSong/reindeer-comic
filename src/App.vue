<template>
  <v-app>
    <v-main v-scroll="onScroll">
      <Library
        @openBook-event="openBookVeiw"
        v-show="showLibrary"
      ></Library>
      <BookVeiw :bookPath="bookPath" v-if="showBookVeiw"></BookVeiw>
    </v-main>
  </v-app>
</template>

<script>
import BookVeiw from "./components/BookVeiw.vue";
import Library from "./components/Library.vue";
export default {
  name: "App",
  components: { Library, BookVeiw },
  data() {
    return {
      bookPath: "",
      openBook: false,
      offset: 0,
    };
  },
  computed: {
    showLibrary() {
      if (!this.openBook) {
        this.$vuetify.goTo(this.offset, {
          duration: 300,
          offset: 0,
          easing: "easeInOutCubic",
        });
      }

      return !this.openBook;
    },
    showBookVeiw() {
      return this.openBook;
    },
  },
  mounted() {
    document.onkeyup = (event) => {
      event.key;
      console.log(event.key);
      if (event.key == "Escape") {
        console.log("UP:" + event.key);

        this.openBook = false;
      }

      if (event.ctrlKey && event.key == "t")
        this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    };
  },

  methods: {
    openBookVeiw(bookPath) {
      console.log("openbook:" + bookPath);

      this.bookPath = bookPath;
      this.openBook = true;
    },
    onScroll() {
      if (this.showLibrary) {
        this.offset = document.documentElement.scrollTop;
      }
    },
  },
};
</script>
