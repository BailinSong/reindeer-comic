<template>
<div style="height: 100%;width: 100%" id="drag">
  <v-container flex>
    <v-row class="text-center">
      <v-col sm="6" md="4" lg="3" xl="2" v-for="book in books" :key="book.path">
        <v-card
          class="mx-auto"
          max-width="300"
          hover
          rounded
        >
          <div @click="open(book.path)">
            <v-img
                class="white--text align-end"
                height="300px"
                :src="book.src+'?cache=true'"
                aspect-ratio="0.71"
                contain

            >
            </v-img>

            <v-card-subtitle > </v-card-subtitle>

            <v-card-text >
              {{ book.title }}
            </v-card-text>
          </div>


          <v-card-actions>
               <v-btn color="orange" text @click="deleteBook(book)" > 删除 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</div>
</template>

<script>



export default {
  name: "Library",

  data: () => ({
    books: [],
  }),

  mounted() {
    this.$vuetify.dark=true
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

      ipcRenderer.send("writedb",bookList);
    });
    ipcRenderer.send("readdb");
  },
  methods: {
    open(path) {
      console.log(path);
      this.$emit("openBook-event", path);
    },
    deleteBook(path){
      let deleteIndex=this.books.indexOf(path)
      this.books.splice(deleteIndex,1)

      const { ipcRenderer } = require("electron")
      ipcRenderer.send("writedb",this.books)
    }
  },
};
</script>
