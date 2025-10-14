<?php

namespace ForwardSoft\Utils;

use ForwardSoft\Config\Database;

class AuditService
{
    private static $db;
    
    public static function init()
    {
        if (!self::$db) {
            self::$db = Database::getInstance()->getConnection();
        }
    }
    
    /**
     * Registrar una acción en el log de auditoría
     */
    public static function log($usuarioId, $usuarioNombre, $accion, $entidad, $entidadId = null, $descripcion = '', $datosAnteriores = null, $datosNuevos = null)
    {
        self::init();
        
        try {
            $sql = "INSERT INTO log_auditoria (
                usuario_id, 
                usuario_nombre, 
                accion, 
                entidad, 
                entidad_id, 
                descripcion, 
                datos_anteriores, 
                datos_nuevos, 
                ip_address, 
                user_agent, 
                fecha_accion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = self::$db->prepare($sql);
            $stmt->execute([
                $usuarioId,
                $usuarioNombre,
                $accion,
                $entidad,
                $entidadId,
                $descripcion,
                $datosAnteriores ? json_encode($datosAnteriores) : null,
                $datosNuevos ? json_encode($datosNuevos) : null,
                self::getClientIP(),
                self::getUserAgent()
            ]);
            
            return true;
        } catch (\Exception $e) {
            error_log("Error en AuditService::log: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Registrar evaluación de clasificación
     */
    public static function logEvaluacionClasificacion($usuarioId, $usuarioNombre, $evaluacionId, $inscripcionId, $datosNuevos, $datosAnteriores = null)
    {
        $accion = $datosAnteriores ? 'MODIFICAR_EVALUACION' : 'EVALUAR_CLASIFICACION';
        $descripcion = $datosAnteriores ? 'Modificación de nota de clasificación' : 'Registro de nota de clasificación';
        
        return self::log(
            $usuarioId,
            $usuarioNombre,
            $accion,
            'evaluacion_clasificacion',
            $evaluacionId,
            $descripcion,
            $datosAnteriores,
            $datosNuevos
        );
    }
    
    /**
     * Registrar evaluación final
     */
    public static function logEvaluacionFinal($usuarioId, $usuarioNombre, $evaluacionId, $inscripcionId, $datosNuevos, $datosAnteriores = null)
    {
        $accion = $datosAnteriores ? 'MODIFICAR_EVALUACION_FINAL' : 'EVALUAR_FINAL';
        $descripcion = $datosAnteriores ? 'Modificación de nota final' : 'Registro de nota final';
        
        return self::log(
            $usuarioId,
            $usuarioNombre,
            $accion,
            'evaluacion_final',
            $evaluacionId,
            $descripcion,
            $datosAnteriores,
            $datosNuevos
        );
    }
    
    /**
     * Registrar cierre de calificación
     */
    public static function logCierreCalificacion($usuarioId, $usuarioNombre, $areaId, $nivelId, $datos)
    {
        return self::log(
            $usuarioId,
            $usuarioNombre,
            'CERRAR_CALIFICACION',
            'area_competencia',
            $areaId,
            "Cierre de calificación para área {$areaId} y nivel {$nivelId}",
            null,
            $datos
        );
    }
    
    /**
     * Registrar login de usuario
     */
    public static function logLogin($usuarioId, $usuarioNombre, $exitoso = true)
    {
        $accion = $exitoso ? 'LOGIN_EXITOSO' : 'LOGIN_FALLIDO';
        $descripcion = $exitoso ? 'Inicio de sesión exitoso' : 'Intento de inicio de sesión fallido';
        
        return self::log(
            $usuarioId,
            $usuarioNombre,
            $accion,
            'usuario',
            $usuarioId,
            $descripcion
        );
    }
    
    /**
     * Registrar logout de usuario
     */
    public static function logLogout($usuarioId, $usuarioNombre)
    {
        return self::log(
            $usuarioId,
            $usuarioNombre,
            'LOGOUT',
            'usuario',
            $usuarioId,
            'Cierre de sesión'
        );
    }
    
    /**
     * Obtener IP del cliente
     */
    private static function getClientIP()
    {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Obtener User Agent del cliente
     */
    private static function getUserAgent()
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    }
    
    /**
     * Obtener logs de auditoría con filtros
     */
    public static function getLogs($filtros = [])
    {
        self::init();
        
        $where = [];
        $params = [];
        
        if (!empty($filtros['usuario_id'])) {
            $where[] = "usuario_id = ?";
            $params[] = $filtros['usuario_id'];
        }
        
        if (!empty($filtros['accion'])) {
            $where[] = "accion = ?";
            $params[] = $filtros['accion'];
        }
        
        if (!empty($filtros['entidad'])) {
            $where[] = "entidad = ?";
            $params[] = $filtros['entidad'];
        }
        
        if (!empty($filtros['fecha_desde'])) {
            $where[] = "fecha_accion >= ?";
            $params[] = $filtros['fecha_desde'];
        }
        
        if (!empty($filtros['fecha_hasta'])) {
            $where[] = "fecha_accion <= ?";
            $params[] = $filtros['fecha_hasta'];
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $sql = "SELECT * FROM log_auditoria {$whereClause} ORDER BY fecha_accion DESC LIMIT 1000";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
