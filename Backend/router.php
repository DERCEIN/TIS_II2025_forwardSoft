<?php
// Router principal para el backend



require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Config/SimpleConfig.php';


\ForwardSoft\Config\SimpleConfig::init();


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);


if (strpos($path, '/api/') === 0) {
    $path = substr($path, 5); // Remover "/api/"
}


error_log("Request URI: " . $request_uri);
error_log("Path: " . $path);
error_log("Method: " . $_SERVER['REQUEST_METHOD']);


switch ($path) {
    case 'olimpistas':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                
                $stmt = $pdo->query("SELECT * FROM olimpistas ORDER BY created_at DESC");
                $olimpistas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'data' => $olimpistas,
                    'total' => count($olimpistas),
                    'message' => 'Lista de olimpistas registrados'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case 'import/template':
        
        require_once __DIR__ . '/src/Controllers/ImportController.php';
        $controller = new \ForwardSoft\Controllers\ImportController();
        $controller->downloadTemplate();
        break;
        
    case 'import/olimpistas':
        
        require_once __DIR__ . '/src/Controllers/ImportController.php';
        $controller = new \ForwardSoft\Controllers\ImportController();
        $controller->importOlimpistas();
        break;
        
    case 'olimpistas/clear':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
               
                $stmt = $pdo->query("DELETE FROM olimpistas");
                $deleted_count = $stmt->rowCount();
                
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'deleted_count' => $deleted_count,
                        'message' => 'Tabla limpiada exitosamente'
                    ]
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    default:
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Endpoint no encontrado',
            'path' => $path,
            'method' => $_SERVER['REQUEST_METHOD']
        ]);
        break;
}
