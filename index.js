var http=require('http'); 
var cheerio = require('cheerio') 
var xlsx = require('node-xlsx'); 
var fs = require('fs'); 
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var worksheet = workbook.addWorksheet('小米论坛帖子')
var worksheet2 = workbook.addWorksheet('评论')
worksheet.columns = [
  {header: '帖子id', key: 'id'},
  { header: '标题', key: 'title'},
  { header: '发布时间', key: 'time'},
  { header: '评论数', key: 'commentsnum'},
  { header: '浏览量', key:'readnum'}
];
var pagestart = 1;
var pageend = 2;
var total = 0;
var curpage = 1;    // 当前处理的帖子列表页码
var listBaseUrl = 'http://bbs.xiaomi.cn/d-';

function getPageData() {
  try{
    http.get(listBaseUrl+curpage, function(req, res) {
      var html='';
      req.on('data',function(data){  
          html+=data;
      });  
      req.on('end',function(){
        var $ = cheerio.load(html);
        var titlelistArr = [];
        $(".theme_list .title a.title_name").each(function(i, elem){
          titlelistArr.push($(this))
        }) 
        var tt = 0;
        var len = titlelistArr.length;
        writeData();
        function writeData() {
          var href = titlelistArr[tt].attr('href');
          saveData(href);
          tt++;
          if(tt==len) {
            curpage++;
            if(curpage>pageend) {
              return;
            }else{
              getPageData();
            }
          }else{
            writeData();
          }
        }
        
      }); 
    })
}catch(e){

}
}

function saveData(url) {
  try{
    http.get(url, function(req, res){
      var html='';
      req.on('data',function(data){  
          html+=data;
      }); 
      req.on('end',function() {
        var $2 = cheerio.load(html);
        var id = url.split('/t-')[1];
        var title = $2('.invitation span.name').text().trim();
        var time = $2('.invitation span.time').text().trim();
        var commentsnum = $2($2('.invitation span.f_r')[0]).text().trim();
        var readnum = $2($2('.invitation span.f_r')[1]).text().trim();
        // var record = `标题：${title}   发布时间：${time}   阅读数：${readnum}   评论数：${commentsnum}\r\n`;
        // console.log(title)
        // var data = [['111','4334']];
        // var buffer = xlsx.build([{name: "小米论坛数据", data: data}]);
        // fs.appendFileSync('./data.xlsx', buffer,'utf8');
        // workbook.xlsx.readFile('./data.xlsx')
        // .then(function() {
        //   worksheet = workbook.getWorksheet('小米');
        var r = [];
        r[0] = id;
        r[1] = title;
        r[2] = time;
        r[3] = commentsnum;
        r[4] = readnum;
        worksheet.addRow(r);
        workbook.xlsx.writeFile('./data.xlsx')
        .then(function() {
        });
        total++;
        console.log(`生成${total}个记录`);
      })
    });}catch(e) {
      
    }
}

getPageData();
