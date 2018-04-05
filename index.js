var http = require('http');
var cheerio = require('cheerio')
var xlsx = require('node-xlsx');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var worksheet = workbook.addWorksheet('小米论坛帖子')
var worksheet2 = workbook.addWorksheet('评论')

worksheet.columns = [
  { header: '帖子id', key: 'id' },
  { header: '标题', key: 'title' },
  { header: '发布时间', key: 'time' },
  { header: '评论数', key: 'commentsnum' },
  { header: '浏览量', key: 'readnum' }
];
var pagestart = 1;
var pageend = 10;
var total = 0;
var curpage = 1;    // 当前处理的帖子列表页码
var listBaseUrl = 'http://bbs.xiaomi.cn/d-';  // 主贴子列表页

function getManiList() {
  if (curpage > pageend) {
    console.log('完成');
    return;
  }
  try {
    http.get(listBaseUrl + curpage, function (req, res) {
      var html = '';
      req.on('data', function (data) {
        html += data;
      });
      req.on('end', function () {
        var $ = cheerio.load(html);
        var titlelistArr = [];

        $(".theme_list .title a.title_name").each(function (i, elem) {
          titlelistArr.push($(this))
        })
        console.log(titlelistArr[0].attr('href'));
        (function (i, len, count, callback) {
          for (; i < len; ++i) {
            (function (i) {
              var href = titlelistArr[i].attr('href');
              var id = href.split('/t-')[1];
              saveMainTiezi(href, (err) => {
                total++;
                if (!err) {
                  console.log(`生成第${total}条主贴子`);
                } else {
                  console.error(err);
                  console.log(`第${total}条主贴子出错，id = ${id}`);
                }
                count++;
                if (count === len) {
                  callback();
                }
              })
            })(i);
          }
        })(0, titlelistArr.length, 0, () => {
          curpage++;
          getManiList();
        })
      });
    })
  } catch (e) {

  }
}

function saveMainTiezi(url, callback) {
  let isRes = false;
  function saveMain(t) {
    try {
      http.get(url, function (req, res) {
        var html = '';
        req.on('data', function (data) {
          isRes = true;
          html += data;
        });
        req.on('end', function () {
          var $2 = cheerio.load(html);
          var id = url.split('/t-')[1];
          var title = $2('.invitation span.name').text().trim();
          var time = $2('.invitation span.time').text().trim();
          var commentsnum = $2($2('.invitation span.f_r')[0]).text().trim();
          var readnum = $2($2('.invitation span.f_r')[1]).text().trim();
          var r = [];
          r[0] = id;
          r[1] = title;
          r[2] = time;
          r[3] = commentsnum;
          r[4] = readnum;
          worksheet.addRow(r);
          workbook.xlsx.writeFile('./data.xlsx')
            .then(() => {
              return callback();
            })
            .catch((err) => {
              if(t<4) {
                saveMain(t++);
              }else {
                return callback(err);
              }
            });

        })
      });
    } catch (e) {
      if(t<4) {
        saveMain(t++);
      }else {
        return callback(e);
      }
    }
  }
  setTimeout(() => {
    saveMain(0);
  }, 10000);
 

  setTimeout(() => {
    console.error('请求超时');
    return callback(new Error('请求超时'));
  }, 100000);
}

getManiList();
