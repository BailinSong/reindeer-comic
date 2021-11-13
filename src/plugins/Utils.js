const Utils = {
  deBounce(fn, delay){
    
    let space=new Object
    space.timer={}
    space.callback=function(){
  
      const args = Array.prototype.map.call(arguments, val => val);

      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        typeof fn === 'function' && fn.apply(null, args);
        clearTimeout(this.timer);
      }, delay > 0 ? delay : 100);
    }
    return space.callback;
  }
}


export default Utils
