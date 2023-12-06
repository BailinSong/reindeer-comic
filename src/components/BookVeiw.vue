<template>

  <v-container @mousewheel.ctrl="handleZoom">
    <div class="floating-div">{{cpage}}/{{total}}</div>
    <v-row no-gutters ref="viewContainer">
      <v-col cols="12" align="center" v-for="(file,index) in files" :key="file">
        <v-img v-intersect="(t,o,i)=>onIntersect(t,o,i,index)" :ref="'image'+index"
            style="display: flex; justify-content: space-around;filter:  contrast(100%) blur(0.0px) brightness(100%) saturate(100%)"
            flex
            :src="file"
            contain
            :width="width"
            min-height="200"
               eager
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
.floating-div {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #5e5e5e;/* 设置背景颜色 */
  padding: 10px;
  border-radius: 5px;
  //color: #ccc; /* 设置文字颜色 */
  z-index: 99;
  mix-blend-mode: difference;
}
</style>

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
      scrollToE: {},
      ptimestamp: 0,
      requestId: [],
      total:0,
      cpage:0,
    };
  },
  computed: {

  },
  beforeDestroy() {
    this.requestId.forEach(e => {
      cancelIdleCallback(e)
    })
  },
  mounted() {
    const {ipcRenderer} = require("electron");

    let fileList = this.files;
    ipcRenderer.once("readfs-reply", (event, arg) => {
      fileList.slice(0, -1);


      const pageProvider = function (pages) {
        const pages_ = pages
        let index = 0;
        return function () {
          return pages_[index++]
        }
      }
      const myPageProvider = pageProvider(arg)
      this.$nextTick(() => {
        arg.forEach(() => {
          this.requestId.push(requestIdleCallback(() => {
            this.$nextTick(() => {
              const page = myPageProvider()
              fileList.push(page)
            })
          }))
        })
      })
      this.total=arg.length

    });
    ipcRenderer.send("readfs", this.bookPath);
  },

  methods: {

    onIntersect(entries, observer, isIntersecting, index) {
      index
      if (isIntersecting) {
        this.cpage=index+1
      }

    },
    handleZoom(evt) {
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
      let end = this.width * (1 + 0.03 * delta)
      let maxWidth = this.$refs.viewContainer.clientWidth
      this.width = (end < 200) ? 200 : (end >= maxWidth) ? maxWidth : end

      let now = new Date().getTime();
      if (now - this.ptimestamp > 5000) {
        this.scrollToE = evt.target;
      }
      this.ptimestamp = now;


      if (this.scrollToE) {

        this.$vuetify.goTo(this.scrollToE, {
              duration: 1000,
              offset: 0
            }
        )
      }


      // let now=new Date().getTime();
      // if (now - this.ptimestamp > 5000) {
      //   // console.info(document.documentElement.scrollTop)
      //   // console.info(document.documentElement.scrollHeight)
      //   this.ptimestamp=now;
      //   this.scrollToE=document.documentElement.scrollTop/document.documentElement.scrollHeight;
      // }
      //
      // window.scrollTo(0,document.documentElement.scrollHeight*this.scrollToE);
    }
  },
};
</script>
