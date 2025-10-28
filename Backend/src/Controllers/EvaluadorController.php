<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Config\Database;

class EvaluadorController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function dashboard()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];

            error_log("========== EvaluadorController::dashboard ==========");
            error_log("User ID: " . $userId);

            // Obtener estadísticas reales del evaluador
            $sql = "SELECT 
                        COUNT(*) as evaluaciones_asignadas,
                        COUNT(CASE WHEN ec.id IS NOT NULL THEN 1 END) as evaluaciones_completadas,
                        COUNT(CASE WHEN ec.id IS NULL THEN 1 END) as evaluaciones_pendientes
                    FROM asignaciones_evaluacion ae
                    JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ae.inscripcion_area_id 
                                                           AND ec.evaluador_id = ae.evaluador_id
                    WHERE ae.evaluador_id = :userId AND ae.fase = 'clasificacion'";
            
            error_log("SQL Query: " . $sql);
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

            error_log("Stats result: " . json_encode($stats));

            Response::success([
                'evaluaciones_asignadas' => (int)$stats['evaluaciones_asignadas'],
                'evaluaciones_completadas' => (int)$stats['evaluaciones_completadas'],
                'evaluaciones_pendientes' => (int)$stats['evaluaciones_pendientes'],
                'proyectos_evaluando' => (int)$stats['evaluaciones_asignadas']
            ], 'Dashboard de evaluador');
        } catch (\Exception $e) {
            error_log('Error en dashboard evaluador: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al obtener estadísticas: ' . $e->getMessage());
        }
    }

    public function evaluaciones()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];
            
            error_log("========== EvaluadorController::evaluaciones ==========");
            error_log("User ID: " . $userId);
            error_log("User Data: " . json_encode($currentUser));

            $fase = $_GET['fase'] ?? 'clasificacion';
           
            $sql = "SELECT 
                        ae.inscripcion_area_id,
                        ia.area_competencia_id,
                        ia.nivel_competencia_id,
                        o.nombre as competidor,
                        o.documento_identidad,
                        ac.nombre as area_nombre,
                        nc.nombre as nivel_nombre,
                        COALESCE(ue.nombre, 'Sin institución') as institucion_nombre,
                        ae.fase,
                        ae.created_at as fecha_asignacion,
                        ec.id as evaluacion_id,
                        ec.puntuacion,
                        ec.observaciones,
                        ec.fecha_evaluacion,
                        ec.is_final,
                        CASE 
                            WHEN ia.estado = 'descalificado' THEN 'descalificado'
                            WHEN ec.id IS NOT NULL THEN 'evaluado'
                            ELSE 'pendiente'
                        END as estado
                    FROM asignaciones_evaluacion ae
                    JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                    JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ae.inscripcion_area_id 
                        AND ec.evaluador_id = ae.evaluador_id
                    WHERE ae.evaluador_id = :userId AND ae.fase = :fase
                    ORDER BY ae.created_at DESC";
            
            error_log("SQL Query: " . $sql);
            error_log("Parameters: userId=$userId, fase=$fase");
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->bindValue(':fase', $fase);
            $stmt->execute();
            $evaluaciones = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            error_log("Raw data count: " . count($evaluaciones));
            if (count($evaluaciones) > 0) {
                error_log("First evaluation: " . json_encode($evaluaciones[0]));
            }

            // Formatear datos para el frontend
            $resultado = array_map(function($eval) {
                error_log("EvaluadorController::evaluaciones - Processing eval: " . print_r($eval, true));
                
                $notaActual = null;
                if ($eval['puntuacion'] !== null && $eval['puntuacion'] !== '') {
                    $notaActual = (float)$eval['puntuacion'];
                }
                
                error_log("EvaluadorController::evaluaciones - Puntuacion: " . var_export($eval['puntuacion'], true) . ", Nota actual: " . var_export($notaActual, true));
                
                return [
                    'id' => $eval['inscripcion_area_id'],
                    'area_competencia_id' => $eval['area_competencia_id'],
                    'area_id' => $eval['area_competencia_id'], // Alias para compatibilidad
                    'nivel_competencia_id' => $eval['nivel_competencia_id'],
                    'nivel_id' => $eval['nivel_competencia_id'], // Alias para compatibilidad
                    'competidor' => $eval['competidor'],
                    'documento' => $eval['documento_identidad'],
                    'area' => $eval['area_nombre'],
                    'nivel' => $eval['nivel_nombre'],
                    'institucion' => $eval['institucion_nombre'],
                    'fase' => $eval['fase'],
                    'fecha_asignacion' => $eval['fecha_asignacion'],
                    'estado' => $eval['estado'],
                    'nota_actual' => $notaActual,
                    'observaciones' => $eval['observaciones'],
                    'evaluacion_id' => $eval['evaluacion_id'],
                    'fecha_evaluacion' => $eval['fecha_evaluacion'],
                    'is_final' => $eval['is_final'] === 't' || $eval['is_final'] === true
                ];
            }, $evaluaciones);

            Response::success($resultado, 'Lista de evaluaciones asignadas');
        } catch (\Exception $e) {
            error_log('Error en evaluaciones: ' . $e->getMessage());
            Response::serverError('Error al obtener evaluaciones: ' . $e->getMessage());
        }
    }

    public function getEstadisticas()
    {
        $this->dashboard();
    }

    public function getEvaluaciones()
    {
        $this->evaluaciones();
    }

    public function verificarPermisosEvaluador()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];
            
            error_log("🔍 Verificando permisos para evaluador ID: " . $userId);
            
            $sql = "
                SELECT 
                    pe.id,
                    pe.start_date,
                    pe.start_time,
                    pe.duration_days,
                    pe.status,
                    u.name as coordinador_nombre,
                    ac.nombre as area_nombre
                FROM permisos_evaluadores pe
                JOIN users u ON u.id = pe.coordinador_id
                JOIN evaluadores_areas ea ON ea.user_id = pe.evaluador_id
                JOIN areas_competencia ac ON ac.id = ea.area_competencia_id
                WHERE pe.evaluador_id = ? 
                AND pe.status = 'activo'
                AND pe.start_date <= CURRENT_DATE
                AND (pe.start_date + INTERVAL '1 day' * pe.duration_days) >= CURRENT_DATE
                ORDER BY pe.created_at DESC
                LIMIT 1
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $permiso = $stmt->fetch();

            error_log("📊 Resultado de la consulta: " . json_encode($permiso));

            if ($permiso) {
                $fechaInicio = new \DateTime($permiso['start_date']);
                $fechaFin = clone $fechaInicio;
                $fechaFin->add(new \DateInterval('P' . $permiso['duration_days'] . 'D'));
                
                Response::success([
                    'tiene_permiso' => true,
                    'permiso' => [
                        'id' => $permiso['id'],
                        'fecha_inicio' => $permiso['start_date'],
                        'hora_inicio' => $permiso['start_time'],
                        'fecha_fin' => $fechaFin->format('Y-m-d'),
                        'duracion_dias' => $permiso['duration_days'],
                        'coordinador' => $permiso['coordinador_nombre'],
                        'area' => $permiso['area_nombre'],
                        'estado' => $permiso['status']
                    ]
                ], 'Evaluador tiene permisos activos');
            } else {
                Response::success([
                    'tiene_permiso' => false,
                    'mensaje' => 'No tiene permisos activos para registrar notas'
                ], 'Evaluador sin permisos activos');
            }

        } catch (\Exception $e) {
            error_log('Error verificando permisos del evaluador: ' . $e->getMessage());
            Response::serverError('Error al verificar permisos: ' . $e->getMessage());
        }
    }
}
