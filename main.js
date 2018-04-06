const request = require('superagent');
const cheerio = require('cheerio')
const fs = require('fs');
const Excel = require('exceljs');

const util = require('./util.js');
const config = require('./config.js');
const getProxy = require('./getProxy.js');  // 代理服务器获取
const uaList = config.uaList;     // userAgent列表
const uaListLen = uaList.length;  // userAgent个数


const RETRY_NUM = 5;              // 重试次数
let START_PAGE_NUM = 1;         // 起始页码
let END_PAGE_NUM = 1;          // 终止页码

const MainPageUrl = 'http://bbs.xiaomi.cn/d-';  // 主贴子列表页
const DetailPageUrl = 'http://bbs.xiaomi.cn/t-###-$$$-o1#comment_top'; // 帖子详情页url

const TIMEOUT = 2000;   // 每次请求响应最大延迟
let proxyList = [];  // 可用的代理服务器列表
let proxyListLen = 0; // 可用代理服务器的个数
const DETAIL_DELAY = 0; // 请求完一个详情页延时
const IO_DELAY = 10;   // 每次io操作延时
const IO_ERROR_DELAY = 1000;  // io出错等待时间
const COMMENT_LIST_ERROR_UP_DELAY = 1000 * 60 * 8; // 请求评论列表页出错次数达到上限
const COMMENT_LIST_ERROR_DELAY = 1000;    // 请求评论列表页出错
const DETAIL_ERROR_DELAY = 1000;  // 请求一个帖子列表页出错了
let successMain = 0;       // 写入车成功的帖子数
let successComment = 0;   // 成功写入评论数

let commentPath;    // 评论数据保存位置
let dataPath;       // 帖子数据保存位置
const mainPageWorkBook = new Excel.Workbook();
const commentWorkBook = new Excel.Workbook();
const mainPage = mainPageWorkBook.addWorksheet('小米论坛帖子');
const commentPage = commentWorkBook.addWorksheet('小米论坛评论');

require('superagent-proxy')(request);

async function main(pageStart, pageEnd, mainPath, commentPath1,hostpageStart,hostpageEnd) {
  START_PAGE_NUM = pageStart;
  END_PAGE_NUM = pageEnd;
  commentPath = commentPath1;
  dataPath = mainPath;
  // 帖子表头
  mainPage.columns = [
    { header: '帖子id', key: 'id' },
    { header: '标题', key: 'title' },
    { header: '发布时间', key: 'time' },
    { header: '评论数', key: 'commentsnum' },
    { header: '浏览量', key: 'readnum' },
    { header: '版块', key: 'catename'},
    { header: 'url', key: 'url'}
  ];
  // 评论表头
  commentPage.columns = [
    { header: '帖子id', key: 'id'},
    { header: '用户名', key: 'username'},
    { header: '等级', key: 'level'},
    { header: '发表时间', key: 'pubtime' },
    { header: '评论内容', key: 'content' },
    { header: '楼层', key: 'floor'}
  ];

  for (let i = 0; i < RETRY_NUM; i++) {
    try {
      let pro = await getProxy(hostpageStart,hostpageEnd);
      proxyList = pro.proxyHostList;
      console.log(`代理服务查找完毕,共${pro.accessNum}台可用`);
      if(config.localProxy) { proxyList.push(config.localProxy); }
      proxyListLen = proxyList.length;
      break;
    } catch(err) {}
  }
  for(let curPageNum = START_PAGE_NUM ; curPageNum <= END_PAGE_NUM; ++curPageNum) {
    for (let i = 0; i < RETRY_NUM; i++) {
      try {
        let mainPageRes = await request.get(`${MainPageUrl}${curPageNum}`)
        .proxy(proxyList[util.getRandom(proxyListLen-1)])
        .set({
            'Content-Type': 'text/html; charset=utf-8',
            'User-Agent': uaList[util.getRandom(uaListLen-1)]
        })
        .timeout(TIMEOUT);
        let $MainPage = cheerio.load(mainPageRes.text);
        let titlelistArr = [];    // 一页列表的所有title

        $MainPage(".theme_list .title a.title_name").each(function (i, elem) {
          titlelistArr.push($MainPage(this));
        });

        for(let curTitleIndex = 0; curTitleIndex < titlelistArr.length; curTitleIndex++) {
          let detailUrl = titlelistArr[curTitleIndex].attr('href');   // 某条帖子的详情url
          let mainId = detailUrl.split('/t-')[1];      // 帖子id
          try {
            let requestDetailPageRes = await requestDetailPage(detailUrl);
          }catch(e2) {
            console.log('err3')
            console.error(e2);
          }
          
        }
        break;
      } catch(err) {
        // 请求完一个帖子列表页
        await util.delay(DETAIL_ERROR_DELAY);
        if(i >= RETRY_NUM -1 ) { // 达到了最大重试次数，还出错
            console.error(`第${curPageNum}个帖子列表页出错`);
        }
      }
    }
    console.log(`第${curPageNum}页帖子完成！`);
  }
  return {successMain, successComment};
}

