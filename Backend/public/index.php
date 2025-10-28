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



error_log("Index.php - About to load Router");
require_once __DIR__ . '/../src/Routes/Router.php';
error_log("Index.php - Router loaded, creating instance");
$router = new \ForwardSoft\Routes\Router();
error_log("Index.php - Router instance created, calling handleRequest");
$router->handleRequest();
error_log("Index.php - handleRequest completed");
switch ($path) {
    case '/':
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'API ForwardSoft Olimpiadas',
            'version' => '1.0.0',
            'endpoints' => [
                'GET /api/olimpistas' => 'Obtener lista de olimpistas',
                'GET /api/import/template' => 'Descargar plantilla CSV',
                'POST /api/import/olimpistas' => 'Importar olimpistas desde CSV',
                'POST /api/olimpistas/clear' => 'Limpiar tabla de olimpistas',
                'POST /api/auth/login' => 'Iniciar sesión',
                'GET /api/auth/me' => 'Obtener usuario actual',
                'POST /api/auth/logout' => 'Cerrar sesión',
                'GET /api/admin/users' => 'Gestionar usuarios (admin)',
                'POST /api/admin/users' => 'Crear usuario (admin)',
                'GET /api/areas-competencia' => 'Obtener áreas de competencia',
                'GET /api/evaluador/estadisticas' => 'Estadísticas del evaluador',
                'POST /api/test/import' => 'Prueba de importación',
                'GET /api/debug/import' => 'Debug de importación',
                'GET /api/debug/users' => 'Debug de usuarios'
            ],
            'status' => 'running'
        ]);
        break;
        
    case '/api/olimpistas':
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
                
                echo json_encode([
                    'success' => true,
                    'data' => $olimpistas,
                    'total' => count($olimpistas),
                    'message' => 'Lista de olimpistas registrados'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/import/template':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            
            $filename = 'template_olimpistas_' . date('Y-m-d') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            
           
            echo "\xEF\xBB\xBF";
            
           
            echo "nombre,apellido,documento_identidad,fecha_nacimiento,telefono,email,grado_escolaridad,unidad_educativa,departamento,area_competencia,nivel_competencia,tutor_legal_nombre,tutor_legal_documento,tutor_legal_telefono,tutor_legal_email,tutor_academico_nombre,tutor_academico_telefono,tutor_academico_email,es_grupo,nombre_grupo\n";
            echo "Juan,Pérez García,12345678,2005-03-15,70123456,juan.perez@email.com,6to de Secundaria,Colegio San José,La Paz,Matemáticas,Secundaria,María García López,87654321,70123457,maria.garcia@email.com,Prof. Carlos Mendoza,70123458,carlos.mendoza@email.com,No,\n";
            
            exit;
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/import/olimpistas':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                
                error_log("Import request - FILES: " . print_r($_FILES, true));
                error_log("Import request - POST: " . print_r($_POST, true));
                
               
                require_once __DIR__ . '/../src/Controllers/ImportController.php';
                $controller = new \ForwardSoft\Controllers\ImportController();
                $controller->importOlimpistas();
            } catch (Exception $e) {
                error_log("Import error: " . $e->getMessage());
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error en importación: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/olimpistas/clear':
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
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'deleted_count' => $deleted_count,
                        'message' => 'Tabla limpiada exitosamente'
                    ]
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/auth/login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                
                require_once __DIR__ . '/../src/Controllers/AuthController.php';
                $controller = new \ForwardSoft\Controllers\AuthController();
                $controller->login();
            } catch (Exception $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error en login: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/auth/me':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                
                require_once __DIR__ . '/../src/Controllers/AuthController.php';
                $controller = new \ForwardSoft\Controllers\AuthController();
                $controller->me();
            } catch (Exception $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al obtener usuario: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/auth/logout':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
               
                require_once __DIR__ . '/../src/Controllers/AuthController.php';
                $controller = new \ForwardSoft\Controllers\AuthController();
                $controller->logout();
            } catch (Exception $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error en logout: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;

   
    case '/api/admin/users':
        header('Content-Type: application/json');
        try {
            
            $currentUser = \ForwardSoft\Utils\JWTManager::getCurrentUser();
            if (!$currentUser) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Token de autenticación requerido']);
                break;
            }
            if (!in_array($currentUser['role'], ['admin'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Acceso de administrador requerido']);
                break;
            }

            require_once __DIR__ . '/../src/Controllers/AdminController.php';
            $controller = new \ForwardSoft\Controllers\AdminController();
            
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $controller->users();
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $controller->createUser();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error en operación de usuario: ' . $e->getMessage()
            ]);
        }
        break;

    
    case '/api/areas-competencia':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            header('Content-Type: application/json');
            try {
                
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                
                $stmt = $pdo->query("SELECT * FROM areas_competencia WHERE is_active = true ORDER BY orden_display, nombre");
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $areas,
                    'message' => 'Lista de áreas de competencia'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al obtener áreas: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;

    
    case '/api/evaluador/estadisticas':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            header('Content-Type: application/json');
            try {
               
                $headers = getallheaders();
                $token = null;
                
                if (isset($headers['Authorization'])) {
                    $authHeader = $headers['Authorization'];
                    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                        $token = $matches[1];
                    }
                }
                
                if (!$token) {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Token de autorización requerido'
                    ]);
                    break;
                }
                
                
                require_once __DIR__ . '/../src/Utils/JWTManager.php';
                $user = \ForwardSoft\Utils\JWTManager::getCurrentUser();
                
                if (!$user || $user['role'] !== 'evaluador') {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Acceso denegado. Solo evaluadores pueden acceder a estas estadísticas.'
                    ]);
                    break;
                }
                
                
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $userId = $user['id'];
                
               
                $stmt = $pdo->prepare("
                    SELECT ac.id as area_id 
                    FROM evaluadores_areas ea 
                    JOIN areas_competencia ac ON ea.area_competencia_id = ac.id 
                    WHERE ea.user_id = ? AND ea.is_active = true
                ");
                $stmt->execute([$userId]);
                $areas = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                if (empty($areas)) {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'total_asignadas' => 0,
                            'completadas' => 0,
                            'pendientes' => 0,
                            'promedio_calificacion' => 0
                        ],
                        'message' => 'No hay áreas asignadas'
                    ]);
                    break;
                }
                
                
                $areaIds = implode(',', array_map('intval', $areas));
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as total_asignadas
                    FROM inscripciones_areas ia
                    JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                    WHERE ia.area_competencia_id IN ($areaIds)
                    AND ia.estado IN ('activo', 'pendiente')
                ");
                $stmt->execute();
                $totalAsignadas = $stmt->fetch(PDO::FETCH_ASSOC)['total_asignadas'];
                
                
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as completadas
                    FROM evaluaciones_clasificacion ec
                    JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id IN ($areaIds)
                    AND ec.puntuacion IS NOT NULL
                    AND ec.evaluador_id = ?
                ");
                $stmt->execute([$userId]);
                $completadas = $stmt->fetch(PDO::FETCH_ASSOC)['completadas'];
                
               
                $pendientes = max(0, $totalAsignadas - $completadas);
                
                
                $stmt = $pdo->prepare("
                    SELECT AVG(ec.puntuacion) as promedio_calificacion
                    FROM evaluaciones_clasificacion ec
                    JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id IN ($areaIds)
                    AND ec.puntuacion IS NOT NULL
                    AND ec.evaluador_id = ?
                ");
                $stmt->execute([$userId]);
                $promedio = $stmt->fetch(PDO::FETCH_ASSOC)['promedio_calificacion'];
                $promedio = $promedio ? round($promedio, 1) : 0;
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'total_asignadas' => (int)$totalAsignadas,
                        'completadas' => (int)$completadas,
                        'pendientes' => (int)$pendientes,
                        'promedio_calificacion' => (float)$promedio
                    ],
                    'message' => 'Estadísticas del evaluador obtenidas correctamente'
                ]);
                
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/evaluador/guardar-nota':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['inscripcion_area_id'], $data['evaluador_id'], $data['puntuacion'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Faltan parámetros obligatorios: inscripcion_area_id, evaluador_id, puntuacion']);
                break;
            }

            $observaciones = $data['observaciones'] ?? null;

            require_once __DIR__ . '/../src/Controllers/EvaluadorController.php';
            $controller = new \ForwardSoft\Controllers\EvaluadorController();

            echo $controller->saveNotaClasificacion(
                $data['inscripcion_area_id'],
                $data['evaluador_id'],
                $data['puntuacion'],
                $observaciones
            );

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar nota: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
    break;

