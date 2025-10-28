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
    private $db;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection(); // no llamar estáticamente
    }

    // Dashboard existente
    public function dashboard()
    {
        $stats = [
            'evaluaciones_asignadas' => 0,
            'evaluaciones_completadas' => 0,
            'evaluaciones_pendientes' => 0,
            'proyectos_evaluando' => 0
        ];

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
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

            Response::success([
                'evaluaciones_asignadas' => (int)$stats['evaluaciones_asignadas'],
                'evaluaciones_completadas' => (int)$stats['evaluaciones_completadas'],
                'evaluaciones_pendientes' => (int)$stats['evaluaciones_pendientes'],
                'proyectos_evaluando' => (int)$stats['evaluaciones_asignadas']
            ], 'Dashboard de evaluador');
        } catch (\Exception $e) {
            error_log('Error en dashboard evaluador: ' . $e->getMessage());
            Response::serverError('Error al obtener estadísticas');
        }
    }

    // Evaluaciones existentes
    public function evaluaciones()
    {
<<<<<<< HEAD
        try {
            $currentUser = JWTManager::getCurrentUser();
            $userId = $currentUser['id'];
            
            error_log("EvaluadorController::evaluaciones - User ID: " . $userId);
            
            $fase = $_GET['fase'] ?? 'clasificacion';
=======
        $evaluaciones = [
            [
                'id' => 1,
                'inscripcion_area_id' => 1,
                'olimpista_nombre' => 'Juan Pérez',
                'area_competencia' => 'Matemáticas',
                'nivel_competencia' => 'Intermedio',
                'estado' => 'inscrito',
                'fecha_asignacion' => '2024-01-01',
            ]
        ];
>>>>>>> 6fcafe8f12b74e00f431addda661127507b71a5f

           
            $sql = "SELECT 
                        ae.inscripcion_area_id,
                        ia.area_competencia_id,
                        ia.nivel_competencia_id,
                        o.nombre_completo as competidor,
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
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':userId', $userId, \PDO::PARAM_INT);
            $stmt->bindValue(':fase', $fase);
            $stmt->execute();
            $evaluaciones = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            error_log("EvaluadorController::evaluaciones - Raw data: " . print_r($evaluaciones, true));

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
                    'nivel_competencia_id' => $eval['nivel_competencia_id'],
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
<<<<<<< HEAD
    public function evaluarClasificacion()
    {
        try {
            $currentUser = \ForwardSoft\Utils\JWTManager::getCurrentUser();
            $evaluadorId = $currentUser['id'] ?? null;

            $data = json_decode(file_get_contents('php://input'), true);

            $inscripcionAreaId = $data['inscripcion_area_id'] ?? null;
            $puntuacion = isset($data['puntuacion']) ? $data['puntuacion'] : null;
            $observaciones = $data['observaciones'] ?? '';
            $desclasificado = !empty($data['desclasificado']) ? 1 : 0;
            $justificacion = $data['justificacion_desclasificacion'] ?? null;
            $isFinal = !empty($data['is_final']) ? 1 : 0;

            if (!$inscripcionAreaId || $puntuacion === null || $puntuacion === '') {
                \ForwardSoft\Utils\Response::badRequest('inscripcion_area_id y puntuacion son obligatorios');
                return;
            }

            if (trim((string)$observaciones) === '') {
                \ForwardSoft\Utils\Response::badRequest('La descripción conceptual es obligatoria');
                return;
            }

            if ($desclasificado && (trim((string)$justificacion) === '' || $justificacion === null)) {
                \ForwardSoft\Utils\Response::badRequest('Debe proporcionar justificación al desclasificar');
                return;
            }

            // Buscar si ya existe evaluación del evaluador para esa inscripcion_area
            $sqlCheck = "SELECT id FROM evaluaciones_clasificacion WHERE inscripcion_area_id = :inscripcion AND evaluador_id = :evaluador";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':inscripcion' => $inscripcionAreaId,
                ':evaluador' => $evaluadorId
            ]);
            $existing = $stmtCheck->fetch(\PDO::FETCH_ASSOC);

            if ($existing) {
                // Update
                $sqlUpdate = "UPDATE evaluaciones_clasificacion
                            SET puntuacion = :puntuacion,
                                observaciones = :observaciones,
                                desclasificado = :desclasificado,
                                justificacion_desclasificacion = :justificacion,
                                fecha_evaluacion = NOW(),
                                is_final = :is_final
                            WHERE id = :id";
                $stmt = $this->pdo->prepare($sqlUpdate);
                $stmt->execute([
                    ':puntuacion' => $puntuacion,
                    ':observaciones' => $observaciones,
                    ':desclasificado' => $desclasificado,
                    ':justificacion' => $justificacion,
                    ':id' => $existing['id'],
                    ':is_final' => $isFinal
                ]);
            } else {
                // Insert
                $sqlInsert = "INSERT INTO evaluaciones_clasificacion
                            (inscripcion_area_id, evaluador_id, puntuacion, observaciones, desclasificado, justificacion_desclasificacion, fecha_evaluacion, is_final)
                            VALUES (:inscripcion, :evaluador, :puntuacion, :observaciones, :desclasificado, :justificacion, NOW(), :is_final)";
                $stmt = $this->pdo->prepare($sqlInsert);
                $stmt->execute([
                    ':inscripcion' => $inscripcionAreaId,
                    ':evaluador' => $evaluadorId,
                    ':puntuacion' => $puntuacion,
                    ':observaciones' => $observaciones,
                    ':desclasificado' => $desclasificado,
                    ':justificacion' => $justificacion,
                    ':is_final' => $isFinal
                ]);
            }

            \ForwardSoft\Utils\Response::success(null, 'Evaluación guardada correctamente');
        } catch (\Exception $e) {
            error_log('Error evaluarClasificacion: ' . $e->getMessage());
            \ForwardSoft\Utils\Response::serverError('Error al guardar evaluación');
        }
    }

