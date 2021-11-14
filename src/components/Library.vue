<template>
  <div>
    <!-- <v-app-bar app>
      <v-combobox
        v-model="chips"
        :items="items"
        chips
        clearable
        label="搜索"
        multiple
        solo
      >
        <template v-slot:selection="{ attrs, item, select, selected }">
          <v-chip
            v-bind="attrs"
            :input-value="selected"
            close
            @click="select"
            @click:close="remove(item)"
          >
            <strong>{{ item }}</strong>
          </v-chip>
        </template>
      </v-combobox>
    </v-app-bar> -->

    <div style="height: 100%; width: 100%" id="drag">
      <v-container flex>
        <v-row class="text-center">
          <v-col
            sm="6"
            md="4"
            lg="3"
            xl="2"
            v-for="book in showBooks"
            :key="book.path"
            v-show="find(book)"
          >
            <v-card class="mx-auto" max-width="300" hover rounded>
              <div @click="open(book.path)">
                <v-img
                  class="white--text align-end"
                  height="300px"
                  :src="book.src + '?cache=true'"
                  aspect-ratio="0.71"
                  contain
                >
                </v-img>

                <v-card-subtitle> </v-card-subtitle>

                <v-card-text>
                  {{ book.title }}
                </v-card-text>
              </div>

              <v-card-actions>
                <v-btn color="orange" text @click="deleteBook(book)">
                  删除
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
export default {
  name: "Library",
  data: () => ({
    books: [],
    addBookList: [],
    search: "",
    chips: [],
    items: [],
  }),
  destroyed() {
    console.log("library destroyed:" + this.bookPath);
  },
  mounted() {
    console.log("library mounted:" + this.bookPath);

    this.$vuetify.dark = true;
    const { ipcRenderer } = require("electron");

    let wrapper = document.getElementById("drag");

    wrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        // var files = [];
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
          // console.log(event.dataTransfer.files[i]);
          // files.push(event.dataTransfer.files[i].path);
          ipcRenderer.send("addBooks", [event.dataTransfer.files[i].path]);
        }
      }
    });

    wrapper.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    let bookList = this.books;

    ipcRenderer.on("readdb-reply", (event, arg) => {
      // console.log("readdb-reply" + arg);

      bookList.slice(0, bookList.length);
      arg.forEach((element) => {
        bookList.push(element);
      });

      // $vuetify.goTo(target, options)
    });

    let finshAddBook = this.deBounce(() => {
      console.log("this.addBookList.length:" + this.addBookList.length);

      this.addBookList.forEach((element) => {
        this.books.push(element);
      });
      this.addBookList.slice(0, -1);
      ipcRenderer.send("writedb", this.books);
    }, 1000);

    ipcRenderer.on("addBooks-reply", (event, arg) => {
      // arg.forEach((element) => {
      this.addBookList.push(arg);
      // });
      // ipcRenderer.send("writedb", bookList);
      finshAddBook();
    });

    ipcRenderer.send("readdb");
  },

  computed: {
    showBooks() {
      console.log(this.books.length);
      return this.books;
    },
    find(){
      return function (book){
        let match = true;
        this.chips.forEach(chip=> {
          if (book.Path.indexOf(chip) < 0) {
            match = false;
          }
        })
        console.log(match)
        return match
      }
    },
  },
  methods: {
    open(path) {
      // console.log(path);
      this.$emit("openBook-event", path);
    },
    deleteBook(path) {
      let deleteIndex = this.books.indexOf(path);
      this.books.splice(deleteIndex, 1);

      const { ipcRenderer } = require("electron");
      ipcRenderer.send("writedb", this.books);
    },
    deBounce(fn, delay) {
      let space = new Object();
      space.timer = {};
      space.callback = function () {
        const args = Array.prototype.map.call(arguments, (val) => val);

        if (space.timer) {
          clearTimeout(space.timer);
        }
        space.timer = setTimeout(
          () => {
            typeof fn === "function" && fn.apply(null, args);
            clearTimeout(space.timer);
          },
          delay > 0 ? delay : 100
        );
      };
      return space.callback;
    },
    remove(item) {
      this.chips.splice(this.chips.indexOf(item), 1);
      this.chips = [...this.chips];
    },
  },
};
</script>
