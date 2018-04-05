const request = require('superagent');
const cheerio = require('cheerio')
const fs = require('fs');
const Excel = require('exceljs');
const mainPageWorkBook = new Excel.Workbook();
const commentWorkBook = new Excel.Workbook();
const mainPage = mainPageWorkBook.addWorksheet('小米论坛帖子');
const commentPage = commentWorkBook.addWorksheet('小米论坛评论');
const util = require('./util.js');
const config = require('./config.js');
const getProxy = require('./getProxy.js');  // 代理服务器获取
const dataPath = './data/main.xlsx'
const uaList = config.uaList;     // userAgent列表
const uaListLen = uaList.length;  // userAgent个数
const RETRY_NUM = 5;              // 重试次数
let curMainPage = 1;
const START_PAGE_NUM = 1;         // 起始页码
const END_PAGE_NUM = 1;          // 终止页码
const MainPageUrl = 'http://bbs.xiaomi.cn/d-';  // 主贴子列表页
const DetailPageUrl = 'http://bbs.xiaomi.cn/t-###-$$$-o1#comment_top'; // 帖子详情页url
const TIMEOUT = 2000;   // 每次请求响应最大延迟
let proxyList = [];  // 可用的代理服务器列表
let proxyListLen = 0; // 可用代理服务器的个数
async function main() {
  // 帖子表头
  mainPage.columns = [
    { header: '帖子id', key: 'id' },
    { header: '标题', key: 'title' },
    { header: '发布时间', key: 'time' },
    { header: '评论数', key: 'commentsnum' },
    { header: '浏览量', key: 'readnum' }
  ];
  // 评论表头
  commentPage.columns = [

  ];

  for (let i = 0; i < RETRY_NUM; i++) {
    try {
      proxyList = await getProxy();
      proxyList.push(config.localProxy);
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
        console.log(mainPageRes.text)
        let $MainPage = cheerio.load(mainPageRes.text);
        let titlelistArr = [];    // 一页列表的所有title

        $MainPage(".theme_list .title a.title_name").each(function (i, elem) {
          titlelistArr.push($MainPage(this));
        });

        for(let curTitleIndex = 0; curTitleIndex < titlelistArr.length; curTitleIndex++) {
          let detailUrl = titlelistArr[curTitleIndex].attr('href');   // 某条帖子的详情url
          console.log(detailUrl)
          let mainId = detailUrl.split('/t-')[1];      // 帖子id
          try {
            let requestDetailPageRes = await requestDetailPage(detailUrl);
            console.log(`帖子${mainId}写入成功`);
          }catch(e2) {
            console.error(e2);
          }
          await util.delay(300);
        }
        break;
      } catch(err) {
        console.error(err);
        if(i === RETRY_NUM -1 ) { // 达到了最大重试次数，还出错
            console.error(`第${curPageNum}个列表页出错`);
        }
      }
      await util.delay(1000);
    }
  }
  
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
        
        
        let r = [];   // 一行数据，表一个帖子
        r[0] = mainId;
        r[1] = title;
        r[2] = time;
        r[3] = commentsnum;
        r[4] = readnum;

        mainPage.addRow(r);
        for(let j = 0; j < RETRY_NUM; j++) {
          try {
            let writeRes = await mainPageWorkBook.xlsx.writeFile(dataPath);
            break;
          }catch(err) {
            console.error(err);
            if(j === RETRY_NUM - 1) {
              console.error(`写入帖子id为${mainId}出错了`);
              throw new Error(err);
            }
          }
      }
      break; 
    }catch(e) {
      console.error(e);
      if(i >= RETRY_NUM - 1) {
        console.error(`请求id为${mainId}的帖子详情出错`);
        throw new Error(e);
      }
    }
}

}

main()
.then(res => {
  console.log(res);
})
.catch(e => {
  console.log(e);
})