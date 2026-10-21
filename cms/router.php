<?php
$root = dirname(__DIR__); /* lokaliai: php -S 127.0.0.1:8812 cms/router.php */
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('~^/(cms|_data)(/|$)~', $p)) { http_response_code(403); exit; }
if (preg_match('~^/[23]-aukstas/$~', $p)) { chdir($root . '/1-aukstas'); require $root . '/1-aukstas/index.php'; return true; }
if (preg_match('~^/prisijungimas/(\w+\.php)$~', $p, $m)) { chdir($root . '/prisijungimas'); require $root . '/prisijungimas/' . $m[1]; return true; }
if (is_dir($root . $p) && is_file($root . rtrim($p, '/') . '/index.php')) { chdir($root . rtrim($p, '/')); require $root . rtrim($p, '/') . '/index.php'; return true; }
return false;
