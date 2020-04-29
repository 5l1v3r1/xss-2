<?php if (!isset($_GET['k'])) {exit(0);}?>
<?php include('utils.php'); ?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>xss attack</title>

  <!-- 引入 layui -->
  <link rel="stylesheet" href="./layui/css/layui.css">
  <script src="./layui/layui.all.js"></script>

  <!-- 引入 codemirror 代码编辑器 -->
  <link rel="stylesheet" href="codemirror/lib/codemirror.css"/>
  <link rel="stylesheet" href="codemirror/theme/monokai.css"/>
  <link rel="stylesheet" href="codemirror/addon/lint/lint.css">

  <script src="codemirror/lib/codemirror.js"></script>
  <script src="codemirror/mode/javascript/javascript.js"></script>
  <script src="codemirror/keymap/sublime.js"></script>
  <script src="codemirror/addon/edit/matchbrackets.js"></script>
  <script src="codemirror/addon/edit/closebrackets.js"></script>

  <!-- <script src="/js/layui.all.js"></script> -->
</head>
<body>



<style>
  .CodeMirror {
    /*border: 1px solid #eee;*/

    height: 650px;
  }

</style>
<!-- <style>
li, td, table, th, body, button, ul {
  color: #00FF00;
  background-color: #000000;
}

tr, td{
  border: 2px solid #00FF00;
  /*border-top:1px solid #00FF00;*/
  /*border-color: #00FF00;*/

}

.layui-tab-title, .layui-tab-card, .layui-tab {
  background-color: #000000;
  /*width: 500px;*/
}


</style> -->




<div class="layui-tab layui-tab-card">
  <!-- tab头部 -->
  <ul class="layui-tab-title">
    <li class="layui-this"><i class="layui-icon layui-icon-file"></i></li>
    <li><i class="layui-icon layui-icon-template-1"></i></li>
    <li><i class="layui-icon layui-icon-set"></i></li>
  </ul>

  <div class="layui-tab-content"">
    <!-- 脚本管理tab -->
    <div class="layui-tab-item layui-show">
      <div class="layui-row">
        <div class="layui-col-md4"  >
          <table id="xss-script" lay-filter="filter-add-script"></table>
        </div>
        <div class="layui-col-md8" style="padding: 10px">
          <div>
            <div class="layui-btn-group" style="padding: 8px;padding-top: 0px">
              <!-- 新建 -->
              <button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="xss-script-add">
                <i class="layui-icon layui-icon-add-1"></i>
              </button>
              <!-- 清空 -->
              <button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="xss-script-clear">
                <i class="layui-icon layui-icon-delete"></i>
              </button>
              <!-- 保存代码 -->
              <button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="xss-script-edit">
                <i class="layui-icon layui-icon-edit"></i>
              </button>
              <!-- 上传模块 -->
              <button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="xss-script-upload">
                <i class="layui-icon layui-icon-upload-drag"></i>
              </button>
              <!-- 帮助 -->
              <button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="xss-script-help">
                <i class="layui-icon layui-icon-help"></i>
              </button>
            </div>  

            <textarea id="file-editer"></textarea>

          </div>
          
        </div>
      </div>
      

    </div>

    <!-- database tab content -->
    <div class="layui-tab-item">
      <table id="xss-database" lay-filter="filter-database"></table>
    </div>
    <!-- setting tab content -->
    <div class="layui-tab-item">developing...</div>

  </div>
</div>

<form class="layui-form  layui-form-pane" action="" id='xss-script-add-dialog' style="height: 200px;padding: 30px;display: none">
  <div class="layui-form-item">

    <label class="layui-form-label">type</label>
    <div class="layui-input-block">
      <select name="type" lay-verify="required" id="xss-add-script-select"></select>
    </div>
  </div>

  <div class="layui-form-item">
    <label class="layui-form-label">desc</label>
    <div class="layui-input-block">
      <input type="text" name="desc" autocomplete="off" class="layui-input">
    </div>
  </div>

  <input name="action" type="hidden" value="addScript">
  <!-- <div class="layui-form-item layui-form-text">
    <div class="layui-input-block">
      <textarea name="code" placeholder="your javascript code..." class="layui-textarea"></textarea>
    </div>
  </div> -->

  <!-- 提交按钮 -->
  <div class="layui-form-item">
    <div class="layui-input-block">
      <button class="layui-btn layui-btn-primary" lay-submit lay-filter="xss-script-add-submit">add</button>
    </div>
  </div>

</form>


<script type="text/html" id="add-script-toolbar">
  <i class="layui-icon layui-icon-delete"  lay-event="del">
</script>

<script type="text/html" id="datatase-toolbar">
  <i class="layui-icon layui-icon-delete"  lay-event="del">
</script>

<script>
var editor = CodeMirror.fromTextArea(document.getElementById("file-editer"), {
  lineNumbers: true,
  mode: "javascript",
  keyMap: "sublime",
  autoCloseBrackets: true,
  matchBrackets: true,
  showCursorWhenSelecting: true,
  theme: "monokai",
  tabSize: 2,
  width: 200,
  gutters: ["CodeMirror-linenumbers","CodeMirror-lint-markers"],
});
//   editor.on("keypress", function() {editor.showHint(); });

// 在编辑器中加载使用文档
(function() {
  function rawString(func) {
    func += '';
    return func.substring(func.indexOf("/*") + 2, func.lastIndexOf("*/"));
  }

  var c = rawString(function() {/*<?php echo file_get_contents(__DIR__.'/'.'README.md')?>*/});
  editor.setValue(c);
})();


var $ = layui.$;
var channel = '/well/channel.php?action=';

console.log('channel: ' + channel);