// 请求详情页并保存帖子数据
async function requestDetailPage(href) {
  let mainId = href.split('/t-')[1];      // 帖子id
  for (let i = 0; i < RETRY_NUM; i++) {
    try {
      let detailPageRes = await request.get(href)
        .proxy(proxyList[util.getRandom(proxyListLen - 1)])
        .set({
          'Content-Type': 'text/html; charset=utf-8',
          'User-Agent': uaList[util.getRandom(uaListLen - 1)]
        })
        .timeout(TIMEOUT);

        let $2 = cheerio.load(detailPageRes.text);
        let title = $2('.invitation span.name').text().trim();  // 帖子标题
        let time = $2('.invitation span.time').text().trim();   // 发表时间
        let commentsnum = $2($2('.invitation span.f_r')[0]).text().trim();  // 评论量
        let readnum = $2($2('.invitation span.f_r')[1]).text().trim();    // 阅读量
        let catename = $2('.container_wrap .invitation .txt .name').text().trim(); // 版块
        // 评论列表的页数
        let commentPageTotal = $2($2('.paging_widget_2 .last').children()[0]).attr('href').split('-')[2];
        try{
          commentPageTotal = parseInt(commentPageTotal, 10);
        }catch(e5) {
          console.error(e5);
          commentPageTotal = 10;
        }
        let r = [];   // 一行数据，表一个帖子
        r[0] = mainId;
        r[1] = title;
        r[2] = time;
        r[3] = commentsnum;
        r[4] = readnum;
        r[5] = catename;
        r[6] = href;
        mainPage.addRow(r);
        for(let j = 0; j < RETRY_NUM; j++) {
          try {
            let writeRes = await mainPageWorkBook.xlsx.writeFile(dataPath);
            successMain++;
            console.log(`帖子${successMain}--${mainId}写入成功`);
            break;
          }catch(err) {
            if(j >= RETRY_NUM - 1) {
              console.error(`写入帖子id为${mainId}出错了`);
              throw new Error(err);
            }
          }
      }


      // 写评论
      try {
        await writeComment(commentPageTotal, mainId);
        console.log(`帖子${mainId}的全部评论全部完成`);

      }catch(e7) {
        console.error(e7);
      }
      break; 
    }catch(e) {
      if(i >= RETRY_NUM - 1) {
        await util.delay(1000 * 60);   // 多等等
        console.error(`请求id为${mainId}的帖子详情出错`);
        throw new Error(e);
      }
    }
}

}
/**
 * 
 * @param {int} commentPageTotal 评论列表总页数
 * @param {string} mainId 帖子id
 */
async function writeComment(commentPageTotal, mainId) {
  commentPageTotal = commentPageTotal > 200? 200:commentPageTotal;
  for(let curCommentPageNum = 1; curCommentPageNum <= commentPageTotal; curCommentPageNum++) {
    let rows  = [];     // 一页评论 20条
    for(let i = 0; i < RETRY_NUM; i++) {
      try {
        let comentUrl = DetailPageUrl.replace('###',mainId).replace('$$$', curCommentPageNum)
        let commentPageRes = await request.get(comentUrl)
        .proxy(proxyList[util.getRandom(proxyListLen-1)])
        .set({
            'Content-Type': 'text/html; charset=utf-8',
            'User-Agent': uaList[util.getRandom(uaListLen-1)]
        })
        .timeout(TIMEOUT);

        let $ = cheerio.load(commentPageRes.text);
        let replyList = $('.reply_list').children();
        let replyListLen = replyList.length;

        for(let j = 0; j < replyListLen; j++) {
          let reply = replyList[j];
          let $3 = cheerio.load(reply);
          let username = $3('.auth_name').text().trim();
          
          let pubtime = $3($3('.time')[1]).text().trim();
          let content = $3('.reply_txt').text().trim();
          let floor = $3('.reply_list_float').text().trim();
          let vip = $3('.vip_icon');
          let level = util.levelClassToLevel(vip);
          let r = [];
          r[0] = mainId;
          r[1] = username;
          r[2] = level;
          r[3] = pubtime;
          r[4] = content;
          r[5] = floor.substring(0,floor.length-1);
          rows.addRow(r);
          
        }
        // 完成一页后写入一次
        for(let k = 0; k < RETRY_NUM; k++) {
            try {
              commentPage.addRows(rows);
              let writeRes = await commentWorkBook.xlsx.writeFile(commentPath);
              successComment+=20;
              console.log(`写评论成功${successComment} - ${mainId}-${curCommentPageNum}`);
              await util.delay(IO_DELAY);     // 读写io台频繁会出错
              break;
            }catch(err) {
              if(k >= RETRY_NUM - 1) {
                console.error(`写评论出错${mainId}-${curCommentPageNum}`);
                await util.delay(IO_ERROR_DELAY);   // 多等等
                throw new Error(err);
              }
            }
        }
        break;
      }catch(e) {
        await util.delay(COMMENT_LIST_ERROR_DELAY);
        if(i >= RETRY_NUM - 1) {      
          console.log(`请求帖子${mainId}的第${curCommentPageNum}页评论列表失败`);
          await util.delay(COMMENT_LIST_ERROR_UP_DELAY);   // 多等等
          throw new Error(e);
        }
      }
      await util.delay(5000);     // 请求完一个评论列表页，一个评论列表页停机5秒
    }
    console.log(`请求帖子${mainId}的第${curCommentPageNum}页评论列表完成`)
  }
}



module.exports = main;