<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Utils\AuditService;
use ForwardSoft\Utils\LogCambiosNotas;
use ForwardSoft\Utils\Mailer;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\User;
use ForwardSoft\Models\EvaluacionFinal;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\tiemposEvaluadores;
use ForwardSoft\Models\ConfiguracionOlimpiada;
use ForwardSoft\Models\NoClasificado;
use ForwardSoft\Models\ConfiguracionMedallero;
use PDO;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class CoordinadorController
{
    private $pdo;
    private $evalClasificacionModel;

    public function __construct()
    {
        $this->pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
        $this->evalClasificacionModel = new EvaluacionClasificacion();
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
        $cuotaPorEvaluador = max(1, (int)($input['cuota_por_evaluador'] ?? 30)); 
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
        error_log("- cuotaPorEvaluador: $cuotaPorEvaluador");
        error_log("- metodo: $metodo");
        error_log("- evitarMismaIE: " . ($evitarMismaIE ? 'true' : 'false'));
        error_log("- evitarMismaArea: " . ($evitarMismaArea ? 'true' : 'false'));
        error_log("- confirmar: " . ($confirmar ? 'true' : 'false'));

        
        if ($areaId <= 0 || !in_array($fase, ['clasificacion','final'])) {
            Response::validationError(['area_id' => 'Parámetros requeridos inválidos. Fase debe ser: clasificacion o final']);
        }

        
        
        $whereNivel = '';
        if ($nivelId === 'primaria') {
            
            $whereNivel = " AND (LOWER(nc.nombre) LIKE '%primaria%' OR LOWER(nc.nombre) LIKE '%primario%')";
        }
        elseif ($nivelId === 'secundaria') {
            
            $whereNivel = " AND (LOWER(nc.nombre) LIKE '%secundaria%' OR LOWER(nc.nombre) LIKE '%secundario%')";
        }
        
        
        $filtroEstado = '';
        if ($fase === 'final') {
            
            $filtroEstado = " AND ia.estado = 'clasificado' 
                              AND EXISTS (
                                  SELECT 1 
                                  FROM evaluaciones_clasificacion ec 
                                  WHERE ec.inscripcion_area_id = ia.id
                              )
                              AND (
                                  SELECT AVG(ec2.puntuacion)
                                  FROM evaluaciones_clasificacion ec2
                                  WHERE ec2.inscripcion_area_id = ia.id
                              ) >= 51";
        } else {
            
            $filtroEstado = " AND ia.estado NOT IN ('desclasificado', 'no_clasificado')";
        }
        
        
        $sqlTotalIns = "SELECT COUNT(*) as total
                        FROM inscripciones_areas ia
                        JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        WHERE ia.area_competencia_id = :areaId" . $whereNivel . $filtroEstado;
        $stmtTotalIns = $this->pdo->prepare($sqlTotalIns);
        $stmtTotalIns->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtTotalIns->execute();
        $totalInscripciones = $stmtTotalIns->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        
        
        $faseLiteral = $fase === 'final' ? 'final' : 'clasificacion';
        
       
        $sqlVerificarFasesBD = "SELECT 
                                    ia.id as inscripcion_id,
                                    o.nombre_completo,
                                    ae.fase,
                                    ae.evaluador_id,
                                    u.name as evaluador_nombre
                                FROM inscripciones_areas ia
                                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                                JOIN olimpistas o ON o.id = ia.olimpista_id
                                JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id
                                JOIN users u ON u.id = ae.evaluador_id
                                WHERE ia.area_competencia_id = :areaId" . $whereNivel . $filtroEstado . "
                                ORDER BY ia.id, ae.fase";
        $stmtVerificarBD = $this->pdo->prepare($sqlVerificarFasesBD);
        $stmtVerificarBD->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtVerificarBD->execute();
        $asignacionesBD = $stmtVerificarBD->fetchAll(PDO::FETCH_ASSOC);
        error_log("=== VERIFICACIÓN DIRECTA DE ASIGNACIONES EN BD ===");
        error_log("Total asignaciones encontradas: " . count($asignacionesBD));
        foreach ($asignacionesBD as $asig) {
            error_log("  - Inscripción ID: {$asig['inscripcion_id']}, Nombre: {$asig['nombre_completo']}, FASE: {$asig['fase']}, Evaluador: {$asig['evaluador_nombre']}");
        }
        
        $sqlConAsignacion = "SELECT COUNT(*) as total
                            FROM inscripciones_areas ia
                            JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                            JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id AND ae.fase = '" . $faseLiteral . "'
                            WHERE ia.area_competencia_id = :areaId" . $whereNivel . $filtroEstado;
        error_log("DEBUG - Verificando asignaciones para fase: '$fase' (literal: '$faseLiteral')");
        error_log("DEBUG - SQL Con Asignación: " . $sqlConAsignacion);
        $stmtConAsignacion = $this->pdo->prepare($sqlConAsignacion);
        $stmtConAsignacion->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtConAsignacion->execute();
        $inscripcionesConAsignacion = $stmtConAsignacion->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        error_log("DEBUG - Resultado del conteo para fase '$faseLiteral': " . $inscripcionesConAsignacion);
        
       
        if ($fase === 'final') {
            $sqlAsignacionesClasificacion = "SELECT COUNT(*) as total
                                            FROM inscripciones_areas ia
                                            JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                                            JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id AND ae.fase = 'clasificacion'
                                            WHERE ia.area_competencia_id = :areaId" . $whereNivel . $filtroEstado;
            $stmtClasif = $this->pdo->prepare($sqlAsignacionesClasificacion);
            $stmtClasif->bindValue(':areaId', $areaId, PDO::PARAM_INT);
            $stmtClasif->execute();
            $conAsignacionClasif = $stmtClasif->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            
           
            $sqlVerificarFases = "SELECT 
                                    ia.id as inscripcion_id,
                                    o.nombre_completo,
                                    ae.fase,
                                    ae.evaluador_id,
                                    u.name as evaluador_nombre
                                  FROM inscripciones_areas ia
                                  JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                                  JOIN olimpistas o ON o.id = ia.olimpista_id
                                  JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id
                                  JOIN users u ON u.id = ae.evaluador_id
                                  WHERE ia.area_competencia_id = :areaId" . $whereNivel . $filtroEstado . "
                                  ORDER BY ia.id, ae.fase";
            $stmtVerificar = $this->pdo->prepare($sqlVerificarFases);
            $stmtVerificar->bindValue(':areaId', $areaId, PDO::PARAM_INT);
            $stmtVerificar->execute();
            $asignacionesDetalle = $stmtVerificar->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("DEBUG FASE FINAL - Inscripciones con asignación de fase CLASIFICATORIA: " . $conAsignacionClasif);
            error_log("DEBUG FASE FINAL - Inscripciones con asignación de fase FINAL: " . $inscripcionesConAsignacion);
            error_log("DEBUG FASE FINAL - Detalle de asignaciones encontradas: " . json_encode($asignacionesDetalle));
        }
        
        
        $sqlIns = "SELECT ia.id as inscripcion_area_id, o.nombre_completo, ue.id as unidad_id, ue.nombre as unidad_nombre, 
                          ia.area_competencia_id, ac.nombre as area_nombre, nc.nombre as nivel_nombre, nc.id as nivel_id
                   FROM inscripciones_areas ia
                   JOIN olimpistas o ON o.id = ia.olimpista_id
                   JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                   JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                   JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                   LEFT JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id AND ae.fase = '" . $faseLiteral . "'
                   WHERE ia.area_competencia_id = :areaId 
                   AND ae.id IS NULL" . $whereNivel . $filtroEstado;
        $stmt = $this->pdo->prepare($sqlIns);
        $stmt->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmt->execute();
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        error_log("=== CONSULTA DE INSCRIPCIONES ===");
        error_log("SQL: " . $sqlIns);
        error_log("SQL Con Asignación: " . $sqlConAsignacion);
        error_log("Área ID: $areaId");
        error_log("Nivel ID: $nivelId");
        error_log("Fase: $fase");
        error_log("WHERE nivel: $whereNivel");
        error_log("Filtro estado aplicado: " . ($fase === 'final' ? 'Fase final - Clasificados con puntuación >= 51' : 'Fase clasificatoria'));
        error_log("Total de inscripciones (sin filtrar por asignaciones): " . $totalInscripciones);
        error_log("Inscripciones con evaluador asignado para fase '$fase': " . $inscripcionesConAsignacion);
        error_log("Inscripciones encontradas (sin asignaciones previas para fase '$fase'): " . count($inscripciones));
        
       
        if ($fase === 'final') {
            $sqlInfoPuntuaciones = "
                SELECT 
                    COUNT(*) as total_clasificados,
                    COUNT(CASE WHEN EXISTS (
                        SELECT 1 FROM evaluaciones_clasificacion ec 
                        WHERE ec.inscripcion_area_id = ia.id
                        AND (SELECT AVG(ec2.puntuacion) FROM evaluaciones_clasificacion ec2 WHERE ec2.inscripcion_area_id = ia.id) >= 51
                    ) THEN 1 END) as con_puntuacion_51,
                    COUNT(CASE WHEN EXISTS (
                        SELECT 1 FROM asignaciones_evaluacion ae 
                        WHERE ae.inscripcion_area_id = ia.id AND ae.fase = 'final'
                    ) THEN 1 END) as con_asignacion_final
                FROM inscripciones_areas ia
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                WHERE ia.area_competencia_id = :areaId 
                AND ia.estado = 'clasificado'" . $whereNivel;
            $stmtInfo = $this->pdo->prepare($sqlInfoPuntuaciones);
            $stmtInfo->bindValue(':areaId', $areaId, PDO::PARAM_INT);
            $stmtInfo->execute();
            $infoPuntuaciones = $stmtInfo->fetch(PDO::FETCH_ASSOC);
            error_log("INFO FASE FINAL - Total clasificados: " . ($infoPuntuaciones['total_clasificados'] ?? 0));
            error_log("INFO FASE FINAL - Con puntuación >= 51: " . ($infoPuntuaciones['con_puntuacion_51'] ?? 0));
            error_log("INFO FASE FINAL - Con asignación final: " . ($infoPuntuaciones['con_asignacion_final'] ?? 0));
        }
        
        

        $sqlSinFiltro = "SELECT ia.id as inscripcion_area_id, o.nombre_completo, ue.nombre as unidad_nombre, 
                                ia.area_competencia_id, ac.nombre as area_nombre, nc.nombre as nivel_nombre, nc.id as nivel_id
                         FROM inscripciones_areas ia
                         JOIN olimpistas o ON o.id = ia.olimpista_id
                         JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                         JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                         JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                         LEFT JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id AND ae.fase = :fase
                         WHERE ia.area_competencia_id = :areaId 
                         AND ae.id IS NULL" . $filtroEstado;
        $stmtSinFiltro = $this->pdo->prepare($sqlSinFiltro);
        $stmtSinFiltro->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtSinFiltro->bindValue(':fase', $fase);
        $stmtSinFiltro->execute();
        $inscripcionesSinFiltro = $stmtSinFiltro->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        error_log("Inscripciones SIN filtro de nivel: " . count($inscripcionesSinFiltro));
        if (!empty($inscripcionesSinFiltro)) {
            error_log("Primera inscripción sin filtro: " . json_encode($inscripcionesSinFiltro[0]));
        }
        
        if (!empty($inscripciones)) {
            error_log("Primera inscripción con filtro: " . json_encode($inscripciones[0]));
        }

        
        
        $sqlTotalEval = "SELECT COUNT(*) as total
                        FROM evaluadores_areas ea 
                        JOIN users u ON u.id = ea.user_id
                        WHERE ea.area_competencia_id = :areaId 
                        AND ea.is_active = true 
                        AND u.is_active = true";
        $stmtTotalEval = $this->pdo->prepare($sqlTotalEval);
        $stmtTotalEval->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtTotalEval->execute();
        $totalEvaluadores = $stmtTotalEval->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        
        $sqlEvalConAsignacion = "SELECT COUNT(DISTINCT ea.user_id) as total
                                FROM evaluadores_areas ea 
                                JOIN users u ON u.id = ea.user_id
                                JOIN asignaciones_evaluacion ae ON ae.evaluador_id = u.id
                                JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                                WHERE ea.area_competencia_id = :areaId 
                                AND ea.is_active = true 
                                AND u.is_active = true
                                AND ae.fase = :fase
                                AND ia.area_competencia_id = :areaId2";
        $stmtEvalConAsignacion = $this->pdo->prepare($sqlEvalConAsignacion);
        $stmtEvalConAsignacion->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtEvalConAsignacion->bindValue(':areaId2', $areaId, PDO::PARAM_INT);
        $stmtEvalConAsignacion->bindValue(':fase', $fase);
        $stmtEvalConAsignacion->execute();
        $evaluadoresConAsignacion = $stmtEvalConAsignacion->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
        
        
        $sqlEval = "SELECT u.id, u.name, u.email, ea.area_competencia_id, 
                           'Sin institución' as institucion_nombre,
                           0 as institucion_id
                    FROM evaluadores_areas ea 
                    JOIN users u ON u.id = ea.user_id
                    LEFT JOIN (
                        SELECT DISTINCT evaluador_id 
                        FROM asignaciones_evaluacion ae
                        JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                        WHERE ae.fase = :fase AND ia.area_competencia_id = :areaId
                    ) asignados ON asignados.evaluador_id = u.id
                    WHERE ea.area_competencia_id = :areaId 
                    AND ea.is_active = true 
                    AND u.is_active = true
                    AND asignados.evaluador_id IS NULL";
        $stmtE = $this->pdo->prepare($sqlEval);
        $stmtE->bindValue(':areaId', $areaId, PDO::PARAM_INT);
        $stmtE->bindValue(':fase', $fase);
        $stmtE->execute();
        $evaluadores = $stmtE->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        error_log("=== CONSULTA DE EVALUADORES ===");
        error_log("SQL: " . $sqlEval);
        error_log("Fase: $fase");
        error_log("Evaluadores encontrados (sin asignaciones previas): " . count($evaluadores));
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
            error_log("Total inscripciones en BD: " . $totalInscripciones);
            error_log("Inscripciones con evaluador asignado: " . $inscripcionesConAsignacion);
            error_log("Total evaluadores en BD: " . $totalEvaluadores);
            error_log("Evaluadores con asignaciones previas: " . $evaluadoresConAsignacion);
            
            $mensaje = 'Sin datos suficientes para asignar';
            if (empty($inscripciones)) {
                if ($totalInscripciones == 0) {
                    if ($fase === 'final') {
                        $mensaje = 'No hay inscripciones clasificadas con puntuación promedio >= 51 para esta área y nivel';
                    } else {
                        $mensaje = 'No hay inscripciones registradas para esta área y nivel';
                    }
                } elseif ($inscripcionesConAsignacion == $totalInscripciones) {
                    if ($fase === 'final') {
                        $mensaje = 'Todas las inscripciones clasificadas con puntuación >= 51 (' . $totalInscripciones . ') ya tienen evaluador asignado para la fase final';
                    } else {
                        $mensaje = 'Todas las inscripciones (' . $totalInscripciones . ') ya tienen evaluador asignado para esta fase';
                    }
                } else {
                    $mensaje = 'No hay inscripciones disponibles sin evaluador asignado para esta fase. Total: ' . $totalInscripciones . ', Con asignación: ' . $inscripcionesConAsignacion;
                }
            } elseif (empty($evaluadores)) {
                if ($totalEvaluadores == 0) {
                    $mensaje = 'No hay evaluadores registrados para esta área';
                } elseif ($evaluadoresConAsignacion == $totalEvaluadores) {
                    $mensaje = 'Todos los evaluadores (' . $totalEvaluadores . ') ya tienen asignaciones previas para esta fase';
                } else {
                    $mensaje = 'No hay evaluadores disponibles sin asignaciones previas para esta fase. Total: ' . $totalEvaluadores . ', Con asignación: ' . $evaluadoresConAsignacion;
                }
            }
            
            Response::success([
                'items' => [], 
                'total' => 0, 
                'mensaje' => $mensaje,
                'diagnostico' => [
                    'total_inscripciones' => $totalInscripciones,
                    'inscripciones_con_asignacion' => $inscripcionesConAsignacion,
                    'inscripciones_disponibles' => count($inscripciones),
                    'total_evaluadores' => $totalEvaluadores,
                    'evaluadores_con_asignacion' => $evaluadoresConAsignacion,
                    'evaluadores_disponibles' => count($evaluadores)
                ]
            ], $mensaje);
        }

        
        $nivelGeneralSeleccionado = $nivelId;
        
       
        $inscripcionesPorGrado = [];
        foreach ($inscripciones as $ins) {
            $gradoId = $ins['nivel_id'];
            $gradoNombre = $ins['nivel_nombre']; 
            
            if (!isset($inscripcionesPorGrado[$gradoId])) {
                $inscripcionesPorGrado[$gradoId] = [
                    'grado_nombre' => $gradoNombre,
                    'inscripciones' => []
                ];
            }
            $inscripcionesPorGrado[$gradoId]['inscripciones'][] = $ins;
        }
        
       
        error_log("=== ASIGNACIÓN AUTOMÁTICA POR GRADO DE ESCOLARIDAD ===");
        error_log("Categoría seleccionada: " . ($nivelGeneralSeleccionado === 'primaria' ? 'PRIMARIA' : ($nivelGeneralSeleccionado === 'secundaria' ? 'SECUNDARIA' : 'TODOS')));
        error_log("Grados encontrados: " . count($inscripcionesPorGrado));
        foreach ($inscripcionesPorGrado as $gradoId => $datosGrado) {
            error_log("Grado $gradoId ({$datosGrado['grado_nombre']}): " . count($datosGrado['inscripciones']) . " inscripciones");
        }
        
        
        $resultado = [];
        $evaluadoresAsignadosPorGrado = []; 
        $evaluadoresDisponibles = $evaluadores;
        $conteoAsignacionesEvaluadores = []; 
        
        foreach ($inscripcionesPorGrado as $gradoId => $datosGrado) {
            $inscripcionesGrado = $datosGrado['inscripciones'];
            $gradoNombre = $datosGrado['grado_nombre'];
            $totalInscripciones = count($inscripcionesGrado);
            
            
            $evaluadoresNecesarios = max(1, (int)ceil($totalInscripciones / $cuotaPorEvaluador));
            error_log("Grado $gradoId ($gradoNombre): $totalInscripciones inscripciones, necesita $evaluadoresNecesarios evaluador(es) (cuota: $cuotaPorEvaluador)");
            
            $evaluadoresParaGrado = [];
            
           
            for ($i = 0; $i < $evaluadoresNecesarios; $i++) {
                $evaluadorAsignado = null;
                
                if (!empty($evaluadoresDisponibles)) {
                   
                    $evaluadorAsignado = array_shift($evaluadoresDisponibles);
                    $evaluadoresParaGrado[] = $evaluadorAsignado;
                    $conteoAsignacionesEvaluadores[$evaluadorAsignado['id']] = ($conteoAsignacionesEvaluadores[$evaluadorAsignado['id']] ?? 0) + 1;
                    error_log("  - Evaluador asignado: {$evaluadorAsignado['name']} (ID: {$evaluadorAsignado['id']})");
                } else {
                   
                    $evaluadorMenosCargado = $evaluadores[0];
                    $minAsignaciones = $conteoAsignacionesEvaluadores[$evaluadores[0]['id']] ?? 0;
                    
                    foreach ($evaluadores as $eval) {
                        $asignaciones = $conteoAsignacionesEvaluadores[$eval['id']] ?? 0;
                        if ($asignaciones < $minAsignaciones) {
                            $minAsignaciones = $asignaciones;
                            $evaluadorMenosCargado = $eval;
                        }
                    }
                    
                    $evaluadorAsignado = $evaluadorMenosCargado;
                    $evaluadoresParaGrado[] = $evaluadorAsignado;
                    $conteoAsignacionesEvaluadores[$evaluadorAsignado['id']] = ($conteoAsignacionesEvaluadores[$evaluadorAsignado['id']] ?? 0) + 1;
                    error_log("  - Evaluador reutilizado: {$evaluadorAsignado['name']} (ID: {$evaluadorAsignado['id']}) - Asignaciones: {$conteoAsignacionesEvaluadores[$evaluadorAsignado['id']]}");
                }
            }
            
            $evaluadoresAsignadosPorGrado[$gradoId] = $evaluadoresParaGrado;
            
           
            $inscripcionesPorEvaluador = min((int)ceil($totalInscripciones / $evaluadoresNecesarios), $cuotaPorEvaluador);
            $indiceEvaluador = 0;
            $contadorInscripcionesEvaluador = 0;
            $conteoInscripcionesPorEvaluadorEnGrado = []; 
            
            foreach ($inscripcionesGrado as $index => $ins) {
                
                $evaluadorActual = $evaluadoresParaGrado[$indiceEvaluador];
                $evalIdActual = $evaluadorActual['id'];
                $inscripcionesAsignadas = $conteoInscripcionesPorEvaluadorEnGrado[$evalIdActual] ?? 0;
                
               
                if ($inscripcionesAsignadas >= $cuotaPorEvaluador && $indiceEvaluador < count($evaluadoresParaGrado) - 1) {
                    $indiceEvaluador++;
                    $contadorInscripcionesEvaluador = 0;
                }
                
                $evaluadorAsignado = $evaluadoresParaGrado[$indiceEvaluador];
                $evalIdAsignado = $evaluadorAsignado['id'];
                
                
                $conteoInscripcionesPorEvaluadorEnGrado[$evalIdAsignado] = ($conteoInscripcionesPorEvaluadorEnGrado[$evalIdAsignado] ?? 0) + 1;
                $contadorInscripcionesEvaluador++;
                
                
                $resultado[] = [
                    'inscripcion_area_id' => (int)$ins['inscripcion_area_id'],
                    'competidor' => $ins['nombre_completo'],
                    'area' => $ins['area_nombre'],
                    'nivel' => $ins['nivel_nombre'],
                    'nivel_id' => $gradoId,
                    'institucion' => $ins['unidad_nombre'],
                    'evaluadores' => [(int)$evaluadorAsignado['id']],
                    'evaluadores_info' => [$evaluadorAsignado]
                ];
            }
            
          
            foreach ($conteoInscripcionesPorEvaluadorEnGrado as $evalId => $cantidad) {
                $evalNombre = '';
                foreach ($evaluadoresParaGrado as $eval) {
                    if ($eval['id'] == $evalId) {
                        $evalNombre = $eval['name'];
                        break;
                    }
                }
                error_log("  - Evaluador $evalNombre (ID: $evalId): $cantidad inscripciones asignadas (cuota: $cuotaPorEvaluador)");
            }
            
            error_log("Grado $gradoId ($gradoNombre): Asignados " . count($evaluadoresParaGrado) . " evaluador(es) para $totalInscripciones inscripciones");
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

        
        $estadisticasGrados = [];
        $totalEvaluadoresUtilizados = 0;
        $evaluadoresUnicos = [];
        
        foreach ($evaluadoresAsignadosPorGrado as $gradoId => $evaluadoresGrado) {
            $datosGrado = $inscripcionesPorGrado[$gradoId];
            $totalInscripcionesGrado = count($datosGrado['inscripciones']);
            
            
            foreach ($evaluadoresGrado as $eval) {
                if (!in_array($eval['id'], $evaluadoresUnicos)) {
                    $evaluadoresUnicos[] = $eval['id'];
                }
            }
            
            
            $inscripcionesPorEval = [];
            foreach ($resultado as $item) {
                if ($item['nivel_id'] == $gradoId && !empty($item['evaluadores'])) {
                    $evalId = $item['evaluadores'][0];
                    $inscripcionesPorEval[$evalId] = ($inscripcionesPorEval[$evalId] ?? 0) + 1;
                }
            }
            
            $evaluadoresInfo = [];
            foreach ($evaluadoresGrado as $eval) {
                $evalId = $eval['id'];
                $inscripcionesAsignadas = $inscripcionesPorEval[$evalId] ?? 0;
                $evaluadoresInfo[] = [
                    'evaluador_id' => $eval['id'],
                    'evaluador_nombre' => $eval['name'],
                    'evaluador_email' => $eval['email'],
                    'inscripciones_asignadas' => $inscripcionesAsignadas
                ];
            }
            
            $estadisticasGrados[] = [
                'grado_id' => $gradoId,
                'grado_nombre' => $datosGrado['grado_nombre'],
                'total_inscripciones' => $totalInscripcionesGrado,
                'total_evaluadores' => count($evaluadoresGrado),
                'cuota_por_evaluador' => $cuotaPorEvaluador,
                'evaluadores' => $evaluadoresInfo
            ];
            
            $totalEvaluadoresUtilizados += count($evaluadoresGrado);
        }
        
        $categoria = $nivelGeneralSeleccionado === 'primaria' ? 'Primaria' : ($nivelGeneralSeleccionado === 'secundaria' ? 'Secundaria' : 'Todos');
        $mensaje = $confirmar 
            ? "Asignación automática de $categoria guardada exitosamente (con cuota de $cuotaPorEvaluador por evaluador)" 
            : "Previsualización de asignación automática para $categoria generada (con cuota de $cuotaPorEvaluador por evaluador)";
            
        Response::success([
            'items' => $resultado, 
            'total' => count($resultado),
            'estadisticas' => [
                'categoria' => $categoria,
                'total_inscripciones' => count($inscripciones),
                'total_evaluadores_disponibles' => count($evaluadores),
                'total_evaluadores_utilizados' => count($evaluadoresUnicos),
                'total_asignaciones_evaluadores' => $totalEvaluadoresUtilizados,
                'cuota_por_evaluador' => $cuotaPorEvaluador,
                'grados_asignados' => count($evaluadoresAsignadosPorGrado),
                'distribucion_grados' => $estadisticasGrados,
                'metodo' => "Asignación automática por grado de escolaridad (cuota: $cuotaPorEvaluador por evaluador)",
                'inscripciones_excluidas' => [
                    'total' => (int)$totalInscripciones,
                    'con_asignacion' => (int)$inscripcionesConAsignacion,
                    'disponibles' => count($inscripciones)
                ],
                'evaluadores_excluidos' => [
                    'total' => (int)$totalEvaluadores,
                    'con_asignacion' => (int)$evaluadoresConAsignacion,
                    'disponibles' => count($evaluadores)
                ]
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
           
            $porcentajeClasificados = 0.6; 
            $puntuacionMinima = 51.00;
            
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
            }
            
           
            $sql = "
                SELECT 
                    ia.id, 
                    o.nombre_completo, 
                    AVG(ec.puntuacion) as puntuacion_promedio,
                    COUNT(ec.id) as total_evaluaciones,
                    STRING_AGG(DISTINCT ec.observaciones, '; ') as observaciones
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ? 
                AND ia.nivel_competencia_id = ?
                AND ia.estado NOT IN ('desclasificado', 'no_clasificado')
                GROUP BY ia.id, o.nombre_completo
                HAVING AVG(ec.puntuacion) >= ?
                ORDER BY puntuacion_promedio DESC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $nivelId, $puntuacionMinima]);
            $participantesElegibles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $totalElegibles = count($participantesElegibles);
            $limiteClasificados = (int)($totalElegibles * $porcentajeClasificados);
            
            $clasificados = array_slice($participantesElegibles, 0, $limiteClasificados);
            $noClasificados = array_slice($participantesElegibles, $limiteClasificados);
            
           
            $sqlNoMinima = "
                SELECT 
                    ia.id, 
                    o.nombre_completo, 
                    AVG(ec.puntuacion) as puntuacion_promedio,
                    COUNT(ec.id) as total_evaluaciones,
                    STRING_AGG(DISTINCT ec.observaciones, '; ') as observaciones
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ? 
                AND ia.nivel_competencia_id = ?
                AND ia.estado NOT IN ('desclasificado', 'no_clasificado')
                GROUP BY ia.id, o.nombre_completo
                HAVING AVG(ec.puntuacion) < ?
                ORDER BY puntuacion_promedio DESC
            ";
            
            $stmtNoMinima = $this->pdo->prepare($sqlNoMinima);
            $stmtNoMinima->execute([$areaId, $nivelId, $puntuacionMinima]);
            $descalificados = $stmtNoMinima->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'clasificados' => array_map(function($p) {
                    return [
                        'id' => $p['id'],
                        'nombre_completo' => $p['nombre_completo'],
                        'puntuacion' => round((float)$p['puntuacion_promedio'], 2),
                        'observaciones' => $p['observaciones']
                    ];
                }, $clasificados),
                'no_clasificados' => array_map(function($p) {
                    return [
                        'id' => $p['id'],
                        'nombre_completo' => $p['nombre_completo'],
                        'puntuacion' => round((float)$p['puntuacion_promedio'], 2),
                        'observaciones' => $p['observaciones']
                    ];
                }, $noClasificados),
                'descalificados' => array_map(function($p) {
                    return [
                        'id' => $p['id'],
                        'nombre_completo' => $p['nombre_completo'],
                        'puntuacion' => round((float)$p['puntuacion_promedio'], 2),
                        'observaciones' => $p['observaciones']
                    ];
                }, $descalificados),
                'total' => $totalElegibles + count($descalificados),
                'criterios' => [
                    'puntuacion_minima' => $puntuacionMinima,
                    'nota' => 'Todos los participantes con puntuación >= ' . $puntuacionMinima . ' puntos son clasificados'
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
                           o.grado_escolaridad,
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
            
            
            error_log("SQL ejecutado: " . $sql);
            error_log("Parámetros: " . json_encode($params));
            error_log("Participantes encontrados: " . count($participantes));
            if (!empty($participantes)) {
                error_log("Primer participante: " . json_encode($participantes[0]));
            }
            
           
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

   
    public function getListasClasificacion()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            $nivelId = $_GET['nivel_id'] ?? null;
            $fase = $_GET['fase'] ?? 'clasificacion';
            
            if (!$areaId || !$nivelId) {
                Response::validationError(['general' => 'Se requieren area_id y nivel_id']);
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
            
            
            $listas = [
                'clasificados' => [],
                'no_clasificados' => [],
                'descalificados' => [],
                'premiados' => []
            ];
            
            foreach ($participantes as $participante) {
                $estado = $participante['estado_clasificacion'];
                if (isset($listas[$estado])) {
                    $listas[$estado][] = $participante;
                }
            }
            
            
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
            
            
            $estadoAprobacion = $_GET['estado_aprobacion'] ?? null;
            
            $filtros = [
                'nivel_id' => $nivelId,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'evaluador_id' => $evaluadorId,
                'olimpista_id' => $olimpistaId,
                'estado_aprobacion' => $estadoAprobacion
            ];
            
            
            $cambios = LogCambiosNotas::getCambiosPorArea($areaId, $filtros);
            
            
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

   
    public function getEvaluadoresPorArea()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                Response::validationError(['area_id' => 'El área es requerida']);
            }
            
            
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

    
    public function getCambiosPendientes()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
           
            $sqlArea = "SELECT area_competencia_id 
                       FROM responsables_academicos 
                       WHERE user_id = ? AND is_active = true 
                       LIMIT 1";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $area = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$area) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $totalPendientes = LogCambiosNotas::getCambiosPendientes($area['area_competencia_id']);
            
            Response::success([
                'total_pendientes' => $totalPendientes,
                'area_id' => $area['area_competencia_id']
            ], 'Contador de cambios pendientes obtenido');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo cambios pendientes: ' . $e->getMessage());
            Response::serverError('No se pudo obtener el contador de cambios pendientes');
        }
    }

    
    public function aprobarCambio($cambioId)
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $observaciones = $input['observaciones'] ?? null;
            
           
            $cambio = LogCambiosNotas::getCambioPorId($cambioId);
            
            if (!$cambio) {
                Response::error('Cambio no encontrado', 404);
                return;
            }
            
            
            $sqlArea = "SELECT area_competencia_id 
                       FROM responsables_academicos 
                       WHERE user_id = ? AND area_competencia_id = ? AND is_active = true 
                       LIMIT 1";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id'], $cambio['area_competencia_id']]);
            $area = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$area) {
                Response::error('No tienes permiso para aprobar cambios de este área', 403);
                return;
            }
            
           
            if ($cambio['estado_aprobacion'] !== 'pendiente') {
                Response::error('Este cambio ya fue procesado', 400);
                return;
            }
            
            
            $resultado = LogCambiosNotas::aprobarCambio($cambioId, $currentUser['id'], $observaciones);
            
            if ($resultado) {
                
                $sqlEvaluador = "SELECT id, name, email FROM users WHERE id = ?";
                $stmtEvaluador = $this->pdo->prepare($sqlEvaluador);
                $stmtEvaluador->execute([$cambio['evaluador_id']]);
                $evaluador = $stmtEvaluador->fetch(PDO::FETCH_ASSOC);
                
                
                try {
                    $mailer = new \ForwardSoft\Utils\Mailer();
                    $mailer->enviarNotificacionCambioAprobado($evaluador, $cambio, $observaciones);
                } catch (\Exception $e) {
                    error_log('Error enviando notificación de aprobación: ' . $e->getMessage());
                }
                
                Response::success([
                    'cambio_id' => $cambioId,
                    'estado' => 'aprobado'
                ], 'Cambio aprobado exitosamente');
            } else {
                Response::error('No se pudo aprobar el cambio', 500);
            }
            
        } catch (\Exception $e) {
            error_log('Error aprobando cambio: ' . $e->getMessage());
            Response::serverError('No se pudo aprobar el cambio');
        }
    }

    
    public function rechazarCambio($cambioId)
    {
        try {
           
            if (empty($cambioId) || !is_numeric($cambioId)) {
                error_log('CoordinadorController::rechazarCambio - cambioId inválido: ' . var_export($cambioId, true));
                Response::error('ID de cambio inválido', 400);
                return;
            }
            
            $cambioId = (int)$cambioId;
            error_log('CoordinadorController::rechazarCambio - Procesando cambio ID: ' . $cambioId);
            
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $observaciones = $input['observaciones'] ?? null;
            
           
            $cambio = LogCambiosNotas::getCambioPorId($cambioId);
            
            if (!$cambio) {
                error_log('CoordinadorController::rechazarCambio - Cambio no encontrado: ' . $cambioId);
                Response::error('Cambio no encontrado', 404);
                return;
            }
            
           
            $sqlArea = "SELECT area_competencia_id 
                       FROM responsables_academicos 
                       WHERE user_id = ? AND area_competencia_id = ? AND is_active = true 
                       LIMIT 1";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id'], $cambio['area_competencia_id']]);
            $area = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$area) {
                error_log('CoordinadorController::rechazarCambio - Sin permiso para área: ' . $cambio['area_competencia_id']);
                Response::error('No tienes permiso para rechazar cambios de este área', 403);
                return;
            }
            
            
            if ($cambio['estado_aprobacion'] !== 'pendiente') {
                error_log('CoordinadorController::rechazarCambio - Cambio ya procesado: ' . $cambio['estado_aprobacion']);
                Response::error('Este cambio ya fue procesado', 400);
                return;
            }
            
            
            $resultado = LogCambiosNotas::rechazarCambio($cambioId, $currentUser['id'], $observaciones);
            
            if ($resultado) {
               
                $sqlEvaluador = "SELECT id, name, email FROM users WHERE id = ?";
                $stmtEvaluador = $this->pdo->prepare($sqlEvaluador);
                $stmtEvaluador->execute([$cambio['evaluador_id']]);
                $evaluador = $stmtEvaluador->fetch(PDO::FETCH_ASSOC);
                
                
                try {
                    if ($evaluador) {
                        $mailer = new \ForwardSoft\Utils\Mailer();
                        $mailer->enviarNotificacionCambioRechazado($evaluador, $cambio, $observaciones);
                    }
                } catch (\Exception $e) {
                    error_log('Error enviando notificación de rechazo: ' . $e->getMessage());
                   
                }
                
                error_log('CoordinadorController::rechazarCambio - Cambio rechazado exitosamente: ' . $cambioId);
                Response::success([
                    'cambio_id' => $cambioId,
                    'estado' => 'rechazado',
                    'nota_revertida' => true
                ], 'Cambio rechazado y nota revertida exitosamente');
            } else {
                error_log('CoordinadorController::rechazarCambio - No se pudo rechazar el cambio: ' . $cambioId);
                Response::error('No se pudo rechazar el cambio', 500);
            }
            
        } catch (\Exception $e) {
            error_log('Error rechazando cambio: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            Response::serverError('No se pudo rechazar el cambio: ' . $e->getMessage());
        }
    }

    
    public function solicitarMasInfo($cambioId)
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $observaciones = $input['observaciones'] ?? null;
            
            if (empty($observaciones)) {
                Response::validationError(['observaciones' => 'Las observaciones son requeridas']);
                return;
            }
            
            
            $cambio = LogCambiosNotas::getCambioPorId($cambioId);
            
            if (!$cambio) {
                Response::error('Cambio no encontrado', 404);
                return;
            }
            
           
            $sqlArea = "SELECT area_competencia_id 
                       FROM responsables_academicos 
                       WHERE user_id = ? AND area_competencia_id = ? AND is_active = true 
                       LIMIT 1";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id'], $cambio['area_competencia_id']]);
            $area = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$area) {
                Response::error('No tienes permiso para solicitar información de cambios de este área', 403);
                return;
            }
            
            
            if ($cambio['estado_aprobacion'] !== 'pendiente') {
                Response::error('Este cambio ya fue procesado', 400);
                return;
            }
            
            
            $resultado = LogCambiosNotas::solicitarMasInfo($cambioId, $currentUser['id'], $observaciones);
            
            if ($resultado) {
               
                $sqlEvaluador = "SELECT id, name, email FROM users WHERE id = ?";
                $stmtEvaluador = $this->pdo->prepare($sqlEvaluador);
                $stmtEvaluador->execute([$cambio['evaluador_id']]);
                $evaluador = $stmtEvaluador->fetch(PDO::FETCH_ASSOC);
                
               
                try {
                    $mailer = new \ForwardSoft\Utils\Mailer();
                    $mailer->enviarNotificacionSolicitudInfo($evaluador, $cambio, $observaciones);
                } catch (\Exception $e) {
                    error_log('Error enviando notificación de solicitud de info: ' . $e->getMessage());
                }
                
                Response::success([
                    'cambio_id' => $cambioId,
                    'estado' => 'pendiente'
                ], 'Solicitud de más información enviada al evaluador');
            } else {
                Response::error('No se pudo procesar la solicitud', 500);
            }
            
        } catch (\Exception $e) {
            error_log('Error solicitando más información: ' . $e->getMessage());
            Response::serverError('No se pudo procesar la solicitud');
        }
    }

    public function getProgresoEvaluacion()
    {
        try {
            
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
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
            
           
            $this->actualizarEstadosClasificacion($areaId);
            
           
            $sqlEstadoCierre = "
                SELECT estado, fecha_cierre
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'clasificacion'
                LIMIT 1
            ";
            $stmtEstadoCierre = $this->pdo->prepare($sqlEstadoCierre);
            $stmtEstadoCierre->execute([$areaId]);
            $estadoCierre = $stmtEstadoCierre->fetch(PDO::FETCH_ASSOC);
            $faseCerrada = $estadoCierre && $estadoCierre['estado'] === 'cerrada';
            
            $sqlNiveles = "
                SELECT 
                    nc.nombre as nivel_nombre,
                    COUNT(ia.id) as total_olimpistas,
                    COUNT(CASE WHEN ec.id IS NOT NULL THEN ia.id END) as evaluados,
                    COUNT(CASE 
                        WHEN ia.estado = 'clasificado' THEN ia.id 
                    END) as clasificados,
                    COUNT(CASE 
                        WHEN ia.estado = 'no_clasificado' OR EXISTS (
                            SELECT 1 FROM no_clasificados ncl 
                            WHERE ncl.inscripcion_area_id = ia.id 
                            AND ncl.fase = 'clasificacion'
                        ) THEN ia.id 
                    END) as no_clasificados,
                    COUNT(CASE 
                        WHEN ia.estado = 'desclasificado' OR EXISTS (
                            SELECT 1 FROM desclasificaciones d 
                            WHERE d.inscripcion_area_id = ia.id 
                            AND d.estado = 'activa'
                        ) THEN ia.id 
                    END) as desclasificados,
                    COUNT(CASE 
                        WHEN ia.estado NOT IN ('desclasificado', 'no_clasificado', 'clasificado') 
                        AND ec.id IS NULL 
                        AND NOT EXISTS (
                            SELECT 1 FROM desclasificaciones d 
                            WHERE d.inscripcion_area_id = ia.id 
                            AND d.estado = 'activa'
                        ) THEN ia.id 
                    END) as pendientes,
                    AVG(CASE WHEN ec.id IS NOT NULL THEN ec.puntuacion END) as promedio_puntuacion,
                    CASE 
                        WHEN COUNT(ia.id) > 0 
                        THEN ROUND((COUNT(CASE WHEN ec.id IS NOT NULL THEN ia.id END) * 100.0) / COUNT(ia.id), 2)
                        ELSE 0 
                    END as porcentaje,
                    CASE 
                        WHEN COUNT(ia.id) > 0 
                        THEN ROUND((COUNT(CASE 
                            WHEN ia.estado = 'desclasificado' OR EXISTS (
                                SELECT 1 FROM desclasificaciones d 
                                WHERE d.inscripcion_area_id = ia.id 
                                AND d.estado = 'activa'
                            ) THEN ia.id 
                        END) * 100.0) / COUNT(ia.id), 2)
                        ELSE 0 
                    END as porcentaje_desclasificados
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
            
            error_log("getProgresoEvaluacion - Niveles obtenidos: " . count($niveles));
            error_log("getProgresoEvaluacion - Primer nivel (raw): " . json_encode($niveles[0] ?? null));
            
            // Asegurar que los valores numéricos sean enteros
            foreach ($niveles as &$nivel) {
                $nivel['total_olimpistas'] = (int)($nivel['total_olimpistas'] ?? 0);
                $nivel['evaluados'] = (int)($nivel['evaluados'] ?? 0);
                $nivel['clasificados'] = (int)($nivel['clasificados'] ?? 0);
                $nivel['no_clasificados'] = (int)($nivel['no_clasificados'] ?? 0);
                $nivel['desclasificados'] = (int)($nivel['desclasificados'] ?? 0);
                $nivel['pendientes'] = (int)($nivel['pendientes'] ?? 0);
                $nivel['promedio_puntuacion'] = $nivel['promedio_puntuacion'] ? round((float)$nivel['promedio_puntuacion'], 2) : 0;
                $nivel['porcentaje'] = $nivel['porcentaje'] ? round((float)$nivel['porcentaje'], 2) : 0;
                $nivel['porcentaje_desclasificados'] = $nivel['porcentaje_desclasificados'] ? round((float)$nivel['porcentaje_desclasificados'], 2) : 0;
            }
            unset($nivel); 
            
            error_log("getProgresoEvaluacion - Niveles procesados: " . json_encode($niveles));
            
            
            $sqlEvaluadores = "
                SELECT 
                    COUNT(DISTINCT ea.user_id) as total_evaluadores,
                    COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '7 days' THEN ea.user_id END) as evaluadores_activos,
                    COUNT(DISTINCT CASE 
                        WHEN pe.id IS NOT NULL 
                        AND pe.status = 'activo'
                        AND NOW() >= (pe.start_date + COALESCE(pe.start_time, '00:00:00')::time)
                        AND NOW() <= (pe.start_date + (pe.duration_days || ' days')::interval)
                        THEN ea.user_id 
                    END) as evaluadores_con_permisos
                FROM evaluadores_areas ea
                JOIN users u ON u.id = ea.user_id
                LEFT JOIN permisos_evaluadores pe ON pe.evaluador_id = u.id 
                    AND pe.status = 'activo'
                WHERE ea.is_active = true AND u.is_active = true AND ea.area_competencia_id = ?
            ";
            
            $stmtEvaluadores = $this->pdo->prepare($sqlEvaluadores);
            $stmtEvaluadores->execute([$areaId]);
            $evaluadoresStats = $stmtEvaluadores->fetch(PDO::FETCH_ASSOC);
            
            
            $sqlEvaluadoresActivos = "
                SELECT 
                    u.id,
                    u.name as nombre,
                    u.email,
                    u.last_login,
                    COUNT(DISTINCT ec.id) as evaluaciones_completadas,
                    COUNT(DISTINCT ae.id) as asignaciones_pendientes,
                    pe.start_date,
                    pe.start_time,
                    pe.duration_days,
                    CASE 
                        WHEN pe.id IS NOT NULL 
                        AND pe.status = 'activo'
                        AND NOW() >= (pe.start_date + COALESCE(pe.start_time, '00:00:00')::time)
                        AND NOW() <= (pe.start_date + (pe.duration_days || ' days')::interval)
                        THEN 'con_permisos'
                        WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'activo_sin_permisos'
                        ELSE 'inactivo'
                    END as estado
                FROM evaluadores_areas ea
                JOIN users u ON u.id = ea.user_id
                LEFT JOIN (
                    SELECT DISTINCT ON (evaluador_id) 
                        id, evaluador_id, start_date, start_time, duration_days, status
                    FROM permisos_evaluadores
                    WHERE status = 'activo'
                    ORDER BY evaluador_id, start_date DESC, start_time DESC
                ) pe ON pe.evaluador_id = u.id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.evaluador_id = u.id
                LEFT JOIN asignaciones_evaluacion ae ON ae.evaluador_id = u.id
                WHERE ea.is_active = true AND u.is_active = true AND ea.area_competencia_id = ?
                GROUP BY u.id, u.name, u.email, u.last_login, pe.id, pe.start_date, pe.start_time, pe.duration_days, pe.status
                ORDER BY u.last_login DESC NULLS LAST
            ";
            
            $stmtEvaluadoresActivos = $this->pdo->prepare($sqlEvaluadoresActivos);
            $stmtEvaluadoresActivos->execute([$areaId]);
            $evaluadoresActivos = $stmtEvaluadoresActivos->fetchAll(PDO::FETCH_ASSOC);
            
            
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
                WHERE (ia.estado IS NULL OR ia.estado NOT IN ('desclasificado', 'no_clasificado'))
                AND ec.id IS NULL
                AND NOT EXISTS (
                    SELECT 1 FROM desclasificaciones d 
                    WHERE d.inscripcion_area_id = ia.id 
                    AND d.estado = 'activa'
                )
                AND ia.area_competencia_id = ?
                ORDER BY ia.created_at ASC
                LIMIT 20
            ";
            
            $stmtSinEvaluar = $this->pdo->prepare($sqlSinEvaluar);
            $stmtSinEvaluar->execute([$areaId]);
            $olimpistasSinEvaluar = $stmtSinEvaluar->fetchAll(PDO::FETCH_ASSOC);
            
            
            $sqlDescalificaciones = "
                SELECT 
                    COUNT(DISTINCT d.id) as total_desclasificaciones,
                    COUNT(DISTINCT CASE WHEN d.fecha_desclasificacion > NOW() - INTERVAL '7 days' THEN d.id END) as desclasificaciones_recientes,
                    rd.tipo,
                    COUNT(*) as cantidad_por_tipo
                FROM desclasificaciones d
                JOIN reglas_desclasificacion rd ON rd.id = d.regla_desclasificacion_id
                JOIN inscripciones_areas ia ON ia.id = d.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
                GROUP BY rd.tipo
            ";
            
            $stmtDescalificaciones = $this->pdo->prepare($sqlDescalificaciones);
            $stmtDescalificaciones->execute([$areaId]);
            $desclasificacionesStats = $stmtDescalificaciones->fetchAll(PDO::FETCH_ASSOC);
            
           
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
            
           
            $totalOlimpistas = (int)array_sum(array_map(function($n) { return (int)($n['total_olimpistas'] ?? 0); }, $niveles));
            $totalEvaluados = (int)array_sum(array_map(function($n) { return (int)($n['evaluados'] ?? 0); }, $niveles));
            $totalClasificados = (int)array_sum(array_map(function($n) { return (int)($n['clasificados'] ?? 0); }, $niveles));
            $totalNoClasificados = (int)array_sum(array_map(function($n) { return (int)($n['no_clasificados'] ?? 0); }, $niveles));
            $totalDesclasificados = (int)array_sum(array_map(function($n) { return (int)($n['desclasificados'] ?? 0); }, $niveles));
            $totalPendientes = (int)array_sum(array_map(function($n) { return (int)($n['pendientes'] ?? 0); }, $niveles));
            $promedioGeneral = $totalOlimpistas > 0 ? round(($totalEvaluados * 100) / $totalOlimpistas, 2) : 0;
            $promedioDesclasificados = $totalOlimpistas > 0 ? round(($totalDesclasificados * 100) / $totalOlimpistas, 2) : 0;
            
            $responseData = [
                'niveles' => $niveles,
                'evaluadores' => [
                    'total' => (int)$evaluadoresStats['total_evaluadores'],
                    'activos' => (int)$evaluadoresStats['evaluadores_activos'],
                    'con_permisos' => (int)($evaluadoresStats['evaluadores_con_permisos'] ?? 0)
                ],
                'evaluadores_lista' => $evaluadoresActivos,
                'olimpistas_sin_evaluar' => $olimpistasSinEvaluar,
                'desclasificaciones' => [
                    'estadisticas' => $desclasificacionesStats,
                    'total_desclasificados' => $totalDesclasificados,
                    'porcentaje_desclasificados' => $promedioDesclasificados
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
                    'total_olimpistas' => (int)$totalOlimpistas,
                    'total_evaluados' => (int)$totalEvaluados,
                    'total_clasificados' => (int)$totalClasificados,
                    'total_no_clasificados' => (int)$totalNoClasificados,
                    'total_pendientes' => (int)$totalPendientes,
                    'total_desclasificados' => (int)$totalDesclasificados,
                    'promedio_general' => $promedioGeneral,
                    'promedio_desclasificados' => $promedioDesclasificados
                ],
                'estado_fase' => [
                    'cerrada' => $faseCerrada,
                    'estado' => $estadoCierre ? $estadoCierre['estado'] : 'activa',
                    'fecha_cierre' => $estadoCierre ? $estadoCierre['fecha_cierre'] : null
                ],
                'ultima_actualizacion' => date('Y-m-d H:i:s')
            ];
            
            error_log("getProgresoEvaluacion - Estadísticas generales: " . json_encode($responseData['estadisticas_generales']));
            error_log("getProgresoEvaluacion - Estado fase: " . json_encode($responseData['estado_fase']));
            error_log("getProgresoEvaluacion - Total niveles: " . count($niveles));
            
            Response::success($responseData, 'Datos de progreso obtenidos');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo progreso de evaluación: ' . $e->getMessage());
            Response::serverError('Error al obtener datos de progreso: ' . $e->getMessage());
        }
    }

    
    public function getProgresoEvaluacionFinal()
    {
        try {
            
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
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
            
            $sqlEstadoCierre = "
                SELECT estado, fecha_cierre
                FROM cierre_fase_general
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ";
            $stmtEstadoCierre = $this->pdo->prepare($sqlEstadoCierre);
            $stmtEstadoCierre->execute();
            $estadoCierreGeneral = $stmtEstadoCierre->fetch(PDO::FETCH_ASSOC);
            
            if (!$estadoCierreGeneral || !in_array($estadoCierreGeneral['estado'], ['cerrada_general', 'cerrada_automatica'])) {
                Response::error('La fase clasificatoria debe estar cerrada para acceder a la fase final', 400);
                return;
            }
            
           
            $sqlCierreFaseFinal = "
                SELECT estado, fecha_cierre, coordinador_id
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'final'
                LIMIT 1
            ";
            $stmtCierreFaseFinal = $this->pdo->prepare($sqlCierreFaseFinal);
            $stmtCierreFaseFinal->execute([$areaId]);
            $estadoCierreFaseFinal = $stmtCierreFaseFinal->fetch(PDO::FETCH_ASSOC);
            
            $faseFinalCerrada = $estadoCierreFaseFinal && 
                               $estadoCierreFaseFinal['estado'] === 'cerrada' && 
                               $estadoCierreFaseFinal['fecha_cierre'] !== null;
            
            $sqlNiveles = "
                SELECT 
                    nc.nombre as nivel_nombre,
                    COUNT(ia.id) FILTER (WHERE ia.estado = 'clasificado') as total_clasificados,
                    COUNT(ef.id) as evaluados,
                    COUNT(CASE 
                        WHEN ef.puntuacion >= 90 THEN ia.id 
                    END) as premiados_oro,
                    COUNT(CASE 
                        WHEN ef.puntuacion >= 80 AND ef.puntuacion < 90 THEN ia.id 
                    END) as premiados_plata,
                    COUNT(CASE 
                        WHEN ef.puntuacion >= 70 AND ef.puntuacion < 80 THEN ia.id 
                    END) as premiados_bronce,
                    COUNT(CASE 
                        WHEN ef.puntuacion < 70 THEN ia.id 
                    END) as no_premiados,
                    COUNT(CASE 
                        WHEN ef.id IS NULL AND ia.estado = 'clasificado' THEN ia.id 
                    END) as pendientes,
                    AVG(CASE WHEN ef.id IS NOT NULL THEN ef.puntuacion END) as promedio_puntuacion,
                    CASE 
                        WHEN COUNT(ia.id) FILTER (WHERE ia.estado = 'clasificado') > 0 
                        THEN ROUND((COUNT(ef.id) * 100.0) / COUNT(ia.id) FILTER (WHERE ia.estado = 'clasificado'), 2)
                        ELSE 0 
                    END as porcentaje_evaluados
                FROM inscripciones_areas ia
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                GROUP BY nc.id, nc.nombre, nc.orden_display
                ORDER BY nc.orden_display
            ";
            
            $stmtNiveles = $this->pdo->prepare($sqlNiveles);
            $stmtNiveles->execute([$areaId]);
            $niveles = $stmtNiveles->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($niveles as &$nivel) {
                $nivel['total_clasificados'] = (int)($nivel['total_clasificados'] ?? 0);
                $nivel['evaluados'] = (int)($nivel['evaluados'] ?? 0);
                $nivel['premiados_oro'] = (int)($nivel['premiados_oro'] ?? 0);
                $nivel['premiados_plata'] = (int)($nivel['premiados_plata'] ?? 0);
                $nivel['premiados_bronce'] = (int)($nivel['premiados_bronce'] ?? 0);
                $nivel['no_premiados'] = (int)($nivel['no_premiados'] ?? 0);
                $nivel['pendientes'] = (int)($nivel['pendientes'] ?? 0);
                $nivel['promedio_puntuacion'] = $nivel['promedio_puntuacion'] ? round((float)$nivel['promedio_puntuacion'], 2) : 0;
                $nivel['porcentaje_evaluados'] = $nivel['porcentaje_evaluados'] ? round((float)$nivel['porcentaje_evaluados'], 2) : 0;
            }
            unset($nivel);
            
            $sqlEvaluadores = "
                SELECT 
                    COUNT(DISTINCT ae.evaluador_id) as total_evaluadores_final,
                    COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '7 days' THEN ae.evaluador_id END) as evaluadores_activos,
                    COUNT(DISTINCT CASE 
                        WHEN pe.id IS NOT NULL 
                        AND pe.status = 'activo'
                        AND NOW() >= (pe.start_date + COALESCE(pe.start_time, '00:00:00')::time)
                        AND NOW() <= (pe.start_date + (pe.duration_days || ' days')::interval)
                        THEN ae.evaluador_id 
                    END) as evaluadores_con_permisos
                FROM asignaciones_evaluacion ae
                JOIN users u ON u.id = ae.evaluador_id
                JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                LEFT JOIN permisos_evaluadores pe ON pe.evaluador_id = u.id 
                    AND pe.status = 'activo'
                WHERE ae.fase = 'final'
                AND ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
            ";
            
            $stmtEvaluadores = $this->pdo->prepare($sqlEvaluadores);
            $stmtEvaluadores->execute([$areaId]);
            $evaluadoresStats = $stmtEvaluadores->fetch(PDO::FETCH_ASSOC);
            
            $sqlEvaluadoresActivos = "
                SELECT 
                    u.id,
                    u.name as nombre,
                    u.email,
                    u.last_login,
                    COUNT(DISTINCT ef.id) as evaluaciones_completadas,
                    COUNT(DISTINCT ae.id) FILTER (WHERE ef.id IS NULL) as asignaciones_pendientes,
                    pe.start_date,
                    pe.start_time,
                    pe.duration_days,
                    CASE 
                        WHEN pe.id IS NOT NULL 
                        AND pe.status = 'activo'
                        AND NOW() >= (pe.start_date + COALESCE(pe.start_time, '00:00:00')::time)
                        AND NOW() <= (pe.start_date + (pe.duration_days || ' days')::interval)
                        THEN 'con_permisos'
                        WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'activo_sin_permisos'
                        ELSE 'inactivo'
                    END as estado
                FROM asignaciones_evaluacion ae
                JOIN users u ON u.id = ae.evaluador_id
                JOIN inscripciones_areas ia ON ia.id = ae.inscripcion_area_id
                LEFT JOIN (
                    SELECT DISTINCT ON (evaluador_id) 
                        id, evaluador_id, start_date, start_time, duration_days, status
                    FROM permisos_evaluadores
                    WHERE status = 'activo'
                    ORDER BY evaluador_id, start_date DESC, start_time DESC
                ) pe ON pe.evaluador_id = u.id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ae.inscripcion_area_id 
                    AND ef.evaluador_id = ae.evaluador_id
                WHERE ae.fase = 'final'
                AND ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                GROUP BY u.id, u.name, u.email, u.last_login, pe.id, pe.start_date, pe.start_time, pe.duration_days, pe.status
                ORDER BY u.last_login DESC NULLS LAST
            ";
            
            $stmtEvaluadoresActivos = $this->pdo->prepare($sqlEvaluadoresActivos);
            $stmtEvaluadoresActivos->execute([$areaId]);
            $evaluadoresActivos = $stmtEvaluadoresActivos->fetchAll(PDO::FETCH_ASSOC);
            
            $sqlSinEvaluar = "
                SELECT 
                    ia.id,
                    COALESCE(o.nombre_completo, CONCAT(o.nombre, ' ', COALESCE(o.apellido, ''))) as nombre,
                    ac.nombre as area,
                    nc.nombre as nivel,
                    EXTRACT(DAYS FROM NOW() - cg.fecha_cierre) as dias_desde_cierre,
                    CASE 
                        WHEN EXTRACT(DAYS FROM NOW() - cg.fecha_cierre) > 5 THEN 'critico'
                        WHEN EXTRACT(DAYS FROM NOW() - cg.fecha_cierre) > 3 THEN 'advertencia'
                        ELSE 'normal'
                    END as nivel_alerta,
                    ae.evaluador_id,
                    u.name as evaluador_nombre
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN asignaciones_evaluacion ae ON ae.inscripcion_area_id = ia.id AND ae.fase = 'final'
                LEFT JOIN users u ON u.id = ae.evaluador_id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                LEFT JOIN cierre_fase_general cg ON cg.fase = 'clasificacion'
                WHERE ia.estado = 'clasificado'
                AND ef.id IS NULL
                AND ia.area_competencia_id = ?
                ORDER BY ia.created_at ASC
                LIMIT 20
            ";
            
            $stmtSinEvaluar = $this->pdo->prepare($sqlSinEvaluar);
            $stmtSinEvaluar->execute([$areaId]);
            $clasificadosSinEvaluar = $stmtSinEvaluar->fetchAll(PDO::FETCH_ASSOC);
            
            $sqlTiempoPromedio = "
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (ef.fecha_evaluacion - cg.fecha_cierre))/86400) as dias_promedio_evaluacion,
                    MIN(EXTRACT(EPOCH FROM (ef.fecha_evaluacion - cg.fecha_cierre))/86400) as tiempo_minimo,
                    MAX(EXTRACT(EPOCH FROM (ef.fecha_evaluacion - cg.fecha_cierre))/86400) as tiempo_maximo
                FROM inscripciones_areas ia
                JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                JOIN cierre_fase_general cg ON cg.fase = 'clasificacion'
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                AND ef.fecha_evaluacion IS NOT NULL
                AND cg.fecha_cierre IS NOT NULL
            ";
            
            $stmtTiempo = $this->pdo->prepare($sqlTiempoPromedio);
            $stmtTiempo->execute([$areaId]);
            $tiempoStats = $stmtTiempo->fetch(PDO::FETCH_ASSOC);
            
            $totalClasificados = (int)array_sum(array_map(function($n) { return (int)($n['total_clasificados'] ?? 0); }, $niveles));
            $totalEvaluados = (int)array_sum(array_map(function($n) { return (int)($n['evaluados'] ?? 0); }, $niveles));
            $totalPremiadosOro = (int)array_sum(array_map(function($n) { return (int)($n['premiados_oro'] ?? 0); }, $niveles));
            $totalPremiadosPlata = (int)array_sum(array_map(function($n) { return (int)($n['premiados_plata'] ?? 0); }, $niveles));
            $totalPremiadosBronce = (int)array_sum(array_map(function($n) { return (int)($n['premiados_bronce'] ?? 0); }, $niveles));
            $totalNoPremiados = (int)array_sum(array_map(function($n) { return (int)($n['no_premiados'] ?? 0); }, $niveles));
            $totalPendientes = (int)array_sum(array_map(function($n) { return (int)($n['pendientes'] ?? 0); }, $niveles));
            $promedioGeneral = $totalClasificados > 0 ? round(($totalEvaluados * 100) / $totalClasificados, 2) : 0;

           
            $medallasAsignadas = [
                'oro' => 0,
                'plata' => 0,
                'bronce' => 0,
                'mencion_honor' => 0,
                'sin_medalla' => 0
            ];
            $topParticipantes = [];
            $configMedallero = null;

            if ($faseFinalCerrada) {
                
                $sqlMedallas = "
                    SELECT 
                        COUNT(*) FILTER (WHERE medalla_asignada = 'oro') as oro,
                        COUNT(*) FILTER (WHERE medalla_asignada = 'plata') as plata,
                        COUNT(*) FILTER (WHERE medalla_asignada = 'bronce') as bronce,
                        COUNT(*) FILTER (WHERE medalla_asignada = 'mencion_honor') as mencion_honor,
                        COUNT(*) FILTER (WHERE medalla_asignada IS NULL AND estado = 'clasificado') as sin_medalla
                    FROM inscripciones_areas
                    WHERE area_competencia_id = ? 
                    AND estado = 'clasificado'
                ";
                $stmtMedallas = $this->pdo->prepare($sqlMedallas);
                $stmtMedallas->execute([$areaId]);
                $medallasData = $stmtMedallas->fetch(PDO::FETCH_ASSOC);

                if ($medallasData) {
                    $medallasAsignadas = [
                        'oro' => (int)($medallasData['oro'] ?? 0),
                        'plata' => (int)($medallasData['plata'] ?? 0),
                        'bronce' => (int)($medallasData['bronce'] ?? 0),
                        'mencion_honor' => (int)($medallasData['mencion_honor'] ?? 0),
                        'sin_medalla' => (int)($medallasData['sin_medalla'] ?? 0)
                    ];
                }

               
                $sqlTop = "
                    SELECT 
                        o.nombre_completo,
                        ue.nombre as unidad_educativa,
                        nc.nombre as nivel_nombre,
                        o.grado_escolaridad,
                        AVG(ef.puntuacion) as nota_promedio,
                        COUNT(ef.id) as num_evaluaciones,
                        ia.medalla_asignada as medalla
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                    LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado = 'clasificado'
                    GROUP BY ia.id, o.nombre_completo, ue.nombre, nc.nombre, o.grado_escolaridad, ia.medalla_asignada
                    HAVING COUNT(ef.id) > 0
                    ORDER BY nota_promedio DESC
                    LIMIT 5
                ";
                $stmtTop = $this->pdo->prepare($sqlTop);
                $stmtTop->execute([$areaId]);
                $topParticipantes = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

                
                try {
                    
                    $sqlCheckConfig = "
                        SELECT id, oro, plata, bronce, mencion_honor, 
                               oro_min, oro_max, plata_min, plata_max, bronce_min, bronce_max,
                               nivel_competencia_id, grado_escolaridad
                        FROM configuracion_medallero
                        WHERE area_competencia_id = ?
                        AND nivel_competencia_id IS NULL
                        AND (grado_escolaridad IS NULL OR grado_escolaridad = '')
                        LIMIT 1
                    ";
                    $stmtCheck = $this->pdo->prepare($sqlCheckConfig);
                    $stmtCheck->execute([$areaId]);
                    $configMedalleroRaw = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                    
                    if (!$configMedalleroRaw) {
                        $sqlCheckAny = "
                            SELECT id, oro, plata, bronce, mencion_honor, 
                                   oro_min, oro_max, plata_min, plata_max, bronce_min, bronce_max,
                                   nivel_competencia_id, grado_escolaridad
                            FROM configuracion_medallero
                            WHERE area_competencia_id = ?
                            ORDER BY nivel_competencia_id NULLS FIRST, grado_escolaridad NULLS FIRST
                            LIMIT 1
                        ";
                        $stmtCheckAny = $this->pdo->prepare($sqlCheckAny);
                        $stmtCheckAny->execute([$areaId]);
                        $configMedalleroRaw = $stmtCheckAny->fetch(PDO::FETCH_ASSOC);
                    }

                    if ($configMedalleroRaw) {
                        $configMedallero = [
                            'id' => $configMedalleroRaw['id'] ?? null,
                            'area_competencia_id' => $areaId,
                            'nivel_competencia_id' => $configMedalleroRaw['nivel_competencia_id'] ?? null,
                            'oro' => (int)($configMedalleroRaw['oro'] ?? 0),
                            'plata' => (int)($configMedalleroRaw['plata'] ?? 0),
                            'bronce' => (int)($configMedalleroRaw['bronce'] ?? 0),
                            'mencion_honor' => (int)($configMedalleroRaw['mencion_honor'] ?? 0),
                            'oro_min' => isset($configMedalleroRaw['oro_min']) ? (int)$configMedalleroRaw['oro_min'] : null,
                            'oro_max' => isset($configMedalleroRaw['oro_max']) ? (int)$configMedalleroRaw['oro_max'] : null,
                            'plata_min' => isset($configMedalleroRaw['plata_min']) ? (int)$configMedalleroRaw['plata_min'] : null,
                            'plata_max' => isset($configMedalleroRaw['plata_max']) ? (int)$configMedalleroRaw['plata_max'] : null,
                            'bronce_min' => isset($configMedalleroRaw['bronce_min']) ? (int)$configMedalleroRaw['bronce_min'] : null,
                            'bronce_max' => isset($configMedalleroRaw['bronce_max']) ? (int)$configMedalleroRaw['bronce_max'] : null,
                            'grado_escolaridad' => $configMedalleroRaw['grado_escolaridad'] ?? null
                        ];
                    }
                } catch (\Exception $e) {
                    error_log('getProgresoEvaluacionFinal: Error obteniendo configuración de medallero: ' . $e->getMessage());
                }
            }
            
            $responseData = [
                'niveles' => $niveles,
                'evaluadores' => [
                    'total' => (int)($evaluadoresStats['total_evaluadores_final'] ?? 0),
                    'activos' => (int)($evaluadoresStats['evaluadores_activos'] ?? 0),
                    'con_permisos' => (int)($evaluadoresStats['evaluadores_con_permisos'] ?? 0)
                ],
                'evaluadores_lista' => $evaluadoresActivos,
                'clasificados_sin_evaluar' => $clasificadosSinEvaluar,
                'metricas_tiempo' => [
                    'dias_promedio_evaluacion' => round($tiempoStats['dias_promedio_evaluacion'] ?? 0, 1),
                    'tiempo_minimo' => round($tiempoStats['tiempo_minimo'] ?? 0, 1),
                    'tiempo_maximo' => round($tiempoStats['tiempo_maximo'] ?? 0, 1)
                ],
                'alertas' => [
                    'criticas' => count(array_filter($clasificadosSinEvaluar, fn($p) => $p['nivel_alerta'] === 'critico')),
                    'advertencias' => count(array_filter($clasificadosSinEvaluar, fn($p) => $p['nivel_alerta'] === 'advertencia')),
                    'total_alertas' => count(array_filter($clasificadosSinEvaluar, fn($p) => $p['nivel_alerta'] !== 'normal'))
                ],
                'estadisticas_generales' => [
                    'total_clasificados' => (int)$totalClasificados,
                    'total_evaluados' => (int)$totalEvaluados,
                    'total_premiados_oro' => (int)$totalPremiadosOro,
                    'total_premiados_plata' => (int)$totalPremiadosPlata,
                    'total_premiados_bronce' => (int)$totalPremiadosBronce,
                    'total_no_premiados' => (int)$totalNoPremiados,
                    'total_pendientes' => (int)$totalPendientes,
                    'promedio_general' => $promedioGeneral
                ],
                
                'medallas' => $medallasAsignadas,
                'top_participantes' => $topParticipantes,
                'config_medallero' => $configMedallero,
                'estado_fase' => [
                    'fase' => 'final',
                    'clasificatoria_cerrada' => true,
                    'fecha_cierre_clasificatoria' => $estadoCierreGeneral['fecha_cierre'] ?? null,
                    'cerrada' => $faseFinalCerrada,
                    'estado' => $estadoCierreFaseFinal ? $estadoCierreFaseFinal['estado'] : 'activa',
                    'fecha_cierre' => $estadoCierreFaseFinal ? $estadoCierreFaseFinal['fecha_cierre'] : null
                ],
                'ultima_actualizacion' => date('Y-m-d H:i:s')
            ];
            
            Response::success($responseData, 'Datos de progreso de evaluación final obtenidos');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo progreso de evaluación final: ' . $e->getMessage());
            Response::serverError('Error al obtener datos de progreso de evaluación final: ' . $e->getMessage());
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
        
        error_log(" Llamando a createTiempoEvaluador con datos: " . json_encode($input));
        
        try {
            $insertId = $model->createTiempoEvaluador($input);
            
            error_log(" Insert ID obtenido: " . $insertId);
            
            if ($insertId) {
                Response::success([
                    'insert_id' => $insertId,
                    'data' => $input
                ], 'Tiempo de evaluación registrado exitosamente.');
            } else {
                error_log(" Insert ID es false o null");
                Response::serverError('No se pudo registrar el tiempo de evaluación.');
            }
        } catch (\Exception $modelException) {
            error_log(" Error en el modelo: " . $modelException->getMessage());
            error_log(" Trace del modelo: " . $modelException->getTraceAsString());
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

    
    public function getDashboardCierreFaseArea()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
            }

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            error_log("getDashboardCierreFaseArea - areaId: " . $areaId . ", areaNombre: " . $areaNombre);

            $sqlStats = "
                SELECT 
                    COUNT(DISTINCT ia.id) FILTER (WHERE ia.estado != 'desclasificado') as total_participantes,
                    COUNT(DISTINCT ia.id) FILTER (
                        WHERE EXISTS (
                            SELECT 1 FROM evaluaciones_clasificacion ec2 
                            WHERE ec2.inscripcion_area_id = ia.id 
                            AND ec2.puntuacion IS NOT NULL
                        )
                        AND ia.estado != 'desclasificado'
                    ) as total_evaluados
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
            ";
            
            $stmtStats = $this->pdo->prepare($sqlStats);
            $stmtStats->execute([$areaId]);
            $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
            
            $totalParticipantes = (int)$stats['total_participantes'];
            $totalEvaluados = (int)$stats['total_evaluados'];
            
            error_log("getDashboardCierreFaseArea - Estadísticas: total_participantes={$totalParticipantes}, total_evaluados={$totalEvaluados}");
            
            $porcentajeClasificados = 0.6; 
            $puntuacionMinima = 51.00; 
            
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
            }
            
           
            $sqlClasificados = "
                SELECT COUNT(DISTINCT ia.id) as total
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
            ";
            
            $stmtClasificados = $this->pdo->prepare($sqlClasificados);
            $stmtClasificados->execute([$areaId]);
            $resultadoClasificados = $stmtClasificados->fetch(PDO::FETCH_ASSOC);
            $clasificadosReal = (int)($resultadoClasificados['total'] ?? 0);
            
            $sqlNoClasificados = "
                SELECT COUNT(DISTINCT ia.id) as total
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'no_clasificado'
            ";
            
            $stmtNoClasificados = $this->pdo->prepare($sqlNoClasificados);
            $stmtNoClasificados->execute([$areaId]);
            $resultadoNoClasificados = $stmtNoClasificados->fetch(PDO::FETCH_ASSOC);
            $noClasificadosReal = (int)($resultadoNoClasificados['total'] ?? 0);
            
           
            $this->actualizarEstadosClasificacion($areaId);
            
           
            $sqlClasificadosActualizado = "
                SELECT COUNT(*) as total
                FROM inscripciones_areas
                WHERE area_competencia_id = ? AND estado = 'clasificado'
            ";
            $stmtClasificadosActualizado = $this->pdo->prepare($sqlClasificadosActualizado);
            $stmtClasificadosActualizado->execute([$areaId]);
            $resultadoClasificados = $stmtClasificadosActualizado->fetch(PDO::FETCH_ASSOC);
            $clasificadosReal = (int)($resultadoClasificados['total'] ?? 0);
            
            $sqlNoClasificadosActualizado = "
                SELECT COUNT(*) as total
                FROM inscripciones_areas
                WHERE area_competencia_id = ? AND estado = 'no_clasificado'
            ";
            $stmtNoClasificadosActualizado = $this->pdo->prepare($sqlNoClasificadosActualizado);
            $stmtNoClasificadosActualizado->execute([$areaId]);
            $resultadoNoClasificados = $stmtNoClasificadosActualizado->fetch(PDO::FETCH_ASSOC);
            $noClasificadosReal = (int)($resultadoNoClasificados['total'] ?? 0);
            
            $sqlTodosEstados = "SELECT estado, COUNT(*) as total FROM inscripciones_areas WHERE area_competencia_id = ? GROUP BY estado";
            $stmtTodosEstados = $this->pdo->prepare($sqlTodosEstados);
            $stmtTodosEstados->execute([$areaId]);
            $todosEstados = $stmtTodosEstados->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("getDashboardCierreFaseArea - Clasificados reales (por estado, después de actualizar): {$clasificadosReal}");
            error_log("getDashboardCierreFaseArea - No clasificados reales (por estado, después de actualizar): {$noClasificadosReal}");
            error_log("getDashboardCierreFaseArea - Todos los estados en el área: " . json_encode($todosEstados));
            $porcentajeCompletitud = $totalParticipantes > 0 
                ? round(($totalEvaluados / $totalParticipantes) * 100, 2) 
                : 0;
            
            $sqlCierre = "
                SELECT estado, porcentaje_completitud, cantidad_clasificados, 
                       fecha_cierre, coordinador_id
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'clasificacion'
                LIMIT 1
            ";
            
            $stmtCierre = $this->pdo->prepare($sqlCierre);
            $stmtCierre->execute([$areaId]);
            $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
            
            if ($cierre && $cierre['estado'] === 'cerrada' && !$cierre['fecha_cierre']) {
                error_log("getDashboardCierreFaseArea - Detectado estado 'cerrada' sin fecha_cierre, esto es anómalo pero NO lo cambiamos automáticamente");
                
            }
            
            $estadoCierre = $cierre ? $cierre['estado'] : ($porcentajeCompletitud == 100 ? 'activa' : 'pendiente');
            $fechaCierre = $cierre ? $cierre['fecha_cierre'] : null;
           
            $puedeCerrar = $porcentajeCompletitud == 100 && $estadoCierre !== 'cerrada' && in_array($estadoCierre, ['activa', 'pendiente', null]);

            
            $porcentajeClasificados = 0.6; 
            $puntuacionMinima = 51.00;
            
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                
                error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
            }

           
            error_log("getDashboardCierreFaseArea - Estado cierre: " . $estadoCierre);
            error_log("getDashboardCierreFaseArea - Fecha cierre: " . ($fechaCierre ?? 'null'));
            error_log("getDashboardCierreFaseArea - Registro cierre completo: " . json_encode($cierre));
            
            if ($estadoCierre === 'cerrada') {
                error_log("getDashboardCierreFaseArea - Llamando obtenerVistaPreviaClasificadosCerrada para areaId: " . $areaId);
                $vistaPrevia = $this->obtenerVistaPreviaClasificadosCerrada($areaId);
            } else {
                error_log("getDashboardCierreFaseArea - Llamando obtenerVistaPreviaClasificados para areaId: " . $areaId);
                $vistaPrevia = $this->obtenerVistaPreviaClasificados($areaId, $porcentajeClasificados, $puntuacionMinima);
            }
            error_log("getDashboardCierreFaseArea - Vista previa obtenida - Clasificados: " . (isset($vistaPrevia['clasificados']) ? count($vistaPrevia['clasificados']) : 0) . ", No clasificados: " . (isset($vistaPrevia['no_clasificados']) ? count($vistaPrevia['no_clasificados']) : 0));
            if (isset($vistaPrevia['clasificados']) && count($vistaPrevia['clasificados']) > 0) {
                error_log("getDashboardCierreFaseArea - Primer clasificado en vista previa: " . json_encode($vistaPrevia['clasificados'][0]));
            }

           
            if ($totalParticipantes > 0) {
               
                $estaCerrada = $cierre && ($cierre['estado'] === 'cerrada' || $cierre['fecha_cierre'] !== null);
                
                if (!$cierre) {
                    
                    $sqlInsert = "
                        INSERT INTO cierre_fase_areas (
                            area_competencia_id, nivel_competencia_id, fase, estado,
                            porcentaje_completitud, cantidad_clasificados, updated_at
                        ) VALUES (?, NULL, 'clasificacion', ?, ?, ?, NOW())
                        ON CONFLICT (area_competencia_id, nivel_competencia_id, fase) 
                        DO UPDATE SET 
                            porcentaje_completitud = CASE 
                                WHEN cierre_fase_areas.estado = 'cerrada' THEN cierre_fase_areas.porcentaje_completitud
                                WHEN cierre_fase_areas.fecha_cierre IS NOT NULL THEN cierre_fase_areas.porcentaje_completitud
                                ELSE EXCLUDED.porcentaje_completitud
                            END,
                            cantidad_clasificados = CASE 
                                WHEN cierre_fase_areas.estado = 'cerrada' THEN cierre_fase_areas.cantidad_clasificados
                                WHEN cierre_fase_areas.fecha_cierre IS NOT NULL THEN cierre_fase_areas.cantidad_clasificados
                                ELSE EXCLUDED.cantidad_clasificados
                            END,
                            estado = CASE 
                                WHEN cierre_fase_areas.estado = 'cerrada' THEN 'cerrada'
                                WHEN cierre_fase_areas.fecha_cierre IS NOT NULL THEN 'cerrada'
                                WHEN EXCLUDED.porcentaje_completitud = 100 THEN 'activa'
                                ELSE 'pendiente'
                            END,
                            updated_at = CASE 
                                WHEN cierre_fase_areas.estado = 'cerrada' THEN cierre_fase_areas.updated_at
                                WHEN cierre_fase_areas.fecha_cierre IS NOT NULL THEN cierre_fase_areas.updated_at
                                ELSE NOW()
                            END
                        RETURNING *
                    ";
                    $stmtInsert = $this->pdo->prepare($sqlInsert);
                    
                    $estadoInsert = $porcentajeCompletitud == 100 ? 'activa' : 'pendiente';
                    $stmtInsert->execute([$areaId, $estadoInsert, $porcentajeCompletitud, $clasificadosReal]);
                } else if (!$estaCerrada) {
                    
                    $sqlUpdate = "
                        UPDATE cierre_fase_areas
                        SET porcentaje_completitud = ?,
                            cantidad_clasificados = ?,
                            estado = CASE 
                                WHEN estado = 'cerrada' THEN 'cerrada'  -- NUNCA cambiar si ya está cerrada
                                WHEN fecha_cierre IS NOT NULL THEN 'cerrada'  -- Si tiene fecha_cierre, mantener cerrada
                                WHEN ? = 100 THEN 'activa'
                                ELSE 'pendiente'
                            END,
                            updated_at = NOW()
                        WHERE area_competencia_id = ? 
                        AND nivel_competencia_id IS NULL
                        AND fase = 'clasificacion'
                        AND estado != 'cerrada'  -- Solo actualizar si NO está cerrada
                        AND fecha_cierre IS NULL  -- Solo actualizar si NO tiene fecha_cierre
                    ";
                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([$porcentajeCompletitud, $clasificadosReal, $porcentajeCompletitud, $areaId]);
                } else {
                    
                    $stmtCierre->execute([$areaId]);
                    $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
                    error_log("getDashboardCierreFaseArea - Fase cerrada detectada, NO se actualiza. Estado preservado: " . ($cierre['estado'] ?? 'null'));
                }
            }

            Response::success([
                'area' => [
                    'id' => $areaId,
                    'nombre' => $areaNombre
                ],
                'estadisticas' => [
                    'total_participantes' => $totalParticipantes,
                    'total_evaluados' => $totalEvaluados,
                    'clasificados_real' => $clasificadosReal,
                    'porcentaje_completitud' => $porcentajeCompletitud,
                    'puede_cerrar' => $puedeCerrar
                ],
                'estado_cierre' => $estadoCierre,
                'fecha_cierre' => $fechaCierre,
                'vista_previa_clasificados' => $vistaPrevia
            ]);

        } catch (\Exception $e) {
            error_log('Error en getDashboardCierreFaseArea: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al obtener información del cierre de fase');
        }
    }

    
    private function obtenerVistaPreviaClasificados($areaId, $porcentajeClasificados, $puntuacionMinima)
    {
        try {
            
            error_log("obtenerVistaPreviaClasificados - Calculando desde evaluaciones para areaId: {$areaId}, puntuacionMinima: {$puntuacionMinima}");
            
            
            $sqlVerificarEvaluaciones = "
                SELECT COUNT(*) as total
                FROM evaluaciones_clasificacion ec
                JOIN inscripciones_areas ia ON ia.id = ec.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
                AND ec.puntuacion IS NOT NULL
            ";
            $stmtVerificar = $this->pdo->prepare($sqlVerificarEvaluaciones);
            $stmtVerificar->execute([$areaId]);
            $verificacion = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
            $totalEvaluaciones = (int)($verificacion['total'] ?? 0);
            error_log("obtenerVistaPreviaClasificados - Total evaluaciones en BD para areaId {$areaId}: {$totalEvaluaciones}");
            
            
            $sqlVerificarInscritos = "
                SELECT COUNT(*) as total
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado != 'desclasificado'
            ";
            $stmtVerificarInscritos = $this->pdo->prepare($sqlVerificarInscritos);
            $stmtVerificarInscritos->execute([$areaId]);
            $verificacionInscritos = $stmtVerificarInscritos->fetch(PDO::FETCH_ASSOC);
            $totalInscritos = (int)($verificacionInscritos['total'] ?? 0);
            error_log("obtenerVistaPreviaClasificados - Total inscritos (sin desclasificados) para areaId {$areaId}: {$totalInscritos}");
            
           
            $sqlElegibles = "
                SELECT 
                    ia.id,
                    o.nombre_completo,
                    COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                    AVG(ec.puntuacion) as puntuacion_promedio,
                    ia.estado as estado_actual,
                    COUNT(ec.id) as total_evaluaciones
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado != 'desclasificado'
                AND ec.puntuacion IS NOT NULL
                GROUP BY ia.id, o.nombre_completo, ue.nombre, ia.estado
                HAVING AVG(ec.puntuacion) >= ?
                ORDER BY puntuacion_promedio DESC
            ";
            
            $stmtElegibles = $this->pdo->prepare($sqlElegibles);
            $stmtElegibles->execute([$areaId, $puntuacionMinima]);
            $participantesElegibles = $stmtElegibles->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("obtenerVistaPreviaClasificados - Participantes elegibles (puntuación >= {$puntuacionMinima}): " . count($participantesElegibles));
            if (count($participantesElegibles) > 0) {
                error_log("obtenerVistaPreviaClasificados - Primer elegible: " . json_encode($participantesElegibles[0]));
            } else {
                
                $sqlDebug = "
                    SELECT 
                        ia.id,
                        o.nombre_completo,
                        AVG(ec.puntuacion) as puntuacion_promedio,
                        COUNT(ec.id) as total_evaluaciones
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado != 'desclasificado'
                    GROUP BY ia.id, o.nombre_completo
                    HAVING COUNT(ec.id) > 0
                    ORDER BY puntuacion_promedio DESC
                    LIMIT 10
                ";
                $stmtDebug = $this->pdo->prepare($sqlDebug);
                $stmtDebug->execute([$areaId]);
                $debugData = $stmtDebug->fetchAll(PDO::FETCH_ASSOC);
                error_log("obtenerVistaPreviaClasificados - DEBUG: Participantes con evaluaciones (sin filtro de puntuación): " . json_encode($debugData));
            }
            
            
            $clasificados = $participantesElegibles;
            
            error_log("obtenerVistaPreviaClasificados - Clasificados calculados: " . count($clasificados) . " de " . count($participantesElegibles) . " elegibles (todos con >= {$puntuacionMinima} puntos)");
            
           
            $noClasificados = [];
            
            
                $sqlNoMinima = "
                    SELECT 
                        ia.id,
                        o.nombre_completo,
                        COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                        AVG(ec.puntuacion) as puntuacion_promedio,
                        ia.estado as estado_actual
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado != 'desclasificado'
                    AND ec.puntuacion IS NOT NULL
                    GROUP BY ia.id, o.nombre_completo, ue.nombre, ia.estado
                    HAVING AVG(ec.puntuacion) < ?
                    ORDER BY puntuacion_promedio DESC
                ";
            $stmtNoMinima = $this->pdo->prepare($sqlNoMinima);
            $stmtNoMinima->execute([$areaId, $puntuacionMinima]);
            $sinMinima = $stmtNoMinima->fetchAll(PDO::FETCH_ASSOC);
            
            $noClasificados = $sinMinima;
            
            error_log("obtenerVistaPreviaClasificados - No clasificados calculados: " . count($noClasificados) . " (sin puntuación mínima: " . count($sinMinima) . ")");
            
            error_log("obtenerVistaPreviaClasificados - Clasificados encontrados: " . count($clasificados));
            error_log("obtenerVistaPreviaClasificados - No clasificados encontrados: " . count($noClasificados));
            
            
            $clasificadosMapeados = array_map(function($p) {
                $resultado = [
                    'id' => (int)$p['id'],
                    'nombre_completo' => $p['nombre_completo'] ?? '',
                    'unidad_educativa_nombre' => $p['unidad_educativa_nombre'] ?? '',
                    'puntuacion' => round((float)($p['puntuacion_promedio'] ?? 0), 2)
                ];
                error_log("obtenerVistaPreviaClasificados - Clasificado mapeado: " . json_encode($resultado));
                return $resultado;
            }, $clasificados);
            
            $noClasificadosMapeados = array_map(function($p) {
                $resultado = [
                    'id' => (int)$p['id'],
                    'nombre_completo' => $p['nombre_completo'] ?? '',
                    'unidad_educativa_nombre' => $p['unidad_educativa_nombre'] ?? '',
                    'puntuacion' => round((float)($p['puntuacion_promedio'] ?? 0), 2)
                ];
                return $resultado;
            }, $noClasificados);
            
            $resultado = [
                'clasificados' => $clasificadosMapeados,
                'no_clasificados' => $noClasificadosMapeados,
                'criterios' => [
                    'puntuacion_minima' => $puntuacionMinima,
                    'nota' => 'Todos los participantes con puntuación >= ' . $puntuacionMinima . ' puntos son clasificados'
                ]
            ];
            
            error_log("obtenerVistaPreviaClasificados - Resultado final - Clasificados: " . count($resultado['clasificados']) . ", No clasificados: " . count($resultado['no_clasificados']));
            
            
            if (!isset($resultado['clasificados']) || !is_array($resultado['clasificados'])) {
                $resultado['clasificados'] = [];
            }
            if (!isset($resultado['no_clasificados']) || !is_array($resultado['no_clasificados'])) {
                $resultado['no_clasificados'] = [];
            }
            
            $resultadoJson = json_encode($resultado);
            $resultadoLog = strlen($resultadoJson) > 1000 ? substr($resultadoJson, 0, 1000) . '...' : $resultadoJson;
            error_log("obtenerVistaPreviaClasificados - Resultado completo (primeros 1000 chars): " . $resultadoLog);
            error_log("obtenerVistaPreviaClasificados - Estructura del resultado: clasificados=" . count($resultado['clasificados']) . ", no_clasificados=" . count($resultado['no_clasificados']) . ", criterios=" . json_encode($resultado['criterios'] ?? []));
            
            return $resultado;

        } catch (\Exception $e) {
            error_log('Error obteniendo vista previa de clasificados: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            return [
                'clasificados' => [],
                'no_clasificados' => [],
                'criterios' => [
                    'puntuacion_minima' => $puntuacionMinima,
                    'nota' => 'Todos los participantes con puntuación >= ' . $puntuacionMinima . ' puntos son clasificados'
                ]
            ];
        }
    }

    
    private function obtenerVistaPreviaClasificadosCerrada($areaId)
    {
        try {
            error_log("obtenerVistaPreviaClasificadosCerrada - INICIO - areaId: " . $areaId);
            
            $porcentajeClasificados = 0.6;
            $puntuacionMinima = 51.00;
            
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                error_log('No se pudo obtener configuración: ' . $e->getMessage());
            }

            
            $sqlVerificacion = "SELECT COUNT(*) as total FROM inscripciones_areas WHERE area_competencia_id = ? AND estado = 'clasificado'";
            $stmtVerificacion = $this->pdo->prepare($sqlVerificacion);
            $stmtVerificacion->execute([$areaId]);
            $verificacion = $stmtVerificacion->fetch(PDO::FETCH_ASSOC);
            error_log("obtenerVistaPreviaClasificadosCerrada - Total con estado 'clasificado': " . ($verificacion['total'] ?? 0));
            
            $sqlTodosEstados = "SELECT estado, COUNT(*) as total FROM inscripciones_areas WHERE area_competencia_id = ? GROUP BY estado";
            $stmtTodosEstados = $this->pdo->prepare($sqlTodosEstados);
            $stmtTodosEstados->execute([$areaId]);
            $todosEstados = $stmtTodosEstados->fetchAll(PDO::FETCH_ASSOC);
            error_log("obtenerVistaPreviaClasificadosCerrada - Todos los estados en el área: " . json_encode($todosEstados));

           
            $sqlClasificados = "
                SELECT DISTINCT
                    ia.id,
                    o.nombre_completo,
                    COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                    COALESCE(
                        (SELECT AVG(puntuacion) FROM evaluaciones_clasificacion WHERE inscripcion_area_id = ia.id),
                        0
                    ) as puntuacion_promedio
                FROM inscripciones_areas ia
                INNER JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                ORDER BY puntuacion_promedio DESC
            ";
            
            error_log("obtenerVistaPreviaClasificadosCerrada - Ejecutando consulta clasificados con areaId: " . $areaId);
            $stmtClasificados = $this->pdo->prepare($sqlClasificados);
            $stmtClasificados->execute([$areaId]);
            $clasificados = $stmtClasificados->fetchAll(PDO::FETCH_ASSOC);
            
           
            if (count($clasificados) == 0 && $verificacion['total'] == 0) {
                error_log("obtenerVistaPreviaClasificadosCerrada - No hay clasificados por estado, calculando desde evaluaciones...");
                
                $sqlElegibles = "
                    SELECT 
                        ia.id,
                        o.nombre_completo,
                        COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                        AVG(ec.puntuacion) as puntuacion_promedio
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado != 'desclasificado'
                    AND ec.puntuacion IS NOT NULL
                    GROUP BY ia.id, o.nombre_completo, ue.nombre
                    HAVING AVG(ec.puntuacion) >= ?
                    ORDER BY puntuacion_promedio DESC
                ";
                $stmtElegibles = $this->pdo->prepare($sqlElegibles);
                $stmtElegibles->execute([$areaId, $puntuacionMinima]);
                $participantesElegibles = $stmtElegibles->fetchAll(PDO::FETCH_ASSOC);
                
                $clasificados = $participantesElegibles;
                
                error_log("obtenerVistaPreviaClasificadosCerrada - Clasificados calculados desde evaluaciones: " . count($clasificados) . " (todos con >= {$puntuacionMinima} puntos)");
            }
            
            error_log("obtenerVistaPreviaClasificadosCerrada - Clasificados encontrados: " . count($clasificados));
            if (count($clasificados) > 0) {
                error_log("obtenerVistaPreviaClasificadosCerrada - Primer clasificado: " . json_encode($clasificados[0]));
            } else {
                error_log("obtenerVistaPreviaClasificadosCerrada - No se encontraron clasificados. Verificando consulta directa...");
                
                $sqlVerifDirecta = "SELECT id, estado FROM inscripciones_areas WHERE area_competencia_id = ? AND estado = 'clasificado' LIMIT 5";
                $stmtVerif = $this->pdo->prepare($sqlVerifDirecta);
                $stmtVerif->execute([$areaId]);
                $verifDirecta = $stmtVerif->fetchAll(PDO::FETCH_ASSOC);
                error_log("obtenerVistaPreviaClasificadosCerrada - Verificación directa: " . json_encode($verifDirecta));
            }

            
            $sqlNoClasificados = "
                SELECT DISTINCT
                    ia.id,
                    o.nombre_completo,
                    COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                    COALESCE(
                        (SELECT AVG(puntuacion) FROM evaluaciones_clasificacion WHERE inscripcion_area_id = ia.id),
                        0
                    ) as puntuacion_promedio
                FROM inscripciones_areas ia
                INNER JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                WHERE ia.area_competencia_id = ?
                AND (
                    ia.estado = 'no_clasificado' 
                    OR EXISTS (
                        SELECT 1 FROM no_clasificados ncl 
                        WHERE ncl.inscripcion_area_id = ia.id 
                        AND ncl.fase = 'clasificacion'
                    )
                )
                AND ia.estado != 'desclasificado'
                ORDER BY puntuacion_promedio DESC
            ";
            
            error_log("obtenerVistaPreviaClasificadosCerrada - Ejecutando consulta no_clasificados con areaId: " . $areaId);
            $stmtNoClasificados = $this->pdo->prepare($sqlNoClasificados);
            $stmtNoClasificados->execute([$areaId]);
            $noClasificados = $stmtNoClasificados->fetchAll(PDO::FETCH_ASSOC);
            
           
            if (count($noClasificados) == 0) {
                error_log("obtenerVistaPreviaClasificadosCerrada - No hay no_clasificados por estado, calculando desde evaluaciones...");
               
                $sqlTodosEvaluados = "
                    SELECT 
                        ia.id,
                        o.nombre_completo,
                        COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                        AVG(ec.puntuacion) as puntuacion_promedio
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado != 'desclasificado'
                    AND ec.puntuacion IS NOT NULL
                    GROUP BY ia.id, o.nombre_completo, ue.nombre
                    HAVING AVG(ec.puntuacion) >= ?
                    ORDER BY puntuacion_promedio DESC
                ";
                $stmtTodosEvaluados = $this->pdo->prepare($sqlTodosEvaluados);
                $stmtTodosEvaluados->execute([$areaId, $puntuacionMinima]);
                $todosElegibles = $stmtTodosEvaluados->fetchAll(PDO::FETCH_ASSOC);
                
                $sqlNoMinima = "
                    SELECT 
                        ia.id,
                        o.nombre_completo,
                        COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                        AVG(ec.puntuacion) as puntuacion_promedio
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                    JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                    WHERE ia.area_competencia_id = ?
                    AND ia.estado != 'desclasificado'
                    AND ec.puntuacion IS NOT NULL
                    GROUP BY ia.id, o.nombre_completo, ue.nombre
                    HAVING AVG(ec.puntuacion) < ?
                    ORDER BY puntuacion_promedio DESC
                ";
                $stmtNoMinima = $this->pdo->prepare($sqlNoMinima);
                $stmtNoMinima->execute([$areaId, $puntuacionMinima]);
                $sinMinima = $stmtNoMinima->fetchAll(PDO::FETCH_ASSOC);
                
                $noClasificados = $sinMinima;
                
                error_log("obtenerVistaPreviaClasificadosCerrada - No clasificados calculados desde evaluaciones: " . count($noClasificados));
            }
            
            error_log("obtenerVistaPreviaClasificadosCerrada - No clasificados encontrados: " . count($noClasificados));
            if (count($noClasificados) > 0) {
                error_log("obtenerVistaPreviaClasificadosCerrada - Primer no_clasificado: " . json_encode($noClasificados[0]));
            } else {
                error_log("obtenerVistaPreviaClasificadosCerrada - No se encontraron no_clasificados. Verificando consulta directa...");
                
                $sqlVerifNoClas = "SELECT id, estado FROM inscripciones_areas WHERE area_competencia_id = ? AND estado = 'no_clasificado' LIMIT 5";
                $stmtVerifNoClas = $this->pdo->prepare($sqlVerifNoClas);
                $stmtVerifNoClas->execute([$areaId]);
                $verifNoClas = $stmtVerifNoClas->fetchAll(PDO::FETCH_ASSOC);
                error_log("obtenerVistaPreviaClasificadosCerrada - Verificación directa no_clasificados: " . json_encode($verifNoClas));
            }

            $resultado = [
                'clasificados' => array_map(function($p) {
                    return [
                        'id' => (int)$p['id'],
                        'nombre_completo' => $p['nombre_completo'],
                        'unidad_educativa_nombre' => $p['unidad_educativa_nombre'],
                        'puntuacion' => round((float)$p['puntuacion_promedio'], 2)
                    ];
                }, $clasificados),
                'no_clasificados' => array_map(function($p) {
                    return [
                        'id' => (int)$p['id'],
                        'nombre_completo' => $p['nombre_completo'],
                        'unidad_educativa_nombre' => $p['unidad_educativa_nombre'],
                        'puntuacion' => round((float)$p['puntuacion_promedio'], 2)
                    ];
                }, $noClasificados),
                'criterios' => [
                    'puntuacion_minima' => $puntuacionMinima,
                    'nota' => 'Todos los participantes con puntuación >= ' . $puntuacionMinima . ' puntos son clasificados'
                ]
            ];
            
            error_log("obtenerVistaPreviaClasificadosCerrada - Resultado final: " . json_encode($resultado));
            return $resultado;

        } catch (\Exception $e) {
            error_log('Error obteniendo vista previa de clasificados (cerrada): ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            return [
                'clasificados' => [],
                'no_clasificados' => [],
                'criterios' => [
                    'porcentaje_clasificados' => 0.6,
                    'puntuacion_minima' => 51.00
                ]
            ];
        }
    }

   
    private function actualizarEstadosClasificacion($areaId)
    {
        try {
            
            $puntuacionMinima = 51.00;
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                error_log('No se pudo obtener configuración: ' . $e->getMessage());
            }
            
            
            $sqlActualizarClasificados = "
                UPDATE inscripciones_areas ia
                SET estado = 'clasificado',
                    updated_at = NOW()
                WHERE ia.area_competencia_id = ?
                AND ia.estado != 'desclasificado'
                AND (
                    SELECT AVG(ec.puntuacion)
                    FROM evaluaciones_clasificacion ec
                    WHERE ec.inscripcion_area_id = ia.id
                ) >= ?
                AND (
                    ia.estado != 'clasificado'
                    OR ia.estado IS NULL
                )
            ";
            
            $stmtClasificados = $this->pdo->prepare($sqlActualizarClasificados);
            $stmtClasificados->execute([$areaId, $puntuacionMinima]);
            $actualizadosClasificados = $stmtClasificados->rowCount();
            
            
            $sqlActualizarNoClasificados = "
                UPDATE inscripciones_areas ia
                SET estado = 'no_clasificado',
                    updated_at = NOW()
                WHERE ia.area_competencia_id = ?
                AND ia.estado != 'desclasificado'
                AND EXISTS (
                    SELECT 1 FROM evaluaciones_clasificacion ec
                    WHERE ec.inscripcion_area_id = ia.id
                )
                AND (
                    SELECT AVG(ec.puntuacion)
                    FROM evaluaciones_clasificacion ec
                    WHERE ec.inscripcion_area_id = ia.id
                ) < ?
                AND ia.estado != 'no_clasificado'
            ";
            
            $stmtNoClasificados = $this->pdo->prepare($sqlActualizarNoClasificados);
            $stmtNoClasificados->execute([$areaId, $puntuacionMinima]);
            $actualizadosNoClasificados = $stmtNoClasificados->rowCount();
            
            if ($actualizadosClasificados > 0 || $actualizadosNoClasificados > 0) {
                error_log("actualizarEstadosClasificacion - Actualizados: {$actualizadosClasificados} clasificados, {$actualizadosNoClasificados} no_clasificados");
            }
            
        } catch (\Exception $e) {
            error_log("Error actualizando estados de clasificación: " . $e->getMessage());
            
        }
    }

    
    public function cerrarFaseArea()
    {
        
        error_log("===========================================");
        error_log(" cerrarFaseArea() MÉTODO LLAMADO ");
        error_log("===========================================");
        
        try {
            $currentUser = JWTManager::getCurrentUser();
            error_log(" Usuario actual: " . ($currentUser['name'] ?? 'sin nombre') . " - Role: " . ($currentUser['role'] ?? 'sin rol'));
            
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                error_log(" [INICIO] Acceso denegado - no es coordinador");
                Response::forbidden('Acceso de coordinador requerido');
            }
            
            error_log(" [INICIO] Usuario es coordinador, continuando...");

            
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];

            
            $sqlStats = "
                SELECT 
                    COUNT(DISTINCT ia.id) FILTER (WHERE ia.estado != 'desclasificado') as total_participantes,
                    COUNT(DISTINCT ia.id) FILTER (
                        WHERE ec.id IS NOT NULL 
                        AND ia.estado != 'desclasificado'
                    ) as total_evaluados
                FROM inscripciones_areas ia
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
            ";
            
            $stmtStats = $this->pdo->prepare($sqlStats);
            $stmtStats->execute([$areaId]);
            $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
            
            $totalParticipantes = (int)$stats['total_participantes'];
            $totalEvaluados = (int)$stats['total_evaluados'];
            
            error_log("cerrarFaseArea - Estadísticas: total_participantes={$totalParticipantes}, total_evaluados={$totalEvaluados}");
            
            if ($totalParticipantes == 0) {
                error_log(" cerrarFaseArea - No hay participantes en el área {$areaId}");
                Response::validationError(['general' => 'No hay participantes inscritos en esta área']);
                return;
            }
            
            if ($totalEvaluados < $totalParticipantes) {
                $pendientes = $totalParticipantes - $totalEvaluados;
                Response::validationError(['general' => "Faltan {$pendientes} evaluaciones por completar. Se requiere 100% de completitud."]);
                return;
            }

            
            $sqlCierre = "
                SELECT estado FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'clasificacion'
                LIMIT 1
            ";
            
            $stmtCierre = $this->pdo->prepare($sqlCierre);
            $stmtCierre->execute([$areaId]);
            $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
            
            if ($cierre && $cierre['estado'] === 'cerrada') {
                Response::validationError(['general' => 'La fase de esta área ya está cerrada']);
                return;
            }

            
            error_log("[cerrarFaseArea] Actualizando estados de clasificación antes de cerrar fase...");
            $this->actualizarEstadosClasificacion($areaId);
            error_log(" [cerrarFaseArea] Estados de clasificación actualizados");
            
            
            $puntuacionMinima = 51.00;
            $porcentajeClasificados = 0.0; 
            
            try {
                $configModel = new ConfiguracionOlimpiada();
                $config = $configModel->getConfiguracion();
                
                if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                    $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                }
            } catch (\Exception $e) {
                error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
            }
            
           
            $sqlClasificados = "
                SELECT ia.id
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
            ";
            
            $stmtClasificados = $this->pdo->prepare($sqlClasificados);
            $stmtClasificados->execute([$areaId]);
            $clasificadosData = $stmtClasificados->fetchAll(PDO::FETCH_ASSOC);
            $idsClasificados = array_map(function($p) {
                return $p['id'];
            }, $clasificadosData);
            $cantidadClasificados = count($idsClasificados);
            
            error_log(" [cerrarFaseArea] Clasificados encontrados: {$cantidadClasificados}");
            
            
            $sqlNoClasificados = "
                SELECT ia.id
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'no_clasificado'
            ";
            
            $stmtNoClasificados = $this->pdo->prepare($sqlNoClasificados);
            $stmtNoClasificados->execute([$areaId]);
            $noClasificadosData = $stmtNoClasificados->fetchAll(PDO::FETCH_ASSOC);
            $idsNoClasificados = array_map(function($p) {
                return $p['id'];
            }, $noClasificadosData);
            
            error_log("[cerrarFaseArea] No clasificados encontrados: " . count($idsNoClasificados));

            
            if (!empty($idsNoClasificados)) {
                $noClasificadoModel = new NoClasificado();
                
                foreach ($idsNoClasificados as $inscripcionId) {
                   
                    $sqlPromedio = "
                        SELECT AVG(puntuacion) as promedio
                        FROM evaluaciones_clasificacion
                        WHERE inscripcion_area_id = ?
                    ";
                    $stmtPromedio = $this->pdo->prepare($sqlPromedio);
                    $stmtPromedio->execute([$inscripcionId]);
                    $promedioData = $stmtPromedio->fetch(PDO::FETCH_ASSOC);
                    $promedio = $promedioData ? (float)$promedioData['promedio'] : 0;

                   
                    if (!$noClasificadoModel->estaNoClasificado($inscripcionId, 'clasificacion')) {
                        try {
                            $noClasificadoModel->create([
                                'inscripcion_area_id' => $inscripcionId,
                                'puntuacion' => $promedio,
                                'puntuacion_minima_requerida' => $puntuacionMinima,
                                'motivo' => "Puntuación promedio {$promedio} menor a la mínima requerida de {$puntuacionMinima} puntos",
                                'evaluador_id' => null,
                                'fase' => 'clasificacion'
                            ]);
                        } catch (\Exception $e) {
                            error_log("Error registrando no clasificado: " . $e->getMessage());
                        }
                    }
                }
            }

           
            $sqlUpdate = "
                INSERT INTO cierre_fase_areas (
                    area_competencia_id, nivel_competencia_id, fase, estado,
                    porcentaje_completitud, cantidad_clasificados, 
                    fecha_cierre, coordinador_id, updated_at
                ) VALUES (?, NULL, 'clasificacion', 'cerrada', 100, ?, NOW(), ?, NOW())
                ON CONFLICT (area_competencia_id, nivel_competencia_id, fase) 
                DO UPDATE SET 
                    estado = 'cerrada',
                    porcentaje_completitud = 100,
                    cantidad_clasificados = EXCLUDED.cantidad_clasificados,
                    fecha_cierre = NOW(),
                    coordinador_id = EXCLUDED.coordinador_id,
                    updated_at = NOW()
                RETURNING *
            ";
            
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([$areaId, $cantidadClasificados, $currentUser['id']]);
            $cierreActualizado = $stmtUpdate->fetch(PDO::FETCH_ASSOC);

           
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['name'] ?? $currentUser['email'],
                $areaId,
                null, 
                [
                    'fase' => 'clasificacion',
                    'total_participantes' => $totalParticipantes,
                    'total_evaluados' => $totalEvaluados,
                    'cantidad_clasificados' => $cantidadClasificados,
                    'fecha_cierre' => $cierreActualizado['fecha_cierre']
                ]
            );

           
            error_log("NOTIFICACIÓN: El área {$areaNombre} (ID: {$areaId}) ha sido cerrada por el coordinador {$currentUser['name']} (ID: {$currentUser['id']})");
           
            if (function_exists('fastcgi_finish_request')) {
               
            }
            error_log("[PUNTO DE NOTIFICACIONES] Llegamos al punto de enviar notificaciones - Área: {$areaNombre}, ID: {$areaId}");
            error_log("[PUNTO DE NOTIFICACIONES] VERIFICACIÓN: Este log DEBE aparecer");

            error_log("[ANTES DE RESPUESTA] Iniciando envío de notificaciones a evaluadores del área {$areaNombre} (ID: {$areaId})");
            try {
                error_log("[ANTES DE RESPUESTA] Creando instancia de Mailer...");
                $mailer = new Mailer();
                error_log("[ANTES DE RESPUESTA] Instancia de Mailer creada exitosamente");
                
                $nombreCoordinador = $currentUser['name'] ?? $currentUser['email'];
                $correoCoordinador = $currentUser['email'];
                error_log("[ANTES DE RESPUESTA] Datos: Coordinador={$nombreCoordinador}, Email={$correoCoordinador}, AreaID={$areaId}");
                error_log("[ANTES DE RESPUESTA] Llamando a enviarMensajeEvaluadoresCierre...");
                
                $resultadoNotificaciones = $mailer->enviarMensajeEvaluadoresCierre(
                    $areaId,
                    $nombreCoordinador,
                    $correoCoordinador
                );
                
                error_log("[ANTES DE RESPUESTA] Resultado de enviarMensajeEvaluadoresCierre: " . ($resultadoNotificaciones ? 'true' : 'false'));
                
                if ($resultadoNotificaciones) {
                    error_log("[ANTES DE RESPUESTA] Notificaciones enviadas exitosamente a evaluadores del área {$areaNombre}");
                } else {
                    error_log(" [ANTES DE RESPUESTA] Error al enviar notificaciones a evaluadores del área {$areaNombre}");
                }
            } catch (\Exception $e) {
                error_log("[ANTES DE RESPUESTA] Error enviando notificaciones a evaluadores: " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
               
            }

            
            $responseData = [
                'area_id' => $areaId,
                'area_nombre' => $areaNombre,
                'total_participantes' => $totalParticipantes,
                'total_evaluados' => $totalEvaluados,
                'cantidad_clasificados' => $cantidadClasificados,
                'fecha_cierre' => $cierreActualizado['fecha_cierre']
            ];

           
            while (ob_get_level()) {
                ob_end_clean();
            }

            
            $responseJson = json_encode([
                'success' => true,
                'message' => 'Fase clasificatoria cerrada exitosamente',
                'data' => $responseData,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            
           
            http_response_code(200);
            header('Content-Type: application/json; charset=utf-8');
            header('Content-Length: ' . strlen($responseJson));
            
            echo $responseJson;
            
            
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            } else {
               
                if (ob_get_level()) {
                    ob_end_flush();
                }
                flush();
            }

            
            set_time_limit(300); 
            ignore_user_abort(true);
            
            
            try {
                $this->generarReportePDFCierreFase($areaId, $areaNombre, $totalParticipantes, $totalEvaluados, $cantidadClasificados, $idsClasificados, $idsNoClasificados, $puntuacionMinima, $porcentajeClasificados, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando PDF de cierre de fase: ' . $e->getMessage());
            }

            // Generar reporte Excel de clasificados
            try {
                $this->generarReporteExcelClasificados($areaId, $areaNombre, $puntuacionMinima, $porcentajeClasificados, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando Excel de clasificados: ' . $e->getMessage());
            }

            // Generar reporte PDF de estadísticas detalladas
            try {
                $this->generarReportePDFEstadisticasDetalladas($areaId, $areaNombre, $puntuacionMinima, $porcentajeClasificados, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando PDF de estadísticas detalladas: ' . $e->getMessage());
            }
            
            exit();

        } catch (\Exception $e) {
            error_log('Error cerrando fase del área: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al cerrar la fase clasificatoria');
        }
    }

    /**
     * Generar reporte PDF del cierre de fase clasificatoria
     * @param int $areaId
     * @param string $areaNombre
     * @param int $totalParticipantes
     * @param int $totalEvaluados
     * @param int $cantidadClasificados
     * @param array $idsClasificados
     * @param array $idsNoClasificados
     * @param float $puntuacionMinima
     * @param float $porcentajeClasificados
     * @param string $fechaCierre
     * @param array $coordinador
     * @return string
     */
    private function generarReportePDFCierreFase($areaId, $areaNombre, $totalParticipantes, $totalEvaluados, $cantidadClasificados, $idsClasificados, $idsNoClasificados, $puntuacionMinima, $porcentajeClasificados, $fechaCierre, $coordinador)
    {
        try {
           
            require_once __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
            
            
            /** @var \TCPDF $pdf */
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            
            
            $pdf->SetCreator('ForwardSoft - Sistema de Olimpiadas');
            $pdf->SetAuthor('Sistema de Olimpiadas');
            $pdf->SetTitle('Reporte de Cierre de Fase Clasificatoria - ' . $areaNombre);
            $pdf->SetSubject('Reporte de Cierre de Fase');
            
           
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            $nombreOlimpiada = $config['nombre'] ?? 'Olimpiada Oh! SanSi';
            $añoOlimpiada = date('Y', strtotime($config['fecha_inicio'] ?? 'now'));
            
           
            $pdf->AddPage();
            
            $pdf->SetFont('helvetica', 'B', 18);
            $pdf->Cell(0, 10, 'REPORTE OFICIAL DE FASE CLASIFICATORIA', 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, $nombreOlimpiada . ' ' . $añoOlimpiada, 0, 1, 'C');
            $pdf->SetFont('helvetica', '', 12);
            $pdf->Cell(0, 6, 'Área: ' . $areaNombre, 0, 1, 'C');
            $pdf->Ln(5);
            
            
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'INFORMACIÓN GENERAL', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(80, 6, 'Fecha de cierre:', 0, 0, 'L');
            $pdf->Cell(0, 6, date('d/m/Y H:i:s', strtotime($fechaCierre)), 0, 1, 'L');
            
            $pdf->Cell(80, 6, 'Coordinador:', 0, 0, 'L');
            $pdf->Cell(0, 6, $coordinador['name'] ?? $coordinador['email'], 0, 1, 'L');
            
            $pdf->Cell(80, 6, 'Total de participantes:', 0, 0, 'L');
            $pdf->Cell(0, 6, $totalParticipantes, 0, 1, 'L');
            
            $pdf->Cell(80, 6, 'Total evaluados:', 0, 0, 'L');
            $pdf->Cell(0, 6, $totalEvaluados, 0, 1, 'L');
            
            $pdf->Cell(80, 6, 'Clasificados:', 0, 0, 'L');
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, $cantidadClasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
           
            $sqlCountNoClasificados = "
                SELECT COUNT(DISTINCT ia.id) as total
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'no_clasificado'
            ";
            $stmtCountNoClasificados = $this->pdo->prepare($sqlCountNoClasificados);
            $stmtCountNoClasificados->execute([$areaId]);
            $countNoClasificados = $stmtCountNoClasificados->fetch(PDO::FETCH_ASSOC);
            $totalNoClasificados = (int)($countNoClasificados['total'] ?? 0);
            
            $pdf->Cell(80, 6, 'No clasificados:', 0, 0, 'L');
            $pdf->SetTextColor(255, 140, 0);
            $pdf->Cell(0, 6, $totalNoClasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            
            $sqlCountDesclasificados = "
                SELECT COUNT(DISTINCT ia.id) as total
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'desclasificado'
            ";
            $stmtCountDesclasificados = $this->pdo->prepare($sqlCountDesclasificados);
            $stmtCountDesclasificados->execute([$areaId]);
            $countDesclasificados = $stmtCountDesclasificados->fetch(PDO::FETCH_ASSOC);
            $totalDesclasificados = (int)($countDesclasificados['total'] ?? 0);
            
            $pdf->Cell(80, 6, 'Desclasificados:', 0, 0, 'L');
            $pdf->SetTextColor(200, 0, 0);
            $pdf->Cell(0, 6, $totalDesclasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Ln(5);
            
            
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'CRITERIOS DE CLASIFICACIÓN', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(0, 6, 'Puntuación mínima requerida: ' . number_format($puntuacionMinima, 2) . ' puntos', 0, 1, 'L');
            $pdf->Cell(0, 6, 'Criterio: Todos los participantes con puntuación >= ' . number_format($puntuacionMinima, 2) . ' puntos son clasificados', 0, 1, 'L');
            
            $pdf->Ln(5);
            
            
            $sqlTodosEvaluados = "
                SELECT 
                    o.nombre_completo,
                    o.grado_escolaridad,
                    nc.nombre as nivel_nombre,
                    ac.nombre as area_nombre,
                    COALESCE(AVG(ec.puntuacion), 0) as nota_final,
                    ia.estado,
                    ue.nombre as unidad_educativa_nombre
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND EXISTS (
                    SELECT 1 FROM evaluaciones_clasificacion ec2 
                    WHERE ec2.inscripcion_area_id = ia.id 
                    AND ec2.puntuacion IS NOT NULL
                )
                GROUP BY ia.id, o.nombre_completo, o.grado_escolaridad, nc.nombre, ac.nombre, ia.estado, ue.nombre
                ORDER BY nota_final DESC, o.nombre_completo
            ";
            
            $stmtTodosEvaluados = $this->pdo->prepare($sqlTodosEvaluados);
            $stmtTodosEvaluados->execute([$areaId]);
            $todosEvaluados = $stmtTodosEvaluados->fetchAll(PDO::FETCH_ASSOC);
            
            
            if (!empty($todosEvaluados)) {
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->Cell(0, 8, 'LISTA DE PARTICIPANTES EVALUADOS (' . count($todosEvaluados) . ')', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 9);
                
               
                $pdf->SetFillColor(200, 200, 200);
                $pdf->Cell(10, 6, '#', 1, 0, 'C', true);
                $pdf->Cell(60, 6, 'Participante', 1, 0, 'L', true);
                $pdf->Cell(40, 6, 'Nivel', 1, 0, 'L', true);
                $pdf->Cell(35, 6, 'Área', 1, 0, 'L', true);
                $pdf->Cell(30, 6, 'Nota Final', 1, 0, 'C', true);
                $pdf->Cell(15, 6, 'Estado', 1, 1, 'C', true);
                
                $pdf->SetFillColor(245, 245, 245);
                $contador = 1;
                foreach ($todosEvaluados as $participante) {
                    $fill = ($contador % 2 == 0);
                    
                    
                    if ($pdf->GetY() > 250) {
                        $pdf->AddPage();
                        
                        $pdf->SetFillColor(200, 200, 200);
                        $pdf->SetFont('helvetica', 'B', 9);
                        $pdf->Cell(10, 6, '#', 1, 0, 'C', true);
                        $pdf->Cell(60, 6, 'Participante', 1, 0, 'L', true);
                        $pdf->Cell(40, 6, 'Nivel', 1, 0, 'L', true);
                        $pdf->Cell(35, 6, 'Área', 1, 0, 'L', true);
                        $pdf->Cell(30, 6, 'Nota Final', 1, 0, 'C', true);
                        $pdf->Cell(15, 6, 'Estado', 1, 1, 'C', true);
                        $pdf->SetFillColor(245, 245, 245);
                        $pdf->SetFont('helvetica', '', 9);
                    }
                    
                    
                    $nivelDisplay = !empty($participante['grado_escolaridad']) 
                        ? $participante['grado_escolaridad'] 
                        : $participante['nivel_nombre'];
                    
                    $pdf->Cell(10, 6, $contador, 1, 0, 'C', $fill);
                    $pdf->Cell(60, 6, $participante['nombre_completo'], 1, 0, 'L', $fill);
                    $pdf->Cell(40, 6, $nivelDisplay, 1, 0, 'L', $fill);
                    $pdf->Cell(35, 6, $participante['area_nombre'], 1, 0, 'L', $fill);
                    $pdf->Cell(30, 6, number_format($participante['nota_final'], 2), 1, 0, 'C', $fill);
                    
                    $estado = $participante['estado'] ?? '';
                    if ($estado === 'clasificado') {
                        $pdf->SetTextColor(0, 128, 0);
                        $pdf->Cell(15, 6, 'C', 1, 1, 'C', $fill);
                    } elseif ($estado === 'no_clasificado') {
                        $pdf->SetTextColor(255, 140, 0);
                        $pdf->Cell(15, 6, 'NC', 1, 1, 'C', $fill);
                    } elseif ($estado === 'desclasificado') {
                        $pdf->SetTextColor(200, 0, 0);
                        $pdf->Cell(15, 6, 'D', 1, 1, 'C', $fill);
                    } else {
                        $pdf->SetTextColor(0, 0, 0);
                        $pdf->Cell(15, 6, '-', 1, 1, 'C', $fill);
                    }
                    $pdf->SetTextColor(0, 0, 0);
                    
                    $contador++;
                }
                
                $pdf->Ln(3);
                $pdf->SetFont('helvetica', 'I', 8);
                $pdf->Cell(0, 4, 'Leyenda: C = Clasificado, NC = No Clasificado, D = Desclasificado', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 9);
                $pdf->Ln(5);
            }
            
            
            $sqlClasificados = "
                SELECT 
                    o.nombre_completo,
                    ue.nombre as unidad_educativa_nombre,
                    AVG(ec.puntuacion) as puntuacion_promedio
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                GROUP BY ia.id, o.nombre_completo, ue.nombre
                ORDER BY puntuacion_promedio DESC
            ";
            
            $stmtClasificados = $this->pdo->prepare($sqlClasificados);
            $stmtClasificados->execute([$areaId]);
            $clasificados = $stmtClasificados->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($clasificados)) {
                
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->SetTextColor(0, 128, 0);
                $pdf->Cell(0, 8, 'CLASIFICADOS (' . count($clasificados) . ')', 0, 1, 'L');
                $pdf->SetTextColor(0, 0, 0);
                $pdf->SetFont('helvetica', '', 9);
                
                $pdf->SetFillColor(200, 230, 200);
                $pdf->Cell(10, 6, '#', 1, 0, 'C', true);
                $pdf->Cell(80, 6, 'Participante', 1, 0, 'L', true);
                $pdf->Cell(70, 6, 'Unidad Educativa', 1, 0, 'L', true);
                $pdf->Cell(30, 6, 'Puntuación', 1, 1, 'C', true);
                
                $pdf->SetFillColor(245, 255, 245);
                $contador = 1;
                foreach ($clasificados as $participante) {
                    $fill = ($contador % 2 == 0);
                    $pdf->Cell(10, 6, $contador, 1, 0, 'C', $fill);
                    $pdf->Cell(80, 6, $participante['nombre_completo'], 1, 0, 'L', $fill);
                    $pdf->Cell(70, 6, $participante['unidad_educativa_nombre'] ?? 'N/A', 1, 0, 'L', $fill);
                    $pdf->Cell(30, 6, number_format($participante['puntuacion_promedio'], 2), 1, 1, 'C', $fill);
                    $contador++;
                }
                
                $pdf->Ln(5);
            }
            
            
            $sqlNoClasificados = "
                SELECT 
                    o.nombre_completo,
                    ue.nombre as unidad_educativa_nombre,
                    AVG(ec.puntuacion) as puntuacion_promedio
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'no_clasificado'
                GROUP BY ia.id, o.nombre_completo, ue.nombre
                ORDER BY puntuacion_promedio DESC
            ";
            
            $stmtNoClasificados = $this->pdo->prepare($sqlNoClasificados);
            $stmtNoClasificados->execute([$areaId]);
            $noClasificados = $stmtNoClasificados->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($noClasificados)) {
                
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->SetTextColor(255, 140, 0);
                $pdf->Cell(0, 8, 'NO CLASIFICADOS (' . count($noClasificados) . ')', 0, 1, 'L');
                $pdf->SetTextColor(0, 0, 0);
                $pdf->SetFont('helvetica', '', 9);
                
                $pdf->SetFillColor(255, 230, 200);
                $pdf->Cell(10, 6, '#', 1, 0, 'C', true);
                $pdf->Cell(80, 6, 'Participante', 1, 0, 'L', true);
                $pdf->Cell(70, 6, 'Unidad Educativa', 1, 0, 'L', true);
                $pdf->Cell(30, 6, 'Puntuación', 1, 1, 'C', true);
                
                $pdf->SetFillColor(255, 245, 230);
                $contador = 1;
                foreach ($noClasificados as $participante) {
                    $fill = ($contador % 2 == 0);
                    $pdf->Cell(10, 6, $contador, 1, 0, 'C', $fill);
                    $pdf->Cell(80, 6, $participante['nombre_completo'], 1, 0, 'L', $fill);
                    $pdf->Cell(70, 6, $participante['unidad_educativa_nombre'] ?? 'N/A', 1, 0, 'L', $fill);
                    $pdf->Cell(30, 6, number_format($participante['puntuacion_promedio'], 2), 1, 1, 'C', $fill);
                    $contador++;
                }
            }
            
            $sqlDesclasificados = "
                SELECT 
                    ia.id as inscripcion_id,
                    o.nombre_completo,
                    COALESCE(ue.nombre, 'Sin institución') as unidad_educativa_nombre,
                    COALESCE(
                        (SELECT ROUND(AVG(puntuacion), 2) 
                         FROM evaluaciones_clasificacion 
                         WHERE inscripcion_area_id = ia.id 
                         AND puntuacion IS NOT NULL), 
                        0
                    ) as puntuacion_promedio,
                    COALESCE(
                        (SELECT motivo 
                         FROM desclasificaciones 
                         WHERE inscripcion_area_id = ia.id 
                         AND estado = 'activa' 
                         ORDER BY fecha_desclasificacion DESC 
                         LIMIT 1), 
                        'Sin observación'
                    ) as observacion,
                    (SELECT fecha_desclasificacion 
                     FROM desclasificaciones 
                     WHERE inscripcion_area_id = ia.id 
                     AND estado = 'activa' 
                     ORDER BY fecha_desclasificacion DESC 
                     LIMIT 1) as fecha_desclasificacion
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'desclasificado'
                ORDER BY fecha_desclasificacion DESC NULLS LAST, o.nombre_completo
            ";
            
            $stmtDesclasificados = $this->pdo->prepare($sqlDesclasificados);
            $stmtDesclasificados->execute([$areaId]);
            $desclasificados = $stmtDesclasificados->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("PDF - Desclasificados encontrados para área {$areaId}: " . count($desclasificados));
            if (count($desclasificados) > 0) {
                error_log("PDF - Primer desclasificado: " . json_encode($desclasificados[0]));
            }
            
            if (!empty($desclasificados)) {
                $pdf->Ln(5);
                
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->SetTextColor(200, 0, 0);
                $pdf->Cell(0, 8, 'DESCLASIFICADOS (' . count($desclasificados) . ')', 0, 1, 'L');
                $pdf->SetTextColor(0, 0, 0);
                $pdf->SetFont('helvetica', '', 9);
                
               
                $pdf->SetFillColor(255, 200, 200);
                $pdf->Cell(10, 6, '#', 1, 0, 'C', true);
                $pdf->Cell(60, 6, 'Participante', 1, 0, 'L', true);
                $pdf->Cell(50, 6, 'Unidad Educativa', 1, 0, 'L', true);
                $pdf->Cell(25, 6, 'Puntuación', 1, 0, 'C', true);
                $pdf->Cell(45, 6, 'Observación', 1, 1, 'L', true);
                
                $pdf->SetFillColor(255, 240, 240);
                $contador = 1;
                foreach ($desclasificados as $participante) {
                    $fill = ($contador % 2 == 0);
                    
                    if ($pdf->GetY() > 250) {
                        $pdf->AddPage();
                    }
                    
                    $xInicio = $pdf->GetX();
                    $yInicio = $pdf->GetY();
                    
                    $observacion = $participante['observacion'] ?? 'Sin observación';
                    $anchoObs = 45;
                    
                    $altura = $pdf->getStringHeight($anchoObs, $observacion);
                    $altura = max(6, ceil($altura)); 
                    
                    $pdf->Cell(10, $altura, $contador, 1, 0, 'C', $fill);
                    $pdf->Cell(60, $altura, $participante['nombre_completo'], 1, 0, 'L', $fill);
                    $pdf->Cell(50, $altura, $participante['unidad_educativa_nombre'] ?? 'N/A', 1, 0, 'L', $fill);
                    
                    $puntuacion = $participante['puntuacion_promedio'] ? number_format($participante['puntuacion_promedio'], 2) : 'N/A';
                    $pdf->Cell(25, $altura, $puntuacion, 1, 0, 'C', $fill);
                    
                    $xObs = $pdf->GetX();
                    $yObs = $pdf->GetY();
                    $pdf->SetXY($xObs, $yObs);
                    $pdf->MultiCell($anchoObs, 6, $observacion, 1, 'L', $fill, 1, $xObs, $yObs);
                    
                   
                    $pdf->SetXY($xInicio, $yInicio + $altura);
                    
                    $contador++;
                }
            }
            
            $pdf->Ln(10);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Fecha y hora de generación: ' . date('d/m/Y H:i:s'), 0, 1, 'L');
            
           
            $pdf->Ln(15);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Generado por:', 0, 1, 'L');
            $pdf->Ln(10);
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, $coordinador['name'] ?? $coordinador['email'], 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Cell(0, 4, 'Coordinador de Área', 0, 1, 'L');
            $pdf->Ln(5);
            
            
            $sqlFirma = "
                SELECT firma_imagen, fecha_firma
                FROM firmas_coordinadores
                WHERE area_competencia_id = ? AND coordinador_id = ? AND reporte_tipo = 'cierre_fase'
                ORDER BY fecha_firma DESC
                LIMIT 1
            ";
            $stmtFirma = $this->pdo->prepare($sqlFirma);
            $stmtFirma->execute([$areaId, $coordinador['id']]);
            $firma = $stmtFirma->fetch(PDO::FETCH_ASSOC);
            
            if ($firma && !empty($firma['firma_imagen'])) {
                
                try {
                   
                    $firmaData = $firma['firma_imagen'];
                    
                   
                    if (strpos($firmaData, 'data:image') === 0) {
                       
                        $firmaData = preg_replace('/^data:image\/\w+;base64,/', '', $firmaData);
                    }
                    
                    $firmaBinaria = base64_decode($firmaData);
                    
                    if ($firmaBinaria !== false) {
                        
                        $tempFile = tempnam(sys_get_temp_dir(), 'firma_');
                        file_put_contents($tempFile, $firmaBinaria);
                        
                        
                        $imageInfo = @getimagesize($tempFile);
                        
                        if ($imageInfo !== false) {
                            $imageWidth = $imageInfo[0];
                            $imageHeight = $imageInfo[1];
                            
                            
                            $maxWidth = 60; // mm
                            $maxHeight = 25; // mm
                            
                            $ratio = $imageWidth / $imageHeight;
                            $pdfWidth = min($maxWidth, $maxHeight * $ratio);
                            $pdfHeight = $pdfWidth / $ratio;
                            
                            if ($pdfHeight > $maxHeight) {
                                $pdfHeight = $maxHeight;
                                $pdfWidth = $pdfHeight * $ratio;
                            }
                            
                           
                            $x = $pdf->GetX();
                            $y = $pdf->GetY();
                            $pdf->Image($tempFile, $x, $y, $pdfWidth, $pdfHeight, '', '', '', false, 300, '', false, false, 0);
                            
                            
                            $pdf->SetXY($x, $y + $pdfHeight + 2);
                            $pdf->Line($x, $pdf->GetY(), $x + $pdfWidth, $pdf->GetY());
                            $pdf->SetFont('helvetica', 'I', 8);
                            $pdf->Cell($pdfWidth, 4, 'Firma y sello', 0, 1, 'L');
                            
                            if (!empty($firma['fecha_firma'])) {
                                $pdf->SetFont('helvetica', '', 7);
                                $pdf->Cell($pdfWidth, 3, 'Firmado: ' . date('d/m/Y H:i', strtotime($firma['fecha_firma'])), 0, 1, 'L');
                            }
                            
                           
                            @unlink($tempFile);
                        } else {
                            
                            $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
                            $pdf->SetFont('helvetica', 'I', 8);
                            $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
                            @unlink($tempFile);
                        }
                    } else {
                        
                        $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
                        $pdf->SetFont('helvetica', 'I', 8);
                        $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
                    }
                } catch (\Exception $e) {
                    error_log('Error insertando firma en PDF: ' . $e->getMessage());
                    
                    $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
                    $pdf->SetFont('helvetica', 'I', 8);
                    $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
                }
            } else {
                
                $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
                $pdf->SetFont('helvetica', 'I', 8);
                $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
            }
            
           
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            
            $filename = 'reporte_cierre_fase_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $filepath = $uploadsDir . $filename;
            
            $pdf->Output($filepath, 'F');
            
            error_log("PDF generado exitosamente: {$filepath}");
            
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando PDF: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Generar reporte Excel de clasificados al cerrar la fase
     * @param int $areaId
     * @param string $areaNombre
     * @param float $puntuacionMinima
     * @param float $porcentajeClasificados
     * @param string $fechaCierre
     * @param array $coordinador
     * @return string
     */
    private function generarReporteExcelClasificados($areaId, $areaNombre, $puntuacionMinima, $porcentajeClasificados, $fechaCierre, $coordinador)
    {
        try {
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
            if (file_exists($autoloadPath) && !class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
                require_once $autoloadPath;
            }
            
            $spreadsheet = new Spreadsheet();
            
           
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Clasificados');
            
           
            $sheet->setCellValue('A1', 'REPORTE DE CLASIFICADOS - FASE CLASIFICATORIA');
            $sheet->mergeCells('A1:F1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            $sheet->setCellValue('A2', 'Área: ' . $areaNombre);
            $sheet->mergeCells('A2:F2');
            $sheet->setCellValue('A3', 'Fecha de cierre: ' . date('d/m/Y H:i:s', strtotime($fechaCierre)));
            $sheet->mergeCells('A3:F3');
            $sheet->setCellValue('A4', 'Generado por: ' . ($coordinador['name'] ?? $coordinador['email']));
            $sheet->mergeCells('A4:F4');
            
            $headers = ['ID', 'Nombre', 'Nivel', 'Área', 'Nota Final', 'Estado'];
            $col = 'A';
            $row = 6;
            foreach ($headers as $header) {
                $sheet->setCellValue($col . $row, $header);
                $sheet->getStyle($col . $row)->getFont()->setBold(true);
                $sheet->getStyle($col . $row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('CCCCCC');
                $sheet->getStyle($col . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $col++;
            }
            
            $sqlClasificados = "
                SELECT 
                    ia.id as inscripcion_id,
                    o.nombre_completo,
                    nc.nombre as nivel_nombre,
                    ac.nombre as area_nombre,
                    COALESCE(AVG(ec.puntuacion), 0) as nota_final,
                    'Clasificado' as estado
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                GROUP BY ia.id, o.nombre_completo, nc.nombre, ac.nombre
                ORDER BY nota_final DESC, o.nombre_completo
            ";
            
            $stmtClasificados = $this->pdo->prepare($sqlClasificados);
            $stmtClasificados->execute([$areaId]);
            $clasificados = $stmtClasificados->fetchAll(PDO::FETCH_ASSOC);
            
           
            $row = 7;
            foreach ($clasificados as $participante) {
                $sheet->setCellValue('A' . $row, $participante['inscripcion_id']);
                $sheet->setCellValue('B' . $row, $participante['nombre_completo']);
                $sheet->setCellValue('C' . $row, $participante['nivel_nombre']);
                $sheet->setCellValue('D' . $row, $participante['area_nombre']);
                $sheet->setCellValue('E' . $row, number_format($participante['nota_final'], 2));
                $sheet->setCellValue('F' . $row, $participante['estado']);
                
                
                $sheet->getStyle('E' . $row)->getNumberFormat()
                    ->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_00);
                
                $row++;
            }
            
           
            $sheet->setAutoFilter('A6:F' . ($row - 1));
            
           
            foreach (range('A', 'F') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
           
            $sheet->freezePane('A7');
            
           
            $sheet2 = $spreadsheet->createSheet();
            $sheet2->setTitle('Estadísticas');
            
           
            $sqlStatsNivel = "
                SELECT 
                    nc.nombre as nivel_nombre,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'no_clasificado' THEN ia.id END) as no_clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'desclasificado' THEN ia.id END) as desclasificados,
                    COUNT(DISTINCT ia.id) as total,
                    AVG(CASE WHEN ia.estado = 'clasificado' THEN ec.puntuacion END) as promedio_nota
                FROM inscripciones_areas ia
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                GROUP BY nc.id, nc.nombre
                ORDER BY nc.orden_display
            ";
            
            $stmtStatsNivel = $this->pdo->prepare($sqlStatsNivel);
            $stmtStatsNivel->execute([$areaId]);
            $statsNivel = $stmtStatsNivel->fetchAll(PDO::FETCH_ASSOC);
            
            // Título
            $sheet2->setCellValue('A1', 'ESTADÍSTICAS POR NIVEL');
            $sheet2->mergeCells('A1:F1');
            $sheet2->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet2->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Encabezados estadísticas
            $headersStats = ['Nivel', 'Clasificados', 'No Clasificados', 'Desclasificados', 'Total', 'Promedio Nota'];
            $col = 'A';
            $row = 3;
            foreach ($headersStats as $header) {
                $sheet2->setCellValue($col . $row, $header);
                $sheet2->getStyle($col . $row)->getFont()->setBold(true);
                $sheet2->getStyle($col . $row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('CCCCCC');
                $col++;
            }
            
            // Datos estadísticas
            $row = 4;
            foreach ($statsNivel as $stat) {
                $sheet2->setCellValue('A' . $row, $stat['nivel_nombre']);
                $sheet2->setCellValue('B' . $row, $stat['clasificados'] ?? 0);
                $sheet2->setCellValue('C' . $row, $stat['no_clasificados'] ?? 0);
                $sheet2->setCellValue('D' . $row, $stat['desclasificados'] ?? 0);
                $sheet2->setCellValue('E' . $row, $stat['total'] ?? 0);
                $sheet2->setCellValue('F' . $row, $stat['promedio_nota'] ? number_format($stat['promedio_nota'], 2) : 'N/A');
                $row++;
            }
            
            // Estadísticas generales
            $row += 2;
            $sheet2->setCellValue('A' . $row, 'ESTADÍSTICAS GENERALES');
            $sheet2->mergeCells('A' . $row . ':F' . $row);
            $sheet2->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
            $row++;
            
            $sqlStatsGeneral = "
                SELECT 
                    COUNT(DISTINCT CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as total_clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'no_clasificado' THEN ia.id END) as total_no_clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'desclasificado' THEN ia.id END) as total_desclasificados,
                    COUNT(DISTINCT ia.id) as total_participantes,
                    AVG(CASE WHEN ia.estado = 'clasificado' THEN ec.puntuacion END) as promedio_general
                FROM inscripciones_areas ia
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
            ";
            
            $stmtStatsGeneral = $this->pdo->prepare($sqlStatsGeneral);
            $stmtStatsGeneral->execute([$areaId]);
            $statsGeneral = $stmtStatsGeneral->fetch(PDO::FETCH_ASSOC);
            
            $row++;
            $sheet2->setCellValue('A' . $row, 'Total Clasificados:');
            $sheet2->setCellValue('B' . $row, $statsGeneral['total_clasificados'] ?? 0);
            $row++;
            $sheet2->setCellValue('A' . $row, 'Total No Clasificados:');
            $sheet2->setCellValue('B' . $row, $statsGeneral['total_no_clasificados'] ?? 0);
            $row++;
            $sheet2->setCellValue('A' . $row, 'Total Desclasificados:');
            $sheet2->setCellValue('B' . $row, $statsGeneral['total_desclasificados'] ?? 0);
            $row++;
            $sheet2->setCellValue('A' . $row, 'Total Participantes:');
            $sheet2->setCellValue('B' . $row, $statsGeneral['total_participantes'] ?? 0);
            $row++;
            $sheet2->setCellValue('A' . $row, 'Promedio General:');
            $sheet2->setCellValue('B' . $row, $statsGeneral['promedio_general'] ? number_format($statsGeneral['promedio_general'], 2) : 'N/A');
            $row++;
            $sheet2->setCellValue('A' . $row, 'Puntuación Mínima:');
            $sheet2->setCellValue('B' . $row, number_format($puntuacionMinima, 2));
            $row++;
            $sheet2->setCellValue('A' . $row, 'Criterio de Clasificación:');
            $sheet2->setCellValue('B' . $row, 'Todos los participantes con puntuación >= ' . number_format($puntuacionMinima, 2) . ' puntos son clasificados');
            
           
            foreach (range('A', 'F') as $col) {
                $sheet2->getColumnDimension($col)->setAutoSize(true);
            }
            
           
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                if (!mkdir($uploadsDir, 0755, true)) {
                    throw new \Exception("No se pudo crear el directorio de reportes: {$uploadsDir}");
                }
            }
            
           
            if (!is_writable($uploadsDir)) {
                throw new \Exception("El directorio de reportes no tiene permisos de escritura: {$uploadsDir}");
            }
            
            $filename = 'reporte_clasificados_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.xlsx';
            $filepath = $uploadsDir . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filepath);
            
            if (!file_exists($filepath)) {
                throw new \Exception("El archivo Excel se intentó guardar pero no se encontró: {$filepath}");
            }
            
            if (filesize($filepath) == 0) {
                throw new \Exception("El archivo Excel se creó pero está vacío: {$filepath}");
            }
            
            error_log("Excel de clasificados generado exitosamente: {$filepath} (tamaño: " . filesize($filepath) . " bytes)");
            
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando Excel de clasificados: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Generar reporte PDF de estadísticas detalladas cuando la fase está cerrada
     * @param int $areaId
     * @param string $areaNombre
     * @param float $puntuacionMinima
     * @param float $porcentajeClasificados
     * @param string $fechaCierre
     * @param array $coordinador
     * @return string
     */
    private function generarReportePDFEstadisticasDetalladas($areaId, $areaNombre, $puntuacionMinima, $porcentajeClasificados, $fechaCierre, $coordinador)
    {
        try {
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            
            require_once __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
            
           
            /** @var \TCPDF $pdf */
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            
            
            $pdf->SetCreator('ForwardSoft - Sistema de Olimpiadas');
            $pdf->SetAuthor('Sistema de Olimpiadas');
            $pdf->SetTitle('Reporte de Estadísticas Detalladas - ' . $areaNombre);
            $pdf->SetSubject('Reporte Estadístico Detallado');
            
            
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            $nombreOlimpiada = $config['nombre'] ?? 'Olimpiada Oh! SanSi';
            $añoOlimpiada = date('Y', strtotime($config['fecha_inicio'] ?? 'now'));
            
            
            $sqlNotas = "
                SELECT 
                    ec.puntuacion,
                    nc.nombre as nivel_nombre,
                    ac.nombre as area_nombre,
                    ia.estado
                FROM evaluaciones_clasificacion ec
                JOIN inscripciones_areas ia ON ia.id = ec.inscripcion_area_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                WHERE ia.area_competencia_id = ?
                AND ec.puntuacion IS NOT NULL
            ";
            
            $stmtNotas = $this->pdo->prepare($sqlNotas);
            $stmtNotas->execute([$areaId]);
            $todasLasNotas = $stmtNotas->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($todasLasNotas)) {
                throw new \Exception('No hay datos de evaluaciones para generar estadísticas');
            }
            
            
            $notas = array_column($todasLasNotas, 'puntuacion');
            $promedioGeneral = count($notas) > 0 ? array_sum($notas) / count($notas) : 0;
            $notaMaxima = max($notas);
            $notaMinima = min($notas);
            
            
            $sumaCuadrados = 0;
            foreach ($notas as $nota) {
                $sumaCuadrados += pow($nota - $promedioGeneral, 2);
            }
            $desviacionEstandar = count($notas) > 1 ? sqrt($sumaCuadrados / (count($notas) - 1)) : 0;
            
           
            $distribucionRangos = [
                '0-20' => 0,
                '21-40' => 0,
                '41-60' => 0,
                '61-80' => 0,
                '81-100' => 0
            ];
            
            foreach ($notas as $nota) {
                if ($nota >= 0 && $nota <= 20) {
                    $distribucionRangos['0-20']++;
                } elseif ($nota >= 21 && $nota <= 40) {
                    $distribucionRangos['21-40']++;
                } elseif ($nota >= 41 && $nota <= 60) {
                    $distribucionRangos['41-60']++;
                } elseif ($nota >= 61 && $nota <= 80) {
                    $distribucionRangos['61-80']++;
                } elseif ($nota >= 81 && $nota <= 100) {
                    $distribucionRangos['81-100']++;
                }
            }
            
           
            $sqlPorNivel = "
                SELECT 
                    nc.nombre as nivel_nombre,
                    COUNT(DISTINCT ia.id) as total_participantes,
                    COUNT(DISTINCT ec.id) as total_evaluaciones,
                    AVG(ec.puntuacion) as promedio,
                    MIN(ec.puntuacion) as nota_minima,
                    MAX(ec.puntuacion) as nota_maxima,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'no_clasificado' THEN ia.id END) as no_clasificados
                FROM inscripciones_areas ia
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ec.puntuacion IS NOT NULL
                GROUP BY nc.id, nc.nombre
                ORDER BY nc.orden_display
            ";
            
            $stmtPorNivel = $this->pdo->prepare($sqlPorNivel);
            $stmtPorNivel->execute([$areaId]);
            $estadisticasPorNivel = $stmtPorNivel->fetchAll(PDO::FETCH_ASSOC);
            
            
            $sqlClasificacion = "
                SELECT 
                    COUNT(DISTINCT CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as total_clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'no_clasificado' THEN ia.id END) as total_no_clasificados,
                    COUNT(DISTINCT CASE WHEN ia.estado = 'desclasificado' THEN ia.id END) as total_desclasificados,
                    COUNT(DISTINCT ia.id) as total_participantes
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
            ";
            
            $stmtClasificacion = $this->pdo->prepare($sqlClasificacion);
            $stmtClasificacion->execute([$areaId]);
            $clasificacion = $stmtClasificacion->fetch(PDO::FETCH_ASSOC);
            
            $totalClasificados = (int)($clasificacion['total_clasificados'] ?? 0);
            $totalNoClasificados = (int)($clasificacion['total_no_clasificados'] ?? 0);
            $totalDesclasificados = (int)($clasificacion['total_desclasificados'] ?? 0);
            $totalParticipantes = (int)($clasificacion['total_participantes'] ?? 0);
            $porcentajeAprobacion = $totalParticipantes > 0 ? ($totalClasificados / $totalParticipantes) * 100 : 0;
            
           
            $pdf->AddPage();
            
            // Título
            $pdf->SetFont('helvetica', 'B', 18);
            $pdf->Cell(0, 10, 'REPORTE ESTADÍSTICAS DETALLADAS', 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, $nombreOlimpiada . ' ' . $añoOlimpiada, 0, 1, 'C');
            $pdf->SetFont('helvetica', '', 12);
            $pdf->Cell(0, 6, 'Área: ' . $areaNombre, 0, 1, 'C');
            $pdf->Cell(0, 6, 'Fecha de cierre: ' . date('d/m/Y H:i:s', strtotime($fechaCierre)), 0, 1, 'C');
            $pdf->Ln(5);
            
            // ANÁLISIS ESTADÍSTICO COMPLETO
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, 'ANÁLISIS ESTADÍSTICO COMPLETO', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Ln(2);
            
            // Estadísticas básicas
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->Cell(0, 6, 'Estadísticas Básicas', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Promedio general de notas:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, number_format($promedioGeneral, 2), 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Desviación estándar:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, number_format($desviacionEstandar, 2), 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Nota máxima:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, number_format($notaMaxima, 2), 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Nota mínima:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetTextColor(200, 0, 0);
            $pdf->Cell(0, 6, number_format($notaMinima, 2), 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Total de evaluaciones:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, count($notas), 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Ln(5);
            
            // Distribución por rangos
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->Cell(0, 6, 'Distribución por Rangos de Notas', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Ln(2);
            
            // Tabla de distribución
            $pdf->SetFillColor(230, 230, 230);
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(60, 8, 'Rango', 1, 0, 'C', true);
            $pdf->Cell(60, 8, 'Cantidad', 1, 0, 'C', true);
            $pdf->Cell(70, 8, 'Porcentaje', 1, 1, 'C', true);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->SetFillColor(255, 255, 255);
            
            $totalEvaluaciones = count($notas);
            foreach ($distribucionRangos as $rango => $cantidad) {
                $porcentaje = $totalEvaluaciones > 0 ? ($cantidad / $totalEvaluaciones) * 100 : 0;
                $pdf->Cell(60, 7, $rango, 1, 0, 'C');
                $pdf->Cell(60, 7, $cantidad, 1, 0, 'C');
                $pdf->Cell(70, 7, number_format($porcentaje, 2) . '%', 1, 1, 'C');
            }
            
            $pdf->Ln(5);
            
           
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->Cell(0, 6, 'Clasificación y Aprobación', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Ln(2);
            
            $pdf->Cell(100, 6, 'Total de participantes:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, $totalParticipantes, 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Cantidad de clasificados:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, $totalClasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Cantidad de no clasificados:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetTextColor(255, 140, 0);
            $pdf->Cell(0, 6, $totalNoClasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Cantidad de desclasificados:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetTextColor(200, 0, 0);
            $pdf->Cell(0, 6, $totalDesclasificados, 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Porcentaje de aprobación:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, number_format($porcentajeAprobacion, 2) . '%', 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Ln(5);
            
           
            if (!empty($estadisticasPorNivel)) {
                $pdf->AddPage();
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'ANÁLISIS POR NIVEL EDUCATIVO', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Ln(2);
                
                // Tabla de análisis por nivel
                $pdf->SetFillColor(230, 230, 230);
                $pdf->SetFont('helvetica', 'B', 9);
                $pdf->Cell(40, 8, 'Nivel', 1, 0, 'C', true);
                $pdf->Cell(30, 8, 'Total', 1, 0, 'C', true);
                $pdf->Cell(30, 8, 'Promedio', 1, 0, 'C', true);
                $pdf->Cell(25, 8, 'Mínima', 1, 0, 'C', true);
                $pdf->Cell(25, 8, 'Máxima', 1, 0, 'C', true);
                $pdf->Cell(20, 8, 'Clasif.', 1, 0, 'C', true);
                $pdf->Cell(20, 8, 'No Clasif.', 1, 1, 'C', true);
                $pdf->SetFont('helvetica', '', 9);
                $pdf->SetFillColor(255, 255, 255);
                
                foreach ($estadisticasPorNivel as $nivel) {
                    $pdf->Cell(40, 7, $nivel['nivel_nombre'], 1, 0, 'L');
                    $pdf->Cell(30, 7, $nivel['total_participantes'], 1, 0, 'C');
                    $pdf->Cell(30, 7, number_format($nivel['promedio'] ?? 0, 2), 1, 0, 'C');
                    $pdf->Cell(25, 7, number_format($nivel['nota_minima'] ?? 0, 2), 1, 0, 'C');
                    $pdf->Cell(25, 7, number_format($nivel['nota_maxima'] ?? 0, 2), 1, 0, 'C');
                    $pdf->Cell(20, 7, $nivel['clasificados'] ?? 0, 1, 0, 'C');
                    $pdf->Cell(20, 7, $nivel['no_clasificados'] ?? 0, 1, 1, 'C');
                }
            }
            
            
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, 'ANÁLISIS POR ÁREA ACADÉMICA', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Ln(2);
            
            $pdf->Cell(100, 6, 'Área analizada:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, $areaNombre, 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Promedio del área:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, number_format($promedioGeneral, 2), 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(100, 6, 'Desviación estándar del área:', 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, number_format($desviacionEstandar, 2), 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            
            $pdf->Ln(5);
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->Cell(0, 6, 'Gráfico de Distribución por Rangos', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Ln(2);
            
            $maxCantidad = max($distribucionRangos);
            $anchoMaximo = 150; // Ancho máximo de la barra en mm
            
            foreach ($distribucionRangos as $rango => $cantidad) {
                $porcentaje = $totalEvaluaciones > 0 ? ($cantidad / $totalEvaluaciones) * 100 : 0;
                $anchoBarra = $maxCantidad > 0 ? ($cantidad / $maxCantidad) * $anchoMaximo : 0;
                
                $pdf->Cell(30, 6, $rango . ':', 0, 0, 'L');
                $pdf->SetFillColor(70, 130, 180);
                $pdf->Rect($pdf->GetX(), $pdf->GetY() + 1, $anchoBarra, 5, 'F');
                $pdf->SetFillColor(255, 255, 255);
                $pdf->Cell(5, 6, '', 0, 0, 'L');
                $pdf->Cell(30, 6, $cantidad . ' (' . number_format($porcentaje, 1) . '%)', 0, 1, 'L');
            }
            
            // Fecha y hora de generación
            $pdf->Ln(10);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Fecha y hora de generación: ' . date('d/m/Y H:i:s'), 0, 1, 'L');
            
            // Firma digital
            $pdf->Ln(15);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Generado por:', 0, 1, 'L');
            $pdf->Ln(10);
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 6, $coordinador['name'] ?? $coordinador['email'], 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 9);
            $pdf->Cell(0, 4, 'Coordinador de Área', 0, 1, 'L');
            $pdf->Ln(5);
            
            // Línea para firma
            $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
            $pdf->SetFont('helvetica', 'I', 8);
            $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
            
           
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            
            $filename = 'reporte_estadisticas_detalladas_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $filepath = $uploadsDir . $filename;
            
            $pdf->Output($filepath, 'F');
            
            error_log("PDF de estadísticas detalladas generado exitosamente: {$filepath}");
            
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando PDF de estadísticas detalladas: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    
    public function descargarReportePDFCierreFase()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
            }

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            
            
            if (!is_dir($uploadsDir)) {
                if (!mkdir($uploadsDir, 0755, true)) {
                    error_log('Error: No se pudo crear el directorio de reportes: ' . $uploadsDir);
                    Response::error('Error de configuración del servidor: directorio de reportes no disponible', 500);
                    return;
                }
            }
            
            if (!is_writable($uploadsDir)) {
                error_log('Error: El directorio de reportes no tiene permisos de escritura: ' . $uploadsDir);
                Response::error('Error de configuración del servidor: directorio de reportes sin permisos', 500);
                return;
            }
            
            $sqlFirma = "
                SELECT fecha_firma
                FROM firmas_coordinadores
                WHERE area_competencia_id = ? AND coordinador_id = ? AND reporte_tipo = 'cierre_fase'
                ORDER BY fecha_firma DESC
                LIMIT 1
            ";
            $stmtFirma = $this->pdo->prepare($sqlFirma);
            $stmtFirma->execute([$areaId, $currentUser['id']]);
            $firma = $stmtFirma->fetch(PDO::FETCH_ASSOC);
            
            $pattern = $uploadsDir . 'reporte_cierre_fase_' . $areaId . '_*.pdf';
            $files = glob($pattern);
            
            $necesitaRegenerar = false;
            if (!empty($files) && $firma) {
                // Ordenar archivos por fecha
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                $latestFile = $files[0];
                $pdfModTime = filemtime($latestFile);
                $firmaTime = strtotime($firma['fecha_firma']);
                
                
                if ($firmaTime > $pdfModTime) {
                    $necesitaRegenerar = true;
                }
            }
            
            
            if (empty($files) || $necesitaRegenerar) {
                
                $sqlCierre = "
                    SELECT estado, fecha_cierre
                    FROM cierre_fase_areas
                    WHERE area_competencia_id = ? 
                    AND fase = 'final'
                    AND estado = 'cerrada'
                    ORDER BY fecha_cierre DESC
                    LIMIT 1
                ";
                $stmtCierre = $this->pdo->prepare($sqlCierre);
                $stmtCierre->execute([$areaId]);
                $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
                
                if (!$cierre) {
                    Response::error('La fase debe estar cerrada para generar el reporte PDF', 400);
                    return;
                }
                
               
                $sqlStats = "
                    SELECT 
                        COUNT(DISTINCT ia.id) as total_participantes,
                        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM evaluaciones_clasificacion ec WHERE ec.inscripcion_area_id = ia.id AND ec.puntuacion IS NOT NULL) THEN ia.id END) as total_evaluados,
                        COUNT(DISTINCT CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as cantidad_clasificados
                    FROM inscripciones_areas ia
                    WHERE ia.area_competencia_id = ?
                ";
                $stmtStats = $this->pdo->prepare($sqlStats);
                $stmtStats->execute([$areaId]);
                $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
                
               
                $puntuacionMinima = 51.00;
                $porcentajeClasificados = 0.6;
                
                try {
                    $configModel = new ConfiguracionOlimpiada();
                    $config = $configModel->getConfiguracion();
                    
                    if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                        $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                    }
                } catch (\Exception $e) {
                    error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
                }
                
                
                try {
                    $this->generarReportePDFCierreFase(
                        $areaId,
                        $areaNombre,
                        $stats['total_participantes'] ?? 0,
                        $stats['total_evaluados'] ?? 0,
                        $stats['cantidad_clasificados'] ?? 0,
                        [],
                        [],
                        $puntuacionMinima,
                        $porcentajeClasificados,
                        $cierre['fecha_cierre'],
                        $currentUser
                    );
                } catch (\Exception $e) {
                    error_log('Error regenerando PDF: ' . $e->getMessage());
                    error_log('Trace: ' . $e->getTraceAsString());
                    // Si no hay PDF existente y falla la generación, devolver error
                    $files = glob($pattern);
                    if (empty($files)) {
                        Response::error('No se pudo generar el reporte PDF. Error: ' . $e->getMessage(), 500);
                        return;
                    }
                    
                }
            }
            
           
            $files = glob($pattern);
            
            if (empty($files)) {
                error_log('No se encontraron archivos PDF con el patrón: ' . $pattern);
                Response::error('No se encontró ningún reporte PDF para esta área. Asegúrate de que la fase esté cerrada.', 404);
                return;
            }
            
           
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile)) {
                error_log('El archivo PDF no existe en la ruta: ' . $latestFile);
                Response::error('El archivo PDF no existe', 404);
                return;
            }
            
            if (!is_readable($latestFile)) {
                error_log('El archivo PDF no es legible: ' . $latestFile);
                Response::error('El archivo PDF no es accesible', 500);
                return;
            }
            
            $fileSize = filesize($latestFile);
            if ($fileSize === false || $fileSize === 0) {
                error_log('El archivo PDF está vacío o no se pudo obtener su tamaño: ' . $latestFile);
                Response::error('El archivo PDF está vacío o corrupto', 500);
                return;
            }
            
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
           
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . $fileSize);
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            
            
            readfile($latestFile);
            exit;
            
        } catch (\Exception $e) {
            error_log('Error descargando PDF de cierre de fase: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            Response::serverError('Error al descargar el reporte PDF: ' . $e->getMessage());
        }
    }

    
    public function descargarReporteExcelClasificados()
    {
        
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
            }
            
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            
           
            $sqlCierre = "
                SELECT estado, fecha_cierre, cantidad_clasificados
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'clasificacion'
                LIMIT 1
            ";
            $stmtCierre = $this->pdo->prepare($sqlCierre);
            $stmtCierre->execute([$areaId]);
            $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
            
           
            $pattern = $uploadsDir . 'reporte_clasificados_' . $areaId . '_*.xlsx';
            $files = glob($pattern);
            
            
            if (empty($files) && $cierre && $cierre['estado'] === 'cerrada') {
                
                while (ob_get_level()) {
                    ob_end_clean();
                }
                
                try {
                    
                    $porcentajeClasificados = 0.6; 
                    $puntuacionMinima = 51.00;
                    
                    
                    try {
                        $configModel = new ConfiguracionOlimpiada();
                        $config = $configModel->getConfiguracion();
                        
                        if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                            $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
                        }
                    } catch (\Exception $e) {
                        error_log('No se pudo obtener configuración de olimpiada: ' . $e->getMessage());
                        
                    }
                    
                    error_log("Generando Excel automáticamente para área {$areaId} (fase cerrada)");
                    $this->generarReporteExcelClasificados($areaId, $areaNombre, $puntuacionMinima, $porcentajeClasificados, $cierre['fecha_cierre'], $currentUser);
                    
                    
                    while (ob_get_level()) {
                        ob_end_clean();
                    }
                    
                    
                    $files = glob($pattern);
                    error_log("Archivos encontrados después de generar: " . count($files));
                    
                    if (empty($files)) {
                        throw new \Exception('El archivo Excel se generó pero no se encontró en el directorio de reportes');
                    }
                } catch (\Exception $e) {
                    
                    while (ob_get_level()) {
                        ob_end_clean();
                    }
                    
                    error_log('Error generando Excel automáticamente: ' . $e->getMessage());
                    error_log('Trace: ' . $e->getTraceAsString());
                    
                    
                    if ($cierre && $cierre['estado'] === 'cerrada') {
                        $errorMsg = 'No se pudo generar el reporte Excel automáticamente. ';
                        $errorMsg .= 'Error: ' . $e->getMessage();
                        $errorMsg .= ' Por favor, contacte al administrador o intente nuevamente más tarde.';
                        Response::error($errorMsg, 500);
                        return;
                    }
                }
            }
            
            if (empty($files)) {
                
                while (ob_get_level()) {
                    ob_end_clean();
                }
                if ($cierre && $cierre['estado'] === 'cerrada') {
                    Response::error('No se encontró ningún reporte Excel para esta área. La generación automática falló. Por favor, contacte al administrador.', 500);
                } else {
                    Response::error('No se encontró ningún reporte Excel para esta área. La fase debe estar cerrada para generar el reporte.', 404);
                }
                return;
            }
            
            
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile)) {
                Response::error('El archivo Excel no existe', 404);
                return;
            }
            
           
            while (ob_get_level()) {
                ob_end_clean();
            }
            
          
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . filesize($latestFile));
            header('Content-Transfer-Encoding: binary');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
            header('Expires: 0');
            
            readfile($latestFile);
            exit;
            
        } catch (\Exception $e) {
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            error_log('Error descargando Excel de clasificados: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al descargar el reporte Excel');
        }
    }

    
    public function descargarReportePDFEstadisticasDetalladas()
    {
        try {
           
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
            }

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            
            // Buscar el PDF más reciente de estadísticas detalladas para este área
            $pattern = $uploadsDir . 'reporte_estadisticas_detalladas_' . $areaId . '_*.pdf';
            $files = glob($pattern);
            
            if (empty($files)) {
                Response::error('No se encontró ningún reporte de estadísticas detalladas para esta área. La fase debe estar cerrada para generar el reporte.', 404);
                return;
            }
            
            
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile)) {
                Response::error('El archivo PDF no existe', 404);
                return;
            }
            
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . filesize($latestFile));
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            
            readfile($latestFile);
            exit;
            
        } catch (\Exception $e) {
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            error_log('Error descargando PDF de estadísticas detalladas: ' . $e->getMessage());
            Response::serverError('Error al descargar el reporte de estadísticas detalladas');
        }
    }

   
    public function listarReportesPDF()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
            }

            
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            
            
            $pattern = $uploadsDir . 'reporte_cierre_fase_' . $areaId . '_*.pdf';
            $files = glob($pattern);
            
            $reportes = [];
            foreach ($files as $file) {
                $reportes[] = [
                    'filename' => basename($file),
                    'fecha_generacion' => date('Y-m-d H:i:s', filemtime($file)),
                    'tamaño' => filesize($file),
                    'url' => '/uploads/reportes/' . basename($file)
                ];
            }
            
            
            usort($reportes, function($a, $b) {
                return strtotime($b['fecha_generacion']) - strtotime($a['fecha_generacion']);
            });
            
            Response::success([
                'area_id' => $areaId,
                'area_nombre' => $areaCoordinador['area_nombre'],
                'reportes' => $reportes,
                'total' => count($reportes)
            ], 'Reportes obtenidos exitosamente');
            
        } catch (\Exception $e) {
            error_log('Error listando PDFs de cierre de fase: ' . $e->getMessage());
            Response::serverError('Error al listar los reportes PDF');
        }
    }

    
    public function generarReportePDFProgreso()
    {
       
        while (ob_get_level()) {
            ob_end_clean();
        }
        ob_start();
        
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                ob_end_clean();
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                ob_end_clean();
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            
            $progressData = $this->obtenerDatosProgresoParaReporte($areaId);
            
           
            require_once __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
            
            
            /** @var \TCPDF $pdf */
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            
            
            $pdf->SetCreator('ForwardSoft - Sistema de Olimpiadas');
            $pdf->SetAuthor('Sistema de Olimpiadas');
            $pdf->SetTitle('Reporte de Progreso de Evaluación Clasificatoria - ' . $areaNombre);
            $pdf->SetSubject('Reporte de Progreso');
            
            
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
           
            $pdf->AddPage();
            
           
            $pdf->SetFont('helvetica', 'B', 20);
            $pdf->Cell(0, 10, 'REPORTE DE PROGRESO DE EVALUACIÓN', 0, 1, 'C');
            $pdf->SetFont('helvetica', '', 14);
            $pdf->Cell(0, 8, 'Fase Clasificatoria - ' . $areaNombre, 0, 1, 'C');
            $pdf->Cell(0, 6, 'Generado: ' . date('d/m/Y H:i:s'), 0, 1, 'C');
            $pdf->Ln(5);
            
            
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, 'ESTADÍSTICAS GENERALES', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            $stats = $progressData['estadisticas_generales'];
            $pdf->Cell(100, 6, 'Total Olimpistas:', 0, 0, 'L');
            $pdf->Cell(0, 6, $stats['total_olimpistas'], 0, 1, 'L');
            
            $pdf->Cell(100, 6, 'Total Evaluados:', 0, 0, 'L');
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, $stats['total_evaluados'], 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell(100, 6, 'Total Pendientes:', 0, 0, 'L');
            $pdf->SetTextColor(255, 140, 0);
            $pdf->Cell(0, 6, $stats['total_pendientes'], 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell(100, 6, 'Total Clasificados:', 0, 0, 'L');
            $pdf->SetTextColor(0, 128, 0);
            $pdf->Cell(0, 6, $stats['total_clasificados'], 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell(100, 6, 'Total No Clasificados:', 0, 0, 'L');
            $pdf->SetTextColor(255, 140, 0);
            $pdf->Cell(0, 6, $stats['total_no_clasificados'], 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell(100, 6, 'Total Desclasificados:', 0, 0, 'L');
            $pdf->SetTextColor(200, 0, 0);
            $pdf->Cell(0, 6, $stats['total_desclasificados'], 0, 1, 'L');
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell(100, 6, 'Promedio General:', 0, 0, 'L');
            $pdf->Cell(0, 6, number_format($stats['promedio_general'], 2) . '%', 0, 1, 'L');
            
            $pdf->Ln(5);
            
            // Progreso por Niveles
            if (!empty($progressData['niveles'])) {
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'PROGRESO POR NIVELES', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 9);
                
                // Encabezado de tabla
                $pdf->SetFillColor(200, 200, 200);
                $pdf->Cell(50, 6, 'Nivel', 1, 0, 'L', true);
                $pdf->Cell(20, 6, 'Total', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Evaluados', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Pendientes', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Clasif.', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'No Clasif.', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Desclasif.', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Promedio', 1, 1, 'C', true);
                
                $pdf->SetFillColor(245, 245, 245);
                foreach ($progressData['niveles'] as $index => $nivel) {
                    $fill = ($index % 2 == 0);
                    $pdf->Cell(50, 6, $nivel['nivel_nombre'], 1, 0, 'L', $fill);
                    $pdf->Cell(20, 6, $nivel['total_olimpistas'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, $nivel['evaluados'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, $nivel['pendientes'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, $nivel['clasificados'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, $nivel['no_clasificados'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, $nivel['desclasificados'], 1, 0, 'C', $fill);
                    $pdf->Cell(20, 6, number_format($nivel['promedio_puntuacion'] ?? 0, 1), 1, 1, 'C', $fill);
                }
                
                $pdf->Ln(5);
            }
            
            // Evaluadores
            if (!empty($progressData['evaluadores_lista'])) {
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'EVALUADORES', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 9);
                
                // Encabezado
                $pdf->SetFillColor(200, 200, 200);
                $pdf->Cell(60, 6, 'Nombre', 1, 0, 'L', true);
                $pdf->Cell(60, 6, 'Email', 1, 0, 'L', true);
                $pdf->Cell(30, 6, 'Completadas', 1, 0, 'C', true);
                $pdf->Cell(30, 6, 'Pendientes', 1, 0, 'C', true);
                $pdf->Cell(20, 6, 'Estado', 1, 1, 'C', true);
                
                $pdf->SetFillColor(245, 245, 245);
                foreach ($progressData['evaluadores_lista'] as $index => $eval) {
                    $fill = ($index % 2 == 0);
                    $pdf->Cell(60, 6, $eval['nombre'], 1, 0, 'L', $fill);
                    $pdf->Cell(60, 6, $eval['email'], 1, 0, 'L', $fill);
                    $pdf->Cell(30, 6, $eval['evaluaciones_completadas'], 1, 0, 'C', $fill);
                    $pdf->Cell(30, 6, $eval['asignaciones_pendientes'], 1, 0, 'C', $fill);
                    
                    $estadoColor = [0, 0, 0];
                    if ($eval['estado'] === 'con_permisos') {
                        $estadoColor = [0, 128, 0];
                    } elseif ($eval['estado'] === 'activo_sin_permisos') {
                        $estadoColor = [255, 140, 0];
                    } else {
                        $estadoColor = [200, 0, 0];
                    }
                    $pdf->SetTextColor($estadoColor[0], $estadoColor[1], $estadoColor[2]);
                    $pdf->Cell(20, 6, ucfirst(str_replace('_', ' ', $eval['estado'])), 1, 1, 'C', $fill);
                    $pdf->SetTextColor(0, 0, 0);
                }
                
                $pdf->Ln(5);
            }
            
            // Olimpistas sin evaluar (primeros 20)
            if (!empty($progressData['olimpistas_sin_evaluar'])) {
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'OLIMPISTAS SIN EVALUAR (Primeros 20)', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 9);
                
                // Encabezado
                $pdf->SetFillColor(255, 200, 200);
                $pdf->Cell(60, 6, 'Nombre', 1, 0, 'L', true);
                $pdf->Cell(40, 6, 'Nivel', 1, 0, 'L', true);
                $pdf->Cell(30, 6, 'Días Pendiente', 1, 0, 'C', true);
                $pdf->Cell(40, 6, 'Evaluador Asignado', 1, 0, 'L', true);
                $pdf->Cell(20, 6, 'Alerta', 1, 1, 'C', true);
                
                $pdf->SetFillColor(255, 240, 240);
                foreach ($progressData['olimpistas_sin_evaluar'] as $index => $olimpista) {
                    $fill = ($index % 2 == 0);
                    $pdf->Cell(60, 6, $olimpista['nombre'], 1, 0, 'L', $fill);
                    $pdf->Cell(40, 6, $olimpista['nivel'], 1, 0, 'L', $fill);
                    $pdf->Cell(30, 6, $olimpista['dias_pendiente'], 1, 0, 'C', $fill);
                    $pdf->Cell(40, 6, $olimpista['evaluador_nombre'] ?? 'Sin asignar', 1, 0, 'L', $fill);
                    
                    $alertaColor = [0, 0, 0];
                    if ($olimpista['nivel_alerta'] === 'critico') {
                        $alertaColor = [200, 0, 0];
                    } elseif ($olimpista['nivel_alerta'] === 'advertencia') {
                        $alertaColor = [255, 140, 0];
                    }
                    $pdf->SetTextColor($alertaColor[0], $alertaColor[1], $alertaColor[2]);
                    $pdf->Cell(20, 6, ucfirst($olimpista['nivel_alerta']), 1, 1, 'C', $fill);
                    $pdf->SetTextColor(0, 0, 0);
                }
            }
            
            // Métricas de tiempo
            if (!empty($progressData['metricas_tiempo'])) {
                $pdf->Ln(5);
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'MÉTRICAS DE TIEMPO', 0, 1, 'L');
                $pdf->SetFont('helvetica', '', 10);
                
                $metricas = $progressData['metricas_tiempo'];
                $pdf->Cell(100, 6, 'Días promedio de evaluación:', 0, 0, 'L');
                $pdf->Cell(0, 6, number_format($metricas['dias_promedio_evaluacion'], 1) . ' días', 0, 1, 'L');
                
                $pdf->Cell(100, 6, 'Tiempo mínimo:', 0, 0, 'L');
                $pdf->Cell(0, 6, number_format($metricas['tiempo_minimo'], 1) . ' días', 0, 1, 'L');
                
                $pdf->Cell(100, 6, 'Tiempo máximo:', 0, 0, 'L');
                $pdf->Cell(0, 6, number_format($metricas['tiempo_maximo'], 1) . ' días', 0, 1, 'L');
            }
            
            
            ob_end_clean();
            
            $filename = 'reporte_progreso_evaluacion_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.pdf';
            
           
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Transfer-Encoding: binary');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
            header('Expires: 0');
            
            
            $pdfContent = $pdf->Output('', 'S');
            
           
            echo $pdfContent;
            exit;
            
        } catch (\Exception $e) {
            ob_end_clean();
            error_log('Error generando PDF de progreso: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al generar el reporte PDF: ' . $e->getMessage());
        }
    }

   
    public function generarReporteExcelProgreso()
    {
       
        while (ob_get_level()) {
            ob_end_clean();
        }
        ob_start();
        
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                ob_end_clean();
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            // Obtener el área asignada al coordinador
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                ob_end_clean();
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            // Obtener datos de progreso
            $progressData = $this->obtenerDatosProgresoParaReporte($areaId);
            
            // Cargar PhpSpreadsheet
            require_once __DIR__ . '/../../vendor/autoload.php';
            
            $spreadsheet = new Spreadsheet();
            
            // Hoja 1: Estadísticas Generales
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Estadísticas Generales');
            
            $sheet->setCellValue('A1', 'REPORTE DE PROGRESO DE EVALUACIÓN CLASIFICATORIA');
            $sheet->mergeCells('A1:D1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            $sheet->setCellValue('A2', 'Área: ' . $areaNombre);
            $sheet->mergeCells('A2:D2');
            $sheet->setCellValue('A3', 'Generado: ' . date('d/m/Y H:i:s'));
            $sheet->mergeCells('A3:D3');
            
            $row = 5;
            $sheet->setCellValue('A' . $row, 'ESTADÍSTICAS GENERALES');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
            $row++;
            
            $stats = $progressData['estadisticas_generales'];
            $sheet->setCellValue('A' . $row, 'Total Olimpistas');
            $sheet->setCellValue('B' . $row, $stats['total_olimpistas']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Total Evaluados');
            $sheet->setCellValue('B' . $row, $stats['total_evaluados']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Total Pendientes');
            $sheet->setCellValue('B' . $row, $stats['total_pendientes']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Total Clasificados');
            $sheet->setCellValue('B' . $row, $stats['total_clasificados']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Total No Clasificados');
            $sheet->setCellValue('B' . $row, $stats['total_no_clasificados']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Total Desclasificados');
            $sheet->setCellValue('B' . $row, $stats['total_desclasificados']);
            $row++;
            
            $sheet->setCellValue('A' . $row, 'Promedio General');
            $sheet->setCellValue('B' . $row, number_format($stats['promedio_general'], 2) . '%');
            
            // Hoja 2: Progreso por Niveles
            if (!empty($progressData['niveles'])) {
                $sheet2 = $spreadsheet->createSheet();
                $sheet2->setTitle('Progreso por Niveles');
                
                $headers = ['Nivel', 'Total', 'Evaluados', 'Pendientes', 'Clasificados', 'No Clasificados', 'Desclasificados', 'Promedio'];
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet2->setCellValue($col . '1', $header);
                    $sheet2->getStyle($col . '1')->getFont()->setBold(true);
                    $sheet2->getStyle($col . '1')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('CCCCCC');
                    $col++;
                }
                
                $row = 2;
                foreach ($progressData['niveles'] as $nivel) {
                    $sheet2->setCellValue('A' . $row, $nivel['nivel_nombre']);
                    $sheet2->setCellValue('B' . $row, $nivel['total_olimpistas']);
                    $sheet2->setCellValue('C' . $row, $nivel['evaluados']);
                    $sheet2->setCellValue('D' . $row, $nivel['pendientes']);
                    $sheet2->setCellValue('E' . $row, $nivel['clasificados']);
                    $sheet2->setCellValue('F' . $row, $nivel['no_clasificados']);
                    $sheet2->setCellValue('G' . $row, $nivel['desclasificados']);
                    $sheet2->setCellValue('H' . $row, number_format($nivel['promedio_puntuacion'] ?? 0, 2));
                    $row++;
                }
                
                // Auto-ajustar columnas
                foreach (range('A', 'H') as $col) {
                    $sheet2->getColumnDimension($col)->setAutoSize(true);
                }
            }
            
            // Hoja 3: Evaluadores
            if (!empty($progressData['evaluadores_lista'])) {
                $sheet3 = $spreadsheet->createSheet();
                $sheet3->setTitle('Evaluadores');
                
                $headers = ['Nombre', 'Email', 'Evaluaciones Completadas', 'Asignaciones Pendientes', 'Estado', 'Último Acceso'];
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet3->setCellValue($col . '1', $header);
                    $sheet3->getStyle($col . '1')->getFont()->setBold(true);
                    $sheet3->getStyle($col . '1')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('CCCCCC');
                    $col++;
                }
                
                $row = 2;
                foreach ($progressData['evaluadores_lista'] as $eval) {
                    $sheet3->setCellValue('A' . $row, $eval['nombre']);
                    $sheet3->setCellValue('B' . $row, $eval['email']);
                    $sheet3->setCellValue('C' . $row, $eval['evaluaciones_completadas']);
                    $sheet3->setCellValue('D' . $row, $eval['asignaciones_pendientes']);
                    $sheet3->setCellValue('E' . $row, ucfirst(str_replace('_', ' ', $eval['estado'])));
                    $sheet3->setCellValue('F' . $row, $eval['last_login'] ? date('d/m/Y H:i', strtotime($eval['last_login'])) : 'Nunca');
                    $row++;
                }
                
                foreach (range('A', 'F') as $col) {
                    $sheet3->getColumnDimension($col)->setAutoSize(true);
                }
            }
            
            // Hoja 4: Olimpistas sin evaluar
            if (!empty($progressData['olimpistas_sin_evaluar'])) {
                $sheet4 = $spreadsheet->createSheet();
                $sheet4->setTitle('Pendientes de Evaluar');
                
                $headers = ['Nombre', 'Nivel', 'Días Pendiente', 'Evaluador Asignado', 'Nivel de Alerta'];
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet4->setCellValue($col . '1', $header);
                    $sheet4->getStyle($col . '1')->getFont()->setBold(true);
                    $sheet4->getStyle($col . '1')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('FFCCCC');
                    $col++;
                }
                
                $row = 2;
                foreach ($progressData['olimpistas_sin_evaluar'] as $olimpista) {
                    $sheet4->setCellValue('A' . $row, $olimpista['nombre']);
                    $sheet4->setCellValue('B' . $row, $olimpista['nivel']);
                    $sheet4->setCellValue('C' . $row, $olimpista['dias_pendiente']);
                    $sheet4->setCellValue('D' . $row, $olimpista['evaluador_nombre'] ?? 'Sin asignar');
                    $sheet4->setCellValue('E' . $row, ucfirst($olimpista['nivel_alerta']));
                    $row++;
                }
                
                foreach (range('A', 'E') as $col) {
                    $sheet4->getColumnDimension($col)->setAutoSize(true);
                }
            }
            
            // Limpiar buffer completamente
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            $filename = 'reporte_progreso_evaluacion_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            // Generar Excel en un archivo temporal con extensión correcta
            $tempDir = sys_get_temp_dir();
            $tempFile = $tempDir . DIRECTORY_SEPARATOR . 'excel_' . uniqid() . '.xlsx';
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);
            
            
            if (!file_exists($tempFile) || filesize($tempFile) == 0) {
                @unlink($tempFile);
                throw new \Exception('Error al generar el archivo Excel');
            }
            
           
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Transfer-Encoding: binary');
            header('Content-Length: ' . filesize($tempFile));
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
            header('Expires: 0');
            
           
            readfile($tempFile);
            
            
            @unlink($tempFile);
            exit;
            
        } catch (\Exception $e) {
            ob_end_clean();
            error_log('Error generando Excel de progreso: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('Error al generar el reporte Excel: ' . $e->getMessage());
        }
    }

   
    private function obtenerDatosProgresoParaReporte($areaId)
    {
        
        
        $sqlNiveles = "
            SELECT 
                nc.nombre as nivel_nombre,
                COUNT(DISTINCT ia.olimpista_id) as total_olimpistas,
                COUNT(DISTINCT CASE WHEN ec.id IS NOT NULL AND ia.estado NOT IN ('desclasificado', 'no_clasificado') THEN ia.olimpista_id END) as evaluados,
                COUNT(CASE WHEN ia.estado = 'clasificado' THEN ia.id END) as clasificados,
                COUNT(CASE 
                    WHEN ia.estado = 'no_clasificado' OR EXISTS (
                        SELECT 1 FROM no_clasificados ncl 
                        WHERE ncl.inscripcion_area_id = ia.id 
                        AND ncl.fase = 'clasificacion'
                    ) THEN ia.id 
                END) as no_clasificados,
                COUNT(CASE 
                    WHEN ia.estado = 'desclasificado' OR EXISTS (
                        SELECT 1 FROM desclasificaciones d 
                        WHERE d.inscripcion_area_id = ia.id 
                        AND d.estado = 'activa'
                    ) THEN ia.id 
                END) as desclasificados,
                COUNT(CASE 
                    WHEN ia.estado NOT IN ('desclasificado', 'no_clasificado', 'clasificado') 
                    AND ec.id IS NULL 
                    AND NOT EXISTS (
                        SELECT 1 FROM desclasificaciones d 
                        WHERE d.inscripcion_area_id = ia.id 
                        AND d.estado = 'activa'
                    ) THEN ia.id 
                END) as pendientes,
                AVG(CASE WHEN ec.id IS NOT NULL AND ia.estado NOT IN ('desclasificado', 'no_clasificado') THEN ec.puntuacion END) as promedio_puntuacion
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
        
        foreach ($niveles as &$nivel) {
            $nivel['total_olimpistas'] = (int)($nivel['total_olimpistas'] ?? 0);
            $nivel['evaluados'] = (int)($nivel['evaluados'] ?? 0);
            $nivel['clasificados'] = (int)($nivel['clasificados'] ?? 0);
            $nivel['no_clasificados'] = (int)($nivel['no_clasificados'] ?? 0);
            $nivel['desclasificados'] = (int)($nivel['desclasificados'] ?? 0);
            $nivel['pendientes'] = (int)($nivel['pendientes'] ?? 0);
            $nivel['promedio_puntuacion'] = (float)($nivel['promedio_puntuacion'] ?? 0);
        }
        unset($nivel);
        
        // Evaluadores
        $sqlEvaluadores = "
            SELECT 
                u.id,
                u.name as nombre,
                u.email,
                u.last_login,
                COUNT(DISTINCT ec.id) as evaluaciones_completadas,
                COUNT(DISTINCT ae.id) as asignaciones_pendientes,
                CASE 
                    WHEN pe.id IS NOT NULL 
                    AND pe.status = 'activo'
                    AND NOW() >= (pe.start_date + COALESCE(pe.start_time, '00:00:00')::time)
                    AND NOW() <= (pe.start_date + (pe.duration_days || ' days')::interval)
                    THEN 'con_permisos'
                    WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'activo_sin_permisos'
                    ELSE 'inactivo'
                END as estado
            FROM evaluadores_areas ea
            JOIN users u ON u.id = ea.user_id
            LEFT JOIN (
                SELECT DISTINCT ON (evaluador_id) 
                    id, evaluador_id, start_date, start_time, duration_days, status
                FROM permisos_evaluadores
                WHERE status = 'activo'
                ORDER BY evaluador_id, start_date DESC, start_time DESC
            ) pe ON pe.evaluador_id = u.id
            LEFT JOIN evaluaciones_clasificacion ec ON ec.evaluador_id = u.id
            LEFT JOIN asignaciones_evaluacion ae ON ae.evaluador_id = u.id
            WHERE ea.is_active = true AND u.is_active = true AND ea.area_competencia_id = ?
            GROUP BY u.id, u.name, u.email, u.last_login, pe.id, pe.start_date, pe.start_time, pe.duration_days, pe.status
            ORDER BY u.last_login DESC NULLS LAST
        ";
        
        $stmtEvaluadores = $this->pdo->prepare($sqlEvaluadores);
        $stmtEvaluadores->execute([$areaId]);
        $evaluadores = $stmtEvaluadores->fetchAll(PDO::FETCH_ASSOC);
        
        
        $sqlSinEvaluar = "
            SELECT 
                ia.id,
                COALESCE(o.nombre_completo, CONCAT(o.nombre, ' ', COALESCE(o.apellido, ''))) as nombre,
                ac.nombre as area,
                nc.nombre as nivel,
                EXTRACT(DAYS FROM NOW() - ia.created_at)::int as dias_pendiente,
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
            WHERE (ia.estado IS NULL OR ia.estado NOT IN ('desclasificado', 'no_clasificado'))
            AND ec.id IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM desclasificaciones d 
                WHERE d.inscripcion_area_id = ia.id 
                AND d.estado = 'activa'
            )
            AND ia.area_competencia_id = ?
            ORDER BY ia.created_at ASC
            LIMIT 100
        ";
        
        $stmtSinEvaluar = $this->pdo->prepare($sqlSinEvaluar);
        $stmtSinEvaluar->execute([$areaId]);
        $olimpistasSinEvaluar = $stmtSinEvaluar->fetchAll(PDO::FETCH_ASSOC);
        

        $sqlTiempo = "
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as dias_promedio_evaluacion,
                MIN(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as tiempo_minimo,
                MAX(EXTRACT(EPOCH FROM (ec.fecha_evaluacion - ia.created_at))/86400) as tiempo_maximo
            FROM inscripciones_areas ia
            JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id
            WHERE ia.area_competencia_id = ?
            AND ec.fecha_evaluacion IS NOT NULL
        ";
        
        $stmtTiempo = $this->pdo->prepare($sqlTiempo);
        $stmtTiempo->execute([$areaId]);
        $tiempoStats = $stmtTiempo->fetch(PDO::FETCH_ASSOC);
        
       
        $totalOlimpistas = (int)array_sum(array_map(function($n) { return (int)($n['total_olimpistas'] ?? 0); }, $niveles));
        $totalEvaluados = (int)array_sum(array_map(function($n) { return (int)($n['evaluados'] ?? 0); }, $niveles));
        $totalClasificados = (int)array_sum(array_map(function($n) { return (int)($n['clasificados'] ?? 0); }, $niveles));
        $totalNoClasificados = (int)array_sum(array_map(function($n) { return (int)($n['no_clasificados'] ?? 0); }, $niveles));
        $totalDesclasificados = (int)array_sum(array_map(function($n) { return (int)($n['desclasificados'] ?? 0); }, $niveles));
        $totalPendientes = (int)array_sum(array_map(function($n) { return (int)($n['pendientes'] ?? 0); }, $niveles));
        $promedioGeneral = $totalOlimpistas > 0 ? round(($totalEvaluados * 100) / $totalOlimpistas, 2) : 0;
        
        return [
            'niveles' => $niveles,
            'evaluadores_lista' => $evaluadores,
            'olimpistas_sin_evaluar' => $olimpistasSinEvaluar,
            'metricas_tiempo' => [
                'dias_promedio_evaluacion' => round($tiempoStats['dias_promedio_evaluacion'] ?? 0, 1),
                'tiempo_minimo' => round($tiempoStats['tiempo_minimo'] ?? 0, 1),
                'tiempo_maximo' => round($tiempoStats['tiempo_maximo'] ?? 0, 1)
            ],
            'estadisticas_generales' => [
                'total_olimpistas' => $totalOlimpistas,
                'total_evaluados' => $totalEvaluados,
                'total_clasificados' => $totalClasificados,
                'total_no_clasificados' => $totalNoClasificados,
                'total_desclasificados' => $totalDesclasificados,
                'total_pendientes' => $totalPendientes,
                'promedio_general' => $promedioGeneral
            ]
        ];
    }

    /**
     * Guardar firma del coordinador
     */
    public function guardarFirma()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['firma_imagen']) || empty($input['firma_imagen'])) {
                Response::error('La imagen de la firma es requerida', 400);
                return;
            }

            $firmaImagen = $input['firma_imagen'];
            $reporteTipo = $input['reporte_tipo'] ?? 'cierre_fase';

            // Validar que sea una imagen base64 válida
            if (!preg_match('/^data:image\/(png|jpeg|jpg);base64,/', $firmaImagen)) {
                Response::error('Formato de imagen inválido. Debe ser PNG o JPEG en base64', 400);
                return;
            }

            
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }

            $areaId = $areaCoordinador['area_id'];

            
            $sqlCheck = "
                SELECT id FROM firmas_coordinadores
                WHERE area_competencia_id = ? AND coordinador_id = ? AND reporte_tipo = ?
            ";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([$areaId, $currentUser['id'], $reporteTipo]);
            $firmaExistente = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($firmaExistente) {
                // Actualizar firma existente
                $sql = "
                    UPDATE firmas_coordinadores
                    SET firma_imagen = ?, fecha_firma = NOW(), updated_at = NOW()
                    WHERE id = ?
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$firmaImagen, $firmaExistente['id']]);
            } else {
                // Insertar nueva firma
                $sql = "
                    INSERT INTO firmas_coordinadores 
                    (area_competencia_id, coordinador_id, firma_imagen, reporte_tipo, fecha_firma)
                    VALUES (?, ?, ?, ?, NOW())
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$areaId, $currentUser['id'], $firmaImagen, $reporteTipo]);
            }

            
            AuditService::log(
                $currentUser['id'],
                $currentUser['name'] ?? $currentUser['email'],
                'FIRMAR_REPORTE',
                'firma_coordinador',
                null,
                "Firma guardada para reporte tipo: {$reporteTipo}",
                null,
                ['area_id' => $areaId, 'reporte_tipo' => $reporteTipo]
            );

            Response::success([
                'mensaje' => 'Firma guardada exitosamente',
                'fecha_firma' => date('Y-m-d H:i:s')
            ], 'Firma guardada correctamente');

        } catch (\Exception $e) {
            error_log('Error guardando firma: ' . $e->getMessage());
            Response::serverError('Error al guardar la firma: ' . $e->getMessage());
        }
    }

    
    public function obtenerFirma()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            $reporteTipo = $_GET['reporte_tipo'] ?? 'cierre_fase';

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }

            $areaId = $areaCoordinador['area_id'];

            
            $sql = "
                SELECT id, firma_imagen, fecha_firma, reporte_tipo
                FROM firmas_coordinadores
                WHERE area_competencia_id = ? AND coordinador_id = ? AND reporte_tipo = ?
                ORDER BY fecha_firma DESC
                LIMIT 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId, $currentUser['id'], $reporteTipo]);
            $firma = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($firma) {
                Response::success([
                    'tiene_firma' => true,
                    'firma_imagen' => $firma['firma_imagen'],
                    'fecha_firma' => $firma['fecha_firma']
                ], 'Firma encontrada');
            } else {
                Response::success([
                    'tiene_firma' => false,
                    'firma_imagen' => null,
                    'fecha_firma' => null
                ], 'No se encontró firma');
            }

        } catch (\Exception $e) {
            error_log('Error obteniendo firma: ' . $e->getMessage());
            Response::serverError('Error al obtener la firma: ' . $e->getMessage());
        }
    }

   
    public function cerrarFaseFinal()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];

            
            $sqlCierreClasificacion = "
                SELECT estado FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND fase = 'clasificacion'
                LIMIT 1
            ";
            $stmtCierreClasificacion = $this->pdo->prepare($sqlCierreClasificacion);
            $stmtCierreClasificacion->execute([$areaId]);
            $cierreClasificacion = $stmtCierreClasificacion->fetch(PDO::FETCH_ASSOC);
            
            if (!$cierreClasificacion || $cierreClasificacion['estado'] !== 'cerrada') {
                Response::validationError(['general' => 'La fase clasificatoria debe estar cerrada antes de cerrar la fase final']);
                return;
            }

            
            $sqlStats = "
                SELECT 
                    COUNT(DISTINCT ia.id) FILTER (WHERE ia.estado = 'clasificado') as total_clasificados,
                    COUNT(DISTINCT ia.id) FILTER (
                        WHERE ia.estado = 'clasificado' 
                        AND EXISTS (SELECT 1 FROM evaluaciones_finales ef WHERE ef.inscripcion_area_id = ia.id)
                    ) as total_evaluados
                FROM inscripciones_areas ia
                WHERE ia.area_competencia_id = ?
            ";
            
            $stmtStats = $this->pdo->prepare($sqlStats);
            $stmtStats->execute([$areaId]);
            $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
            
            $totalClasificados = (int)$stats['total_clasificados'];
            $totalEvaluados = (int)$stats['total_evaluados'];
            
            if ($totalClasificados == 0) {
                Response::validationError(['general' => 'No hay participantes clasificados en esta área']);
                return;
            }
            
            if ($totalEvaluados < $totalClasificados) {
                $pendientes = $totalClasificados - $totalEvaluados;
                Response::validationError(['general' => "Faltan {$pendientes} evaluaciones por completar. Todos los participantes clasificados deben ser evaluados."]);
                return;
            }

            
            $medalleroModel = new ConfiguracionMedallero();
            $configMedallero = $medalleroModel->getByAreaAndLevel($areaId, null);
            
            
            if (!$configMedallero) {
                $sqlConfigNiveles = "
                    SELECT COUNT(*) as total
                    FROM configuracion_medallero
                    WHERE area_competencia_id = ?
                    AND nivel_competencia_id IS NOT NULL
                ";
                $stmtConfigNiveles = $this->pdo->prepare($sqlConfigNiveles);
                $stmtConfigNiveles->execute([$areaId]);
                $configNiveles = $stmtConfigNiveles->fetch(PDO::FETCH_ASSOC);
                
                if (!$configNiveles || (int)$configNiveles['total'] == 0) {
                    Response::validationError(['general' => 'No existe configuración de medallero para esta área. Debe configurarla antes de cerrar la fase final. Puede configurarla en: Admin > Configuración > Medallero']);
                    return;
                }
                
               
                $sqlPrimeraConfig = "
                    SELECT *
                    FROM configuracion_medallero
                    WHERE area_competencia_id = ?
                    AND nivel_competencia_id IS NOT NULL
                    LIMIT 1
                ";
                $stmtPrimeraConfig = $this->pdo->prepare($sqlPrimeraConfig);
                $stmtPrimeraConfig->execute([$areaId]);
                $configMedallero = $stmtPrimeraConfig->fetch(PDO::FETCH_ASSOC);
            }

            
            $sqlVerificarMedallas = "
                SELECT COUNT(*) as total_con_medalla
                FROM inscripciones_areas
                WHERE area_competencia_id = ? 
                AND medalla_asignada IN ('oro', 'plata', 'bronce', 'mencion_honor')
            ";
            $stmtVerificarMedallas = $this->pdo->prepare($sqlVerificarMedallas);
            $stmtVerificarMedallas->execute([$areaId]);
            $verificarMedallas = $stmtVerificarMedallas->fetch(PDO::FETCH_ASSOC);
            
            
            if ($verificarMedallas && (int)$verificarMedallas['total_con_medalla'] > 0) {
               
                $sqlCierreReciente = "
                    SELECT MAX(fecha_cierre) as ultimo_cierre
                    FROM cierre_fase_areas
                    WHERE area_competencia_id = ? 
                    AND nivel_competencia_id IS NULL
                    AND fase = 'final'
                    AND estado = 'cerrada'
                    AND fecha_cierre > NOW() - INTERVAL '24 hours'
                ";
                $stmtCierreReciente = $this->pdo->prepare($sqlCierreReciente);
                $stmtCierreReciente->execute([$areaId]);
                $cierreReciente = $stmtCierreReciente->fetch(PDO::FETCH_ASSOC);
                
                if ($cierreReciente && $cierreReciente['ultimo_cierre']) {
                    Response::validationError(['general' => 'La fase final de esta área ya está cerrada']);
                    return;
                }
            }

            
            $medallasAsignadas = $this->calcularMedallasFaseFinal($areaId, $configMedallero);
            
            
            $sqlUpdate = "
                INSERT INTO cierre_fase_areas (
                    area_competencia_id, nivel_competencia_id, fase, estado,
                    porcentaje_completitud, cantidad_clasificados, 
                    fecha_cierre, coordinador_id, updated_at
                ) VALUES (?, NULL, 'final', 'cerrada', 100, ?, NOW(), ?, NOW())
                ON CONFLICT (area_competencia_id, nivel_competencia_id, fase) 
                DO UPDATE SET 
                    estado = 'cerrada',
                    porcentaje_completitud = 100,
                    cantidad_clasificados = EXCLUDED.cantidad_clasificados,
                    fecha_cierre = NOW(),
                    coordinador_id = EXCLUDED.coordinador_id,
                    updated_at = NOW()
                RETURNING *
            ";
            
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([$areaId, $totalEvaluados, $currentUser['id']]);
            $cierreActualizado = $stmtUpdate->fetch(PDO::FETCH_ASSOC);

            
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['name'] ?? $currentUser['email'],
                $areaId,
                null,
                [
                    'fase' => 'final',
                    'total_clasificados' => $totalClasificados,
                    'total_evaluados' => $totalEvaluados,
                    'medallas_asignadas' => $medallasAsignadas,
                    'fecha_cierre' => $cierreActualizado['fecha_cierre']
                ]
            );

            
            $responseData = [
                'area_id' => $areaId,
                'area_nombre' => $areaNombre,
                'total_clasificados' => $totalClasificados,
                'total_evaluados' => $totalEvaluados,
                'medallas_asignadas' => $medallasAsignadas,
                'fecha_cierre' => $cierreActualizado['fecha_cierre']
            ];

            
            while (ob_get_level()) {
                ob_end_clean();
            }

            
            $responseJson = json_encode([
                'success' => true,
                'message' => 'Fase final cerrada exitosamente. Los reportes se están generando en segundo plano.',
                'data' => $responseData,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            
            http_response_code(200);
            header('Content-Type: application/json; charset=utf-8');
            header('Content-Length: ' . strlen($responseJson));
            echo $responseJson;
            
            
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            } else {
                if (ob_get_level()) {
                    ob_end_flush();
                }
                flush();
            }

          
            set_time_limit(300);
            ignore_user_abort(true);
            
            try {
                $this->generarReportePDFCierreFaseFinal($areaId, $areaNombre, $totalClasificados, $totalEvaluados, $medallasAsignadas, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando PDF de cierre de fase final: ' . $e->getMessage());
            }

            try {
                $this->generarReporteExcelParticipantesFaseFinal($areaId, $areaNombre, $medallasAsignadas, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando Excel de participantes fase final: ' . $e->getMessage());
            }

            try {
                $this->generarReportePDFEstadisticasFaseFinal($areaId, $areaNombre, $medallasAsignadas, $cierreActualizado['fecha_cierre'], $currentUser);
            } catch (\Exception $e) {
                error_log('Error generando PDF de estadísticas fase final: ' . $e->getMessage());
            }
            
            exit();

        } catch (\Exception $e) {
            error_log('Error cerrando fase final: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            Response::serverError('No se pudo cerrar la fase final: ' . $e->getMessage());
        }
    }

   
    private function calcularMedallasFaseFinal($areaId, $configMedallero)
    {
        $medallasAsignadas = [
            'oro' => 0,
            'plata' => 0,
            'bronce' => 0,
            'mencion_honor' => 0,
            'sin_medalla' => 0
        ];

       
        $sql = "
            SELECT 
                ia.id as inscripcion_area_id,
                ia.nivel_competencia_id,
                o.grado_escolaridad,
                AVG(ef.puntuacion) as puntuacion_promedio,
                COUNT(ef.id) as num_evaluaciones
            FROM inscripciones_areas ia
            JOIN olimpistas o ON o.id = ia.olimpista_id
            LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
            WHERE ia.area_competencia_id = ? 
            AND ia.estado = 'clasificado'
            GROUP BY ia.id, ia.nivel_competencia_id, o.grado_escolaridad
            HAVING COUNT(ef.id) > 0
            ORDER BY o.grado_escolaridad, puntuacion_promedio DESC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$areaId]);
        $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

       
        $participantesPorGrado = [];
        foreach ($participantes as $participante) {
            $grado = $participante['grado_escolaridad'] ?? 'sin_grado';
            if (!isset($participantesPorGrado[$grado])) {
                $participantesPorGrado[$grado] = [];
            }
            $participantesPorGrado[$grado][] = $participante;
        }

        $medalleroModel = new ConfiguracionMedallero();

        
        foreach ($participantesPorGrado as $grado => $participantesGrado) {
            
            $nivelId = !empty($participantesGrado) ? $participantesGrado[0]['nivel_competencia_id'] : null;
            $configGrado = $medalleroModel->getByAreaAndLevel($areaId, $nivelId, $grado);
          
            if (!$configGrado) {
                $configGrado = $configMedallero;
            }

            $oroMax = (int)($configGrado['oro'] ?? 0);
            $plataMax = (int)($configGrado['plata'] ?? 0);
            $bronceMax = (int)($configGrado['bronce'] ?? 0);
            $mencionMax = (int)($configGrado['mencion_honor'] ?? 0);

            $oroMin = (float)($configGrado['oro_min'] ?? 0);
            $oroMaxPunt = (float)($configGrado['oro_max'] ?? 100);
            $plataMin = (float)($configGrado['plata_min'] ?? 0);
            $plataMaxPunt = (float)($configGrado['plata_max'] ?? 100);
            $bronceMin = (float)($configGrado['bronce_min'] ?? 0);
            $bronceMaxPunt = (float)($configGrado['bronce_max'] ?? 100);

            $contadorOro = 0;
            $contadorPlata = 0;
            $contadorBronce = 0;
            $contadorMencion = 0;

            
            usort($participantesGrado, function($a, $b) {
                return $b['puntuacion_promedio'] <=> $a['puntuacion_promedio'];
            });

            foreach ($participantesGrado as $participante) {
                $puntuacion = (float)$participante['puntuacion_promedio'];
                $inscripcionId = $participante['inscripcion_area_id'];
                $medalla = null;

               
                if ($contadorOro < $oroMax && $puntuacion >= $oroMin && $puntuacion <= $oroMaxPunt) {
                    $medalla = 'oro';
                    $contadorOro++;
                } elseif ($contadorPlata < $plataMax && $puntuacion >= $plataMin && $puntuacion <= $plataMaxPunt) {
                    $medalla = 'plata';
                    $contadorPlata++;
                } elseif ($contadorBronce < $bronceMax && $puntuacion >= $bronceMin && $puntuacion <= $bronceMaxPunt) {
                    $medalla = 'bronce';
                    $contadorBronce++;
                } elseif ($contadorMencion < $mencionMax) {
                   
                    $medalla = 'mencion_honor';
                    $contadorMencion++;
                } else {
                    $medalla = null; 
                }

                
                $sqlUpdate = "
                    UPDATE inscripciones_areas 
                    SET medalla_asignada = ?,
                        estado = 'clasificado'
                    WHERE id = ?
                ";
                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([$medalla, $inscripcionId]);

               
                if ($medalla) {
                    $medallasAsignadas[$medalla]++;
                } else {
                    $medallasAsignadas['sin_medalla']++;
                }
            }
        }

        return $medallasAsignadas;
    }

    
    private function obtenerDatosFaseFinal($areaId)
    {
        error_log("obtenerDatosFaseFinal: Iniciando para área {$areaId}");
        
       
        $sqlTodosCierres = "
            SELECT area_competencia_id, nivel_competencia_id, fase, estado, fecha_cierre
            FROM cierre_fase_areas
            WHERE area_competencia_id = ?
            ORDER BY fecha_cierre DESC
        ";
        $stmtTodosCierres = $this->pdo->prepare($sqlTodosCierres);
        $stmtTodosCierres->execute([$areaId]);
        $todosCierres = $stmtTodosCierres->fetchAll(PDO::FETCH_ASSOC);
        error_log("obtenerDatosFaseFinal: Todos los registros de cierre para área {$areaId}: " . json_encode($todosCierres));
        
        
        $sqlCierre = "
            SELECT fecha_cierre, estado
            FROM cierre_fase_areas
            WHERE area_competencia_id = ? 
            AND nivel_competencia_id IS NULL
            AND fase = 'final'
            AND estado = 'cerrada'
            AND fecha_cierre IS NOT NULL
            ORDER BY fecha_cierre DESC
            LIMIT 1
        ";
        $stmtCierre = $this->pdo->prepare($sqlCierre);
        $stmtCierre->execute([$areaId]);
        $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);
        
        
        if (!$cierre) {
            $sqlCierre2 = "
                SELECT fecha_cierre, estado
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? 
                AND nivel_competencia_id IS NULL
                AND estado = 'cerrada'
                ORDER BY updated_at DESC, fecha_cierre DESC NULLS LAST
                LIMIT 1
            ";
            $stmtCierre2 = $this->pdo->prepare($sqlCierre2);
            $stmtCierre2->execute([$areaId]);
            $cierre = $stmtCierre2->fetch(PDO::FETCH_ASSOC);
        }
        
       
        $sqlVerificarMedallas = "
            SELECT COUNT(*) as total_con_medalla
            FROM inscripciones_areas
            WHERE area_competencia_id = ? 
            AND estado IN ('oro', 'plata', 'bronce', 'mencion_honor')
        ";
        $stmtVerificarMedallas = $this->pdo->prepare($sqlVerificarMedallas);
        $stmtVerificarMedallas->execute([$areaId]);
        $verificarMedallas = $stmtVerificarMedallas->fetch(PDO::FETCH_ASSOC);
        $tieneMedallas = $verificarMedallas && (int)$verificarMedallas['total_con_medalla'] > 0;
        
       
        $sqlTodosEstados = "
            SELECT estado, COUNT(*) as cantidad
            FROM inscripciones_areas
            WHERE area_competencia_id = ?
            GROUP BY estado
        ";
        $stmtTodosEstados = $this->pdo->prepare($sqlTodosEstados);
        $stmtTodosEstados->execute([$areaId]);
        $todosEstados = $stmtTodosEstados->fetchAll(PDO::FETCH_ASSOC);
        error_log("obtenerDatosFaseFinal: Estados de inscripciones para área {$areaId}: " . json_encode($todosEstados));
        
        error_log("obtenerDatosFaseFinal: Registro de cierre encontrado: " . ($cierre ? 'Sí (' . json_encode($cierre) . ')' : 'No'));
        error_log("obtenerDatosFaseFinal: Tiene medallas asignadas: " . ($tieneMedallas ? 'Sí (' . $verificarMedallas['total_con_medalla'] . ')' : 'No'));
        
       
        if (!$cierre && !$tieneMedallas) {
            error_log("obtenerDatosFaseFinal: No hay registro de cierre ni medallas, retornando null");
            return null;
        }
        
       
        if (!$cierre && $tieneMedallas) {
            error_log("obtenerDatosFaseFinal: Hay medallas pero no registro de cierre, usando fecha actual");
            $cierre = ['fecha_cierre' => date('Y-m-d H:i:s'), 'estado' => 'cerrada'];
        }
        
       
        if ($cierre && $cierre['estado'] === 'cerrada' && !$tieneMedallas) {
            error_log("obtenerDatosFaseFinal: Hay registro de cierre cerrada pero no hay medallas, intentando regenerar medallas...");
            try {
                $medalleroModel = new ConfiguracionMedallero();
                $configMedallero = $medalleroModel->getByAreaAndLevel($areaId, null);
                
                if ($configMedallero) {
                    
                    $medallasAsignadas = $this->calcularMedallasFaseFinal($areaId, $configMedallero);
                    error_log("obtenerDatosFaseFinal: Medallas regeneradas: " . json_encode($medallasAsignadas));
                    $tieneMedallas = array_sum($medallasAsignadas) > 0;
                } else {
                    error_log("obtenerDatosFaseFinal: No se encontró configuración de medallero para regenerar medallas");
                }
            } catch (\Exception $e) {
                error_log("obtenerDatosFaseFinal: Error al regenerar medallas: " . $e->getMessage());
            }
        }
        
       
        $sqlStats = "
            SELECT 
                COUNT(DISTINCT ia.id) FILTER (
                    WHERE EXISTS (SELECT 1 FROM evaluaciones_finales ef WHERE ef.inscripcion_area_id = ia.id)
                    AND ia.estado = 'clasificado'
                ) as total_clasificados,
                COUNT(DISTINCT ia.id) FILTER (
                    WHERE EXISTS (SELECT 1 FROM evaluaciones_finales ef WHERE ef.inscripcion_area_id = ia.id)
                ) as total_evaluados
            FROM inscripciones_areas ia
            WHERE ia.area_competencia_id = ?
        ";
        $stmtStats = $this->pdo->prepare($sqlStats);
        $stmtStats->execute([$areaId]);
        $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
        
        $totalClasificados = (int)$stats['total_clasificados'];
        $totalEvaluados = (int)$stats['total_evaluados'];
        
        error_log("obtenerDatosFaseFinal: total_clasificados={$totalClasificados}, total_evaluados={$totalEvaluados}");
        
        
        $sqlMedallas = "
            SELECT 
                COUNT(*) FILTER (WHERE medalla_asignada = 'oro') as oro,
                COUNT(*) FILTER (WHERE medalla_asignada = 'plata') as plata,
                COUNT(*) FILTER (WHERE medalla_asignada = 'bronce') as bronce,
                COUNT(*) FILTER (WHERE medalla_asignada = 'mencion_honor') as mencion_honor,
                COUNT(*) FILTER (WHERE medalla_asignada IS NULL AND estado = 'clasificado') as sin_medalla
            FROM inscripciones_areas
            WHERE area_competencia_id = ? 
            AND estado = 'clasificado'
        ";
        $stmtMedallas = $this->pdo->prepare($sqlMedallas);
        $stmtMedallas->execute([$areaId]);
        $medallasData = $stmtMedallas->fetch(PDO::FETCH_ASSOC);
        
        $medallasAsignadas = [
            'oro' => (int)($medallasData['oro'] ?? 0),
            'plata' => (int)($medallasData['plata'] ?? 0),
            'bronce' => (int)($medallasData['bronce'] ?? 0),
            'mencion_honor' => (int)($medallasData['mencion_honor'] ?? 0),
            'sin_medalla' => (int)($medallasData['sin_medalla'] ?? 0)
        ];
        
        error_log("obtenerDatosFaseFinal: medallas_asignadas=" . json_encode($medallasAsignadas));
        
        $resultado = [
            'total_clasificados' => $totalClasificados,
            'total_evaluados' => $totalEvaluados,
            'medallas_asignadas' => $medallasAsignadas,
            'fecha_cierre' => $cierre['fecha_cierre']
        ];
        
        error_log("obtenerDatosFaseFinal: Retornando datos exitosamente");
        return $resultado;
    }

    
    private function generarReportePDFCierreFaseFinal($areaId, $areaNombre, $totalClasificados, $totalEvaluados, $medallasAsignadas, $fechaCierre, $coordinador)
    {
        try {
            require_once __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
            
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            $pdf->SetCreator('ForwardSoft - Sistema de Olimpiadas');
            $pdf->SetAuthor('Sistema de Olimpiadas');
            $pdf->SetTitle('Reporte de Cierre de Fase Final - ' . $areaNombre);
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            $nombreOlimpiada = $config['nombre'] ?? 'Olimpiada Oh! SanSi';
            $añoOlimpiada = date('Y', strtotime($config['fecha_inicio'] ?? 'now'));
            
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 18);
            $pdf->Cell(0, 10, 'REPORTE OFICIAL DE FASE FINAL', 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, $nombreOlimpiada . ' ' . $añoOlimpiada, 0, 1, 'C');
            $pdf->SetFont('helvetica', '', 12);
            $pdf->Cell(0, 6, 'Área: ' . $areaNombre, 0, 1, 'C');
            $pdf->Cell(0, 6, 'Fecha de cierre: ' . date('d/m/Y H:i:s', strtotime($fechaCierre)), 0, 1, 'C');
            $pdf->Ln(3);
            
            // Información del coordinador
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Coordinador: ' . ($coordinador['name'] ?? $coordinador['email']), 0, 1, 'C');
            if (isset($coordinador['role'])) {
                $pdf->Cell(0, 6, 'Cargo: Coordinador de Área', 0, 1, 'C');
            }
            $pdf->Ln(5);
            
            // Estadísticas generales
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'ESTADÍSTICAS GENERALES', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(100, 6, 'Total de participantes clasificados:', 0, 0, 'L');
            $pdf->Cell(0, 6, $totalClasificados, 0, 1, 'L');
            $pdf->Cell(100, 6, 'Total de participantes evaluados:', 0, 0, 'L');
            $pdf->Cell(0, 6, $totalEvaluados, 0, 1, 'L');
            $pdf->Cell(100, 6, 'Total de participantes premiados:', 0, 0, 'L');
            $totalPremiados = ($medallasAsignadas['oro'] ?? 0) + ($medallasAsignadas['plata'] ?? 0) + ($medallasAsignadas['bronce'] ?? 0) + ($medallasAsignadas['mencion_honor'] ?? 0);
            $pdf->Cell(0, 6, $totalPremiados, 0, 1, 'L');
            $pdf->Ln(3);
            
            // Distribución de medallas
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'DISTRIBUCIÓN DE MEDALLAS', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(100, 6, 'Medallas de Oro:', 0, 0, 'L');
            $pdf->Cell(0, 6, $medallasAsignadas['oro'] ?? 0, 0, 1, 'L');
            $pdf->Cell(100, 6, 'Medallas de Plata:', 0, 0, 'L');
            $pdf->Cell(0, 6, $medallasAsignadas['plata'] ?? 0, 0, 1, 'L');
            $pdf->Cell(100, 6, 'Medallas de Bronce:', 0, 0, 'L');
            $pdf->Cell(0, 6, $medallasAsignadas['bronce'] ?? 0, 0, 1, 'L');
            $pdf->Cell(100, 6, 'Menciones de Honor:', 0, 0, 'L');
            $pdf->Cell(0, 6, ($medallasAsignadas['mencion_honor'] ?? 0) + ($medallasAsignadas['sin_medalla'] ?? 0), 0, 1, 'L');
            $pdf->Ln(5);
            
            // Criterios aplicados (Configuración de medallero)
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'CRITERIOS APLICADOS', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            
            try {
                $medalleroModel = new ConfiguracionMedallero();
                
                
                $configMedallero = $medalleroModel->getByAreaAndLevel($areaId, null);
                
                
                $sqlConfigGrados = "
                    SELECT DISTINCT o.grado_escolaridad
                    FROM inscripciones_areas ia
                    JOIN olimpistas o ON o.id = ia.olimpista_id
                    WHERE ia.area_competencia_id = ?
                    AND EXISTS (SELECT 1 FROM evaluaciones_finales ef WHERE ef.inscripcion_area_id = ia.id)
                    AND o.grado_escolaridad IS NOT NULL
                ";
                $stmtGrados = $this->pdo->prepare($sqlConfigGrados);
                $stmtGrados->execute([$areaId]);
                $grados = $stmtGrados->fetchAll(PDO::FETCH_COLUMN);
                
                if ($configMedallero) {
                    $pdf->Cell(0, 6, 'Configuración de Medallero Aplicada:', 0, 1, 'L');
                    $pdf->SetFont('helvetica', '', 9);
                    
                    
                    if (count($grados) == 0 || !$medalleroModel->getByAreaAndLevel($areaId, null, $grados[0] ?? null)) {
                        $pdf->Cell(0, 5, 'Configuración General del Área:', 0, 1, 'L');
                        $pdf->SetFont('helvetica', 'B', 8);
                        $pdf->Cell(0, 4, 'Medallas de Oro: Máximo ' . ($configMedallero['oro'] ?? 0) . ' medallas', 0, 1, 'L');
                        if (isset($configMedallero['oro_min']) && isset($configMedallero['oro_max'])) {
                            $pdf->SetFont('helvetica', '', 8);
                            $pdf->Cell(0, 4, '  Rango: ' . number_format($configMedallero['oro_min'], 2) . ' - ' . number_format($configMedallero['oro_max'], 2), 0, 1, 'L');
                        }
                        $pdf->SetFont('helvetica', 'B', 8);
                        $pdf->Cell(0, 4, 'Medallas de Plata: Máximo ' . ($configMedallero['plata'] ?? 0) . ' medallas', 0, 1, 'L');
                        if (isset($configMedallero['plata_min']) && isset($configMedallero['plata_max'])) {
                            $pdf->SetFont('helvetica', '', 8);
                            $pdf->Cell(0, 4, '  Rango: ' . number_format($configMedallero['plata_min'], 2) . ' - ' . number_format($configMedallero['plata_max'], 2), 0, 1, 'L');
                        }
                        $pdf->SetFont('helvetica', 'B', 8);
                        $pdf->Cell(0, 4, 'Medallas de Bronce: Máximo ' . ($configMedallero['bronce'] ?? 0) . ' medallas', 0, 1, 'L');
                        if (isset($configMedallero['bronce_min']) && isset($configMedallero['bronce_max'])) {
                            $pdf->SetFont('helvetica', '', 8);
                            $pdf->Cell(0, 4, '  Rango: ' . number_format($configMedallero['bronce_min'], 2) . ' - ' . number_format($configMedallero['bronce_max'], 2), 0, 1, 'L');
                        }
                        $pdf->SetFont('helvetica', 'B', 8);
                        $pdf->Cell(0, 4, 'Menciones de Honor: Máximo ' . ($configMedallero['mencion_honor'] ?? 0) . ' menciones', 0, 1, 'L');
                    }
                    
                    
                    foreach ($grados as $grado) {
                        $configGrado = $medalleroModel->getByAreaAndLevel($areaId, null, $grado);
                        if ($configGrado && $configGrado !== $configMedallero) {
                            $pdf->SetFont('helvetica', 'B', 9);
                            $pdf->Cell(0, 5, 'Configuración para Grado ' . $grado . ':', 0, 1, 'L');
                            $pdf->SetFont('helvetica', 'B', 8);
                            $pdf->Cell(0, 4, '  Oro: Máx. ' . ($configGrado['oro'] ?? 0) . ' | Rango: ' . number_format($configGrado['oro_min'] ?? 0, 2) . '-' . number_format($configGrado['oro_max'] ?? 100, 2), 0, 1, 'L');
                            $pdf->Cell(0, 4, '  Plata: Máx. ' . ($configGrado['plata'] ?? 0) . ' | Rango: ' . number_format($configGrado['plata_min'] ?? 0, 2) . '-' . number_format($configGrado['plata_max'] ?? 100, 2), 0, 1, 'L');
                            $pdf->Cell(0, 4, '  Bronce: Máx. ' . ($configGrado['bronce'] ?? 0) . ' | Rango: ' . number_format($configGrado['bronce_min'] ?? 0, 2) . '-' . number_format($configGrado['bronce_max'] ?? 100, 2), 0, 1, 'L');
                            $pdf->Cell(0, 4, '  Mención Honor: Máx. ' . ($configGrado['mencion_honor'] ?? 0), 0, 1, 'L');
                        }
                    }
                } else {
                    $pdf->Cell(0, 6, 'No se encontró configuración de medallero. Las medallas se asignaron según criterios por defecto.', 0, 1, 'L');
                }
            } catch (\Exception $e) {
                error_log('Error obteniendo configuración de medallero para PDF: ' . $e->getMessage());
                $pdf->Cell(0, 6, 'Error al obtener configuración de medallero.', 0, 1, 'L');
            }
            
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Ln(5);
            
            
            $tiposMedalla = ['oro', 'plata', 'bronce', 'mencion_honor'];
            foreach ($tiposMedalla as $tipoMedalla) {
                // Para mención de honor, mostrar solo los que no recibieron ninguna medalla (medalla_asignada IS NULL)
                if ($tipoMedalla === 'mencion_honor') {
                    $sql = "
                        SELECT 
                            o.nombre_completo,
                            o.documento_identidad,
                            ue.nombre as unidad_educativa,
                            nc.nombre as nivel_nombre,
                            o.grado_escolaridad,
                            COALESCE(AVG(ef.puntuacion), 0) as puntuacion_promedio,
                            COUNT(ef.id) as num_evaluaciones
                        FROM inscripciones_areas ia
                        JOIN olimpistas o ON o.id = ia.olimpista_id
                        LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                        LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                        WHERE ia.area_competencia_id = ? 
                        AND ia.medalla_asignada IS NULL
                        AND ia.estado = 'clasificado'
                        AND EXISTS (SELECT 1 FROM evaluaciones_finales ef2 WHERE ef2.inscripcion_area_id = ia.id)
                        GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad
                        ORDER BY puntuacion_promedio DESC
                    ";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([$areaId]);
                } else {
                    $sql = "
                        SELECT 
                            o.nombre_completo,
                            o.documento_identidad,
                            ue.nombre as unidad_educativa,
                            nc.nombre as nivel_nombre,
                            o.grado_escolaridad,
                            AVG(ef.puntuacion) as puntuacion_promedio,
                            COUNT(ef.id) as num_evaluaciones
                        FROM inscripciones_areas ia
                        JOIN olimpistas o ON o.id = ia.olimpista_id
                        LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                        LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                        WHERE ia.area_competencia_id = ? 
                        AND ia.medalla_asignada = ?
                        AND ia.estado = 'clasificado'
                        GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad
                        ORDER BY puntuacion_promedio DESC
                    ";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([$areaId, $tipoMedalla]);
                }
                $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($participantes)) {
                    $pdf->AddPage();
                    $pdf->SetFont('helvetica', 'B', 14);
                    $tituloSeccion = ($tipoMedalla === 'mencion_honor') 
                        ? 'MENCIÓN DE HONOR' 
                        : 'MEDALLA DE ' . strtoupper($tipoMedalla);
                    $pdf->Cell(0, 8, $tituloSeccion, 0, 1, 'C');
                    $pdf->Ln(3);
                    
                    $pdf->SetFont('helvetica', 'B', 10);
                    $pdf->SetFillColor(230, 230, 230);
                    $pdf->Cell(60, 7, 'Nombre', 1, 0, 'C', true);
                    $pdf->Cell(40, 7, 'Documento', 1, 0, 'C', true);
                    $pdf->Cell(50, 7, 'Unidad Educativa', 1, 0, 'C', true);
                    $pdf->Cell(40, 7, 'Puntuación', 1, 1, 'C', true);
                    $pdf->SetFont('helvetica', '', 9);
                    $pdf->SetFillColor(255, 255, 255);
                    
                    foreach ($participantes as $participante) {
                        $pdf->Cell(60, 6, substr($participante['nombre_completo'], 0, 30), 1, 0, 'L');
                        $pdf->Cell(40, 6, $participante['documento_identidad'], 1, 0, 'C');
                        $pdf->Cell(50, 6, substr($participante['unidad_educativa'] ?? 'N/A', 0, 25), 1, 0, 'L');
                        $pdf->Cell(40, 6, number_format($participante['puntuacion_promedio'], 2), 1, 1, 'C');
                    }
                }
            }
            
            
            $sqlTodos = "
                SELECT 
                    o.nombre_completo,
                    o.documento_identidad,
                    ue.nombre as unidad_educativa,
                    nc.nombre as nivel_nombre,
                    o.grado_escolaridad,
                    AVG(ef.puntuacion) as puntuacion_promedio,
                    COUNT(ef.id) as num_evaluaciones,
                    COALESCE(ia.medalla_asignada, 'sin_medalla') as medalla
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ? 
                AND EXISTS (SELECT 1 FROM evaluaciones_finales ef2 WHERE ef2.inscripcion_area_id = ia.id)
                AND ia.estado = 'clasificado'
                GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad, ia.medalla_asignada
                ORDER BY puntuacion_promedio DESC
            ";
            $stmtTodos = $this->pdo->prepare($sqlTodos);
            $stmtTodos->execute([$areaId]);
            $todosParticipantes = $stmtTodos->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($todosParticipantes)) {
                $pdf->AddPage();
                $pdf->SetFont('helvetica', 'B', 14);
                $pdf->Cell(0, 8, 'RANKING COMPLETO DE PARTICIPANTES', 0, 1, 'C');
                $pdf->Ln(3);
                
                $pdf->SetFont('helvetica', 'B', 9);
                $pdf->SetFillColor(230, 230, 230);
                $pdf->Cell(10, 7, 'Pos', 1, 0, 'C', true);
                $pdf->Cell(50, 7, 'Nombre', 1, 0, 'C', true);
                $pdf->Cell(35, 7, 'Documento', 1, 0, 'C', true);
                $pdf->Cell(40, 7, 'Unidad Educativa', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Puntuación', 1, 0, 'C', true);
                $pdf->Cell(25, 7, 'Medalla', 1, 1, 'C', true);
                $pdf->SetFont('helvetica', '', 8);
                $pdf->SetFillColor(255, 255, 255);
                
                $posicion = 1;
                foreach ($todosParticipantes as $participante) {
                    $medallaTexto = ($participante['medalla'] && $participante['medalla'] !== 'sin_medalla') 
                        ? ucfirst(str_replace('_', ' ', $participante['medalla'])) 
                        : 'Mención de Honor';
                    $pdf->Cell(10, 6, $posicion, 1, 0, 'C');
                    $pdf->Cell(50, 6, substr($participante['nombre_completo'], 0, 28), 1, 0, 'L');
                    $pdf->Cell(35, 6, $participante['documento_identidad'], 1, 0, 'C');
                    $pdf->Cell(40, 6, substr($participante['unidad_educativa'] ?? 'N/A', 0, 22), 1, 0, 'L');
                    $pdf->Cell(30, 6, number_format($participante['puntuacion_promedio'], 2), 1, 0, 'C');
                    $pdf->Cell(25, 6, $medallaTexto, 1, 1, 'C');
                    $posicion++;
                }
            }
            
            
            $pdf->AddPage();
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 6, 'Generado por: ' . ($coordinador['name'] ?? $coordinador['email']), 0, 1, 'L');
            $pdf->Ln(10);
            $pdf->Line($pdf->GetX(), $pdf->GetY(), $pdf->GetX() + 60, $pdf->GetY());
            $pdf->SetFont('helvetica', 'I', 8);
            $pdf->Cell(60, 4, 'Firma y sello', 0, 1, 'L');
            
            // Guardar archivo
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            
            $filename = 'reporte_cierre_fase_final_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $filepath = $uploadsDir . $filename;
            $pdf->Output($filepath, 'F');
            
            error_log("PDF de fase final generado exitosamente: {$filepath}");
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando PDF de fase final: ' . $e->getMessage());
            throw $e;
        }
    }

   
    private function generarReporteExcelParticipantesFaseFinal($areaId, $areaNombre, $medallasAsignadas, $fechaCierre, $coordinador)
    {
        try {
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
            if (file_exists($autoloadPath) && !class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
                require_once $autoloadPath;
            }
            
            $spreadsheet = new Spreadsheet();
            
            // Hoja 1: Resumen General
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Resumen General');
            $sheet->setCellValue('A1', 'REPORTE DE PARTICIPANTES - FASE FINAL');
            $sheet->mergeCells('A1:F1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            $sheet->setCellValue('A2', 'Área: ' . $areaNombre);
            $sheet->mergeCells('A2:F2');
            $sheet->setCellValue('A3', 'Fecha de cierre: ' . date('d/m/Y H:i:s', strtotime($fechaCierre)));
            $sheet->mergeCells('A3:F3');
            
            $sheet->setCellValue('A5', 'Distribución de Medallas:');
            $sheet->setCellValue('A6', 'Medallas de Oro:');
            $sheet->setCellValue('B6', $medallasAsignadas['oro'] ?? 0);
            $sheet->setCellValue('A7', 'Medallas de Plata:');
            $sheet->setCellValue('B7', $medallasAsignadas['plata'] ?? 0);
            $sheet->setCellValue('A8', 'Medallas de Bronce:');
            $sheet->setCellValue('B8', $medallasAsignadas['bronce'] ?? 0);
            $sheet->setCellValue('A9', 'Menciones de Honor:');
            $sheet->setCellValue('B9', ($medallasAsignadas['mencion_honor'] ?? 0) + ($medallasAsignadas['sin_medalla'] ?? 0));
            
            // Criterios aplicados (Configuración de medallero)
            $row = 12;
            $sheet->setCellValue('A' . $row, 'Criterios Aplicados (Configuración de Medallero):');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $row++;
            
            try {
                $medalleroModel = new ConfiguracionMedallero();
                $configMedallero = $medalleroModel->getByAreaAndLevel($areaId, null);
                
                if ($configMedallero) {
                    $sheet->setCellValue('A' . $row, 'Configuración General:');
                    $sheet->getStyle('A' . $row)->getFont()->setBold(true);
                    $row++;
                    $sheet->setCellValue('A' . $row, 'Medallas de Oro:');
                    $sheet->setCellValue('B' . $row, 'Máximo ' . ($configMedallero['oro'] ?? 0));
                    if (isset($configMedallero['oro_min']) && isset($configMedallero['oro_max'])) {
                        $sheet->setCellValue('C' . $row, 'Rango: ' . number_format($configMedallero['oro_min'], 2) . ' - ' . number_format($configMedallero['oro_max'], 2));
                    }
                    $row++;
                    $sheet->setCellValue('A' . $row, 'Medallas de Plata:');
                    $sheet->setCellValue('B' . $row, 'Máximo ' . ($configMedallero['plata'] ?? 0));
                    if (isset($configMedallero['plata_min']) && isset($configMedallero['plata_max'])) {
                        $sheet->setCellValue('C' . $row, 'Rango: ' . number_format($configMedallero['plata_min'], 2) . ' - ' . number_format($configMedallero['plata_max'], 2));
                    }
                    $row++;
                    $sheet->setCellValue('A' . $row, 'Medallas de Bronce:');
                    $sheet->setCellValue('B' . $row, 'Máximo ' . ($configMedallero['bronce'] ?? 0));
                    if (isset($configMedallero['bronce_min']) && isset($configMedallero['bronce_max'])) {
                        $sheet->setCellValue('C' . $row, 'Rango: ' . number_format($configMedallero['bronce_min'], 2) . ' - ' . number_format($configMedallero['bronce_max'], 2));
                    }
                    $row++;
                    $sheet->setCellValue('A' . $row, 'Menciones de Honor:');
                    $sheet->setCellValue('B' . $row, 'Máximo ' . ($configMedallero['mencion_honor'] ?? 0));
                }
            } catch (\Exception $e) {
                error_log('Error obteniendo configuración de medallero para Excel: ' . $e->getMessage());
            }
            
            // Hojas por tipo de medalla
            $tiposMedalla = [
                'oro' => 'Medalla de Oro',
                'plata' => 'Medalla de Plata',
                'bronce' => 'Medalla de Bronce',
                'mencion_honor' => 'Mención de Honor'
            ];
            
            foreach ($tiposMedalla as $tipoMedalla => $titulo) {
                $sheet = $spreadsheet->createSheet();
                $sheet->setTitle($titulo);
                
                // Para mención de honor, mostrar solo los que no recibieron ninguna medalla (medalla_asignada IS NULL)
                if ($tipoMedalla === 'mencion_honor') {
                    $sql = "
                        SELECT 
                            o.nombre_completo,
                            o.documento_identidad,
                            ue.nombre as unidad_educativa,
                            nc.nombre as nivel_nombre,
                            o.grado_escolaridad,
                            COALESCE(AVG(ef.puntuacion), 0) as puntuacion_promedio,
                            COUNT(ef.id) as num_evaluaciones
                        FROM inscripciones_areas ia
                        JOIN olimpistas o ON o.id = ia.olimpista_id
                        LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                        LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                        WHERE ia.area_competencia_id = ? 
                        AND ia.medalla_asignada IS NULL
                        AND ia.estado = 'clasificado'
                        AND EXISTS (SELECT 1 FROM evaluaciones_finales ef2 WHERE ef2.inscripcion_area_id = ia.id)
                        GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad
                        ORDER BY puntuacion_promedio DESC
                    ";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([$areaId]);
                } else {
                    $sql = "
                        SELECT 
                            o.nombre_completo,
                            o.documento_identidad,
                            ue.nombre as unidad_educativa,
                            nc.nombre as nivel_nombre,
                            o.grado_escolaridad,
                            AVG(ef.puntuacion) as puntuacion_promedio,
                            COUNT(ef.id) as num_evaluaciones
                        FROM inscripciones_areas ia
                        JOIN olimpistas o ON o.id = ia.olimpista_id
                        LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                        LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                        WHERE ia.area_competencia_id = ? 
                        AND ia.medalla_asignada = ?
                        AND ia.estado = 'clasificado'
                        GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad
                        ORDER BY puntuacion_promedio DESC
                    ";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([$areaId, $tipoMedalla]);
                }
                $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Encabezados
                $headers = ['Nombre Completo', 'Documento', 'Unidad Educativa', 'Nivel', 'Grado', 'Puntuación Promedio', 'Número de Evaluaciones'];
                $col = 'A';
                $row = 1;
                foreach ($headers as $header) {
                    $sheet->setCellValue($col . $row, $header);
                    $sheet->getStyle($col . $row)->getFont()->setBold(true);
                    $col++;
                }
                
                // Datos
                $row = 2;
                foreach ($participantes as $participante) {
                    $sheet->setCellValue('A' . $row, $participante['nombre_completo']);
                    $sheet->setCellValue('B' . $row, $participante['documento_identidad']);
                    $sheet->setCellValue('C' . $row, $participante['unidad_educativa'] ?? 'N/A');
                    $sheet->setCellValue('D' . $row, $participante['nivel_nombre']);
                    $sheet->setCellValue('E' . $row, $participante['grado_escolaridad'] ?? 'N/A');
                    $sheet->setCellValue('F' . $row, number_format($participante['puntuacion_promedio'], 2));
                    $sheet->setCellValue('G' . $row, $participante['num_evaluaciones']);
                    $row++;
                }
                
                foreach (range('A', 'G') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            }
            
            // Hoja de ranking completo
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle('Ranking Completo');
            
            $sqlTodos = "
                SELECT 
                    o.nombre_completo,
                    o.documento_identidad,
                    ue.nombre as unidad_educativa,
                    nc.nombre as nivel_nombre,
                    o.grado_escolaridad,
                    AVG(ef.puntuacion) as puntuacion_promedio,
                    COUNT(ef.id) as num_evaluaciones,
                    COALESCE(ia.medalla_asignada, 'sin_medalla') as medalla
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                LEFT JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ? 
                AND EXISTS (SELECT 1 FROM evaluaciones_finales ef2 WHERE ef2.inscripcion_area_id = ia.id)
                AND ia.estado = 'clasificado'
                GROUP BY ia.id, o.nombre_completo, o.documento_identidad, ue.nombre, nc.nombre, o.grado_escolaridad, ia.medalla_asignada
                ORDER BY puntuacion_promedio DESC
            ";
            $stmtTodos = $this->pdo->prepare($sqlTodos);
            $stmtTodos->execute([$areaId]);
            $todosParticipantes = $stmtTodos->fetchAll(PDO::FETCH_ASSOC);
            
            $headers = ['Posición', 'Nombre Completo', 'Documento', 'Unidad Educativa', 'Nivel', 'Grado', 'Puntuación Promedio', 'N° Evaluaciones', 'Medalla'];
            $col = 'A';
            $row = 1;
            foreach ($headers as $header) {
                $sheet->setCellValue($col . $row, $header);
                $sheet->getStyle($col . $row)->getFont()->setBold(true);
                $col++;
            }
            
            $posicion = 1;
            $row = 2;
            foreach ($todosParticipantes as $participante) {
                $medallaTexto = ($participante['medalla'] && $participante['medalla'] !== 'sin_medalla') 
                    ? ucfirst(str_replace('_', ' ', $participante['medalla'])) 
                    : 'Mención de Honor';
                $sheet->setCellValue('A' . $row, $posicion);
                $sheet->setCellValue('B' . $row, $participante['nombre_completo']);
                $sheet->setCellValue('C' . $row, $participante['documento_identidad']);
                $sheet->setCellValue('D' . $row, $participante['unidad_educativa'] ?? 'N/A');
                $sheet->setCellValue('E' . $row, $participante['nivel_nombre']);
                $sheet->setCellValue('F' . $row, $participante['grado_escolaridad'] ?? 'N/A');
                $sheet->setCellValue('G' . $row, number_format($participante['puntuacion_promedio'], 2));
                $sheet->setCellValue('H' . $row, $participante['num_evaluaciones']);
                $sheet->setCellValue('I' . $row, $medallaTexto);
                $posicion++;
                $row++;
            }
            
            foreach (range('A', 'I') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Guardar archivo
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            
            $filename = 'reporte_participantes_fase_final_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.xlsx';
            $filepath = $uploadsDir . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filepath);
            
            error_log("Excel de fase final generado exitosamente: {$filepath}");
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando Excel de fase final: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generar reporte PDF de estadísticas detalladas fase final
     */
    private function generarReportePDFEstadisticasFaseFinal($areaId, $areaNombre, $medallasAsignadas, $fechaCierre, $coordinador)
    {
        try {
            require_once __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
            
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            $pdf->SetCreator('ForwardSoft - Sistema de Olimpiadas');
            $pdf->SetAuthor('Sistema de Olimpiadas');
            $pdf->SetTitle('Reporte de Estadísticas Detalladas Fase Final - ' . $areaNombre);
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            $nombreOlimpiada = $config['nombre'] ?? 'Olimpiada Oh! SanSi';
            
            // Obtener todas las puntuaciones
            $sql = "
                SELECT ef.puntuacion, nc.nombre as nivel_nombre, o.grado_escolaridad, COALESCE(ia.medalla_asignada, 'sin_medalla') as medalla
                FROM evaluaciones_finales ef
                JOIN inscripciones_areas ia ON ia.id = ef.inscripcion_area_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN olimpistas o ON o.id = ia.olimpista_id
                WHERE ia.area_competencia_id = ?
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$areaId]);
            $evaluaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($evaluaciones)) {
                throw new \Exception('No hay datos de evaluaciones para generar estadísticas');
            }
            
            $puntuaciones = array_column($evaluaciones, 'puntuacion');
            $promedio = count($puntuaciones) > 0 ? array_sum($puntuaciones) / count($puntuaciones) : 0;
            $maxima = max($puntuaciones);
            $minima = min($puntuaciones);
            
            // Calcular desviación estándar
            $sumaCuadrados = 0;
            foreach ($puntuaciones as $punt) {
                $sumaCuadrados += pow($punt - $promedio, 2);
            }
            $desviacion = count($puntuaciones) > 1 ? sqrt($sumaCuadrados / (count($puntuaciones) - 1)) : 0;
            
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 18);
            $pdf->Cell(0, 10, 'REPORTE ESTADÍSTICAS DETALLADAS', 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(0, 8, $nombreOlimpiada, 0, 1, 'C');
            $pdf->SetFont('helvetica', '', 12);
            $pdf->Cell(0, 6, 'Área: ' . $areaNombre, 0, 1, 'C');
            $pdf->Cell(0, 6, 'Fase: Final', 0, 1, 'C');
            $pdf->Ln(5);
            
            // Estadísticas básicas
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'ESTADÍSTICAS BÁSICAS', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(100, 6, 'Promedio general:', 0, 0, 'L');
            $pdf->Cell(0, 6, number_format($promedio, 2), 0, 1, 'L');
            $pdf->Cell(100, 6, 'Desviación estándar:', 0, 0, 'L');
            $pdf->Cell(0, 6, number_format($desviacion, 2), 0, 1, 'L');
            $pdf->Cell(100, 6, 'Puntuación máxima:', 0, 0, 'L');
            $pdf->Cell(0, 6, number_format($maxima, 2), 0, 1, 'L');
            $pdf->Cell(100, 6, 'Puntuación mínima:', 0, 0, 'L');
            $pdf->Cell(0, 6, number_format($minima, 2), 0, 1, 'L');
            $pdf->Cell(100, 6, 'Total de evaluaciones:', 0, 0, 'L');
            $pdf->Cell(0, 6, count($puntuaciones), 0, 1, 'L');
            $pdf->Ln(5);
            
            // Distribución de medallas
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 8, 'DISTRIBUCIÓN DE MEDALLAS', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->SetFillColor(230, 230, 230);
            $pdf->Cell(100, 7, 'Tipo de Medalla', 1, 0, 'C', true);
            $pdf->Cell(90, 7, 'Cantidad', 1, 1, 'C', true);
            $pdf->SetFillColor(255, 255, 255);
            $pdf->Cell(100, 6, 'Oro', 1, 0, 'L');
            $pdf->Cell(90, 6, $medallasAsignadas['oro'] ?? 0, 1, 1, 'C');
            $pdf->Cell(100, 6, 'Plata', 1, 0, 'L');
            $pdf->Cell(90, 6, $medallasAsignadas['plata'] ?? 0, 1, 1, 'C');
            $pdf->Cell(100, 6, 'Bronce', 1, 0, 'L');
            $pdf->Cell(90, 6, $medallasAsignadas['bronce'] ?? 0, 1, 1, 'C');
            $pdf->Cell(100, 6, 'Mención de Honor', 1, 0, 'L');
            $pdf->Cell(90, 6, ($medallasAsignadas['mencion_honor'] ?? 0) + ($medallasAsignadas['sin_medalla'] ?? 0), 1, 1, 'C');
            
            // Guardar archivo
            $uploadsDir = __DIR__ . '/../../public/uploads/reportes/';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            
            $filename = 'reporte_estadisticas_fase_final_' . $areaId . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $filepath = $uploadsDir . $filename;
            $pdf->Output($filepath, 'F');
            
            error_log("PDF de estadísticas fase final generado exitosamente: {$filepath}");
            return $filename;
            
        } catch (\Exception $e) {
            error_log('Error generando PDF de estadísticas fase final: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Descargar reporte PDF de cierre de fase final
     */
    public function descargarReportePDFCierreFaseFinal()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            // Obtener área del coordinador
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            
            $pattern = __DIR__ . '/../../public/uploads/reportes/reporte_cierre_fase_final_' . $areaId . '_*.pdf';
            $files = glob($pattern);
            
           
            if (empty($files)) {
                error_log("PDF no encontrado para área {$areaId}, intentando regenerar...");
                $datosFaseFinal = $this->obtenerDatosFaseFinal($areaId);
                
                if (!$datosFaseFinal) {
                    error_log("No se pudieron obtener datos de fase final para área {$areaId}");
                    Response::error('No se encontró ningún reporte PDF para esta área. Asegúrate de que la fase final esté cerrada.', 404);
                    return;
                }
                
                error_log("Regenerando PDF para área {$areaId} con datos: " . json_encode($datosFaseFinal));
                
                
                try {
                    $filename = $this->generarReportePDFCierreFaseFinal(
                        $areaId, 
                        $areaNombre, 
                        $datosFaseFinal['total_clasificados'], 
                        $datosFaseFinal['total_evaluados'], 
                        $datosFaseFinal['medallas_asignadas'], 
                        $datosFaseFinal['fecha_cierre'], 
                        $currentUser
                    );
                    
                    error_log("PDF generado: {$filename}");
                    
                    
                    $files = glob($pattern);
                    if (empty($files)) {
                        error_log("Error: No se encontró el archivo después de generarlo. Patrón: {$pattern}");
                        Response::error('Error al generar el reporte PDF. El archivo no se pudo crear.', 500);
                        return;
                    }
                    
                    error_log("Archivo encontrado después de regenerar: " . count($files) . " archivos");
                } catch (\Exception $e) {
                    error_log('Error regenerando PDF de fase final: ' . $e->getMessage());
                    error_log('Trace: ' . $e->getTraceAsString());
                    Response::error('Error al generar el reporte PDF: ' . $e->getMessage(), 500);
                    return;
                }
            }
            
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile) || !is_readable($latestFile)) {
                Response::error('El archivo PDF no es accesible', 500);
                return;
            }
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . filesize($latestFile));
            readfile($latestFile);
            exit();
            
        } catch (\Exception $e) {
            error_log('Error descargando PDF de fase final: ' . $e->getMessage());
            Response::serverError('Error al descargar el reporte PDF');
        }
    }

    /**
     * Descargar reporte Excel de participantes fase final
     */
    public function descargarReporteExcelParticipantesFaseFinal()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            // Obtener área del coordinador
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            
            $pattern = __DIR__ . '/../../public/uploads/reportes/reporte_participantes_fase_final_' . $areaId . '_*.xlsx';
            $files = glob($pattern);
            
           
            if (empty($files)) {
                $datosFaseFinal = $this->obtenerDatosFaseFinal($areaId);
                
                if (!$datosFaseFinal) {
                    Response::error('No se encontró ningún reporte Excel para esta área. Asegúrate de que la fase final esté cerrada.', 404);
                    return;
                }
                
                // Regenerar el reporte
                try {
                    $this->generarReporteExcelParticipantesFaseFinal(
                        $areaId, 
                        $areaNombre, 
                        $datosFaseFinal['medallas_asignadas'], 
                        $datosFaseFinal['fecha_cierre'], 
                        $currentUser
                    );
                    
                    $files = glob($pattern);
                    if (empty($files)) {
                        Response::error('Error al generar el reporte Excel', 500);
                        return;
                    }
                } catch (\Exception $e) {
                    error_log('Error regenerando Excel de fase final: ' . $e->getMessage());
                    Response::error('Error al generar el reporte Excel: ' . $e->getMessage(), 500);
                    return;
                }
            }
            
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile) || !is_readable($latestFile)) {
                Response::error('El archivo Excel no es accesible', 500);
                return;
            }
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . filesize($latestFile));
            readfile($latestFile);
            exit();
            
        } catch (\Exception $e) {
            error_log('Error descargando Excel de fase final: ' . $e->getMessage());
            Response::serverError('Error al descargar el reporte Excel');
        }
    }

    /**
     * Descargar reporte PDF de estadísticas fase final
     */
    public function descargarReportePDFEstadisticasFaseFinal()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            if (!$currentUser || $currentUser['role'] !== 'coordinador') {
                Response::forbidden('Acceso de coordinador requerido');
                return;
            }

            // Obtener área del coordinador
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$currentUser['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            // Buscar el PDF más reciente
            $pattern = __DIR__ . '/../../public/uploads/reportes/reporte_estadisticas_fase_final_' . $areaId . '_*.pdf';
            $files = glob($pattern);
            
            
            if (empty($files)) {
                $datosFaseFinal = $this->obtenerDatosFaseFinal($areaId);
                
                if (!$datosFaseFinal) {
                    Response::error('No se encontró ningún reporte de estadísticas para esta área. Asegúrate de que la fase final esté cerrada.', 404);
                    return;
                }
                
                // Regenerar el reporte
                try {
                    $this->generarReportePDFEstadisticasFaseFinal(
                        $areaId, 
                        $areaNombre, 
                        $datosFaseFinal['medallas_asignadas'], 
                        $datosFaseFinal['fecha_cierre'], 
                        $currentUser
                    );
                    
                    
                    $files = glob($pattern);
                    if (empty($files)) {
                        Response::error('Error al generar el reporte de estadísticas', 500);
                        return;
                    }
                } catch (\Exception $e) {
                    error_log('Error regenerando PDF de estadísticas fase final: ' . $e->getMessage());
                    Response::error('Error al generar el reporte de estadísticas: ' . $e->getMessage(), 500);
                    return;
                }
            }
            
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            
            if (!file_exists($latestFile) || !is_readable($latestFile)) {
                Response::error('El archivo PDF no es accesible', 500);
                return;
            }
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($latestFile) . '"');
            header('Content-Length: ' . filesize($latestFile));
            readfile($latestFile);
            exit();
            
        } catch (\Exception $e) {
            error_log('Error descargando PDF de estadísticas fase final: ' . $e->getMessage());
            Response::serverError('Error al descargar el reporte de estadísticas');
        }
    }

    /**
     * Obtener participantes premiados del área del coordinador
     * Basado en medalla_asignada de la fase final
     */
    public function getParticipantesPremiados()
    {
        try {
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$userData['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            $areaNombre = $areaCoordinador['area_nombre'];
            
            // Verificar si la fase final está cerrada
            $sqlFaseCerrada = "
                SELECT COUNT(*) as cerrada
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? AND fase = 'final'
            ";
            $stmtFase = $this->pdo->prepare($sqlFaseCerrada);
            $stmtFase->execute([$areaId]);
            $faseCerrada = $stmtFase->fetch(PDO::FETCH_ASSOC);
            
            if (!$faseCerrada || $faseCerrada['cerrada'] == 0) {
                Response::error('La fase final aún no ha sido cerrada', 400);
                return;
            }
            
           
            $sqlParticipantes = "
                SELECT 
                    ia.id,
                    o.id as olimpista_id,
                    o.nombre_completo as nombre,
                    o.unidad_educativa as unidad,
                    nc.nombre as nivel,
                    ia.medalla_asignada,
                    ef.puntuacion as puntaje,
                    ROW_NUMBER() OVER (
                        ORDER BY 
                            CASE 
                                WHEN ia.medalla_asignada = 'oro' THEN 1
                                WHEN ia.medalla_asignada = 'plata' THEN 2
                                WHEN ia.medalla_asignada = 'bronce' THEN 3
                                WHEN ia.medalla_asignada IS NULL THEN 4
                                ELSE 5
                            END,
                            ef.puntuacion DESC
                    ) as puesto
                FROM inscripciones_areas ia
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                LEFT JOIN evaluaciones_finales ef ON ef.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ?
                AND ia.estado = 'clasificado'
                AND (
                    ia.medalla_asignada IN ('oro', 'plata', 'bronce')
                    OR ia.medalla_asignada IS NULL
                )
                ORDER BY 
                    CASE 
                        WHEN ia.medalla_asignada = 'oro' THEN 1
                        WHEN ia.medalla_asignada = 'plata' THEN 2
                        WHEN ia.medalla_asignada = 'bronce' THEN 3
                        WHEN ia.medalla_asignada IS NULL THEN 4
                        ELSE 5
                    END,
                    ef.puntuacion DESC
            ";
            
            $stmt = $this->pdo->prepare($sqlParticipantes);
            $stmt->execute([$areaId]);
            $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
           
            $sqlAprobacion = "
                SELECT aprobado, fecha_aprobacion, observaciones
                FROM aprobaciones_certificados
                WHERE area_competencia_id = ? AND coordinador_id = ?
                LIMIT 1
            ";
            $stmtAprob = $this->pdo->prepare($sqlAprobacion);
            $stmtAprob->execute([$areaId, $userData['id']]);
            $aprobacion = $stmtAprob->fetch(PDO::FETCH_ASSOC);
            
            
            $estadisticas = [
                'oro' => 0,
                'plata' => 0,
                'bronce' => 0,
                'mencion_honor' => 0,
                'total' => count($participantes)
            ];
            
            foreach ($participantes as $participante) {
                $medalla = $participante['medalla_asignada'];
                if (isset($estadisticas[$medalla])) {
                    $estadisticas[$medalla]++;
                }
            }
            
            Response::success([
                'area' => [
                    'id' => $areaId,
                    'nombre' => $areaNombre
                ],
                'participantes' => $participantes,
                'estadisticas' => $estadisticas,
                'aprobado' => $aprobacion ? (bool)$aprobacion['aprobado'] : false,
                'fecha_aprobacion' => $aprobacion['fecha_aprobacion'] ?? null,
                'observaciones' => $aprobacion['observaciones'] ?? null
            ], 'Participantes premiados obtenidos correctamente');
            
        } catch (\Exception $e) {
            error_log('Error obteniendo participantes premiados: ' . $e->getMessage());
            Response::serverError('Error al obtener participantes premiados');
        }
    }

    
    public function aprobarCertificados()
    {
        try {
            $userData = JWTManager::getCurrentUser();
            
            if (!$userData || $userData['role'] !== 'coordinador') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $aprobado = isset($input['aprobado']) ? (bool)$input['aprobado'] : true;
            $observaciones = $input['observaciones'] ?? null;
            
           
            $sqlArea = "
                SELECT ac.id as area_id, ac.nombre as area_nombre
                FROM responsables_academicos ra
                JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                WHERE ra.user_id = ? AND ra.is_active = true
                LIMIT 1
            ";
            
            $stmtArea = $this->pdo->prepare($sqlArea);
            $stmtArea->execute([$userData['id']]);
            $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
            
            if (!$areaCoordinador) {
                Response::error('No se encontró área asignada al coordinador', 400);
                return;
            }
            
            $areaId = $areaCoordinador['area_id'];
            
            
            $sqlFaseCerrada = "
                SELECT COUNT(*) as cerrada
                FROM cierre_fase_areas
                WHERE area_competencia_id = ? AND fase = 'final'
            ";
            $stmtFase = $this->pdo->prepare($sqlFaseCerrada);
            $stmtFase->execute([$areaId]);
            $faseCerrada = $stmtFase->fetch(PDO::FETCH_ASSOC);
            
            if (!$faseCerrada || $faseCerrada['cerrada'] == 0) {
                Response::error('La fase final aún no ha sido cerrada', 400);
                return;
            }
            
          
            $sqlUpsert = "
                INSERT INTO aprobaciones_certificados 
                    (area_competencia_id, coordinador_id, aprobado, fecha_aprobacion, observaciones, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (area_competencia_id, coordinador_id)
                DO UPDATE SET
                    aprobado = EXCLUDED.aprobado,
                    fecha_aprobacion = CASE 
                        WHEN EXCLUDED.aprobado = true THEN EXCLUDED.fecha_aprobacion
                        ELSE aprobaciones_certificados.fecha_aprobacion
                    END,
                    observaciones = EXCLUDED.observaciones,
                    updated_at = CURRENT_TIMESTAMP
            ";
            
            $stmt = $this->pdo->prepare($sqlUpsert);
            $stmt->execute([$areaId, $userData['id'], $aprobado, $observaciones]);
            
            Response::success([
                'aprobado' => $aprobado,
                'fecha_aprobacion' => date('Y-m-d H:i:s'),
                'observaciones' => $observaciones
            ], $aprobado ? 'Certificados aprobados correctamente' : 'Aprobación cancelada correctamente');
            
        } catch (\Exception $e) {
            error_log('Error aprobando certificados: ' . $e->getMessage());
            Response::serverError('Error al aprobar certificados');
        }
    }

} 