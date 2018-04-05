// 加入babel来启动
require("babel-core/register");
require("./awaittest.js");
require("babel-core").transform("code", {
    plugins: ["transform-runtime"]
});