const main = require('./main.js');
/**
 * 参数1：起始页
 * 参数2:终止页
 * 参数3：帖子路径
 * 参数4：评论路径
 * 参数5 请求的代理服务器的页数 默认为 1
 */

let arguments = process.argv.splice(2);


let pageStart = arguments[0] || 1;
let pageEnd = arguments[1] || 1;
let mainPath = arguments[2] || './data/main.xlsx';
let commentPath = arguments[3] || './data/comment.xlsx';
let hostPageNum = arguments[4] || 1;

main(pageStart, pageEnd,mainPath,commentPath,hostPageNum)
.then(res => {
    console.log('操作完成');
    console.log(`共写入帖子${res.successMain}个`);
    console.log(`共写入评论${res.successComment}条`);
})
.catch(e => {
    console.log('操作失败');
    console.error(e);
})