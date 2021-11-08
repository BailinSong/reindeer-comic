<template>
  <v-app>
    <v-main>
      <Library @openBook-event="openBookVeiw" v-if="!this.openBook"></Library>
      <book-veiw :bookPath='bookPath' v-else></book-veiw>
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
    };
  },
  computed: {},
  mounted() {
    document.onkeyup = (event) => {
      event.key;
      console.log(event.key);
      if (event.key == "Escape") {
        console.log("UP:" + event.key);
        this.bookPath = "";
        this.openBook = false;
      }

      if(event.ctrlKey&&event.key=='t')
        this.$vuetify.theme.dark=!this.$vuetify.theme.dark
    };
  },

  methods: {
    openBookVeiw(bookPath) {
      console.log("openbook:" + bookPath);

      this.bookPath = bookPath;
      this.openBook = true;
    },
  },
};
</script>