// --------------------------
// Cerrar calificación y generar listas de clasificados
// --------------------------
    case '/api/evaluador/cerrar-calificacion':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['area_id'], $data['nivel_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Faltan parámetros obligatorios: area_id, nivel_id']);
                break;
            }

            require_once __DIR__ . '/../src/Controllers/EvaluadorController.php';
            $controller = new \ForwardSoft\Controllers\EvaluadorController();

            echo $controller->cerrarCalificacion(
                $data['area_id'],
                $data['nivel_id']
            );

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al cerrar calificación: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
    break;

    case '/api/test/import':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                
                require_once __DIR__ . '/../src/Controllers/ImportController.php';
                $controller = new \ForwardSoft\Controllers\ImportController();
                $result = $controller->importOlimpistas();
                echo json_encode($result);
            } catch (Exception $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error en importación de prueba: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/debug/import':
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
               
                header('Content-Type: application/json');
                
                $debug = [
                    'message' => 'Endpoint de debug para importación CSV',
                    'request_method' => $_SERVER['REQUEST_METHOD'],
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not_set',
                    'files_received' => $_FILES,
                    'post_data' => $_POST,
                    'available_endpoints' => [
                        '/api/import/template - GET (descargar plantilla)',
                        '/api/import/olimpistas - POST (importar CSV)',
                        '/api/debug/import - GET/POST (debug)'
                    ]
                ];
                
                if (isset($_FILES['csv_file']) && $_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
                    $filePath = $_FILES['csv_file']['tmp_name'];
                    
                    
                    $handle = fopen($filePath, 'r');
                    if ($handle) {
                        $headers = fgetcsv($handle, 0, ',', '"', '\\');
                        fclose($handle);
                        
                        $debug['csv_headers_raw'] = $headers;
                        $debug['csv_headers_count'] = count($headers);
                        
                        
                        $headers = array_map(function($header) {
                            $header = trim($header);
                            $header = preg_replace('/[\x00-\x1F\x7F]/', '', $header);
                            return trim($header);
                        }, $headers);
                        
                        $headers = array_filter($headers, function($header) {
                            return !empty(trim($header));
                        });
                        $headers = array_values($headers);
                        
                        $debug['csv_headers_cleaned'] = $headers;
                        $debug['csv_headers_cleaned_count'] = count($headers);
                        
                        
                        $requiredHeaders = [
                            'nombre', 'apellido', 'documento_identidad', 'grado_escolaridad',
                            'unidad_educativa', 'departamento', 'tutor_legal_nombre',
                            'tutor_legal_documento', 'area_competencia', 'nivel_competencia'
                        ];
                        
                        $missingHeaders = [];
                        foreach ($requiredHeaders as $required) {
                            $found = false;
                            foreach ($headers as $header) {
                                if (trim($header) === trim($required)) {
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found) {
                                $missingHeaders[] = $required;
                            }
                        }
                        
                        $debug['required_headers'] = $requiredHeaders;
                        $debug['missing_headers'] = $missingHeaders;
                        $debug['all_headers_present'] = empty($missingHeaders);
                    } else {
                        $debug['error'] = 'No se pudo abrir el archivo CSV';
                    }
                } else {
                    $debug['error'] = 'No se recibió archivo CSV válido';
                }
                
                echo json_encode($debug, JSON_PRETTY_PRINT);
                
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error en debug: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/debug/users':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $stmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $users,
                    'total' => count($users)
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado']);
        break;
}
