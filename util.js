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
// 等级class转换为等级
const levelClassToLevel = function(node) {
    for(let i = 0; i < 30; i++) {
        if(node.hasClass('vip_icon_m'+i) || node.hasClass('vip_icon_s'+i)){
            return i;
        }
    }
    return 0;
}
module.exports =  {
    delay,
    getRandom,
    levelClassToLevel
}