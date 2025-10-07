<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Config\Database;

class EvaluadorController
{
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

        Response::success($stats, 'Dashboard de evaluador');
    }

    // Evaluaciones existentes
    public function evaluaciones()
    {
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

        Response::success($evaluaciones, 'Lista de evaluaciones asignadas');
    }

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
}
