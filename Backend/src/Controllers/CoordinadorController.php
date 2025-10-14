<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Utils\AuditService;
use ForwardSoft\Utils\LogCambiosNotas;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\User;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\EvaluacionFinal;
use PDO;

class CoordinadorController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
    }
    public function dashboard()
    {
        $stats = [
           
            'proyectos_activos' => 0,
            'evaluaciones_pendientes' => 0,
            'evaluadores_disponibles' => 0
        ];

        Response::success($stats, 'Dashboard de coordinador');
    }

    
    public function test()
    {
        try {
         
            $sql = "SELECT COUNT(*) as total FROM areas_competencia";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success([
                'message' => 'CoordinadorController funcionando',
                'database_connection' => 'OK',
                'areas_count' => $result['total']
            ], 'Test exitoso');
        } catch (\Exception $e) {
            Response::error('Error de base de datos: ' . $e->getMessage(), 500);
        }
    }

    public function proyectos()
    {
       
        $proyectos = [
            [
                'id' => 1,
                'nombre' => 'Proyecto de ejemplo',
                'descripcion' => 'Descripción del proyecto',
                'estado' => 'activo',
                'fecha_inicio' => '2024-01-01',
                'fecha_fin' => '2024-12-31'
            ]
        ];

        Response::success($proyectos, 'Lista de proyectos');
    }

    
    public function getAreasNiveles()
    {
        try {
            
            $sqlAreas = "SELECT id, nombre, descripcion FROM areas_competencia WHERE is_active = true ORDER BY orden_display, nombre";
            $stmtAreas = $this->pdo->prepare($sqlAreas);
            $stmtAreas->execute();
            $areas = $stmtAreas->fetchAll(PDO::FETCH_ASSOC);

            
            $sqlNiveles = "SELECT id, nombre, descripcion FROM niveles_competencia WHERE is_active = true ORDER BY orden_display, nombre";
            $stmtNiveles = $this->pdo->prepare($sqlNiveles);
            $stmtNiveles->execute();
            $niveles = $stmtNiveles->fetchAll(PDO::FETCH_ASSOC);

            
            $rondas = [];
            try {
                $sqlRondas = "SELECT id, nombre, descripcion, area_competencia_id, nivel_competencia_id, estado 
                              FROM rondas_asignacion 
                              WHERE estado IN ('pendiente', 'activa') 
                              ORDER BY created_at DESC";
                $stmtRondas = $this->pdo->prepare($sqlRondas);
                $stmtRondas->execute();
                $rondas = $stmtRondas->fetchAll(PDO::FETCH_ASSOC);
            } catch (\Exception $e) {
                
                error_log('Tabla rondas_asignacion no existe: ' . $e->getMessage());
                $rondas = [];
            }

            Response::success([
                'areas' => $areas,
                'niveles' => $niveles,
                'rondas' => $rondas
            ], 'Catálogos obtenidos');
        } catch (\Exception $e) {
            error_log('Error en getAreasNiveles: ' . $e->getMessage());
            Response::serverError('Error al obtener catálogos: ' . $e->getMessage());
        }
    }

    
    public function generarAsignaciones()
    {
        $currentUser = JWTManager::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            Response::validationError(['general' => 'Datos inválidos']);
        }

        $areaId = (int)($input['area_id'] ?? 0);
        $nivelId = isset($input['nivel_id']) ? (int)$input['nivel_id'] : null;
        $rondaId = isset($input['ronda_id']) ? (int)$input['ronda_id'] : null;
        $fase = $input['fase'] ?? 'clasificacion';
        $numEval = max(1, min(5, (int)($input['num_evaluadores'] ?? 2)));
        $metodo = $input['metodo'] ?? 'simple';
        $evitarMismaIE = (bool)($input['evitar_misma_institucion'] ?? true);
        $evitarMismaArea = (bool)($input['evitar_misma_area'] ?? true);
        $confirmar = (bool)($input['confirmar'] ?? false);

        if ($areaId <= 0 || !in_array($fase, ['clasificacion','premiacion'])) {
            Response::validationError(['area_id' => 'Parámetros requeridos inválidos']);
        }

        
        $whereNivel = $nivelId ? ' AND ia.nivel_competencia_id = :nivelId' : '';
        $sqlIns = "SELECT ia.id as inscripcion_area_id, o.nombre_completo, ue.id as unidad_id, ue.nombre as unidad_nombre, 
                          ia.area_competencia_id, ac.nombre as area_nombre, nc.nombre as nivel_nombre
                   FROM inscripciones_areas ia
                   JOIN olimpistas o ON o.id = ia.olimpista_id
                   JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                   JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                   JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                   WHERE ia.area_competencia_id = :areaId" . $whereNivel;
        $stmt = $this->pdo->prepare($sqlIns);
        $stmt->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        if ($nivelId) $stmt->bindValue(':nivelId', $nivelId, PDO::PARAM_INT);
        $stmt->execute();
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        
        $sqlEval = "SELECT u.id, u.name, u.email, ea.area_competencia_id, 
                           'Sin institución' as institucion_nombre,
                           0 as institucion_id
                    FROM evaluadores_areas ea 
                    JOIN users u ON u.id = ea.user_id
                    WHERE ea.area_competencia_id = :areaId AND ea.is_active = true AND u.is_active = true";
        $stmtE = $this->pdo->prepare($sqlEval);
        $stmtE->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtE->execute();
        $evaluadores = $stmtE->fetchAll(PDO::FETCH_ASSOC) ?: [];

        if (empty($inscripciones) || empty($evaluadores)) {
            Response::success(['items' => [], 'total' => 0, 'mensaje' => 'Sin datos suficientes para asignar'], 'Sin datos suficientes');
        }

       
        $resultado = [];
        $asignacionesGeneradas = [];
        
        foreach ($inscripciones as $ins) {
            $pool = $evaluadores;
            
            
            if ($evitarMismaIE) {
                // Filtrar evaluadores de la misma institución
                $pool = array_filter($pool, function($eval) use ($ins) {
                    return $eval['institucion_id'] != $ins['unidad_id'];
                });
            }
            
            if ($evitarMismaArea) {
                // Ya filtrado por área en la consulta
            }

            if (empty($pool)) {
                // Si no hay evaluadores disponibles después de filtros, usar todos
                $pool = $evaluadores;
            }

            $asignados = [];
            
            if ($metodo === 'simple') {
                // Asignación aleatoria simple
                $poolIdx = array_keys($pool);
                shuffle($poolIdx);
                foreach ($poolIdx as $idx) {
                    $asignados[] = (int)$pool[$idx]['id'];
                    if (count($asignados) >= $numEval) break;
                }
            } else {
                // Asignación balanceada por área
                $asignados = $this->asignacionBalanceada($pool, $numEval, $asignacionesGeneradas);
            }

            $resultado[] = [
                'inscripcion_area_id' => (int)$ins['inscripcion_area_id'],
                'competidor' => $ins['nombre_completo'],
                'area' => $ins['area_nombre'],
                'nivel' => $ins['nivel_nombre'],
                'institucion' => $ins['unidad_nombre'],
                'evaluadores' => $asignados,
                'evaluadores_info' => array_map(function($id) use ($evaluadores) {
                    $eval = array_filter($evaluadores, fn($e) => $e['id'] == $id);
                    return reset($eval);
                }, $asignados)
            ];
            
            
            foreach ($asignados as $evalId) {
                $asignacionesGeneradas[$evalId] = ($asignacionesGeneradas[$evalId] ?? 0) + 1;
            }
        }

        
        if ($confirmar) {
            $this->pdo->beginTransaction();
            try {
                
                $delete = $this->pdo->prepare("DELETE FROM asignaciones_evaluacion 
                                              WHERE inscripcion_area_id IN (
                                                  SELECT ia.id FROM inscripciones_areas ia 
                                                  WHERE ia.area_competencia_id = ?
                                              ) AND fase = ?");
                $delete->execute([$areaId, $fase]);
                
                $insert = $this->pdo->prepare("INSERT INTO asignaciones_evaluacion(inscripcion_area_id, evaluador_id, fase, creado_por) VALUES (?, ?, ?, ?)");
                foreach ($resultado as $item) {
                    foreach ($item['evaluadores'] as $evId) {
                        $insert->execute([$item['inscripcion_area_id'], $evId, $fase, $currentUser['id']]);
                    }
                }
                $this->pdo->commit();
            } catch (\Exception $e) {
                $this->pdo->rollBack();
                error_log('Error guardando asignaciones: ' . $e->getMessage());
                Response::serverError('No se pudo guardar la asignación');
            }
        }

        Response::success([
            'items' => $resultado, 
            'total' => count($resultado),
            'estadisticas' => [
                'total_inscripciones' => count($inscripciones),
                'total_evaluadores' => count($evaluadores),
                'evaluadores_por_inscripcion' => $numEval,
                'metodo' => $metodo
            ]
        ], $confirmar ? 'Asignación guardada exitosamente' : 'Previsualización generada');
    }

   
    private function asignacionBalanceada($evaluadores, $numEval, $asignacionesPrevias = [])
    {
        
        usort($evaluadores, function($a, $b) use ($asignacionesPrevias) {
            $countA = $asignacionesPrevias[$a['id']] ?? 0;
            $countB = $asignacionesPrevias[$b['id']] ?? 0;
            return $countA - $countB;
        });

        $asignados = [];
        for ($i = 0; $i < $numEval && $i < count($evaluadores); $i++) {
            $asignados[] = (int)$evaluadores[$i]['id'];
        }

        return $asignados;
    }

    public function listarAsignacionesPorArea($areaId)
    {
        $fase = $_GET['fase'] ?? 'clasificacion';
        $nivelId = $_GET['nivel_id'] ?? null;

        $sql = "SELECT aa.inscripcion_area_id, aa.evaluador_id, u.name as evaluador_nombre, aa.fase,
                       o.nombre_completo as competidor, ac.nombre as area_nombre, nc.nombre as nivel_nombre,
                       ue.nombre as institucion_competidor
                FROM asignaciones_evaluacion aa
                JOIN inscripciones_areas ia ON ia.id = aa.inscripcion_area_id
                JOIN users u ON u.id = aa.evaluador_id
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                WHERE ia.area_competencia_id = :areaId AND aa.fase = :fase" . ($nivelId ? " AND ia.nivel_competencia_id = :nivelId" : "");
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':areaId', (int)$areaId, PDO::PARAM_INT);
        $stmt->bindValue(':fase', $fase);
        if ($nivelId) $stmt->bindValue(':nivelId', (int)$nivelId, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        Response::success($rows, 'Asignaciones obtenidas');
    }

    
    public function exportarAsignaciones($areaId)
    {
        try {
            $fase = $_GET['fase'] ?? 'clasificacion';
            $nivelId = $_GET['nivel_id'] ?? null;

            error_log("Exportando asignaciones - AreaId: $areaId, Fase: $fase, NivelId: " . ($nivelId ?? 'null'));

            $sql = "SELECT o.nombre_completo as competidor, ac.nombre as area, nc.nombre as nivel,
                           COALESCE(ue.nombre, 'Sin institución') as institucion, u.name as evaluador, u.email as evaluador_email
                    FROM asignaciones_evaluacion aa
                    JOIN inscripciones_areas ia ON ia.id = aa.inscripcion_area_id
                    JOIN users u ON u.id = aa.evaluador_id
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                    JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    WHERE ia.area_competencia_id = :areaId AND aa.fase = :fase" . ($nivelId ? " AND ia.nivel_competencia_id = :nivelId" : "") . "
                    ORDER BY o.nombre_completo, u.name";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':areaId', (int)$areaId, PDO::PARAM_INT);
        $stmt->bindValue(':fase', $fase);
        if ($nivelId) $stmt->bindValue(':nivelId', (int)$nivelId, PDO::PARAM_INT);
        $stmt->execute();
        $asignaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        
        $agrupadas = [];
        foreach ($asignaciones as $asig) {
            $key = $asig['competidor'];
            if (!isset($agrupadas[$key])) {
                $agrupadas[$key] = [
                    'competidor' => $asig['competidor'],
                    'area' => $asig['area'],
                    'nivel' => $asig['nivel'],
                    'institucion' => $asig['institucion'],
                    'evaluadores' => []
                ];
            }
            $agrupadas[$key]['evaluadores'][] = $asig['evaluador'] . ' (' . $asig['evaluador_email'] . ')';
        }

        
        $csv = "Competidor,Área,Nivel,Institución,Evaluadores\n";
        foreach ($agrupadas as $item) {
            $csv .= '"' . $item['competidor'] . '","' . $item['area'] . '","' . $item['nivel'] . '","' . $item['institucion'] . '","' . implode('; ', $item['evaluadores']) . '"' . "\n";
        }

            $filename = 'asignaciones_' . $areaId . '_' . $fase . '_' . date('Y-m-d_H-i-s') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo $csv;
            exit;
            
        } catch (\Exception $e) {
            error_log('Error exportando asignaciones: ' . $e->getMessage());
            Response::serverError('Error al exportar asignaciones: ' . $e->getMessage());
        }
    }

    
    public function crearRonda()
    {
        $currentUser = JWTManager::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['nombre'])) {
            Response::validationError(['nombre' => 'Nombre de ronda requerido']);
        }

        $nombre = trim($input['nombre']);
        $descripcion = trim($input['descripcion'] ?? '');
        $areaId = isset($input['area_id']) ? (int)$input['area_id'] : null;
        $nivelId = isset($input['nivel_id']) ? (int)$input['nivel_id'] : null;
        $fechaInicio = $input['fecha_inicio'] ?? null;
        $fechaFin = $input['fecha_fin'] ?? null;

        try {
            $sql = "INSERT INTO rondas_asignacion (nombre, descripcion, area_competencia_id, nivel_competencia_id, fecha_inicio, fecha_fin, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, 'pendiente')";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$nombre, $descripcion, $areaId, $nivelId, $fechaInicio, $fechaFin]);
            
            $rondaId = $this->pdo->lastInsertId();
            
            Response::success(['id' => $rondaId, 'nombre' => $nombre], 'Ronda creada exitosamente');
        } catch (\Exception $e) {
            error_log('Error creando ronda: ' . $e->getMessage());
            Response::serverError('No se pudo crear la ronda');
        }
    }

   
    public function cerrarCalificacion()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['area_id']) || !isset($input['nivel_id'])) {
                Response::validationError(['general' => 'Se requieren area_id y nivel_id']);
            }
            
            $areaId = (int)$input['area_id'];
            $nivelId = (int)$input['nivel_id'];
            $fase = $input['fase'] ?? 'clasificacion';
            
            $currentUser = JWTManager::getCurrentUser();
            
            
            $sql = "SELECT COUNT(*) as total, 
                           COUNT(ec.id) as evaluadas
                    FROM inscripciones_areas ia
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ? AND ia.nivel_competencia_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $nivelId]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($resultado['total'] == 0) {
                Response::validationError(['general' => 'No hay participantes inscritos en esta área y nivel']);
            }
            
            if ($resultado['evaluadas'] < $resultado['total']) {
                $pendientes = $resultado['total'] - $resultado['evaluadas'];
                Response::validationError(['general' => "Faltan {$pendientes} evaluaciones por completar"]);
            }
            
           
            $listas = $this->generarListasClasificacion($areaId, $nivelId, $fase);
            
            
            $sql = "UPDATE rondas_asignacion 
                    SET estado = 'cerrado', fecha_cierre = NOW() 
                    WHERE area_competencia_id = ? AND nivel_competencia_id = ? AND estado = 'activo'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $nivelId]);
            
            
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                $areaId,
                $nivelId,
                [
                    'fase' => $fase,
                    'total_participantes' => $resultado['total'],
                    'listas_generadas' => $listas
                ]
            );
            
            Response::success([
                'area_id' => $areaId,
                'nivel_id' => $nivelId,
                'fase' => $fase,
                'total_participantes' => $resultado['total'],
                'listas' => $listas
            ], 'Calificación cerrada exitosamente');
            
        } catch (\Exception $e) {
            error_log('Error cerrando calificación: ' . $e->getMessage());
            Response::serverError('No se pudo cerrar la calificación');
        }
    }

   
    public function generarListasClasificacion($areaId, $nivelId, $fase)
    {
        try {
            
            $sql = "SELECT ia.id, o.nombre_completo, ec.puntuacion, ec.observaciones
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ? AND ia.nivel_competencia_id = ?
                    ORDER BY ec.puntuacion DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $nivelId]);
            $evaluaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $total = count($evaluaciones);
            $clasificados = [];
            $noClasificados = [];
            $descalificados = [];
            
            
            $porcentajeClasificados = 0.6; 
            $puntuacionMinima = 50; 
            
            $limiteClasificados = (int)($total * $porcentajeClasificados);
            
            foreach ($evaluaciones as $index => $eval) {
                $puntuacion = (float)$eval['puntuacion'];
                
                if ($puntuacion < $puntuacionMinima) {
                    $descalificados[] = $eval;
                } elseif ($index < $limiteClasificados) {
                    $clasificados[] = $eval;
                } else {
                    $noClasificados[] = $eval;
                }
            }
            
            return [
                'clasificados' => $clasificados,
                'no_clasificados' => $noClasificados,
                'descalificados' => $descalificados,
                'total' => $total,
                'criterios' => [
                    'porcentaje_clasificados' => $porcentajeClasificados,
                    'puntuacion_minima' => $puntuacionMinima
                ]
            ];
            
        } catch (\Exception $e) {
            error_log('Error generando listas: ' . $e->getMessage());
            throw $e;
        }
    }

    
    public function getParticipantesConEvaluaciones()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            $nivelId = $_GET['nivel_id'] ?? null;
            $fase = $_GET['fase'] ?? 'clasificacion';
            
            if (!$areaId) {
                Response::validationError(['area_id' => 'El área es requerida']);
            }
            
            
            $sql = "SELECT ia.id as inscripcion_area_id,
                           o.nombre_completo,
                           o.documento_identidad,
                           ue.nombre as unidad_educativa_nombre,
                           d.nombre as departamento_nombre,
                           ac.nombre as area_nombre,
                           nc.nombre as nivel_nombre,
                           ec.puntuacion,
                           ec.observaciones,
                           ec.fecha_evaluacion,
                           ec.evaluador_id,
                           u.name as evaluador_nombre,
                           u.email as evaluador_email,
                           CASE 
                               WHEN ec.puntuacion IS NULL THEN 'sin_evaluar'
                               WHEN ec.puntuacion < 50 THEN 'descalificado'
                               WHEN ec.puntuacion >= 50 THEN 'evaluado'
                               ELSE 'sin_evaluar'
                           END as estado_evaluacion
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN departamentos d ON d.id = ue.departamento_id
                    JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                    JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN (
                        SELECT DISTINCT ON (inscripcion_area_id) 
                               inscripcion_area_id, puntuacion, observaciones, fecha_evaluacion, evaluador_id
                        FROM evaluaciones_clasificacion
                        ORDER BY inscripcion_area_id, puntuacion DESC, fecha_evaluacion DESC
                    ) ec ON ec.inscripcion_area_id = ia.id
                    LEFT JOIN users u ON u.id = ec.evaluador_id
                    WHERE ia.area_competencia_id = ?";
            
            $params = [$areaId];
            
            if ($nivelId) {
                $sql .= " AND ia.nivel_competencia_id = ?";
                $params[] = $nivelId;
            }
            
            $sql .= " ORDER BY ec.puntuacion DESC, o.nombre_completo";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Debug: Log de los datos obtenidos
            error_log("SQL ejecutado: " . $sql);
            error_log("Parámetros: " . json_encode($params));
            error_log("Participantes encontrados: " . count($participantes));
            if (!empty($participantes)) {
                error_log("Primer participante: " . json_encode($participantes[0]));
            }
            
            // Contar estados
            $estadisticas = [
                'total' => count($participantes),
                'sin_evaluar' => 0,
                'evaluado' => 0,
                'descalificado' => 0
            ];
            
            foreach ($participantes as $participante) {
                $estado = $participante['estado_evaluacion'];
                if (isset($estadisticas[$estado])) {
                    $estadisticas[$estado]++;
                }
            }
            
            Response::success([
                'participantes' => $participantes,
                'estadisticas' => $estadisticas,
                'area_id' => $areaId,
                'nivel_id' => $nivelId,
                'fase' => $fase
            ], 'Participantes con evaluaciones obtenidos');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo participantes con evaluaciones: ' . $e->getMessage());
            Response::serverError('Error al obtener participantes con evaluaciones: ' . $e->getMessage());
        }
    }

    /**
     * Obtener listas de clasificación para un área y nivel
     */
    public function getListasClasificacion()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            $nivelId = $_GET['nivel_id'] ?? null;
            $fase = $_GET['fase'] ?? 'clasificacion';
            
            if (!$areaId || !$nivelId) {
                Response::validationError(['general' => 'Se requieren area_id y nivel_id']);
            }
            
            // Obtener todas las evaluaciones con información completa
            $sql = "SELECT ia.id as inscripcion_area_id,
                           o.nombre_completo,
                           o.documento_identidad,
                           ue.nombre as unidad_educativa_nombre,
                           d.nombre as departamento_nombre,
                           ac.nombre as area_nombre,
                           nc.nombre as nivel_nombre,
                           ec.puntuacion,
                           ec.observaciones,
                           ec.fecha_evaluacion,
                           CASE 
                               WHEN ec.puntuacion < 50 THEN 'descalificado'
                               WHEN ec.puntuacion >= 50 AND ec.puntuacion >= (
                                   SELECT AVG(puntuacion) * 0.6 
                                   FROM evaluaciones_clasificacion ec2 
                                   JOIN inscripciones_areas ia2 ON ia2.id = ec2.inscripcion_area_id 
                                   WHERE ia2.area_competencia_id = ? AND ia2.nivel_competencia_id = ?
                               ) THEN 'clasificado'
                               ELSE 'no_clasificado'
                           END as estado_clasificacion
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN departamentos d ON d.id = ue.departamento_id
                    JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                    JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ? AND ia.nivel_competencia_id = ?
                    ORDER BY ec.puntuacion DESC, o.nombre_completo";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $nivelId, $areaId, $nivelId]);
            $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Agrupar por estado
            $listas = [
                'clasificados' => [],
                'no_clasificados' => [],
                'descalificados' => [],
                'premiados' => [] // Los premiados serían los primeros clasificados
            ];
            
            foreach ($participantes as $participante) {
                $estado = $participante['estado_clasificacion'];
                if (isset($listas[$estado])) {
                    $listas[$estado][] = $participante;
                }
            }
            
            // Los premiados son los primeros 3 clasificados
            $listas['premiados'] = array_slice($listas['clasificados'], 0, 3);
            
            Response::success([
                'listas' => $listas,
                'total' => count($participantes),
                'resumen' => [
                    'clasificados' => count($listas['clasificados']),
                    'no_clasificados' => count($listas['no_clasificados']),
                    'descalificados' => count($listas['descalificados']),
                    'premiados' => count($listas['premiados'])
                ]
            ], 'Listas de clasificación obtenidas');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo listas de clasificación: ' . $e->getMessage());
            Response::serverError('Error al obtener listas de clasificación: ' . $e->getMessage());
        }
    }

    /**
     * Obtener log de cambios de notas para coordinadores
     */
    public function getLogCambiosNotas()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            $nivelId = $_GET['nivel_id'] ?? null;
            $fechaDesde = $_GET['fecha_desde'] ?? null;
            $fechaHasta = $_GET['fecha_hasta'] ?? null;
            $evaluadorId = $_GET['evaluador_id'] ?? null;
            $olimpistaId = $_GET['olimpista_id'] ?? null;
            
            if (!$areaId) {
                Response::validationError(['area_id' => 'El área es requerida']);
            }
            
            $currentUser = JWTManager::getCurrentUser();
            
            // Verificar que el usuario es coordinador del área
            // (Aquí podrías agregar validación adicional si es necesario)
            
            $filtros = [
                'nivel_id' => $nivelId,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'evaluador_id' => $evaluadorId,
                'olimpista_id' => $olimpistaId
            ];
            
            // Obtener cambios
            $cambios = LogCambiosNotas::getCambiosPorArea($areaId, $filtros);
            
            // Obtener estadísticas
            $estadisticas = LogCambiosNotas::getEstadisticasCambios($areaId, $filtros);
            
            Response::success([
                'cambios' => $cambios,
                'estadisticas' => $estadisticas,
                'filtros_aplicados' => $filtros
            ], 'Log de cambios obtenido exitosamente');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo log de cambios: ' . $e->getMessage());
            Response::serverError('No se pudo obtener el log de cambios');
        }
    }

    /**
     * Obtener evaluadores por área
     */
    public function getEvaluadoresPorArea()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                Response::validationError(['area_id' => 'El área es requerida']);
            }
            
            // Obtener evaluadores del área específica
            $sql = "SELECT u.id, u.name, u.email, u.role, 
                           ea.area_competencia_id,
                           ac.nombre as area_nombre,
                           'Sin institución' as institucion_nombre,
                           0 as institucion_id
                    FROM evaluadores_areas ea 
                    JOIN users u ON u.id = ea.user_id
                    JOIN areas_competencia ac ON ac.id = ea.area_competencia_id
                    WHERE ea.area_competencia_id = ? AND ea.is_active = true AND u.is_active = true
                    ORDER BY u.name";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId]);
            $evaluadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success([
                'evaluadores' => $evaluadores,
                'total' => count($evaluadores),
                'area_id' => $areaId
            ], 'Evaluadores del área obtenidos');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo evaluadores por área: ' . $e->getMessage());
            Response::serverError('Error al obtener evaluadores del área: ' . $e->getMessage());
        }
    }

} 
