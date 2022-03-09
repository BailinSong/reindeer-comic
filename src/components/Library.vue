<template>
  <div style="height: 100%; width: 100%">
    <v-app-bar app>
      <v-combobox

          v-model="chips"
          :items="items"
          clearable
          dense
          hide-details
          hide-no-data
          hide-selected
          multiple
          prepend-icon="mdi-magnify"
          single-line
          small-chips
      >
        <template v-slot:selection="{ attrs, item, select, selected }">
          <v-chip
              :color="getColor(item)"
              :input-value="selected"
              close
              small
              v-bind="attrs"
              @click="select"
              @click:close="remove(item)"
          >
            <strong>{{ item }}</strong>
          </v-chip>
        </template>
      </v-combobox>
    </v-app-bar>

    <div id="drag" style="height: 100%; width: 100%">
      <v-container flex>
        <v-row class="text-center">
          <v-col
              v-for="book in showBooks"
              v-show="find(book)"
              :key="book._id"
              lg="3"
              md="4"
              sm="6"
              xl="2"
          >
            <v-card class="mx-auto" hover max-width="300" rounded>
              <div @click="open(book.path)">
                <v-img
                    :src="book.src + '?cache=true'"
                    aspect-ratio="0.71"
                    class="white--text align-end"
                    contain
                    height="300px"
                >
                </v-img>

                <v-card-title dense>
                  {{ book.title }}
                </v-card-title>
              </div>
              <v-card-subtitle>
                <v-combobox

                    v-model="book.tags"
                    dense
                    hide-details
                    hide-no-data
                    hide-selected
                    label="Tag"
                    multiple
                    small-chips
                    @change="save(book)"

                >
                  <template
                      v-slot:selection="{ attrs, item, select, selected }"
                  >
                    <v-chip
                        :color="getColor(item)"
                        :input-value="selected"
                        close
                        small
                        v-bind="attrs"
                        @click="select&chips.push(item)"
                        @click:close="removeTag(book,item)"

                    >
                      <strong>{{ item }}</strong>
                    </v-chip>
                  </template>
                </v-combobox>
              </v-card-subtitle>
              <v-card-actions align-self="center">
                <v-btn color="orange" text @click="deleteBook(book)">
                  <v-icon>mdi-delete</v-icon>
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

import {ipcRenderer} from "electron";

export default {
  name: "Library",
  data: () => ({
    books: [],
    addBookList: [],
    search: "",
    chips: [],
    items: [],
  }),
  // watch: {
  //   chips: {
  //     handler(newValue, oldvalue) {
  //       console.log(newValue + ":" + oldvalue);
  //     },
  //   },
  // },
  destroyed() {
    console.log("library destroyed:" + this.bookPath);
  },
  mounted() {
    console.log("library mounted:" + this.bookPath);

    this.$vuetify.dark = true;
    // const {ipcRenderer} = require("electron");

    let wrapper = document.getElementById("drag");

    wrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {

        for (let i = 0; i < event.dataTransfer.files.length; i++) {
          ipcRenderer.send("addBooks", [event.dataTransfer.files[i].path]);
        }
      }
    });

    wrapper.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    let bookList = this.books;

    ipcRenderer.on("readBooks-reply", (event, arg) => {
      // console.log("readdb-reply" + arg);

      bookList.slice(0, bookList.length);
      arg.forEach((element) => {
        bookList.push(element);
        this.items.push(element.title);
      });

      // $vuetify.goTo(target, options)
    });

    let finshAddBook = this.deBounce(() => {
      console.log("begin this.addBookList.length:" + this.addBookList.length);

      this.addBookList.forEach((element) => {
        console.log('add book'+element.title)
        this.books.push(element);
        this.items.push(element.title);
      });
      this.addBookList=this.addBookList.slice(0, -1);
      console.log("end this.addBookList.length:" + this.addBookList.length);
    }, 1000);

    ipcRenderer.on("addBooks-reply", (event, arg) => {
      // arg.forEach((element) => {
      this.addBookList.push(arg);
      // });
      // ipcRenderer.send("writedb", bookList);
      finshAddBook();
    });

    ipcRenderer.send("readBooks");
  },

  computed: {
    showBooks() {
      console.log(this.books.length);
      return this.books;
    },
    find() {
      return function (book) {
        let match = true;
        this.chips.forEach((chip) => {
          if (book.tags) {
            console.log(book.tags.indexOf(chip));
          }
          if (
              book.title.toLowerCase().indexOf(chip.toLowerCase()) < 0 &&
              (!book.tags || book.tags.indexOf(chip) < 0)
          ) {
            match = false;
          }
        });
        return match;
      };
    },
  },
  methods: {
    open(path) {
      // console.log(path);
      this.$emit("openBook-event", path);
    },
    deleteBook(book) {
      let deleteIndex = this.books.indexOf(book);
      this.books.splice(deleteIndex, 1);
      ipcRenderer.send("deleteBook", book);
    },
    deBounce(fn, delay) {
      let space = {};
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
    }, removeTag(book, item) {
      book.tags.splice(book.tags.indexOf(item), 1);
      book.tags = [...book.tags];
      ipcRenderer.send("updateBook", book);
    },
    getColor(str) {
      var hash = 0,
          i,
          chr,
          len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }

      let color = "FFFFFF" + hash.toString(16);
      color = "#" + color.substring(color.length - 6);
      console.log(color);
      return color;
    }, save(book) {
      ipcRenderer.send("updateBook", book);
    }
  },
};
</script>
