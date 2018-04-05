/**
 * 查找可用的代理服务器
 */
const request = require('superagent');
require('superagent-proxy')(request);
const cheerio = require('cheerio');
const util =  require('./util.js');
const config = require('./config.js');
const uaList = config.uaList;
const uaListLen = uaList.length;
const testHost = config.testHost;
const testHostLen = testHost.length;

let accesIps = [];          // 有效的代理服务器
const ONEPAGEDELAY = 1000;  // 请求一页后的延迟时间
const TIMEOUT = 2000;        // 通过代理服务器请求有效响应时间，超出则认为是无效的
const ONETESTDELAY = 0;   // 测试完一台代理服务器后的延迟
let testNum = 0;           // 测试的proxy host数量
let accessNum = 0;          // 可用的服务台数
async function getProxy(stpage,endpage) {
    console.info('正在获取可用的代理服务，请稍后...');
    for(let i = stpage; i <= endpage; i++ ) {
        try {
            let pageRes = await  request.get('http://www.xicidaili.com/nn/' + i)
            .set({
                    'Content-Type': 'text/html; charset=utf-8',
                    'User-Agent': uaList[util.getRandom(uaListLen-1)]
                });
            let $ = cheerio.load(pageRes.text);
            let trs = $('tr');
            let trLen = trs.length;
            for(let line  = 1; line < trLen; line++) {
                let td = $(trs[line]).children('td');
                let ip = td[1].children[0].data;
                let port = td[2].children[0].data;
                let proxyHost = `http://${ip}:${port}`;
                testNum++;

                try { 
                    let testRes = await request.get(testHost[util.getRandom(testHostLen-1)])
                    .proxy(proxyHost)
                    .set({
                        'Content-Type': 'text/html; charset=utf-8',
                        'User-Agent': uaList[util.getRandom(uaListLen-1)]
                    })
                    .timeout(TIMEOUT);
                    accessNum++;
                    console.log(`测试第${testNum}个:${proxyHost}可用`);
                    accesIps.push(proxyHost);
                    await util.delay(ONETESTDELAY);
                }catch(err) {
                    console.log(`测试第${testNum}个:${proxyHost}失败`);
                }
            }
            await util.delay(ONEPAGEDELAY);
        }catch(e) {
            console.log(e);
        }
    }

    return {accessNum,proxyHostList:accesIps};
}
module.exports = getProxy;
