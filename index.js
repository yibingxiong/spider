require("babel-core/register");
require("babel-core").transform("code", {
    plugins: ["transform-runtime"]
});


const main = require('./main.js');
/**
 * 参数1：起始页
 * 参数2:终止页
 * 参数3：帖子路径
 * 参数4：评论路径
 * 参数5 请求的代理服务器的起始页 默认为 1
 * 参数6 请求代理服务器的结束页 默认1
 */

let args = process.argv.splice(2);


let pageStart = args[0] || 1;
let pageEnd = args[1] || 1;
let mainPath = args[2] || './data/main.xlsx';
let commentPath = args[3] || './data/comment.xlsx';
let hostpageStart = args[4] || 1;
let hostpageEnd = args[5] || 1;
pageStart = parseInt(pageStart,10);
pageEnd = parseInt(pageEnd,10);
hostpageStart = parseInt(hostpageStart,10);
hostpageEnd = parseInt(hostpageEnd,10);
main(pageStart, pageEnd,mainPath,commentPath,hostpageStart,hostpageEnd)
.then(res => {
    console.log('操作完成');
    console.log(`共写入帖子${res.successMain}个`);
    console.log(`共写入评论${res.successComment}条`);
})
.catch(e => {
    console.log('操作失败');
    console.error(e);
})