=======

    // Obtener olimpistas por área y nivel
    public function getOlimpistas($areaId, $nivelId)
    {
        $sql = "SELECT ia.id AS inscripcion_area_id,
                       o.id AS olimpista_id,
                       o.nombre_completo,
                       ec.nombre AS area,
                       nc.nombre AS nivel,
                       COALESCE(e.puntuacion, 0) AS nota
                FROM inscripciones_areas ia
                JOIN olimpistas o ON ia.olimpista_id = o.id
                JOIN areas_competencia ec ON ia.area_competencia_id = ec.id
                JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN evaluaciones_clasificacion e ON ia.id = e.inscripcion_area_id
                WHERE ia.area_competencia_id = :areaId
                  AND ia.nivel_competencia_id = :nivelId";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['areaId' => $areaId, 'nivelId' => $nivelId]);
        $competidores = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return Response::success($competidores, 'Lista de competidores');
    }

    // Guardar o actualizar nota de clasificación
    public function saveNotaClasificacion($inscripcionAreaId, $evaluadorId, $puntuacion, $observaciones = null)
    {
        if ($puntuacion < 0 || $puntuacion > 100) {
            return Response::error('La nota debe estar entre 0 y 100');
        }

        $this->db->beginTransaction();
        try {
            // Verificar si ya existe
            $sql = "SELECT * FROM evaluaciones_clasificacion 
                    WHERE inscripcion_area_id=:inscripcion AND evaluador_id=:evaluador";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['inscripcion' => $inscripcionAreaId, 'evaluador' => $evaluadorId]);
            $notaExistente = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($notaExistente) {
                // Guardar log de cambio
                $sqlLog = "INSERT INTO logs_cambios 
                            (tabla_afectada, registro_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id, accion)
                        VALUES 
                            ('evaluaciones_clasificacion', :rid, 'puntuacion', :old, :new, :uid, 'UPDATE')";
                $stmtLog = $this->db->prepare($sqlLog);
                $stmtLog->execute([
                    'rid' => $notaExistente['id'],
                    'old' => $notaExistente['puntuacion'],
                    'new' => $puntuacion,
                    'uid' => $evaluadorId
                ]);

                // Actualizar nota
                $sqlUpdate = "UPDATE evaluaciones_clasificacion 
                            SET puntuacion=:puntuacion, observaciones=:obs, fecha_evaluacion=NOW()
                            WHERE id=:id";
                $stmtUpdate = $this->db->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    'puntuacion' => $puntuacion,
                    'obs' => $observaciones,
                    'id' => $notaExistente['id']
                ]);
            } else {
                // Insertar nueva evaluación
                $sqlInsert = "INSERT INTO evaluaciones_clasificacion 
                            (inscripcion_area_id, evaluador_id, puntuacion, observaciones)
                            VALUES (:inscripcion, :evaluador, :puntuacion, :obs)";
                $stmtInsert = $this->db->prepare($sqlInsert);
                $stmtInsert->execute([
                    'inscripcion' => $inscripcionAreaId,
                    'evaluador' => $evaluadorId,
                    'puntuacion' => $puntuacion,
                    'obs' => $observaciones
                ]);
            }

            $this->db->commit();
            return Response::success('Nota registrada con éxito');

        } catch (\Exception $e) {
            $this->db->rollBack();
            return Response::error('Error al registrar la nota: ' . $e->getMessage());
        }
    }


    // Cerrar calificación y generar listas de clasificados
    public function cerrarCalificacion($areaId, $nivelId)
    {
        $sql = "SELECT ia.id AS inscripcion_area_id,
                    COALESCE(e.puntuacion, 0) AS nota
                FROM inscripciones_areas ia
                LEFT JOIN evaluaciones_clasificacion e ON ia.id = e.inscripcion_area_id
                WHERE ia.area_competencia_id=:areaId
                AND ia.nivel_competencia_id=:nivelId";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['areaId' => $areaId, 'nivelId' => $nivelId]);
        $competidores = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $clasificados = [];
        $noClasificados = [];
        $descalificados = [];

        $this->db->beginTransaction();
        try {
            foreach ($competidores as $c) {
                $fase = 'clasificacion';
                $nota = $c['nota'];
                $inscripcionId = $c['inscripcion_area_id'];
                $posicion = null; // Se puede calcular si quieres ranking

                if ($nota >= 51) {
                    $estado = 'clasificado';
                    $clasificados[] = $inscripcionId;
                } elseif ($nota > 0) {
                    $estado = 'no_clasificado';
                    $noClasificados[] = $inscripcionId;
                } else {
                    $estado = 'descalificado';
                    $descalificados[] = $inscripcionId;
                }

                // Actualizar estado en inscripciones_areas
                $sqlUpdate = "UPDATE inscripciones_areas SET estado=:estado, updated_at=NOW() WHERE id=:id";
                $stmtUpdate = $this->db->prepare($sqlUpdate);
                $stmtUpdate->execute(['estado' => $estado, 'id' => $inscripcionId]);

                // Insertar en resultados_finales
                $sqlRes = "INSERT INTO resultados_finales
                        (inscripcion_area_id, fase, posicion, medalla, puntuacion_final)
                        VALUES (:inscripcion, :fase, :pos, 'sin_medalla', :puntuacion)";
                $stmtRes = $this->db->prepare($sqlRes);
                $stmtRes->execute([
                    'inscripcion' => $inscripcionId,
                    'fase' => $fase,
                    'pos' => $posicion ?? 0,
                    'puntuacion' => $nota
                ]);
            }

            $this->db->commit();

            $resultado = [
                'clasificados' => $clasificados,
                'no_clasificados' => $noClasificados,
                'descalificados' => $descalificados
            ];

            return Response::success($resultado, 'Cierre de calificación generado');

        } catch (\Exception $e) {
            $this->db->rollBack();
            return Response::error('Error al cerrar calificación: ' . $e->getMessage());
        }
    }
>>>>>>> 6fcafe8f12b74e00f431addda661127507b71a5f
}
