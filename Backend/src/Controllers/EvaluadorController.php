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

            
            $sqlClasificacion = "SELECT 
                        COUNT(*) as evaluaciones_asignadas,
                        COUNT(CASE WHEN ec.id IS NOT NULL THEN 1 END) as evaluaciones_completadas,
                        COUNT(CASE WHEN ec.id IS NULL THEN 1 END) as evaluaciones_pendientes
                    FROM asignaciones_evaluacion ae
                    JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ae.inscripcion_area_id 
                                                           AND ec.evaluador_id = ae.evaluador_id
                    WHERE ae.evaluador_id = :userId AND ae.fase = 'clasificacion'";
            
            $stmt = $this->pdo->prepare($sqlClasificacion);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $statsClasificacion = $stmt->fetch(\PDO::FETCH_ASSOC);

            $sqlFinal = "SELECT 
                        COUNT(*) as evaluaciones_asignadas,
                        COUNT(CASE WHEN ef.id IS NOT NULL THEN 1 END) as evaluaciones_completadas,
                        COUNT(CASE WHEN ef.id IS NULL THEN 1 END) as evaluaciones_pendientes
                    FROM asignaciones_evaluacion ae
                    JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                    LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ae.inscripcion_area_id 
                                                       AND ef.evaluador_id = ae.evaluador_id
                    WHERE ae.evaluador_id = :userId AND ae.fase = 'final' AND ia.estado = 'clasificado'";
            
            $stmt = $this->pdo->prepare($sqlFinal);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $statsFinal = $stmt->fetch(\PDO::FETCH_ASSOC);

            Response::success([
                'fase_clasificacion' => [
                    'evaluaciones_asignadas' => (int)$statsClasificacion['evaluaciones_asignadas'],
                    'evaluaciones_completadas' => (int)$statsClasificacion['evaluaciones_completadas'],
                    'evaluaciones_pendientes' => (int)$statsClasificacion['evaluaciones_pendientes']
                ],
                'fase_final' => [
                    'evaluaciones_asignadas' => (int)$statsFinal['evaluaciones_asignadas'],
                    'evaluaciones_completadas' => (int)$statsFinal['evaluaciones_completadas'],
                    'evaluaciones_pendientes' => (int)$statsFinal['evaluaciones_pendientes']
                ],
                'evaluaciones_asignadas' => (int)$statsClasificacion['evaluaciones_asignadas'] + (int)$statsFinal['evaluaciones_asignadas'],
                'evaluaciones_completadas' => (int)$statsClasificacion['evaluaciones_completadas'] + (int)$statsFinal['evaluaciones_completadas'],
                'evaluaciones_pendientes' => (int)$statsClasificacion['evaluaciones_pendientes'] + (int)$statsFinal['evaluaciones_pendientes'],
                'proyectos_evaluando' => (int)$statsClasificacion['evaluaciones_asignadas'] + (int)$statsFinal['evaluaciones_asignadas']
            ], 'Dashboard de evaluador');
        } catch (\Exception $e) {
            error_log('Error en dashboard evaluador: ' . $e->getMessage());
            Response::serverError('Error al obtener estadísticas');
        }
    }

    public function getEvaluaciones()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];
            
            error_log("EvaluadorController::evaluaciones - User ID: " . $userId);
            
            $fase = $_GET['fase'] ?? 'clasificacion';
            
            $filtroEstado = '';
            if ($fase === 'final') {
                $filtroEstado = "AND ia.estado = 'clasificado'";
            }
           
            $sql = "SELECT 
                        ae.inscripcion_area_id,
                        ia.area_competencia_id,
                        ia.nivel_competencia_id,
                        ia.estado as inscripcion_estado,
                        o.nombre_completo as competidor,
                        o.documento_identidad,
                        o.grado_escolaridad,
                        ac.nombre as area_nombre,
                        nc.nombre as nivel_nombre,
                        COALESCE(ue.nombre, 'Sin institución') as institucion_nombre,
                        ae.fase,
                        ae.created_at as fecha_asignacion,
                        " . ($fase === 'final' ? "ef.id as evaluacion_id,
                        ef.puntuacion,
                        ef.observaciones,
                        ef.fecha_evaluacion,
                        NULL as is_final," : "ec.id as evaluacion_id,
                        ec.puntuacion,
                        ec.observaciones,
                        ec.fecha_evaluacion,
                        ec.is_final,") . "
                        CASE 
                            WHEN " . ($fase === 'final' ? "ef.id" : "ec.id") . " IS NOT NULL THEN 'evaluado'
                            ELSE 'pendiente'
                        END as estado
                    FROM asignaciones_evaluacion ae
                    JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                    JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    " . ($fase === 'final' ? 
                        "LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ae.inscripcion_area_id 
                            AND ef.evaluador_id = ae.evaluador_id" : 
                        "LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ae.inscripcion_area_id 
                            AND ec.evaluador_id = ae.evaluador_id") . "
                    WHERE ae.evaluador_id = :userId
                    AND ae.fase = :fase
                    " . $filtroEstado . "
                    ORDER BY ae.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->bindValue(':fase', $fase);
            $stmt->execute();
            $evaluaciones = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            error_log("EvaluadorController::evaluaciones - Raw data: " . print_r($evaluaciones, true));

            $resultado = array_map(function($eval) use ($fase) {
                error_log("EvaluadorController::evaluaciones - Processing eval: " . print_r($eval, true));
                
                $notaActual = null;
                if ($eval['puntuacion'] !== null && $eval['puntuacion'] !== '') {
                    $notaActual = (float)$eval['puntuacion'];
                }
                
                error_log("EvaluadorController::evaluaciones - Puntuacion: " . var_export($eval['puntuacion'], true) . ", Nota actual: " . var_export($notaActual, true));
                
                return [
                    'id' => $eval['inscripcion_area_id'],
                    'area_competencia_id' => $eval['area_competencia_id'],
                    'nivel_competencia_id' => $eval['nivel_competencia_id'],
                    'competidor' => $eval['competidor'],
                    'documento' => $eval['documento_identidad'],
                    'grado_escolaridad' => $eval['grado_escolaridad'] ?? null,
                    'area' => $eval['area_nombre'],
                    'nivel' => $eval['nivel_nombre'],
                    'institucion' => $eval['institucion_nombre'],
                    'fase' => $eval['fase'],
                    'inscripcion_estado' => $eval['inscripcion_estado'] ?? 'inscrito',
                    'fecha_asignacion' => $eval['fecha_asignacion'],
                    'estado' => $eval['estado'],
                    'nota_actual' => $notaActual,
                    'observaciones' => $eval['observaciones'],
                    'evaluacion_id' => $eval['evaluacion_id'],
                    'fecha_evaluacion' => $eval['fecha_evaluacion'],
                    'is_final' => $fase === 'final' ? true : ($eval['is_final'] === 't' || $eval['is_final'] === true)
                ];
            }, $evaluaciones);

            
            $faseClasificatoriaCerrada = false;
            $fechaCierreClasificatoria = null;
            if ($fase === 'clasificacion' || $fase === 'final') {
               
                $areaId = null;
                if (!empty($evaluaciones)) {
                    $areaId = $evaluaciones[0]['area_competencia_id'] ?? null;
                }
                
               
                if (!$areaId) {
                    $sqlArea = "SELECT DISTINCT ia.area_competencia_id 
                                FROM asignaciones_evaluacion ae
                                JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                                WHERE ae.evaluador_id = :userId
                                LIMIT 1";
                    $stmtArea = $this->pdo->prepare($sqlArea);
                    $stmtArea->bindValue(':userId', $userId, \PDO::PARAM_INT);
                    $stmtArea->execute();
                    $areaData = $stmtArea->fetch(\PDO::FETCH_ASSOC);
                    $areaId = $areaData['area_competencia_id'] ?? null;
                }
                
                if ($areaId) {
                    $sqlCierre = "SELECT estado, fecha_cierre 
                                  FROM cierre_fase_areas 
                                  WHERE area_competencia_id = :areaId 
                                  AND nivel_competencia_id IS NULL
                                  AND estado = 'cerrada'
                                  ORDER BY fecha_cierre DESC
                                  LIMIT 1";
                    $stmtCierre = $this->pdo->prepare($sqlCierre);
                    $stmtCierre->bindValue(':areaId', $areaId, \PDO::PARAM_INT);
                    $stmtCierre->execute();
                    $cierre = $stmtCierre->fetch(\PDO::FETCH_ASSOC);
                    
                    if ($cierre && $cierre['estado'] === 'cerrada') {
                        $faseClasificatoriaCerrada = true;
                        $fechaCierreClasificatoria = $cierre['fecha_cierre'];
                    }
                }
            }

            Response::success([
                'evaluaciones' => $resultado,
                'fase_cerrada' => $fase === 'clasificacion' ? $faseClasificatoriaCerrada : false,
                'fecha_cierre' => $fase === 'clasificacion' ? $fechaCierreClasificatoria : null,
                'fase_clasificatoria_cerrada' => $faseClasificatoriaCerrada,
                'fecha_cierre_clasificatoria' => $fechaCierreClasificatoria
            ], 'Lista de evaluaciones asignadas');
        } catch (\Exception $e) {
            error_log('Error en evaluaciones: ' . $e->getMessage());
            Response::serverError('Error al obtener evaluaciones: ' . $e->getMessage());
        }
    }

    public function getEstadisticas()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];

            $sql = "SELECT 
                        COUNT(DISTINCT ae.inscripcion_area_id) as total_asignadas,
                        COUNT(CASE WHEN ec.id IS NOT NULL THEN 1 END) as total_evaluadas,
                        COUNT(CASE WHEN ec.id IS NULL THEN 1 END) as pendientes,
                        ROUND(AVG(ec.puntuacion), 2) as promedio_puntuacion
                    FROM asignaciones_evaluacion ae
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ae.inscripcion honor_id 
                                                              AND ec.evaluador_id = ae.evaluador_id
                    WHERE ae.evaluador_id = :userId";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

            Response::success($stats, 'Estadísticas del evaluador');
        } catch (\Exception $e) {
            error_log('Error en getEstadisticas: ' . $e->getMessage());
            Response::serverError('Error al obtener estadísticas');
        }
    }

    public function verificarPermisosEvaluador()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];

            $sql = "SELECT id, coordinador_id, evaluador_id, start_date, start_time, duration_days, status,
                           (start_date + (duration_days || ' days')::interval) AS end_datetime
                    FROM permisos_evaluadores
                    WHERE evaluador_id = :userId
                    ORDER BY start_date DESC, start_time DESC
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $permiso = $stmt->fetch(\PDO::FETCH_ASSOC);

            $tienePermiso = false;
            $detalle = null;
            $now = new \DateTime('now');

            if ($permiso) {
                $start = new \DateTime($permiso['start_date'] . ' ' . $permiso['start_time']);
                $end = new \DateTime($permiso['end_datetime']);

                $tienePermiso = ($permiso['status'] === 'activo') && $now >= $start && $now <= $end;

                
                $coordStmt = $this->pdo->prepare("SELECT name FROM users WHERE id = :cid");
                $coordStmt->bindValue(':cid', $permiso['coordinador_id'], \PDO::PARAM_INT);
                $coordStmt->execute();
                $coordinadorName = $coordStmt->fetchColumn();

                
                $areaNombre = null;
                $areaDirectaStmt = $this->pdo->prepare("SELECT ac.nombre
                                                         FROM evaluadores_areas ea
                                                         JOIN areas_competencia ac ON ac.id = ea.area_competencia_id
                                                         WHERE ea.user_id = :uid AND ea.is_active = true
                                                         ORDER BY ea.fecha_asignacion DESC
                                                         LIMIT 1");
                $areaDirectaStmt->bindValue(':uid', $userId, \PDO::PARAM_INT);
                $areaDirectaStmt->execute();
                $areaNombre = $areaDirectaStmt->fetchColumn() ?: null;

                
                if (!$areaNombre) {
                    $areaStmt = $this->pdo->prepare("SELECT ac.nombre
                                                      FROM asignaciones_evaluacion ae
                                                      JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                                                      JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                                                      WHERE ae.evaluador_id = :uid
                                                      ORDER BY ae.created_at DESC
                                                      LIMIT 1");
                    $areaStmt->bindValue(':uid', $userId, \PDO::PARAM_INT);
                    $areaStmt->execute();
                    $areaNombre = $areaStmt->fetchColumn() ?: null;
                }

                
                $configAreaInfo = null;
                if ($areaNombre) {
                    $areaStmt = $this->pdo->prepare("SELECT id FROM areas_competencia WHERE nombre = ? LIMIT 1");
                    $areaStmt->execute([$areaNombre]);
                    $areaId = $areaStmt->fetchColumn();
                    
                    if ($areaId) {
                        $configAreaModel = new \ForwardSoft\Models\ConfiguracionAreaEvaluacion();
                        $configArea = $configAreaModel->getByAreaId($areaId);
                        
                        if ($configArea) {
                            $configAreaInfo = [
                                'tiempo_evaluacion_minutos' => (int)$configArea['tiempo_evaluacion_minutos'],
                                'periodo_evaluacion_inicio' => $configArea['periodo_evaluacion_inicio'],
                                'periodo_evaluacion_fin' => $configArea['periodo_evaluacion_fin'],
                                'periodo_publicacion_inicio' => $configArea['periodo_publicacion_inicio'],
                                'periodo_publicacion_fin' => $configArea['periodo_publicacion_fin'],
                                'dentro_periodo_configurado' => $now >= new \DateTime($configArea['periodo_evaluacion_inicio']) && 
                                                                 $now <= new \DateTime($configArea['periodo_evaluacion_fin'])
                            ];
                        }
                    }
                }

                $detalle = [
                    'id' => (int)$permiso['id'],
                    'coordinador_id' => (int)$permiso['coordinador_id'],
                    'evaluador_id' => (int)$permiso['evaluador_id'],
                    'start_date' => $permiso['start_date'],
                    'start_time' => $permiso['start_time'],
                    'duration_days' => (int)$permiso['duration_days'],
                    'status' => $permiso['status'],
                    'end_datetime' => $permiso['end_datetime'],
                   
                    'fecha_inicio' => $start->format(DATE_ATOM),
                    'fecha_fin' => $end->format(DATE_ATOM),
                    'coordinador' => $coordinadorName ?: null,
                    'area' => $areaNombre ?: null,
                    'configuracion_area' => $configAreaInfo,
                ];
            }

            Response::success([
                'tiene_permiso' => $tienePermiso,
                'permiso' => $detalle
            ], 'Permisos del evaluador');
        } catch (\Exception $e) {
            error_log('Error en verificarPermisosEvaluador: ' . $e->getMessage());
            Response::serverError('Error al verificar permisos');
        }
    }
}