function getScriptId(url) {
  return url.substr(url.lastIndexOf('/') + 1).split('.')[0];
}


var __tableSkin = 'line';

// 渲染数据库表
var databaseTable = layui.table.render({
  elem: '#xss-database',      // 表格元素定位
  url: channel+'database',    // 数据接口
  // page: true,                 // 开启分页
  skin: __tableSkin,
  cols: [[ 
    {align:'center', toolbar: '#datatase-toolbar', width: 10},

    {field: 'dateTime', title: 'time', sort: true, width: 165, align:'center'},
    {field: 'url', title: 'url', sort: true, width: 165, align:'center'},
    {field: 'script', title: 'script', sort: true, align:'center'},
    {field: 'type', title: 'type', sort: true, width: 100, align:'center'},
    {field: 'title', title: 'title', width: 80, sort: true, align:'center'},
    {field: 'referrer', title: 'referrer', width: 80, align:'center'},
    {field: 'screen', title: 'screen', width: 100, align:'center'},
    {field: 'language', title: 'lang', width: 75, align:'center'},
    {field: 'platform', title: 'platform', width: 95, align:'center'},
    {field: 'userAgent', title: 'userAgent', width: 100, align:'center'},
    {field: 'payload', title: 'payload', align:'center'},
  ]]
});


// 数据表格按钮事件处理 
layui.table.on('tool(filter-database)', function(obj){
  if(obj.event === 'detail'){
    // 查看详细信息
  } else if(obj.event === 'del'){ //删除
    $.get(channel+'delData&id='+obj.data.id, function(){
      obj.del();
    });
  }
});


// 渲染脚本表格
var addScriptTable = layui.table.render({
  elem: '#xss-script',      // 表格元素定位
  //height: 600,        // 表格高度
  url: channel+'getScript', //数据接口
  // page: true,         //开启分页
  skin: __tableSkin, // nob row line
  //size: 'lg',
  cols: [[            //表头
    {toolbar: '#add-script-toolbar', align: 'center', width: 10},
    {field: 'url', title: 'url', align:'center', width: 200},
    {field: 'type', title: 'type', align:'center', width: 120, sort: true},
    {field: 'desc', title: 'desc', align:'center'},
  ]],
  done: function (res, curr, count) {
    // $('tr').css({'background-color': '#000000', 'color': '#00ff00'});
  }
});


var __currentScriptRow = null;
// 脚本表格行点击事件处理
layui.table.on('row(filter-add-script)', function(obj) {
  // 编辑器显示选中脚本的代码
  __currentScriptRow = obj;
  $.get(channel+'readScript&id='+getScriptId(obj.data.url), function(r) {
      editor.setValue(r);
  });
  // 选中行高亮
  obj.tr.addClass('layui-bg-blue').siblings().removeClass('layui-bg-blue');
});

// 脚本表格按钮事件处理 
layui.table.on('tool(filter-add-script)', function(obj) {
  console.log(obj.data);
  var scriptId = getScriptId(obj.data.url);

  if (obj.event === 'del') { //删除
    $.get(channel+'delScript&id='+scriptId, function() {
      obj.del();
    });
  }
});
  

// 点+按钮弹出表单 添加脚本
$('#xss-script-add').click(function() {
  layui.layer.open({
    title: 'new script',
    type: 1,
    content: $('#xss-script-add-dialog'),
    success: function(layero, index) {
      layui.form.render(); // 重新渲染弹层中的下拉选择框select
    }
  });
});


// 保存当前脚本代码
$('#xss-script-edit').click(function() {
  if (__currentScriptRow == null) {
    return;
  }
  var id = getScriptId(__currentScriptRow.data.url);

  $('#xss-script-edit i').removeClass('layui-icon-edit').addClass('layui-icon-loading-1 layui-anim layui-anim-rotate layui-anim-loop');
  $.ajax({
    type: 'POST',
    url: channel+'writeScript&id='+id, 

    data: {'code': editor.getValue()}, 

    success: function(r) {
      $('#xss-script-edit i').addClass('layui-icon-edit').removeClass('layui-icon-loading-1 layui-anim layui-anim-rotate layui-anim-loop');
      layui.layer.msg('saved');
    },
    error: function() {
      alert('error');
    },
  });
});


$('#xss-script-help').click(function() {
  $.get(channel+'help', function(r) {
    if (__currentScriptRow != null) {
      __currentScriptRow.tr.removeClass('layui-bg-blue');
      __currentScriptRow = null;
    }
    editor.setValue(r);
  });
});


// 删除所有脚本
$('#xss-script-clear').click(function() {
  $.post(channel+'clearScript', function() {
    addScriptTable.reload();
  });
});


// 新建脚本表单提交处理
layui.form.on('submit(xss-script-add-submit)', function(data) {
  $.post(channel+'addScript', data.field, function() {
    // 添加成功刷新表格
    layer.msg(JSON.stringify(data.field));
    addScriptTable.reload();
  });
  return false;
});


setInterval(function() {
  // 如果当前不在database分页
  if (!1) {
    return;
  }

  // 请求后台确认是否有新数据
  if (1) {
    return;
  }

  // 请求后台获取最新的数据渲染表格
  $.post(channel+'database', function(){
    databaseTable.reload();
  });
}, 1000);


// 给新建脚本对话框下拉填充脚本类型
(function(){
  var r = '',
    scriptTypes = <?php echo json_encode(listdir(__DIR__.DS.'template')); ?>;
  for (var i = 0; i < scriptTypes.length; i++) {
    r += "<option value='" + scriptTypes[i] + "'>" + scriptTypes[i] + "</option>";
  }
  document.getElementById('xss-add-script-select').innerHTML = r;
})();

</script> 
</body>
</html>



