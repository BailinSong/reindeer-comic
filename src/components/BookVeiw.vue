<template>
  <v-container @mousewheel.ctrl="handleZoom" @keydown.ctrl="lockX">
    <v-row no-gutters  ref="viewContainer" >
      <v-col cols="12" align="center" v-for="file in files" :key="file" >
        <v-img
          style="display: flex; justify-content: space-around;filter:  contrast(100%) blur(0.5px) brightness(100%) saturate(100%)"
          flex
          :src="file"
          contain
          :width="width"
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
      scrollToE:{},
      ptimestamp:0
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

  methods: {
    handleZoom(evt){
      evt = evt || window.event
      if (!evt) evt = window.event
      if (evt.stopPropagation) { // 这是取消冒泡,阻止浏览器滚动事件
        evt.stopPropagation()
      } else {
        evt.cancelBubble = true
      }
      if (evt.preventDefault) { // 这是取消默认行为，要弄清楚取消默认行为和冒泡不是一回事
        evt.preventDefault()
      } else {
        evt.returnValue = false
      }
      let delta = 0

      if (evt.wheelDelta) {
        delta = evt.wheelDelta / 120
        if (window.opera) delta = -delta
      } else if (evt.detail) {
        delta = -evt.detail / 3
      }
      let end=this.width*(1+0.05*delta)
      let maxWidth=this.$refs.viewContainer.clientWidth
      this.width=(end<200)?200:(end>=maxWidth)?maxWidth:end

      let now=new Date().getTime();
      if (now - this.ptimestamp > 5000) {
        this.ptimestamp=now;
        this.scrollToE=evt.target;
      }

      this.$vuetify.goTo(this.scrollToE, {
          duration: 500,
          offset: 0
      })
      // window.scrollTo(this.getScrollTop()*(1+0.05*delta),0);
    }
  },
};
</script>
