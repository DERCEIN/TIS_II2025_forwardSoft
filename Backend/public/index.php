<?php
// Cargar configuración
require_once __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno
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

// Obtener la ruta solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Debug: mostrar información de la petición
error_log("Request URI: " . $request_uri);
error_log("Path: " . $path);
error_log("Method: " . $_SERVER['REQUEST_METHOD']);

// Router simple
switch ($path) {
    case '/api/olimpistas':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                // Conectar a la base de datos
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Consultar olimpistas desde la tabla principal
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
            // Generar plantilla simple
            $filename = 'template_olimpistas_' . date('Y-m-d') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            
            // BOM para UTF-8
            echo "\xEF\xBB\xBF";
            
            // CSV directo
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
                // Debug: mostrar información de la petición
                error_log("Import request - FILES: " . print_r($_FILES, true));
                error_log("Import request - POST: " . print_r($_POST, true));
                
                // Usar el ImportController
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
                // Conectar a la base de datos
                $pdo = new PDO(
                    "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                    $_ENV['DB_USERNAME'],
                    $_ENV['DB_PASSWORD']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Limpiar tabla principal
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
                // Usar el AuthController para login
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
                // Usar el AuthController para obtener usuario actual
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
                // Usar el AuthController para logout
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

    // Admin - crear usuario (requiere admin)
    case '/api/admin/users':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            header('Content-Type: application/json');
            try {
                // Verificar autenticación y rol
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
                $controller->createUser();
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al crear usuario: ' . $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/api/test/import':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                // Probar importación con el archivo de prueba
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
                // Debug detallado de la importación
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
                    
                    // Leer encabezados
                    $handle = fopen($filePath, 'r');
                    if ($handle) {
                        $headers = fgetcsv($handle, 0, ',', '"', '\\');
                        fclose($handle);
                        
                        $debug['csv_headers_raw'] = $headers;
                        $debug['csv_headers_count'] = count($headers);
                        
                        // Limpiar encabezados
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
                        
                        // Verificar encabezados requeridos
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
