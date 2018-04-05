// 延迟
const delay = function (ms) {
    return new Promise((resolve) => {
      setTimeout(() => {resolve()}, ms);
    });
}
// 获取1到up的随机整数,含up
const getRandom = function (up) {
    return Math.ceil(Math.random()*up);
}
module.exports =  {
    delay,
    getRandom,
}