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
use ForwardSoft\Models\tiemposEvaluadores;
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
        
        error_log("=== RECIBIENDO PETICIÓN DE ASIGNACIÓN ===");
        error_log("Input recibido: " . json_encode($input));
        
        if (!$input) {
            Response::validationError(['general' => 'Datos inválidos']);
        }

        $areaId = (int)($input['area_id'] ?? 0);
        $nivelId = $input['nivel_id'] ?? null;
        $rondaId = isset($input['ronda_id']) ? (int)$input['ronda_id'] : null;
        $fase = $input['fase'] ?? 'clasificacion';
        $numEval = max(1, min(5, (int)($input['num_evaluadores'] ?? 2)));
        $metodo = $input['metodo'] ?? 'simple';
        $evitarMismaIE = (bool)($input['evitar_misma_institucion'] ?? true);
        $evitarMismaArea = (bool)($input['evitar_misma_area'] ?? true);
        $confirmar = (bool)($input['confirmar'] ?? false);
        
        error_log("Parámetros procesados:");
        error_log("- areaId: $areaId");
        error_log("- nivelId: $nivelId");
        error_log("- rondaId: $rondaId");
        error_log("- fase: $fase");
        error_log("- numEval: $numEval");
        error_log("- metodo: $metodo");
        error_log("- evitarMismaIE: " . ($evitarMismaIE ? 'true' : 'false'));
        error_log("- evitarMismaArea: " . ($evitarMismaArea ? 'true' : 'false'));
        error_log("- confirmar: " . ($confirmar ? 'true' : 'false'));

        if ($areaId <= 0 || !in_array($fase, ['clasificacion','premiacion'])) {
            Response::validationError(['area_id' => 'Parámetros requeridos inválidos']);
        }

        
        
        $whereNivel = '';
        if ($nivelId === 'primaria') {
            
            $whereNivel = " AND (LOWER(nc.nombre) LIKE '%primaria%' OR LOWER(nc.nombre) LIKE '%primario%')";
        }
        elseif ($nivelId === 'secundaria') {
            
            $whereNivel = " AND (LOWER(nc.nombre) LIKE '%secundaria%' OR LOWER(nc.nombre) LIKE '%secundario%')";
        }
        
        $sqlIns = "SELECT ia.id as inscripcion_area_id, o.nombre_completo, ue.id as unidad_id, ue.nombre as unidad_nombre, 
                          ia.area_competencia_id, ac.nombre as area_nombre, nc.nombre as nivel_nombre, nc.id as nivel_id
                   FROM inscripciones_areas ia
                   JOIN olimpistas o ON o.id = ia.olimpista_id
                   JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                   JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                   JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                   WHERE ia.area_competencia_id = :areaId" . $whereNivel;
        $stmt = $this->pdo->prepare($sqlIns);
        $stmt->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmt->execute();
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        error_log("=== CONSULTA DE INSCRIPCIONES ===");
        error_log("SQL: " . $sqlIns);
        error_log("Área ID: $areaId");
        error_log("Nivel ID: $nivelId");
        error_log("WHERE nivel: $whereNivel");
        error_log("Inscripciones encontradas: " . count($inscripciones));
        
        
        $sqlSinFiltro = "SELECT ia.id as inscripcion_area_id, o.nombre_completo, ue.nombre as unidad_nombre, 
                                ia.area_competencia_id, ac.nombre as area_nombre, nc.nombre as nivel_nombre, nc.id as nivel_id
                         FROM inscripciones_areas ia
                         JOIN olimpistas o ON o.id = ia.olimpista_id
                         JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                         JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                         JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                         WHERE ia.area_competencia_id = :areaId";
        $stmtSinFiltro = $this->pdo->prepare($sqlSinFiltro);
        $stmtSinFiltro->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtSinFiltro->execute();
        $inscripcionesSinFiltro = $stmtSinFiltro->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        error_log("Inscripciones SIN filtro de nivel: " . count($inscripcionesSinFiltro));
        if (!empty($inscripcionesSinFiltro)) {
            error_log("Primera inscripción sin filtro: " . json_encode($inscripcionesSinFiltro[0]));
        }
        
        if (!empty($inscripciones)) {
            error_log("Primera inscripción con filtro: " . json_encode($inscripciones[0]));
        }

        
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
        
        error_log("=== CONSULTA DE EVALUADORES ===");
        error_log("SQL: " . $sqlEval);
        error_log("Evaluadores encontrados: " . count($evaluadores));
        if (!empty($evaluadores)) {
            error_log("Primer evaluador: " . json_encode($evaluadores[0]));
        }

        
        if (empty($inscripciones) && !empty($inscripcionesSinFiltro)) {
            error_log("=== USANDO INSCRIPCIONES SIN FILTRO DE NIVEL ===");
            $inscripciones = $inscripcionesSinFiltro;
        }

        if (empty($inscripciones) || empty($evaluadores)) {
            error_log("=== ERROR: DATOS INSUFICIENTES ===");
            error_log("Inscripciones vacías: " . (empty($inscripciones) ? 'SÍ' : 'NO'));
            error_log("Evaluadores vacíos: " . (empty($evaluadores) ? 'SÍ' : 'NO'));
            error_log("Inscripciones sin filtro: " . count($inscripcionesSinFiltro));
            Response::success(['items' => [], 'total' => 0, 'mensaje' => 'Sin datos suficientes para asignar'], 'Sin datos suficientes');
        }

        // Agrupar inscripciones por nivel
        $inscripcionesPorNivel = [];
        foreach ($inscripciones as $ins) {
            $nivelId = $ins['nivel_id'];
            if (!isset($inscripcionesPorNivel[$nivelId])) {
                $inscripcionesPorNivel[$nivelId] = [];
            }
            $inscripcionesPorNivel[$nivelId][] = $ins;
        }
        
        // Log para debug
        error_log("=== ASIGNACIÓN AUTOMÁTICA POR NIVEL ===");
        error_log("Categoría seleccionada: " . ($nivelId === 'primaria' ? 'PRIMARIA' : 'SECUNDARIA'));
        error_log("Niveles encontrados: " . implode(', ', array_keys($inscripcionesPorNivel)));
        foreach ($inscripcionesPorNivel as $nivelId => $inscripciones) {
            error_log("Nivel $nivelId: " . count($inscripciones) . " inscripciones");
        }
        
        // Asignar 1 evaluador por nivel
        $resultado = [];
        $evaluadoresAsignadosPorNivel = [];
        $evaluadoresDisponibles = $evaluadores;
        
        foreach ($inscripcionesPorNivel as $nivelId => $inscripcionesNivel) {
            // Seleccionar 1 evaluador para este nivel
            $evaluadorNivel = null;
            
            if (!empty($evaluadoresDisponibles)) {
                // Tomar el primer evaluador disponible
                $evaluadorNivel = array_shift($evaluadoresDisponibles);
                $evaluadoresAsignadosPorNivel[$nivelId] = $evaluadorNivel;
                error_log("Nivel $nivelId ({$inscripcionesNivel[0]['nivel_nombre']}) asignado al evaluador: {$evaluadorNivel['name']} (ID: {$evaluadorNivel['id']})");
            } else {
                // Si no hay más evaluadores, reutilizar uno existente
                $evaluadorNivel = $evaluadores[array_rand($evaluadores)];
                $evaluadoresAsignadosPorNivel[$nivelId] = $evaluadorNivel;
                error_log("Nivel $nivelId ({$inscripcionesNivel[0]['nivel_nombre']}) reasignado al evaluador: {$evaluadorNivel['name']} (ID: {$evaluadorNivel['id']})");
            }
            
            // Asignar el mismo evaluador a todas las inscripciones de este nivel
            foreach ($inscripcionesNivel as $ins) {
                $resultado[] = [
                    'inscripcion_area_id' => (int)$ins['inscripcion_area_id'],
                    'competidor' => $ins['nombre_completo'],
                    'area' => $ins['area_nombre'],
                    'nivel' => $ins['nivel_nombre'],
                    'nivel_id' => $nivelId,
                    'institucion' => $ins['unidad_nombre'],
                    'evaluadores' => [(int)$evaluadorNivel['id']],
                    'evaluadores_info' => [$evaluadorNivel]
                ];
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

        // Estadísticas por nivel
        $estadisticasNiveles = [];
        foreach ($evaluadoresAsignadosPorNivel as $nivelId => $evaluador) {
            $inscripcionesNivel = $inscripcionesPorNivel[$nivelId];
            $estadisticasNiveles[] = [
                'nivel_id' => $nivelId,
                'nivel_nombre' => $inscripcionesNivel[0]['nivel_nombre'],
                'evaluador_id' => $evaluador['id'],
                'evaluador_nombre' => $evaluador['name'],
                'total_inscripciones' => count($inscripcionesNivel)
            ];
        }
        
        $categoria = $nivelId === 'primaria' ? 'Primaria' : 'Secundaria';
        $mensaje = $confirmar 
            ? "Asignación automática de $categoria guardada exitosamente" 
            : "Previsualización de asignación automática para $categoria generada";
            
        Response::success([
            'items' => $resultado, 
            'total' => count($resultado),
            'estadisticas' => [
                'categoria' => $categoria,
                'total_inscripciones' => count($inscripciones),
                'total_evaluadores' => count($evaluadores),
                'niveles_asignados' => count($evaluadoresAsignadosPorNivel),
                'distribucion_niveles' => $estadisticasNiveles,
                'metodo' => 'Asignación automática: 1 evaluador por nivel específico'
            ]
        ], $mensaje);
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

    public function getProgresoEvaluacion()
    {
        try {
            // Obtener el área del coordinador desde el token JWT
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            // Obtener el área del coordinador
            $sqlAreaCoordinador = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlAreaCoordinador);
            $stmtArea->execute([$userData['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            // Obtener datos de progreso por nivel (solo del área del coordinador)
            $sqlNiveles = "
                SELECT 
                    nc.nombre as nivel_nombre,
                    COUNT(DISTINCT ia.olimpista_id) as total_olimpistas,
                    COUNT(DISTINCT CASE WHEN ec.id IS NOT NULL THEN ia.olimpista_id END) as evaluados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'descalificado' THEN ia.olimpista_id END) as descalificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'pendiente' AND ec.id IS NULL THEN ia.olimpista_id END) as pendientes,
                    AVG(CASE WHEN ec.id IS NOT NULL THEN ec.puntuacion END) as promedio_puntuacion,
                    CASE 
                        WHEN COUNT(DISTINCT ia.olimpista_id) > 0 
                        THEN ROUND((COUNT(DISTINCT CASE WHEN ec.id IS NOT NULL THEN ia.olimpista_id END) * 100.0) / COUNT(DISTINCT ia.olimpista_id), 2)
                        ELSE 0 
                    END as porcentaje,
                    CASE 
                        WHEN COUNT(DISTINCT ia.olimpista_id) > 0 
                        THEN ROUND((COUNT(DISTINCT CASE WHEN ia.estado = 'descalificado' THEN ia.olimpista_id END) * 100.0) / COUNT(DISTINCT ia.olimpista_id), 2)
                        ELSE 0 
                    END as porcentaje_descalificados
                FROM inscripciones_areas ia
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                GROUP BY nc.id, nc.nombre, nc.orden_display
                ORDER BY nc.orden_display
            ";
            
            $stmtNiveles = $this->pdo->prepare($sqlNiveles);
            $stmtNiveles->execute([$areaId]);
            $niveles = $stmtNiveles->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener estadísticas de evaluadores (solo del área del coordinador)
            $sqlEvaluadores = "
                SELECT 
                    COUNT(DISTINCT ea.user_id) as total_evaluadores,
                    COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '7 days' THEN ea.user_id END) as evaluadores_activos
                FROM evaluadores_areas ea
                JOIN users u ON u.id = ea.user_id
                WHERE ea.is_active = true AND u.is_active = true AND ea.area_competencia_id = ?
            ";
            
            $stmtEvaluadores = $this->pdo->prepare($sqlEvaluadores);
            $stmtEvaluadores->execute([$areaId]);
            $evaluadoresStats = $stmtEvaluadores->fetch(PDO::FETCH_ASSOC);
            
            // Obtener lista de evaluadores activos (solo del área del coordinador)
            $sqlEvaluadoresActivos = "
                SELECT 
                    u.id,
                    u.name as nombre,
                    u.email,
                    u.last_login,
                    COUNT(DISTINCT ec.id) as evaluaciones_completadas,
                    COUNT(DISTINCT ae.id) as asignaciones_pendientes,
                    CASE 
                        WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'activo'
                        ELSE 'inactivo'
                    END as estado
                FROM evaluadores_areas ea
                JOIN users u ON u.id = ea.user_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.evaluador_id = u.id
                LEFT JOIN asignaciones_evaluacion ae ON ae.evaluador_id = u.id
                WHERE ea.is_active = true AND u.is_active = true AND ea.area_competencia_id = ?
                GROUP BY u.id, u.name, u.email, u.last_login
                ORDER BY u.last_login DESC NULLS LAST
            ";
            
            $stmtEvaluadoresActivos = $this->pdo->prepare($sqlEvaluadoresActivos);
            $stmtEvaluadoresActivos->execute([$areaId]);
            $evaluadoresActivos = $stmtEvaluadoresActivos->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener olimpistas sin evaluar con alertas de retraso
            $sqlSinEvaluar = "
                SELECT 
                    ia.id,
                    COALESCE(o.nombre_completo, CONCAT(o.nombre, ' ', COALESCE(o.apellido, ''))) as nombre,
                    ac.nombre as area,
                    nc.nombre as nivel,
                    EXTRACT(DAYS FROM NOW() - ia.created_at) as dias_pendiente,
                    CASE 
                        WHEN EXTRACT(DAYS FROM NOW() - ia.created_at) > 5 THEN 'critico'
                        WHEN EXTRACT(DAYS FROM NOW() - ia.created_at) > 3 THEN 'advertencia'
                        ELSE 'normal'
                    END as nivel_alerta,
                    ae.evaluador_id,
                    u.name as evaluador_nombre
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                LEFT JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id
                LEFT JOIN users u ON u.id = ae.evaluador_id
                WHERE (ia.estado IS NULL OR ia.estado != 'descalificado')
                AND ec.id IS NULL
                AND ia.area_competencia_id = ?
                ORDER BY ia.created_at ASC
                LIMIT 20
            ";
            
            $stmtSinEvaluar = $this->pdo->prepare($sqlSinEvaluar);
            $stmtSinEvaluar->execute([$areaId]);
            $olimpistasSinEvaluar = $stmtSinEvaluar->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener estadísticas de descalificaciones
            $sqlDescalificaciones = "
                SELECT 
                    COUNT(DISTINCT d.id) as total_descalificaciones,
                    COUNT(DISTINCT CASE WHEN d.fecha_descalificacion > NOW() - INTERVAL '7 days' THEN d.id END) as descalificaciones_recientes,
                    rd.tipo,
                    COUNT(*) as cantidad_por_tipo
                FROM descalificaciones d
                JOIN reglas_descalificacion rd ON rd.id = d.regla_descalificacion_id
                JOIN inscripciones_areas ia ON ia.id = d.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
                GROUP BY rd.tipo
            ";
            
            $stmtDescalificaciones = $this->pdo->prepare($sqlDescalificaciones);
            $stmtDescalificaciones->execute([$areaId]);
            $descalificacionesStats = $stmtDescalificaciones->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener métricas de tiempo promedio
            $sqlTiempoPromedio = "
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as dias_promedio_evaluacion,
                    MIN(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as tiempo_minimo,
                    MAX(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as tiempo_maximo
                FROM inscripciones_areas ia
                JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ec.fecha_evaluacion IS NOT NULL
            ";
            
            $stmtTiempo = $this->pdo->prepare($sqlTiempoPromedio);
            $stmtTiempo->execute([$areaId]);
            $tiempoStats = $stmtTiempo->fetch(PDO::FETCH_ASSOC);
            
            // Calcular estadísticas generales mejoradas
            $totalOlimpistas = array_sum(array_column($niveles, 'total_olimpistas'));
            $totalEvaluados = array_sum(array_column($niveles, 'evaluados'));
            $totalDescalificados = array_sum(array_column($niveles, 'descalificados'));
            $totalPendientes = $totalOlimpistas - $totalEvaluados - $totalDescalificados;
            $promedioGeneral = $totalOlimpistas > 0 ? round(($totalEvaluados * 100) / $totalOlimpistas, 2) : 0;
            $promedioDescalificados = $totalOlimpistas > 0 ? round(($totalDescalificados * 100) / $totalOlimpistas, 2) : 0;
            
            Response::success([
                'niveles' => $niveles,
                'evaluadores' => [
                    'total' => (int)$evaluadoresStats['total_evaluadores'],
                    'activos' => (int)$evaluadoresStats['evaluadores_activos']
                ],
                'evaluadores_lista' => $evaluadoresActivos,
                'olimpistas_sin_evaluar' => $olimpistasSinEvaluar,
                'descalificaciones' => [
                    'estadisticas' => $descalificacionesStats,
                    'total_descalificados' => $totalDescalificados,
                    'porcentaje_descalificados' => $promedioDescalificados
                ],
                'metricas_tiempo' => [
                    'dias_promedio_evaluacion' => round($tiempoStats['dias_promedio_evaluacion'] ?? 0, 1),
                    'tiempo_minimo' => round($tiempoStats['tiempo_minimo'] ?? 0, 1),
                    'tiempo_maximo' => round($tiempoStats['tiempo_maximo'] ?? 0, 1)
                ],
                'alertas' => [
                    'criticas' => count(array_filter($olimpistasSinEvaluar, fn($p) => $p['nivel_alerta'] === 'critico')),
                    'advertencias' => count(array_filter($olimpistasSinEvaluar, fn($p) => $p['nivel_alerta'] === 'advertencia')),
                    'total_alertas' => count(array_filter($olimpistasSinEvaluar, fn($p) => $p['nivel_alerta'] !== 'normal'))
                ],
                'estadisticas_generales' => [
                    'total_olimpistas' => $totalOlimpistas,
                    'total_evaluados' => $totalEvaluados,
                    'total_pendientes' => $totalPendientes,
                    'total_descalificados' => $totalDescalificados,
                    'promedio_general' => $promedioGeneral,
                    'promedio_descalificados' => $promedioDescalificados
                ],
                'ultima_actualizacion' => date('Y-m-d H:i:s')
            ], 'Datos de progreso obtenidos');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo progreso de evaluación: ' . $e->getMessage());
            Response::serverError('Error al obtener datos de progreso: ' . $e->getMessage());
        }
    }

    public function getAlertasCriticas()
    {
        try {
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            // Obtener el área del coordinador
            $sqlAreaCoordinador = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlAreaCoordinador);
            $stmtArea->execute([$userData['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            
            // Alertas críticas: evaluaciones pendientes > 5 días
            $sqlAlertasCriticas = "
                SELECT 
                    ia.id,
                    COALESCE(o.nombre_completo, CONCAT(o.nombre, ' ', COALESCE(o.apellido, ''))) as nombre,
                    ac.nombre as area,
                    nc.nombre as nivel,
                    EXTRACT(DAYS FROM NOW() - ia.created_at) as dias_pendiente,
                    ae.evaluador_id,
                    u.name as evaluador_nombre,
                    u.email as evaluador_email
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                LEFT JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id
                LEFT JOIN users u ON u.id = ae.evaluador_id
                WHERE (ia.estado IS NULL OR ia.estado != 'descalificado')
                AND ec.id IS NULL
                AND EXTRACT(DAYS FROM NOW() - ia.created_at) > 5
                AND ia.area_competencia_id = ?
                ORDER BY ia.created_at ASC
            ";
            
            $stmtAlertas = $this->pdo->prepare($sqlAlertasCriticas);
            $stmtAlertas->execute([$areaId]);
            $alertasCriticas = $stmtAlertas->fetchAll(PDO::FETCH_ASSOC);
            
            // Alertas de evaluadores inactivos
            $sqlEvaluadoresInactivos = "
                SELECT 
                    u.id,
                    u.name as nombre,
                    u.email,
                    u.last_login,
                    COUNT(DISTINCT ae.id) as asignaciones_pendientes,
                    EXTRACT(DAYS FROM NOW() - u.last_login) as dias_inactivo
                FROM evaluadores_areas ea
                JOIN users u ON u.id = ea.user_id
                LEFT JOIN asignaciones_evaluacion ae ON ae.evaluador_id = u.id
                WHERE ea.is_active = true 
                AND u.is_active = true 
                AND ea.area_competencia_id = ?
                AND u.last_login < NOW() - INTERVAL '3 days'
                GROUP BY u.id, u.name, u.email, u.last_login
                ORDER BY u.last_login ASC
            ";
            
            $stmtInactivos = $this->pdo->prepare($sqlEvaluadoresInactivos);
            $stmtInactivos->execute([$areaId]);
            $evaluadoresInactivos = $stmtInactivos->fetchAll(PDO::FETCH_ASSOC);
            
            // Métricas críticas
            $totalAlertas = count($alertasCriticas) + count($evaluadoresInactivos);
            $nivelCriticidad = $totalAlertas > 10 ? 'alto' : ($totalAlertas > 5 ? 'medio' : 'bajo');
            
            Response::success([
                'alertas_criticas' => $alertasCriticas,
                'evaluadores_inactivos' => $evaluadoresInactivos,
                'metricas' => [
                    'total_alertas' => $totalAlertas,
                    'evaluaciones_criticas' => count($alertasCriticas),
                    'evaluadores_inactivos' => count($evaluadoresInactivos),
                    'nivel_criticidad' => $nivelCriticidad
                ],
                'ultima_actualizacion' => date('Y-m-d H:i:s')
            ], 'Alertas críticas obtenidas');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo alertas críticas: ' . $e->getMessage());
            Response::serverError('Error al obtener alertas críticas: ' . $e->getMessage());
        }
    }

    public function getTiemposEvaluadoresPorArea() {
    try {
        $areaId = $_GET['area_id'] ?? null;

        if (!$areaId || !is_numeric($areaId)) {
            Response::validationError(['area_id' => 'El área es requerida y debe ser un número válido']);
            return;
        }

        $sql = "
            SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    ea.area_competencia_id,
    ac.nombre AS area_nombre,
    pe.start_date,
    pe.start_time,
    pe.duration_days,
    pe.status
FROM evaluadores_areas AS ea
JOIN users AS u ON u.id = ea.user_id
JOIN areas_competencia AS ac ON ac.id = ea.area_competencia_id
LEFT JOIN (
    SELECT DISTINCT ON (evaluador_id)
        evaluador_id,
        start_date,
        start_time,
        duration_days,
        status
    FROM permisos_evaluadores
    ORDER BY evaluador_id, created_at DESC
) AS pe ON pe.evaluador_id = u.id
WHERE ea.area_competencia_id = ?
  AND ea.is_active = true
  AND u.is_active = true
ORDER BY u.name;

        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([(int)$areaId]);
        $evaluadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success([
            'evaluadores' => $evaluadores,
            'total' => count($evaluadores),
            'area_id' => (int)$areaId
        ], 'Evaluadores del área obtenidos');

    } catch (\Exception $e) {
        error_log('Error obteniendo evaluadores por área: ' . $e->getMessage());
        Response::serverError('Error al obtener evaluadores del área: ' . $e->getMessage());
    }
    
}
public function registrarTiemposEvaluadores()
{
    try {
        
       
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("BODY RECIBIDO: " . json_encode($input));

        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        
        if (isset($input['tiempo'])) {
            $input = $input['tiempo'];
        }

        
        $required = ['coordinador_id', 'evaluador_id', 'start_date', 'start_time','duration_days'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                Response::validationError([$field => "El campo $field es obligatorio"]);
            }
        }

        
        if (!isset($input['status'])) {
            $input['status'] = 'activo';
        }

        error_log("DATOS PROCESADOS: " . json_encode($input));

        
        $model = new tiemposEvaluadores();
        
        error_log("🎯 Llamando a createTiempoEvaluador con datos: " . json_encode($input));
        
        try {
            $insertId = $model->createTiempoEvaluador($input);
            
            error_log("✅ Insert ID obtenido: " . $insertId);
            
            if ($insertId) {
                Response::success([
                    'insert_id' => $insertId,
                    'data' => $input
                ], 'Tiempo de evaluación registrado exitosamente.');
            } else {
                error_log("❌ Insert ID es false o null");
                Response::serverError('No se pudo registrar el tiempo de evaluación.');
            }
        } catch (\Exception $modelException) {
            error_log("❌ Error en el modelo: " . $modelException->getMessage());
            error_log("❌ Trace del modelo: " . $modelException->getTraceAsString());
            throw $modelException;
        }

    } catch (\PDOException $e) {
        error_log('Error PDO al registrar tiempo del evaluador: ' . $e->getMessage());
        error_log('Trace: ' . $e->getTraceAsString());
        Response::serverError('Error de base de datos: ' . $e->getMessage());
    } catch (\Exception $e) {
        error_log('Error al registrar tiempo del evaluador: ' . $e->getMessage());
        error_log('Trace: ' . $e->getTraceAsString());
        Response::serverError('Error interno del servidor: ' . $e->getMessage());
    }
}



} 
