<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


require_once __DIR__ . '/../vendor/autoload.php';


$envFile = __DIR__ . '/../config.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}


$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);


error_log("Request URI: " . $request_uri);
error_log("Path: " . $path);
error_log("Method: " . $_SERVER['REQUEST_METHOD']);


// Usar el Router class en lugar del switch manual
error_log("Index.php - About to load Router");
require_once __DIR__ . '/../src/Routes/Router.php';
error_log("Index.php - Router loaded, creating instance");
$router = new \ForwardSoft\Routes\Router();
error_log("Index.php - Router instance created, calling handleRequest");
$router->handleRequest();
error_log("Index.php - handleRequest completed");