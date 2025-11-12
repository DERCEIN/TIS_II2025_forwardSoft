<?php


$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($request_uri, PHP_URL_PATH);
$isFileDownload = strpos($path, '/reporte-pdf') !== false || 
                  strpos($path, '/reporte-excel') !== false ||
                  strpos($path, '/descargar-pdf') !== false ||
                  strpos($path, '/descargar-excel') !== false ||
                  strpos($path, '/descargar-estadisticas') !== false;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (!$isFileDownload) {
    header('Content-Type: application/json');
}


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


if (!$isFileDownload) {
    error_log("Request URI: " . $request_uri);
    error_log("Path: " . $path);
    error_log("Method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Index.php - About to load Router");
}

require_once __DIR__ . '/../src/Routes/Router.php';

if (!$isFileDownload) {
    error_log("Index.php - Router loaded, creating instance");
}

$router = new \ForwardSoft\Routes\Router();

if (!$isFileDownload) {
    error_log("Index.php - Router instance created, calling handleRequest");
}

$router->handleRequest();

if (!$isFileDownload) {
    error_log("Index.php - handleRequest completed");
}