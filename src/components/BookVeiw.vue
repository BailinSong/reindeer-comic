<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12" v-for="file in files" :key="file">
        <v-img 
          style="display: flex; justify-content: space-around;filter:  contrast(100%) blur(0.5px) brightness(100%) saturate(100%)"
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

    let fileList = this.files;
    ipcRenderer.once("readfs-reply", (event, arg) => {
      fileList.slice(0, -1);
      arg.forEach((element) => {
        fileList.push(element);
      });
    });
    ipcRenderer.send("readfs", this.bookPath);
  },

  methods: {},
};
</script>
