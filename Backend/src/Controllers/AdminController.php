<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Utils\EmailService;
use ForwardSoft\Utils\AuditService;
use ForwardSoft\Models\User;
use ForwardSoft\Models\ConfiguracionOlimpiada;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\InscripcionArea;
use PDO;
use PDOException;
use Exception;
use ForwardSoft\Utils\Mailer;
class AdminController
{
    private $userModel;
    private $pdo;

    public function __construct()
    {
        $this->userModel = new User();
        $this->pdo = $this->getConnection();
    }

    private function getConnection()
    {
        try {
            $pdo = new PDO(
                "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                $_ENV['DB_USERNAME'],
                $_ENV['DB_PASSWORD']
            );
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }

    public function dashboard()
    {
        $stats = [
            'total_users' => $this->userModel->getTotalUsers(),
            'total_admins' => $this->userModel->getUsersByRole('admin'),
            'total_coordinadores' => $this->userModel->getUsersByRole('coordinador'),
            'total_evaluadores' => $this->userModel->getUsersByRole('evaluador'),
            'recent_users' => $this->userModel->getRecentUsers(5)
        ];

        Response::success($stats, 'Dashboard de administrador');
    }

    public function users()
    {
        $users = $this->userModel->getAll();
        
        
        
        foreach ($users as &$user) {
            unset($user['password']);
            
           
            if ($user['role'] === 'evaluador') {
                $stmt = $this->pdo->prepare("
                    SELECT ac.nombre as area_nombre 
                    FROM evaluadores_areas ea 
                    JOIN areas_competencia ac ON ea.area_competencia_id = ac.id 
                    WHERE ea.user_id = ? AND ea.is_active = true
                ");
                $stmt->execute([$user['id']]);
                $area = $stmt->fetch(PDO::FETCH_ASSOC);
                $user['area'] = $area ? $area['area_nombre'] : null;
            }
            
            elseif ($user['role'] === 'coordinador') {
                $stmt = $this->pdo->prepare("
                    SELECT ac.nombre as area_nombre 
                    FROM responsables_academicos ra 
                    JOIN areas_competencia ac ON ra.area_competencia_id = ac.id 
                    WHERE ra.user_id = ? AND ra.is_active = true
                ");
                $stmt->execute([$user['id']]);
                $area = $stmt->fetch(PDO::FETCH_ASSOC);
                $user['area'] = $area ? $area['area_nombre'] : null;
            }
        }

        Response::success($users, 'Lista de usuarios para administración');
    }

    public function createUser()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateUserCreation($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        
        $existingUser = $this->userModel->findByEmail($input['email']);
        if ($existingUser) {
            error_log("Debug - Usuario ya existe: {$input['email']}");
            Response::validationError(['email' => 'El email ya está registrado']);
        }

        
        $passwordTemporal = $this->generarPasswordTemporal();
        
        
        $userData = [
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'role' => $input['role'] ?? 'evaluador',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $userId = $this->userModel->create($userData);

       
        if ($userId && isset($input['area_id']) && $input['area_id']) {
            error_log("🔍 Debug - Asignando área al usuario: UserID=$userId, AreaID={$input['area_id']}, Role={$input['role']}");
            $this->asignarAreaUsuario($userId, $input['area_id'], $input['role']);
        } else {
            error_log("🔍 Debug - No se asignó área: UserID=$userId, AreaID=" . ($input['area_id'] ?? 'no definido') . ", Role={$input['role']}");
        }

        if ($userId) {
            $newUser = $this->userModel->findById($userId);
            $currentAdmin = JWTManager::getCurrentUser();
            
            $mailer = new Mailer();
            $areaID=$input['area_id'];
            $areaName=$this->encontrarAreaPorID($areaID);
            $nombre = htmlspecialchars($input['name']);
            $correo = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
            $contrasena = htmlspecialchars($passwordTemporal);
            $roleCreado = htmlspecialchars($input['role'] ?? 'evaluador');
            $contenido = "
                <p>Hola <strong>" . htmlspecialchars($nombre) . "</strong>,</p>
                <p>Se ha creado tu cuenta en el sistema <strong>Olimpiada Oh! SanSi</strong>.</p>
                <p>Tu rol asignado es: <strong>" . htmlspecialchars($roleCreado) . "</strong></p>
                <p>Área de competencia asignada: <strong>" . htmlspecialchars($areaName) . "</strong></p>
                <p>
                    <strong>Correo:</strong> " . htmlspecialchars($correo) . "<br>
                    <strong>Contraseña temporal:</strong> " . htmlspecialchars($contrasena) . "
                </p>
                <p>Por favor, cambia tu contraseña al iniciar sesión.</p>
                <p><em>No olvides tu nueva contraseña, ya que no podrás recuperarla.</em></p>
                <p>
                    <a href='http://localhost:3000/login' 
                        style='background-color:#004aad;
                            color:#ffffff;
                            padding:10px 15px;
                            text-decoration:none;
                            border-radius:5px;
                            font-weight:bold;'>
                        Iniciar sesión
                    </a>
                </p>
                ";
            
            $emailEnviado= $mailer->enviar($correo, "Credenciales de acceso", $contenido);

            if ($emailEnviado) {
                unset($newUser['password']);
                Response::success([
                    'user' => $newUser,
                    'credentials_sent' => true,
                    'temporary_password' => $passwordTemporal 
                ], 'Usuario creado exitosamente y credenciales enviadas por email', 201);
            } else {
                
                unset($newUser['password']);
                Response::success([
                    'user' => $newUser,
                    'credentials_sent' => false,
                    'temporary_password' => $passwordTemporal,
                    'warning' => 'Usuario creado pero no se pudo enviar el email. Usa la contraseña temporal mostrada.'
                ], 'Usuario creado pero error al enviar credenciales por email', 201);
            }
        } else {
            Response::serverError('Error al crear el usuario');
        }
    }
    public function encontrarAreaPorID($areaId): mixed
    {
        try {
            $stmt = $this->pdo->prepare("SELECT nombre FROM areas_competencia WHERE id = ?");
            $stmt->execute([$areaId]);
            $area = $stmt->fetch(PDO::FETCH_ASSOC);
            return $area ? $area['nombre'] : null;
        } catch (Exception $e) {
            error_log("Error al encontrar área por ID: " . $e->getMessage());
            return null;
        }
    }
    private function validateUserCreation($input)
    {
        $errors = [];

        if (empty($input['name'])) {
            $errors['name'] = 'El nombre es requerido';
        } elseif (strlen($input['name']) < 2) {
            $errors['name'] = 'El nombre debe tener al menos 2 caracteres';
        }

        if (empty($input['email'])) {
            $errors['email'] = 'El email es requerido';
        } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email inválido';
        }

        

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
    }

    private function generarPasswordTemporal()
    {
        
        $caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        $longitud = 8;
        
        for ($i = 0; $i < $longitud; $i++) {
            $password .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        
        return $password;
    }

    public function reenviarCredenciales($userId)
    {
        $user = $this->userModel->findById($userId);
        
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        
        $passwordTemporal = $this->generarPasswordTemporal();
        
        
        $this->userModel->update($userId, [
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        $currentAdmin = JWTManager::getCurrentUser();
        
        
        $emailService = new EmailService();
        $emailEnviado = $emailService->enviarCredenciales($user, $passwordTemporal, $currentAdmin);
        
        if ($emailEnviado) {
            Response::success([
                'user_id' => $userId,
                'email' => $user['email'],
                'credentials_sent' => true,
                'temporary_password' => $passwordTemporal
            ], 'Credenciales reenviadas exitosamente');
        } else {
            Response::success([
                'user_id' => $userId,
                'email' => $user['email'],
                'credentials_sent' => false,
                'temporary_password' => $passwordTemporal,
                'warning' => 'No se pudo enviar el email. Usa la contraseña temporal mostrada.'
            ], 'Credenciales actualizadas pero error al enviar email');
        }
    }

    private function asignarAreaUsuario($userId, $areaId, $role)
    {
        try {
            error_log("Debug - asignarAreaUsuario: UserID=$userId, AreaID=$areaId, Role=$role");
            
            if ($role === 'evaluador') {
                
                $stmt = $this->pdo->prepare("SELECT id FROM evaluadores_areas WHERE user_id = ? AND is_active = true");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    
                    $stmt = $this->pdo->prepare("UPDATE evaluadores_areas SET area_competencia_id = ?, fecha_asignacion = NOW() WHERE user_id = ? AND is_active = true");
                    $stmt->execute([$areaId, $userId]);
                    error_log("Debug - Área actualizada para evaluador: UserID=$userId, AreaID=$areaId");
                } else {
                    
                    $stmt = $this->pdo->prepare("INSERT INTO evaluadores_areas (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                    $stmt->execute([$userId, $areaId]);
                    error_log("Debug - Área asignada a evaluador: UserID=$userId, AreaID=$areaId");
                }
            } elseif ($role === 'coordinador') {
                
                $stmt = $this->pdo->prepare("SELECT id FROM responsables_academicos WHERE user_id = ? AND is_active = true");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    
                    $stmt = $this->pdo->prepare("UPDATE responsables_academicos SET area_competencia_id = ?, fecha_asignacion = NOW() WHERE user_id = ? AND is_active = true");
                    $stmt->execute([$areaId, $userId]);
                    error_log("Debug - Área actualizada para coordinador: UserID=$userId, AreaID=$areaId");
                } else {
                    
                    $stmt = $this->pdo->prepare("INSERT INTO responsables_academicos (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                    $stmt->execute([$userId, $areaId]);
                    error_log(" Debug - Área asignada a coordinador: UserID=$userId, AreaID=$areaId");
                }
            } else {
                error_log("Debug - Rol no reconocido para asignación: $role");
            }
        } catch (Exception $e) {
            error_log("Debug - Error al asignar área al usuario: " . $e->getMessage());
        }
    }

    
    public function getDashboardCierreFase()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                Response::forbidden('Acceso de administrador requerido');
            }

           
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            
            
            if (!$config) {
                error_log(" No se encontró configuración de olimpiada, usando valores por defecto");
                $config = [
                    'clasificacion_fecha_inicio' => null,
                    'clasificacion_fecha_fin' => null
                ];
            }
            
            
            $stmt = $this->pdo->prepare("
                SELECT * FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $stmt->execute();
            $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);

            
            if (!$cierreGeneral) {
                $fechaInicio = isset($config['clasificacion_fecha_inicio']) ? $config['clasificacion_fecha_inicio'] : null;
                $fechaFin = isset($config['clasificacion_fecha_fin']) ? $config['clasificacion_fecha_fin'] : null;
                
                try {
                    $stmt = $this->pdo->prepare("
                        INSERT INTO cierre_fase_general (
                            fase, estado, fecha_inicio, fecha_fin_original, 
                            fecha_fin_extendida, created_at
                        ) VALUES (?, ?, ?, ?, ?, NOW())
                        RETURNING *
                    ");
                    $estado = $fechaInicio && strtotime($fechaInicio) <= time() ? 'activa' : 'pendiente';
                    $stmt->execute(['clasificacion', $estado, $fechaInicio, $fechaFin, $fechaFin]);
                    $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (PDOException $e) {
                    error_log("Error creando registro de cierre_fase_general: " . $e->getMessage());
                    
                    $cierreGeneral = [
                        'fase' => 'clasificacion',
                        'estado' => 'pendiente',
                        'fecha_inicio' => $fechaInicio,
                        'fecha_fin_original' => $fechaFin,
                        'fecha_fin_extendida' => null,
                        'fecha_cierre' => null,
                        'usuario_cierre_id' => null,
                        'areas_cerradas' => 0,
                        'areas_pendientes' => 0,
                        'clasificados_migrados' => 0,
                        'no_clasificados_excluidos' => 0,
                        'desclasificados_excluidos' => 0,
                    ];
                }
            }

            
            try {
                
                $stmt = $this->pdo->prepare("
                    SELECT DISTINCT
                        ac.id,
                        ac.nombre as area_nombre
                    FROM areas_competencia ac
                    WHERE ac.is_active = true
                    ORDER BY ac.nombre
                ");
                $stmt->execute();
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                
                foreach ($areas as &$area) {
                    
                    $stmtCierre = $this->pdo->prepare("
                        SELECT estado, porcentaje_completitud, cantidad_clasificados, 
                               fecha_cierre, coordinador_id
                        FROM cierre_fase_areas
                        WHERE area_competencia_id = ? AND nivel_competencia_id IS NULL
                        LIMIT 1
                    ");
                    $stmtCierre->execute([$area['id']]);
                    $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
                    
                    $area['estado'] = $cierre ? $cierre['estado'] : 'pendiente';
                    $area['porcentaje_completitud'] = $cierre ? (float)$cierre['porcentaje_completitud'] : 0;
                    $area['cantidad_clasificados'] = $cierre ? (int)$cierre['cantidad_clasificados'] : 0;
                    $area['fecha_cierre'] = $cierre ? $cierre['fecha_cierre'] : null;
                    $area['coordinador_id'] = $cierre ? $cierre['coordinador_id'] : null;
                    
                    
                    if ($area['coordinador_id']) {
                        $stmtCoord = $this->pdo->prepare("SELECT name FROM users WHERE id = ?");
                        $stmtCoord->execute([$area['coordinador_id']]);
                        $coord = $stmtCoord->fetch(PDO::FETCH_ASSOC);
                        $area['coordinador_nombre'] = $coord ? $coord['name'] : null;
                    } else {
                        $area['coordinador_nombre'] = null;
                    }
                    
                    
                    $stmtStats = $this->pdo->prepare("
                        SELECT 
                            COUNT(*) FILTER (WHERE ia.estado NOT IN ('desclasificado', 'no_clasificado')) as total_participantes,
                            COUNT(*) FILTER (
                                WHERE ia.estado NOT IN ('desclasificado', 'no_clasificado')
                                AND EXISTS (
                                    SELECT 1 FROM evaluaciones_clasificacion ec 
                                    WHERE ec.inscripcion_area_id = ia.id
                                )
                            ) as total_evaluados,
                            COUNT(*) FILTER (WHERE ia.estado = 'clasificado') as clasificados_real
                        FROM inscripciones_areas ia
                        WHERE ia.area_competencia_id = ?
                    ");
                    $stmtStats->execute([$area['id']]);
                    $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
                    
                    $area['total_participantes'] = (int)$stats['total_participantes'];
                    $area['total_evaluados'] = (int)$stats['total_evaluados'];
                    $area['clasificados_real'] = (int)$stats['clasificados_real'];
                    
                    
                    if (!$cierre && $area['total_participantes'] > 0) {
                        $area['porcentaje_completitud'] = round(($area['total_evaluados'] / $area['total_participantes']) * 100, 2);
                    }
                }
                
            } catch (PDOException $e) {
                error_log("Error obteniendo áreas: " . $e->getMessage());
                
                $stmt = $this->pdo->prepare("
                    SELECT DISTINCT
                        ac.id,
                        ac.nombre as area_nombre,
                        'pendiente' as estado,
                        0 as porcentaje_completitud,
                        0 as cantidad_clasificados,
                        NULL as fecha_cierre,
                        NULL as coordinador_id,
                        NULL as coordinador_nombre,
                        (
                            SELECT COUNT(*) 
                            FROM inscripciones_areas ia
                            WHERE ia.area_competencia_id = ac.id
                            AND ia.estado NOT IN ('desclasificado', 'no_clasificado')
                        ) as total_participantes,
                        (
                            SELECT COUNT(*) 
                            FROM inscripciones_areas ia
                            JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                            WHERE ia.area_competencia_id = ac.id
                            AND ia.estado NOT IN ('desclasificado', 'no_clasificado')
                        ) as total_evaluados,
                        (
                            SELECT COUNT(*) 
                            FROM inscripciones_areas ia
                            WHERE ia.area_competencia_id = ac.id
                            AND ia.estado = 'clasificado'
                        ) as clasificados_real
                    FROM areas_competencia ac
                    WHERE ac.is_active = true
                    ORDER BY ac.nombre
                ");
                $stmt->execute();
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            
            foreach ($areas as &$area) {
                
                $area['porcentaje_completitud'] = (float)$area['porcentaje_completitud'];
                $area['cantidad_clasificados'] = (int)$area['cantidad_clasificados'];
                
                if (($area['estado'] === 'pendiente' || !isset($area['estado'])) && isset($area['id'])) {
                    try {
                        $stmtUpdate = $this->pdo->prepare("
                            INSERT INTO cierre_fase_areas (
                                area_competencia_id, nivel_competencia_id, estado,
                                porcentaje_completitud, cantidad_clasificados, updated_at
                            ) VALUES (?, NULL, ?, ?, ?, NOW())
                            ON CONFLICT (area_competencia_id, nivel_competencia_id) 
                            DO UPDATE SET 
                                porcentaje_completitud = EXCLUDED.porcentaje_completitud,
                                cantidad_clasificados = EXCLUDED.cantidad_clasificados,
                                updated_at = NOW()
                        ");
                        $estadoArea = $area['porcentaje_completitud'] == 100 ? 'cerrada' : 
                                      ($area['porcentaje_completitud'] > 0 ? 'activa' : 'pendiente');
                        $stmtUpdate->execute([
                            $area['id'],
                            $estadoArea,
                            $area['porcentaje_completitud'],
                            $area['clasificados_real']
                        ]);
                        $area['estado'] = $estadoArea;
                    } catch (PDOException $e) {
                        error_log("Error actualizando cierre_fase_areas: " . $e->getMessage());
                        
                    }
                }
            }

            
            $areasCerradas = count(array_filter($areas, fn($a) => $a['estado'] === 'cerrada'));
            $areasActivas = count(array_filter($areas, fn($a) => $a['estado'] === 'activa'));
            $areasPendientes = count(array_filter($areas, fn($a) => $a['estado'] === 'pendiente'));
            
            $totalClasificados = array_sum(array_column($areas, 'clasificados_real'));
            $totalNoClasificados = 0;
            $totalDesclasificados = 0;

            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) FILTER (WHERE estado = 'no_clasificado') as no_clasificados,
                    COUNT(*) FILTER (WHERE estado = 'desclasificado') as desclasificados
                FROM inscripciones_areas
            ");
            $stmt->execute();
            $excluidos = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalNoClasificados = (int)$excluidos['no_clasificados'];
            $totalDesclasificados = (int)$excluidos['desclasificados'];

            
            $fechaFinEfectiva = $cierreGeneral['fecha_fin_extendida'] ?? $cierreGeneral['fecha_fin_original'];

            
            $todasCerradas = $areasCerradas === count($areas) && count($areas) > 0;

            
            if (!$cierreGeneral) {
                $cierreGeneral = [
                    'estado' => 'pendiente',
                    'fecha_inicio' => null,
                    'fecha_fin_original' => null,
                    'fecha_fin_extendida' => null,
                    'fecha_cierre' => null,
                    'usuario_cierre_id' => null,
                    'clasificados_migrados' => 0,
                ];
            }

            Response::success([
                'fase_general' => [
                    'estado' => $cierreGeneral['estado'] ?? 'pendiente',
                    'fecha_inicio' => $cierreGeneral['fecha_inicio'] ?? null,
                    'fecha_fin_original' => $cierreGeneral['fecha_fin_original'] ?? null,
                    'fecha_fin_extendida' => $cierreGeneral['fecha_fin_extendida'] ?? null,
                    'fecha_fin_efectiva' => $fechaFinEfectiva,
                    'fecha_cierre' => $cierreGeneral['fecha_cierre'] ?? null,
                    'usuario_cierre_id' => $cierreGeneral['usuario_cierre_id'] ?? null,
                    'areas_cerradas' => $areasCerradas,
                    'areas_pendientes' => $areasPendientes,
                    'areas_activas' => $areasActivas,
                    'total_areas' => count($areas),
                    'puede_cerrar' => $todasCerradas && ($cierreGeneral['estado'] ?? 'pendiente') !== 'cerrada_general' && ($cierreGeneral['estado'] ?? 'pendiente') !== 'cerrada_automatica'
                ],
                'areas' => $areas,
                'resumen' => [
                    'clasificados_migrados' => (int)($cierreGeneral['clasificados_migrados'] ?? 0),
                    'no_clasificados_excluidos' => $totalNoClasificados,
                    'desclasificados_excluidos' => $totalDesclasificados,
                    'total_clasificados' => $totalClasificados
                ]
            ], 'Dashboard de cierre de fase obtenido');

        } catch (Exception $e) {
            error_log('Error obteniendo dashboard de cierre de fase: ' . $e->getMessage());
            Response::serverError('Error al obtener dashboard de cierre de fase: ' . $e->getMessage());
        }
    }

    
    public function extenderFechaCierre()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                Response::forbidden('Acceso de administrador requerido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['nueva_fecha']) || !isset($input['justificacion'])) {
                Response::validationError(['general' => 'Se requieren nueva_fecha y justificacion']);
            }

            $nuevaFecha = $input['nueva_fecha'];
            $justificacion = trim($input['justificacion']);

            if (empty($justificacion)) {
                Response::validationError(['justificacion' => 'La justificación es requerida']);
            }

            
            $stmt = $this->pdo->prepare("
                SELECT fecha_fin_original, fecha_fin_extendida, fecha_fin_extendida as fecha_actual
                FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $stmt->execute();
            $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cierreGeneral) {
                Response::validationError(['general' => 'No existe configuración de fase clasificatoria']);
            }

            $fechaActual = $cierreGeneral['fecha_fin_extendida'] ?? $cierreGeneral['fecha_fin_original'];
            
            if (strtotime($nuevaFecha) <= strtotime($fechaActual)) {
                Response::validationError(['nueva_fecha' => 'La nueva fecha debe ser posterior a la fecha actual']);
            }

            
            $stmt = $this->pdo->prepare("
                UPDATE cierre_fase_general 
                SET fecha_fin_extendida = ?,
                    justificacion_extension = ?,
                    usuario_extension_id = ?,
                    fecha_extension = NOW(),
                    updated_at = NOW()
                WHERE fase = 'clasificacion'
            ");
            $stmt->execute([$nuevaFecha, $justificacion, $currentUser['id']]);

            
            $configModel = new ConfiguracionOlimpiada();
            $configModel->updateConfiguracion(['clasificacion_fecha_fin' => $nuevaFecha]);

            // Registrar en auditoría
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                0, 
                0, 
                [
                    'accion' => 'extender_fecha_cierre',
                    'fecha_anterior' => $fechaActual,
                    'fecha_nueva' => $nuevaFecha,
                    'justificacion' => $justificacion
                ]
            );

            Response::success([
                'fecha_anterior' => $fechaActual,
                'fecha_nueva' => $nuevaFecha,
                'justificacion' => $justificacion
            ], 'Fecha de cierre extendida exitosamente');

        } catch (Exception $e) {
            error_log('Error extendiendo fecha de cierre: ' . $e->getMessage());
            Response::serverError('Error al extender fecha de cierre: ' . $e->getMessage());
        }
    }

   
    public function cerrarFaseGeneral()
    {
        try {
            $this->pdo->beginTransaction();

            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                Response::forbidden('Acceso de administrador requerido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $confirmado = $input['confirmado'] ?? false;

            if (!$confirmado) {
                Response::validationError(['general' => 'Debe confirmar el cierre de fase']);
            }

           
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as total,
                       COUNT(*) FILTER (WHERE estado = 'cerrada') as cerradas
                FROM cierre_fase_areas
                WHERE nivel_competencia_id IS NULL
            ");
            $stmt->execute();
            $estadoAreas = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($estadoAreas['cerradas'] < $estadoAreas['total']) {
                $pendientes = $estadoAreas['total'] - $estadoAreas['cerradas'];
                Response::validationError([
                    'general' => "No se puede cerrar la fase general. {$pendientes} área(s) aún no han cerrado su fase"
                ]);
            }

           
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT ia.id as inscripcion_area_id,
                       ia.area_competencia_id,
                       ia.nivel_competencia_id,
                       ia.olimpista_id
                FROM inscripciones_areas ia
                WHERE ia.estado = 'clasificado'
            ");
            $stmt->execute();
            $clasificados = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $clasificadosMigrados = 0;
            $noClasificadosExcluidos = 0;
            $desclasificadosExcluidos = 0;

            
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) FILTER (WHERE estado = 'no_clasificado') as no_clasificados,
                    COUNT(*) FILTER (WHERE estado = 'desclasificado') as desclasificados
                FROM inscripciones_areas
            ");
            $stmt->execute();
            $excluidos = $stmt->fetch(PDO::FETCH_ASSOC);
            $noClasificadosExcluidos = (int)$excluidos['no_clasificados'];
            $desclasificadosExcluidos = (int)$excluidos['desclasificados'];

           
            $coordinadorController = new \ForwardSoft\Controllers\CoordinadorController();
            
            foreach ($clasificados as $clasificado) {
                try {
                    
                    $stmtCheck = $this->pdo->prepare("
                        SELECT id FROM asignaciones_evaluacion
                        WHERE inscripcion_area_id = ? AND fase = 'final'
                    ");
                    $stmtCheck->execute([$clasificado['inscripcion_area_id']]);
                    $existe = $stmtCheck->fetch();

                    if (!$existe) {
                        
                        $stmtEval = $this->pdo->prepare("
                            SELECT DISTINCT evaluador_id 
                            FROM asignaciones_evaluacion ae
                            JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                            WHERE ia.area_competencia_id = ? 
                            AND ia.nivel_competencia_id = ?
                            AND ae.fase = 'clasificacion'
                        ");
                        $stmtEval->execute([
                            $clasificado['area_competencia_id'],
                            $clasificado['nivel_competencia_id']
                        ]);
                        $evaluadores = $stmtEval->fetchAll(PDO::FETCH_ASSOC);

                        
                        if (empty($evaluadores)) {
                            $stmtEval = $this->pdo->prepare("
                                SELECT user_id as evaluador_id 
                                FROM evaluadores_areas
                                WHERE area_competencia_id = ?
                                AND (nivel_competencia_id = ? OR nivel_competencia_id IS NULL)
                                AND is_active = true
                            ");
                            $stmtEval->execute([
                                $clasificado['area_competencia_id'],
                                $clasificado['nivel_competencia_id']
                            ]);
                            $evaluadores = $stmtEval->fetchAll(PDO::FETCH_ASSOC);
                        }

                        
                        if (!empty($evaluadores)) {
                            $evaluadorId = $evaluadores[0]['evaluador_id'];
                            
                            $stmtInsert = $this->pdo->prepare("
                                INSERT INTO asignaciones_evaluacion (
                                    inscripcion_area_id, evaluador_id, fase, fecha_asignacion, creado_por
                                ) VALUES (?, ?, 'final', NOW(), ?)
                                ON CONFLICT (inscripcion_area_id, evaluador_id, fase) DO NOTHING
                            ");
                            $stmtInsert->execute([
                                $clasificado['inscripcion_area_id'],
                                $evaluadorId,
                                $currentUser['id']
                            ]);
                            
                            $clasificadosMigrados++;
                        }
                    }
                } catch (Exception $e) {
                    error_log("Error migrando clasificado {$clasificado['inscripcion_area_id']}: " . $e->getMessage());
                }
            }

            
            $stmt = $this->pdo->prepare("
                UPDATE cierre_fase_general 
                SET estado = 'cerrada_general',
                    fecha_cierre = NOW(),
                    usuario_cierre_id = ?,
                    areas_cerradas = ?,
                    areas_pendientes = 0,
                    clasificados_migrados = ?,
                    no_clasificados_excluidos = ?,
                    desclasificados_excluidos = ?,
                    updated_at = NOW()
                WHERE fase = 'clasificacion'
            ");
            $stmt->execute([
                $currentUser['id'],
                $estadoAreas['cerradas'],
                $clasificadosMigrados,
                $noClasificadosExcluidos,
                $desclasificadosExcluidos
            ]);

            
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                0, // area_id = 0 para cierre general
                0, // nivel_id = 0 para cierre general
                [
                    'accion' => 'cerrar_fase_general',
                    'areas_cerradas' => $estadoAreas['cerradas'],
                    'clasificados_migrados' => $clasificadosMigrados,
                    'no_clasificados_excluidos' => $noClasificadosExcluidos,
                    'desclasificados_excluidos' => $desclasificadosExcluidos
                ]
            );

           
            $this->pdo->commit();

            Response::success([
                'mensaje' => 'Fase clasificatoria cerrada exitosamente',
                'areas_cerradas' => $estadoAreas['cerradas'],
                'clasificados_migrados' => $clasificadosMigrados,
                'no_clasificados_excluidos' => $noClasificadosExcluidos,
                'desclasificados_excluidos' => $desclasificadosExcluidos,
                'fecha_cierre' => date('Y-m-d H:i:s')
            ], 'Fase clasificatoria cerrada exitosamente');

        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log('Error cerrando fase general: ' . $e->getMessage());
            Response::serverError('Error al cerrar fase general: ' . $e->getMessage());
        }
    }

   
    public function verificarCierreAutomatico()
    {
        try {
            
            $stmt = $this->pdo->prepare("
                SELECT fecha_fin_original, fecha_fin_extendida, estado
                FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $stmt->execute();
            $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cierreGeneral) {
                return;
            }

           
            if (in_array($cierreGeneral['estado'], ['cerrada_general', 'cerrada_automatica'])) {
                return;
            }

            $fechaFin = $cierreGeneral['fecha_fin_extendida'] ?? $cierreGeneral['fecha_fin_original'];
            
            if (!$fechaFin || strtotime($fechaFin) > time()) {
                return; 
            }

            
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as total,
                       COUNT(*) FILTER (WHERE porcentaje_completitud = 100) as completadas
                FROM cierre_fase_areas
                WHERE nivel_competencia_id IS NULL
            ");
            $stmt->execute();
            $estadoAreas = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($estadoAreas['completadas'] < $estadoAreas['total']) {
                
                error_log(" ALERTA CRÍTICA: La fecha de cierre ha vencido pero {$estadoAreas['completadas']}/{$estadoAreas['total']} áreas están completadas");
                
                return;
            }

           
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("
                UPDATE cierre_fase_general 
                SET estado = 'cerrada_automatica',
                    fecha_cierre = NOW(),
                    updated_at = NOW()
                WHERE fase = 'clasificacion'
            ");
            $stmt->execute();


            $this->pdo->commit();

            error_log(" Cierre automático ejecutado: La fecha de cierre venció y todas las áreas están completadas");

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log('Error en verificación de cierre automático: ' . $e->getMessage());
        }
    }

    /**
     * Revertir cierre de fase general (solo dentro de 24 horas)
     */
    public function revertirCierreFase()
    {
        try {
            $this->pdo->beginTransaction();

            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                Response::forbidden('Acceso de administrador requerido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $confirmado = $input['confirmado'] ?? false;
            $justificacion = trim($input['justificacion'] ?? '');

            if (!$confirmado) {
                Response::validationError(['general' => 'Debe confirmar la reversión del cierre']);
            }

            if (empty($justificacion)) {
                Response::validationError(['justificacion' => 'La justificación es requerida']);
            }

            // Obtener información del cierre
            $stmt = $this->pdo->prepare("
                SELECT id, estado, fecha_cierre, usuario_cierre_id, clasificados_migrados
                FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $stmt->execute();
            $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cierreGeneral) {
                Response::validationError(['general' => 'No existe registro de cierre de fase']);
            }

            // Verificar que esté cerrada
            if (!in_array($cierreGeneral['estado'], ['cerrada_general', 'cerrada_automatica'])) {
                Response::validationError(['general' => 'La fase no está cerrada, no se puede revertir']);
            }

            // Verificar que no hayan pasado más de 24 horas
            $fechaCierre = strtotime($cierreGeneral['fecha_cierre']);
            $horasTranscurridas = (time() - $fechaCierre) / 3600;

            if ($horasTranscurridas > 24) {
                Response::validationError([
                    'general' => 'No se puede revertir el cierre después de 24 horas. Han transcurrido ' . round($horasTranscurridas, 1) . ' horas.'
                ]);
            }

            // Revertir asignaciones de fase final (eliminar las creadas durante el cierre)
            $clasificadosMigrados = (int)$cierreGeneral['clasificados_migrados'];
            if ($clasificadosMigrados > 0) {
                // Eliminar asignaciones de fase final creadas después de la fecha de cierre
                $stmt = $this->pdo->prepare("
                    DELETE FROM asignaciones_evaluacion
                    WHERE fase = 'final'
                    AND fecha_asignacion >= ?
                    AND creado_por = (
                        SELECT usuario_cierre_id FROM cierre_fase_general 
                        WHERE fase = 'clasificacion' ORDER BY id DESC LIMIT 1
                    )
                ");
                $stmt->execute([$cierreGeneral['fecha_cierre']]);
            }

            // Revertir estado a 'activa'
            $stmt = $this->pdo->prepare("
                UPDATE cierre_fase_general 
                SET estado = 'activa',
                    fecha_cierre = NULL,
                    usuario_cierre_id = NULL,
                    updated_at = NOW()
                WHERE fase = 'clasificacion'
            ");
            $stmt->execute();

            // Registrar en auditoría
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                0,
                0,
                [
                    'accion' => 'revertir_cierre_fase_general',
                    'fecha_cierre_original' => $cierreGeneral['fecha_cierre'],
                    'horas_transcurridas' => round($horasTranscurridas, 2),
                    'justificacion' => $justificacion,
                    'clasificados_revertidos' => $clasificadosMigrados
                ]
            );

            $this->pdo->commit();

            Response::success([
                'mensaje' => 'Cierre de fase revertido exitosamente',
                'horas_transcurridas' => round($horasTranscurridas, 2),
                'clasificados_revertidos' => $clasificadosMigrados
            ], 'Cierre de fase revertido exitosamente');

        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log('Error revirtiendo cierre de fase: ' . $e->getMessage());
            Response::serverError('Error al revertir cierre de fase: ' . $e->getMessage());
        }
    }

    /**
     * Generar reporte consolidado del cierre de fase
     */
    public function generarReporteConsolidado()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                Response::forbidden('Acceso de administrador requerido');
            }

            // Obtener información del cierre general
            $stmt = $this->pdo->prepare("
                SELECT c.*, u.name as usuario_cierre_nombre
                FROM cierre_fase_general c
                LEFT JOIN users u ON u.id = c.usuario_cierre_id
                WHERE c.fase = 'clasificacion'
                ORDER BY c.id DESC LIMIT 1
            ");
            $stmt->execute();
            $cierreGeneral = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cierreGeneral) {
                Response::validationError(['general' => 'No existe registro de cierre de fase']);
            }

            // Obtener todas las áreas con su información
            $stmt = $this->pdo->prepare("
                SELECT 
                    ac.id,
                    ac.nombre as area_nombre,
                    cfa.estado,
                    cfa.porcentaje_completitud,
                    cfa.cantidad_clasificados,
                    cfa.fecha_cierre,
                    u.name as coordinador_nombre,
                    COUNT(*) FILTER (WHERE ia.estado NOT IN ('desclasificado', 'no_clasificado')) as total_participantes,
                    COUNT(*) FILTER (
                        WHERE ia.estado NOT IN ('desclasificado', 'no_clasificado')
                        AND EXISTS (SELECT 1 FROM evaluaciones_clasificacion ec WHERE ec.inscripcion_area_id = ia.id)
                    ) as total_evaluados,
                    COUNT(*) FILTER (WHERE ia.estado = 'clasificado') as clasificados_real,
                    COUNT(*) FILTER (WHERE ia.estado = 'no_clasificado') as no_clasificados,
                    COUNT(*) FILTER (WHERE ia.estado = 'desclasificado') as desclasificados
                FROM areas_competencia ac
                LEFT JOIN cierre_fase_areas cfa ON cfa.area_competencia_id = ac.id AND cfa.nivel_competencia_id IS NULL
                LEFT JOIN users u ON u.id = cfa.coordinador_id
                LEFT JOIN inscripciones_areas ia ON ia.area_competencia_id = ac.id
                WHERE ac.is_active = true
                GROUP BY ac.id, ac.nombre, cfa.estado, cfa.porcentaje_completitud, 
                         cfa.cantidad_clasificados, cfa.fecha_cierre, u.name
                ORDER BY ac.nombre
            ");
            $stmt->execute();
            $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcular estadísticas generales
            $totalAreas = count($areas);
            $areasCerradas = count(array_filter($areas, fn($a) => $a['estado'] === 'cerrada'));
            $totalParticipantes = array_sum(array_column($areas, 'total_participantes'));
            $totalEvaluados = array_sum(array_column($areas, 'total_evaluados'));
            $totalClasificados = array_sum(array_column($areas, 'clasificados_real'));
            $totalNoClasificados = array_sum(array_column($areas, 'no_clasificados'));
            $totalDesclasificados = array_sum(array_column($areas, 'desclasificados'));

            // Generar CSV
            $filename = 'reporte_cierre_fase_' . date('Y-m-d_H-i-s') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            
            $output = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Encabezado del reporte
            fputcsv($output, ['REPORTE CONSOLIDADO DE CIERRE DE FASE CLASIFICATORIA']);
            fputcsv($output, ['Fecha de generación:', date('Y-m-d H:i:s')]);
            fputcsv($output, ['Generado por:', $currentUser['name'] ?? $currentUser['email']]);
            fputcsv($output, []);
            
            // Información general del cierre
            fputcsv($output, ['INFORMACIÓN GENERAL DEL CIERRE']);
            fputcsv($output, ['Estado:', $cierreGeneral['estado']]);
            fputcsv($output, ['Fecha de inicio:', $cierreGeneral['fecha_inicio'] ?? 'N/A']);
            fputcsv($output, ['Fecha de fin original:', $cierreGeneral['fecha_fin_original'] ?? 'N/A']);
            fputcsv($output, ['Fecha de fin extendida:', $cierreGeneral['fecha_fin_extendida'] ?? 'N/A']);
            fputcsv($output, ['Fecha de cierre:', $cierreGeneral['fecha_cierre'] ?? 'N/A']);
            fputcsv($output, ['Cerrado por:', $cierreGeneral['usuario_cierre_nombre'] ?? 'N/A']);
            fputcsv($output, []);
            
            // Resumen estadístico
            fputcsv($output, ['RESUMEN ESTADÍSTICO']);
            fputcsv($output, ['Total de áreas:', $totalAreas]);
            fputcsv($output, ['Áreas cerradas:', $areasCerradas]);
            fputcsv($output, ['Total participantes:', $totalParticipantes]);
            fputcsv($output, ['Total evaluados:', $totalEvaluados]);
            fputcsv($output, ['Total clasificados:', $totalClasificados]);
            fputcsv($output, ['Total no clasificados:', $totalNoClasificados]);
            fputcsv($output, ['Total desclasificados:', $totalDesclasificados]);
            fputcsv($output, ['Clasificados migrados:', $cierreGeneral['clasificados_migrados'] ?? 0]);
            fputcsv($output, []);
            
            // Detalle por área
            fputcsv($output, ['DETALLE POR ÁREA']);
            fputcsv($output, [
                'Área',
                'Estado',
                'Participantes',
                'Evaluados',
                'Clasificados',
                'No Clasificados',
                'Desclasificados',
                '% Completitud',
                'Fecha Cierre',
                'Coordinador'
            ]);
            
            foreach ($areas as $area) {
                fputcsv($output, [
                    $area['area_nombre'],
                    $area['estado'] ?? 'pendiente',
                    $area['total_participantes'],
                    $area['total_evaluados'],
                    $area['clasificados_real'],
                    $area['no_clasificados'],
                    $area['desclasificados'],
                    number_format($area['porcentaje_completitud'] ?? 0, 2) . '%',
                    $area['fecha_cierre'] ?? 'N/A',
                    $area['coordinador_nombre'] ?? 'N/A'
                ]);
            }
            
            fclose($output);
            exit;

        } catch (Exception $e) {
            error_log('Error generando reporte consolidado: ' . $e->getMessage());
            Response::serverError('Error al generar reporte consolidado: ' . $e->getMessage());
        }
    }
}
