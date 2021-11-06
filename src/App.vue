<template>
  <v-app>
    <v-main>
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
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",

  data() {
    return {
      files: [],
      cPath: "",
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
    ipcRenderer.send("readfs", this.cPath);
  },

  methods: {},
};
</script>
