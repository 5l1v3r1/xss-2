<?php

include('utils.php');

var_dump(listdir(__DIR__.DS.'template'));

$script = new Script(2);

//dp($script->create());
//dp($script->delete());
//dp($script->read());

dp($script->write('wefwfe222\r\nww'));



dp($_SERVER['HTTP_HOST']);
dp($_SERVER['PHP_SELF']);

echo 'http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];






































