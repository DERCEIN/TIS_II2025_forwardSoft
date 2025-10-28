<?php

namespace ForwardSoft\Routes;

use ForwardSoft\Utils\Response;
use ForwardSoft\Controllers\AuthController;
use ForwardSoft\Controllers\UserController;
use ForwardSoft\Controllers\AdminController;
use ForwardSoft\Controllers\EvaluadorController;
use ForwardSoft\Controllers\CoordinadorController;
use ForwardSoft\Controllers\OlimpistaController;
use ForwardSoft\Controllers\ImportController;
use ForwardSoft\Controllers\EvaluacionController;
use ForwardSoft\Controllers\ReporteController;
use ForwardSoft\Controllers\CatalogoController;


class Router
{
    private $routes = [];
    private $middleware = [];
    
    public function __construct()
    {
        error_log("Router - Constructor called");
        $this->setupRoutes();
        error_log("Router - Routes registered: " . count($this->routes));
    }

    public function setupRoutes()
    {
        
        
        // Rutas de autenticación
        $this->addRoute('POST', '/api/auth/login', [AuthController::class, 'login']);
        $this->addRoute('POST', '/api/auth/register', [AuthController::class, 'register']);
        $this->addRoute('POST', '/api/auth/logout', [AuthController::class, 'logout'], ['auth']);
        $this->addRoute('GET', '/api/auth/me', [AuthController::class, 'me'], ['auth']);

        // Rutas de usuarios
        $this->addRoute('GET', '/api/users', [UserController::class, 'index'], ['auth']);
        $this->addRoute('GET', '/api/users/{id}', [UserController::class, 'show'], ['auth']);
        $this->addRoute('PUT', '/api/users/{id}', [UserController::class, 'update'], ['auth']);
        $this->addRoute('DELETE', '/api/users/{id}', [UserController::class, 'delete'], ['auth']);
        // Perfil del usuario autenticado
        $this->addRoute('PUT', '/api/users/{id}/password', [UserController::class, 'changePassword'], ['auth']);
        $this->addRoute('POST', '/api/users/avatar', [UserController::class, 'uploadAvatar'], ['auth']);

        // Rutas de administrador
        $this->addRoute('GET', '/api/admin/dashboard', [AdminController::class, 'dashboard'], ['auth', 'admin']);
        $this->addRoute('GET', '/api/admin/users', [AdminController::class, 'users'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/admin/users', [AdminController::class, 'createUser'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/admin/users/{id}/resend-credentials', [AdminController::class, 'reenviarCredenciales'], ['auth', 'admin']);

        // Rutas de coordinador
        $this->addRoute('GET', '/api/coordinador/dashboard', [CoordinadorController::class, 'dashboard'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/proyectos', [CoordinadorController::class, 'proyectos'], ['auth', 'coordinador']);

        // Rutas de evaluador
        $this->addRoute('GET', '/api/evaluador/dashboard', [EvaluadorController::class, 'dashboard'], ['auth', 'evaluador']);
        $this->addRoute('GET', '/api/evaluador/evaluaciones', [EvaluadorController::class, 'evaluaciones'], ['auth', 'evaluador']);
        $this->addRoute('GET', '/api/evaluador/competidores/{areaId}/{nivelId}', [EvaluadorController::class, 'getOlimpistas'], ['auth', 'evaluador']);
        // Registrar o actualizar nota de clasificación
        $this->addRoute('POST', '/api/evaluador/guardar-nota', [EvaluadorController::class, 'saveNotaClasificacion'], ['auth', 'evaluador']);

        // Cerrar calificación y generar listas de clasificados
        $this->addRoute('POST', '/api/evaluador/cerrar-calificacion', [EvaluadorController::class, 'cerrarCalificacion'], ['auth', 'evaluador']);


        // Rutas de coordinador - asignaciones de evaluadores
        $this->addRoute('GET', '/api/coordinador/catalogos', [CoordinadorController::class, 'getAreasNiveles'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/asignaciones/generar', [CoordinadorController::class, 'generarAsignaciones'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/asignaciones/area/{areaId}', [CoordinadorController::class, 'listarAsignacionesPorArea'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/asignaciones/exportar/{areaId}', [CoordinadorController::class, 'exportarAsignaciones'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/rondas', [CoordinadorController::class, 'crearRonda'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/cerrar-calificacion', [CoordinadorController::class, 'cerrarCalificacion'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/participantes-evaluaciones', [CoordinadorController::class, 'getParticipantesConEvaluaciones'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/listas-clasificacion', [CoordinadorController::class, 'getListasClasificacion'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/log-cambios-notas', [CoordinadorController::class, 'getLogCambiosNotas'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/evaluadores-por-area', [CoordinadorController::class, 'getEvaluadoresPorArea'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/progreso-evaluacion', [CoordinadorController::class, 'getProgresoEvaluacion'], ['auth', 'coordinador']);

        // Rutas de olimpistas
        $this->addRoute('GET', '/api/olimpistas', [OlimpistaController::class, 'index'], ['auth']);
        $this->addRoute('GET', '/api/olimpistas/{id}', [OlimpistaController::class, 'show'], ['auth']);
        $this->addRoute('POST', '/api/olimpistas', [OlimpistaController::class, 'create'], ['auth']);
        $this->addRoute('PUT', '/api/olimpistas/{id}', [OlimpistaController::class, 'update'], ['auth']);
        $this->addRoute('DELETE', '/api/olimpistas/{id}', [OlimpistaController::class, 'delete'], ['auth']);
        $this->addRoute('GET', '/api/olimpistas/area/{areaId}', [OlimpistaController::class, 'getByArea'], ['auth']);
        $this->addRoute('GET', '/api/olimpistas/nivel/{nivelId}', [OlimpistaController::class, 'getByLevel'], ['auth']);

        // Rutas de importación
        $this->addRoute('POST', '/api/import/olimpistas', [ImportController::class, 'importOlimpistas'], ['auth']);
        $this->addRoute('GET', '/api/import/template', [ImportController::class, 'downloadTemplate'], ['auth']);

        // Rutas de evaluación
        $this->addRoute('POST', '/api/evaluaciones/clasificacion', [EvaluacionController::class, 'evaluarClasificacion'], ['auth']);
        $this->addRoute('POST', '/api/evaluaciones/final', [EvaluacionController::class, 'evaluarFinal'], ['auth']);
        $this->addRoute('GET', '/api/evaluaciones/area/{areaId}', [EvaluacionController::class, 'getEvaluacionesByArea'], ['auth']);
        $this->addRoute('GET', '/api/evaluaciones/finales/area/{areaId}', [EvaluacionController::class, 'getEvaluacionesFinalesByArea'], ['auth']);
        $this->addRoute('GET', '/api/evaluaciones/inscripcion/{inscripcionId}', [EvaluacionController::class, 'getEvaluacionesByInscripcion'], ['auth']);
        $this->addRoute('POST', '/api/evaluaciones/calcular-clasificados/{areaId}', [EvaluacionController::class, 'calcularClasificados'], ['auth']);
        $this->addRoute('POST', '/api/evaluaciones/calcular-premiados/{areaId}', [EvaluacionController::class, 'calcularPremiados'], ['auth']);
        $this->addRoute('GET', '/api/evaluaciones/resultados/{areaId}', [EvaluacionController::class, 'getResultadosFinales'], ['auth']);
        $this->addRoute('GET', '/api/evaluaciones/medallero/{areaId}', [EvaluacionController::class, 'getMedallero'], ['auth']);
        $this->addRoute('POST', '/api/evaluador/confirmar-cierre-calificacion', [EvaluacionController::class, 'confirmarCierreCalificacion'], ['auth', 'evaluador']);

        // Rutas de reportes
        $this->addRoute('GET', '/api/reportes/estadisticas', [ReporteController::class, 'getEstadisticasGenerales'], ['auth']);
        $this->addRoute('GET', '/api/reportes/inscripciones', [ReporteController::class, 'getReporteInscripciones'], ['auth']);
        $this->addRoute('GET', '/api/reportes/evaluaciones', [ReporteController::class, 'getReporteEvaluaciones'], ['auth']);
        $this->addRoute('GET', '/api/reportes/resultados', [ReporteController::class, 'getReporteResultados'], ['auth']);
        $this->addRoute('GET', '/api/reportes/medallero-completo', [ReporteController::class, 'getMedalleroCompleto'], ['auth']);
        $this->addRoute('GET', '/api/reportes/ranking/{areaId}', [ReporteController::class, 'getRankingPorArea'], ['auth']);
        $this->addRoute('GET', '/api/reportes/estadisticas-departamento', [ReporteController::class, 'getEstadisticasPorDepartamento'], ['auth']);
        $this->addRoute('GET', '/api/reportes/estadisticas-area', [ReporteController::class, 'getEstadisticasPorArea'], ['auth']);
        $this->addRoute('GET', '/api/reportes/olimpista/{olimpistaId}', [ReporteController::class, 'getReporteDetalladoOlimpista'], ['auth']);
        $this->addRoute('GET', '/api/reportes/evaluador/{evaluadorId}', [ReporteController::class, 'getReporteEvaluador'], ['auth']);
        $this->addRoute('GET', '/api/reportes/exportar/inscripciones', [ReporteController::class, 'exportarInscripciones'], ['auth']);
        $this->addRoute('GET', '/api/reportes/exportar/resultados', [ReporteController::class, 'exportarResultados'], ['auth']);

        // Catálogos
        $this->addRoute('GET', '/api/catalogo/niveles', [CatalogoController::class, 'niveles'], ['auth']);
        $this->addRoute('GET', '/api/catalogo/areas-competencia', [CatalogoController::class, 'areasCompetencia'], ['auth']);
        
        // Ruta para servir imágenes de avatar (debe ir antes de otras rutas dinámicas)
        $this->addRoute('GET', '/api/avatar/{filename}', function($filename) {
            error_log("🔍 Avatar Route - Handler ejecutado con filename: " . $filename);
            
            // Validar que el nombre del archivo sea seguro (solo números, guiones y extensiones de imagen)
            if (!preg_match('/^[0-9]+-[0-9]+\.(png|jpg|jpeg|gif|webp)$/i', $filename)) {
                error_log("❌ Avatar - Nombre de archivo no válido: " . $filename);
                Response::notFound('Archivo no válido');
            }
            
            $filePath = __DIR__ . '/../../public/uploads/avatars/' . $filename;
            error_log("🔍 Avatar - Buscando archivo en: " . $filePath);
            
            if (file_exists($filePath) && is_file($filePath)) {
                error_log("✅ Avatar - Archivo encontrado: " . $filePath);
                
                
                $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                $mimeTypes = [
                    'png' => 'image/png',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'gif' => 'image/gif',
                    'webp' => 'image/webp',
                    'svg' => 'image/svg+xml'
                ];
                
                $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
                
                
                header('Content-Type: ' . $mimeType);
                header('Content-Length: ' . filesize($filePath));
                header('Cache-Control: public, max-age=31536000'); // Cache por 1 año
                header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($filePath)) . ' GMT');
                
                
                readfile($filePath);
                exit();
            } else {
                error_log("❌ Avatar - Archivo no encontrado: " . $filePath);
                Response::notFound('Avatar no encontrado');
            }
        });

        
        $this->addRoute('GET', '/api/areas-competencia', [CatalogoController::class, 'areasCompetencia']);

        $this->addRoute('GET', '/api/health', function() {
            Response::success(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s')]);
        });
        
        
        
        $this->addRoute('GET', '/', function() {
            Response::success([
                'message' => 'API ForwardSoft Olimpiadas',
                'version' => '1.0.0',
                'status' => 'running'
            ]);
        });
    }

    public function addRoute($method, $path, $handler, $middleware = [])
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    public function handleRequest()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        error_log("Router - Method: " . $method);
        error_log("Router - Original Path: " . $path);
        error_log("Router - Total Routes: " . count($this->routes));
        
        
        $basePaths = ['/backend/public', '/public', '/Backend/public'];
        foreach ($basePaths as $basePath) {
            if (strpos($path, $basePath) === 0) {
                $path = substr($path, strlen($basePath));
                error_log("Router - Removed base path: " . $basePath);
                break;
            }
        }
        
        error_log("Router - Final Path: " . $path);

        foreach ($this->routes as $route) {
            if ($this->matchRoute($route, $method, $path)) {
                $this->executeRoute($route, $path);
                return;
            }
        }

        
        Response::notFound('Ruta no encontrada');
    }

    private function matchRoute($route, $method, $path)
    {
        if ($route['method'] !== $method) {
            return false;
        }

        $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $route['path']);
        $pattern = '#^' . $pattern . '$#';

        return preg_match($pattern, $path);
    }

    private function executeRoute($route, $path)
    {
        
        foreach ($route['middleware'] as $middlewareName) {
            $middleware = $this->getMiddleware($middlewareName);
            if ($middleware && !$middleware()) {
                return;
            }
        }

       
        $params = $this->extractParams($route['path'], $path);

        
        $handler = $route['handler'];
        
        if (is_callable($handler)) {
            call_user_func_array($handler, $params);
        } elseif (is_array($handler) && count($handler) === 2) {
            $controller = new $handler[0]();
            $method = $handler[1];
            
            if (method_exists($controller, $method)) {
                call_user_func_array([$controller, $method], $params);
            } else {
                Response::serverError('Método no encontrado en el controlador');
            }
        } else {
            Response::serverError('Handler inválido');
        }
    }

    private function extractParams($routePath, $requestPath)
    {
        $routeParts = explode('/', $routePath);
        $requestParts = explode('/', $requestPath);
        $params = [];

        for ($i = 0; $i < count($routeParts); $i++) {
            if (isset($routeParts[$i]) && preg_match('/\{([^}]+)\}/', $routeParts[$i], $matches)) {
                $params[] = $requestParts[$i] ?? null;
            }
        }

        return $params;
    }

    private function getMiddleware($name)
    {
        $middlewares = [
            'auth' => function() {
                $user = \ForwardSoft\Utils\JWTManager::getCurrentUser();
                error_log("🔍 Debug Auth Middleware - User: " . json_encode($user));
                if (!$user) {
                    error_log("❌ Debug Auth Middleware - No user found, token may be invalid or missing");
                    \ForwardSoft\Utils\Response::unauthorized('Token de autenticación requerido');
                    return false;
                }
                error_log("✅ Debug Auth Middleware - User authenticated successfully");
                return true;
            },
            'admin' => function() {
                $user = \ForwardSoft\Utils\JWTManager::getCurrentUser();
                if (!$user || $user['role'] !== 'admin') {
                    \ForwardSoft\Utils\Response::forbidden('Acceso de administrador requerido');
                    return false;
                }
                return true;
            },
            'coordinador' => function() {
                $user = \ForwardSoft\Utils\JWTManager::getCurrentUser();
                if (!$user || !in_array($user['role'], ['admin', 'coordinador'])) {
                    \ForwardSoft\Utils\Response::forbidden('Acceso de coordinador requerido');
                    return false;
                }
                return true;
            },
            'evaluador' => function() {
                $user = \ForwardSoft\Utils\JWTManager::getCurrentUser();
                if (!$user || !in_array($user['role'], ['admin', 'coordinador', 'evaluador'])) {
                    \ForwardSoft\Utils\Response::forbidden('Acceso de evaluador requerido');
                    return false;
                }
                return true;
            }
        ];

        return $middlewares[$name] ?? null;
    }
}
