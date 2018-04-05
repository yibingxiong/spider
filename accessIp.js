var request = require('http');
var cheerio = require('cheerio');
//require('superagent-proxy')(request);
let ips = [];
// var res = request.get('http://www.xicidaili.com/nn/' + page);
// console.log(res.text)
try{
(async function () {  
  for(var page = 1; page <= 10; page++){    
    //请求代理IP页面
    try{
        var res = await http.get('http://www.xicidaili.com/'); 
    }catch(e) {
        console.log(e);
    }
       
    var $ = cheerio.load(res.text);   
    console.log(res.text) 
    var tr = $('tr');    
    //从第二行开始获取IP和端口
    // for(var line = 1 ; line < tr.length ; line++ ){      
    //   var td = $(tr[line]).children('td');      
    //   var proxy =  'http://' + td[1].children[0].data + ':' + td[2].children[0].data;     
    //   try {        
    //     //代理IP请求，设置超时为3000ms，返回正确即当可用
    //     var testip = await request.get('http://ip.chinaz.com/getip.aspx').proxy(proxy).timeout(3000);  
    //     if(testip.statusCode == 200 && testip.text.substring(0,4) == '{ip:' ){  
    //       //存入数据库
    //       ips.push({proxy: proxy});        
    //     }
    //   }catch (error){      
    //   }    
    // }  
  }
})();
}catch(e) {
    console.log(e);
}
console.log(ips);
