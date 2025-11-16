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
use ForwardSoft\Controllers\ConfiguracionOlimpiadaController;
use ForwardSoft\Controllers\DesclasificacionController;
use ForwardSoft\Controllers\MedalleroController;

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
        
        // Rutas de cierre de fase (administrador)
        $this->addRoute('GET', '/api/admin/cierre-fase/dashboard', [AdminController::class, 'getDashboardCierreFase'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/admin/cierre-fase/extender-fecha', [AdminController::class, 'extenderFechaCierre'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/admin/cierre-fase/cerrar-general', [AdminController::class, 'cerrarFaseGeneral'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/admin/cierre-fase/revertir', [AdminController::class, 'revertirCierreFase'], ['auth', 'admin']);
        $this->addRoute('GET', '/api/admin/cierre-fase/verificar-automatico', [AdminController::class, 'verificarCierreAutomatico'], ['auth', 'admin']);
        $this->addRoute('GET', '/api/admin/cierre-fase/reporte-consolidado', [AdminController::class, 'generarReporteConsolidado'], ['auth', 'admin']);
        
        // Rutas de configuración general
        $this->addRoute('GET', '/api/configuracion', [ConfiguracionOlimpiadaController::class, 'getConfiguracion'], ['auth']);
        $this->addRoute('PUT', '/api/configuracion/general', [ConfiguracionOlimpiadaController::class, 'updateConfiguracionGeneral'], ['auth', 'admin']);
        
        // Rutas de configuración por área
        $this->addRoute('GET', '/api/configuracion/areas', [ConfiguracionOlimpiadaController::class, 'getConfiguracionesPorArea'], ['auth', 'admin']);
        $this->addRoute('GET', '/api/configuracion/area', [ConfiguracionOlimpiadaController::class, 'getConfiguracionPorArea'], ['auth', 'admin']);
        $this->addRoute('PUT', '/api/configuracion/area', [ConfiguracionOlimpiadaController::class, 'updateConfiguracionPorArea'], ['auth', 'admin']);
        $this->addRoute('POST', '/api/configuracion/validar-choques', [ConfiguracionOlimpiadaController::class, 'validarChoquesHorarios'], ['auth']);
        //Rutas de configuración de medallero
        $this->addRoute('GET','/api/administrador/medallero',[MedalleroController::class,'getMedallero'],['auth','admin']);
        $this->addRoute('PUT','/api/administrador/medallero',[MedalleroController::class,'updateMedallero'],['auth','admin']);
        $this->addRoute('GET','/api/administrador/medallero/areas',[MedalleroController::class,'getAreas'],['auth','admin']);
        // Rutas de desclasificación
        $this->addRoute('GET', '/api/desclasificacion/reglas', [DesclasificacionController::class, 'getReglasPorArea'], ['auth']);
        $this->addRoute('POST', '/api/desclasificacion/registrar', [DesclasificacionController::class, 'registrarDesclasificacion'], ['auth']);
        $this->addRoute('GET', '/api/desclasificacion/area', [DesclasificacionController::class, 'getDesclasificacionesPorArea'], ['auth']);
        $this->addRoute('POST', '/api/desclasificacion/revocar', [DesclasificacionController::class, 'revocarDesclasificacion'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/desclasificacion/verificar-automatica', [DesclasificacionController::class, 'verificarDesclasificacionAutomatica'], ['auth']);
        $this->addRoute('GET', '/api/desclasificacion/estadisticas', [DesclasificacionController::class, 'getEstadisticas'], ['auth']);

        // Rutas de coordinador
        $this->addRoute('GET', '/api/coordinador/dashboard', [CoordinadorController::class, 'dashboard'], middleware: ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/proyectos', [CoordinadorController::class, 'proyectos'], ['auth', 'coordinador']);

        // Rutas de evaluador
        $this->addRoute('GET', '/api/evaluador/dashboard', [EvaluadorController::class, 'dashboard'], ['auth', 'evaluador']);
        $this->addRoute('GET', '/api/evaluador/evaluaciones', [EvaluadorController::class, 'getEvaluaciones'], ['auth', 'evaluador']);
        $this->addRoute('GET', '/api/evaluador/estadisticas', [EvaluadorController::class, 'getEstadisticas'], ['auth', 'evaluador']);
        $this->addRoute('GET', '/api/evaluador/verificar-permisos', [EvaluadorController::class, 'verificarPermisosEvaluador'], ['auth', 'evaluador']);

        // Rutas de coordinador - asignaciones de evaluadores
        $this->addRoute('GET', '/api/coordinador/catalogos', [CoordinadorController::class, 'getAreasNiveles'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/asignaciones/generar', [CoordinadorController::class, 'generarAsignaciones'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/asignaciones/area/{areaId}', [CoordinadorController::class, 'listarAsignacionesPorArea'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/asignaciones/exportar/{areaId}', [CoordinadorController::class, 'exportarAsignaciones'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/rondas', [CoordinadorController::class, 'crearRonda'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/cerrar-calificacion', [CoordinadorController::class, 'cerrarCalificacion'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/participantes-evaluaciones', [CoordinadorController::class, 'getParticipantesConEvaluaciones'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/cierre-fase/dashboard', [CoordinadorController::class, 'getDashboardCierreFaseArea'], ['auth', 'coordinador']);
        $this->addRoute('POST', '/api/coordinador/cierre-fase/cerrar', [CoordinadorController::class, 'cerrarFaseArea'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/cierre-fase/descargar-pdf', [CoordinadorController::class, 'descargarReportePDFCierreFase'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/cierre-fase/descargar-excel', [CoordinadorController::class, 'descargarReporteExcelClasificados'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/cierre-fase/descargar-estadisticas', [CoordinadorController::class, 'descargarReportePDFEstadisticasDetalladas'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/cierre-fase/listar-pdfs', [CoordinadorController::class, 'listarReportesPDF'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/listas-clasificacion', [CoordinadorController::class, 'getListasClasificacion'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/log-cambios-notas', [CoordinadorController::class, 'getLogCambiosNotas'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/evaluadores-por-area', [CoordinadorController::class, 'getEvaluadoresPorArea'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/progreso-evaluacion', [CoordinadorController::class, 'getProgresoEvaluacion'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/progreso-evaluacion-final', [CoordinadorController::class, 'getProgresoEvaluacionFinal'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/alertas-criticas', [CoordinadorController::class, 'getAlertasCriticas'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/progreso-evaluacion/reporte-pdf', [CoordinadorController::class, 'generarReportePDFProgreso'], ['auth', 'coordinador']);
        $this->addRoute('GET', '/api/coordinador/progreso-evaluacion/reporte-excel', [CoordinadorController::class, 'generarReporteExcelProgreso'], ['auth', 'coordinador']);

        //Rutas de coordinador - tiempos de evaluadores
        $this->addRoute('GET', path: '/api/coordinador/tiempos-evaluadores-por-area' ,handler: [CoordinadorController::class,'getTiemposEvaluadoresPorArea'], middleware: ['auth','coordinador']);
        $this->addRoute(method: 'POST', path:'/api/coordinador/tiempos-evaluadores', handler: [CoordinadorController::class,'registrarTiemposEvaluadores'], middleware: ['auth','coordinador']);

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
        $this->addRoute('GET', '/api/catalogo/areas-competencia-estadisticas', [CatalogoController::class, 'areasCompetenciaConEstadisticas'], ['auth']);
        
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
        
        // Log especial para la ruta de cerrar fase
        if ($path === '/api/coordinador/cierre-fase/cerrar' && $method === 'POST') {
            error_log("🎯🎯🎯 RUTA DE CERRAR FASE DETECTADA 🎯🎯🎯");
        }

        foreach ($this->routes as $route) {
            if ($this->matchRoute($route, $method, $path)) {
                error_log("✅ Router - Ruta encontrada: {$method} {$route['path']}");
                if ($path === '/api/coordinador/cierre-fase/cerrar') {
                    error_log("🎯🎯🎯 EJECUTANDO RUTA DE CERRAR FASE 🎯🎯🎯");
                }
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
            
            if ($method === 'cerrarFaseArea') {
                error_log("🎯🎯🎯 EJECUTANDO CONTROLADOR: {$handler[0]}::{$method} 🎯🎯🎯");
            }
            
            if (method_exists($controller, $method)) {
                error_log("✅ Router - Llamando método: {$handler[0]}::{$method}");
                call_user_func_array([$controller, $method], $params);
            } else {
                error_log("❌ Router - Método no encontrado: {$handler[0]}::{$method}");
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
