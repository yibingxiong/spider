var request = require('superagent');
var cheerio = require('cheerio');

require('superagent-proxy')(request)

let accesIps = [];
let pageCount = 0;

for (let curpage = 1; curpage < 11; curpage++) {
    (function(curpage){
        request.get('http://www.xicidaili.com/nn/' + curpage)
        .set({
            'Content-Type': 'text/html; charset=utf-8',
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
        })
        .end((err, res) => {
            pageCount++;
            if(pageCount === 10) {
                console.log(accesIps);
                return;
            }
            if (err) {
                console.log(err);
                console.log('err');
            } else {
                let $ = cheerio.load(res.text);
                let trs = $('tr');      // 一页里边所有的行
                let count = 0;
                for (let line = 1; line < trs.length; line++) {
                    let td = $(trs[line]).children('td');
                    let ip = td[1].children[0].data;
                    let port = td[2].children[0].data;
                    let proxyHost = `http://${ip}:${port}`;

                    try {
                        //代理IP请求，设置超时为3000ms，返回正确即当可用
                        var testip = request.get('http://cnodejs.org/topic/5203a71844e76d216a727d2e')
                            .proxy(proxyHost)
                            .timeout(3000)
                            .end((err, res) => {
                                count++;
                                if (!err) {
                                    accesIps.push(proxyHost);
                                }
                                if (count === trs.length - 1) {       // 第一行没有要
                                    
                                }
                            });
                    } catch (error) {
                        console.log(error);
                        count++;
                    }
                }
            }
        })
    })(curpage);
}
