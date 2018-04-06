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

/**
 *  生成1 - up 之间含1含up的n个不重复随机数
 *  @param {number} 上限
 *  @param {number} 个数
 */
const getRandomN = function(up, n) {
    let set = new Set();

    if(n >= up) {
        for(let i = 1; i <= up; i++) {
            set.add(i);
        }
    }else {
        while(set.size < n) {
            set.add(getRandom(up));
        }
    }

    let res = [...set];
    res.sort((v1, v2) => { return v1 - v2; });
    return res;
}
module.exports =  {
    delay,
    getRandom,
    levelClassToLevel,
    getRandomN
}