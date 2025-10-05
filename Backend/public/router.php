<?php


$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);


if (!file_exists(__DIR__ . $path) || is_dir(__DIR__ . $path)) {
    
    include __DIR__ . '/index.php';
} else {
    
    return false;
}


