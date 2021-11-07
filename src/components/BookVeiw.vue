<template>
  <v-container>
    book veiw
    <v-row no-gutters>
      <v-col cols="12" v-for="file in files" :key="file">
        <v-img
          style="display: flex; justify-content: space-around"
          flex
          :src="file"
          contain
          aspect-ratio="0.71"
          max-height="1080"
        ></v-img>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "BookVeiw",
  props: {
    bookPath: String,
  },
  data() {
    return {
      files: [],
      width: 500,
    };
  },
  computed: {},
  mounted() {
    const { ipcRenderer } = require("electron");

    console.log(this.files);

    let fileList = this.files;
    ipcRenderer.on("readfs-reply", (event, arg) => {
      fileList.slice(0, 0);
      arg.forEach((element) => {
        fileList.push(element);
      });
    });
    ipcRenderer.send("readfs", this.bookPath);
  },

  methods: {},
};
</script>
