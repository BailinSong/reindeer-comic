<template>
  <v-container id="drag">
    <v-row class="text-center">
      <v-col sm="6" md="4" lg="3" xl="2" v-for="book in books" :key="book.key">
        <v-card
          class="mx-auto"
          max-width="300"
          @click="open(book.path)"
          hover
          rounded
        >
          <v-img
            class="white--text align-end"
            height="300px"
            :src="book.src"
            aspect-ratio="0.71"
            contain
          >
          </v-img>

          <v-card-subtitle class="pb-0"> </v-card-subtitle>

          <v-card-text class="text--primary">
            {{ book.title }}
          </v-card-text>

          <!-- <v-card-actions>
            <v-btn color="orange" text > 打开 </v-btn>

            <v-btn color="orange" text> 删除 </v-btn>
          </v-card-actions> -->
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "Library",

  data: () => ({
    books: [],
  }),

  mounted() {
    const { ipcRenderer } = require("electron");
    let wrapper = document.getElementById("drag");
    wrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        var files = [];
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
          console.log(event.dataTransfer.files[i]);
          files.push(event.dataTransfer.files[i].path);
        }
        ipcRenderer.send("addBooks", files);
       
      }
    });

    wrapper.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    let bookList = this.books;
    ipcRenderer.on("readdb-reply", (event, arg) => {
      console.log("readdb-reply" + arg);

      bookList.slice(0, 0);
      arg.forEach((element) => {
        bookList.push(element);
      });
    });
    ipcRenderer.on("addBooks-reply", (event, arg) => {
      console.log("addBooks-reply" + arg);
      arg.forEach((element) => {
        bookList.push(element);
      });

      ipcRenderer.send("writedb");
    });
    ipcRenderer.send("readdb");
  },
  methods: {
    open(path) {
      console.log(path);
      this.$emit("openBook-event", path);
    },
  },
};
</script>
