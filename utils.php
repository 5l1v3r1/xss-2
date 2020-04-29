<?php

// 开启报错
ini_set("display_errors", "On"); 
error_reporting(E_ALL | E_STRICT);

define('DS', DIRECTORY_SEPARATOR);


function listdir($path) {
  $r = [];
  foreach (scandir($path) as $i){
    if (!in_array($i, ['.', '..', '.DS_Store'])){
      $r[] = $i;
    }
  }
  return $r;
}


function dp($t) {echo $t.'<br>';}


function rm($dir) {
   $dh=opendir($dir);
   while ($file=readdir($dh)) {
      if($file!="." && $file!="..") {
         $fullpath=$dir.DS.$file;
         if(!is_dir($fullpath)) {
            unlink($fullpath);
         } else {
            deldir($fullpath);
         }
      }
   }
   closedir($dh);
   rmdir($dir);
}







































