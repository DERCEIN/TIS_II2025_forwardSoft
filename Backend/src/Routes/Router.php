<?php

namespace ForwardSoft\Routes;

use ForwardSoft\Utils\Response;
use ForwardSoft\Controllers\AuthController;
use ForwardSoft\Controllers\UserController;
use ForwardSoft\Controllers\AdminController;
use ForwardSoft\Controllers\CoordinadorController;
use ForwardSoft\Controllers\EvaluadorController;
use ForwardSoft\Controllers\OlimpistaController;
use ForwardSoft\Controllers\ImportController;
use ForwardSoft\Controllers\EvaluacionController;
use ForwardSoft\Controllers\ReporteController;

class Router
{
    private $routes = [];
    private $middleware = [];

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

        // Ruta de salud del API
        $this->addRoute('GET', '/api/health', function() {
            Response::success(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s')]);
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
        
        
        $basePath = '/backend/public';
        if (strpos($path, $basePath) === 0) {
            $path = substr($path, strlen($basePath));
        }

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
                if (!$user) {
                    \ForwardSoft\Utils\Response::unauthorized('Token de autenticación requerido');
                    return false;
                }
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
