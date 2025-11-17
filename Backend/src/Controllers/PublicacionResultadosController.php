<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\PublicacionResultados;
use ForwardSoft\Models\ConfiguracionAreaEvaluacion;
use PDO;

class PublicacionResultadosController
{
    private $pdo;
    private $publicacionModel;

    public function __construct()
    {
        $this->pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
        $this->publicacionModel = new PublicacionResultados();
    }

    public function publicarResultados()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || !in_array($currentUser['role'], ['coordinador', 'admin'])) {
                Response::forbidden('Acceso no autorizado');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $areaId = $input['area_competencia_id'] ?? null;

            if (!$areaId) {
                Response::validationError(['area_competencia_id' => 'El ID del área es requerido']);
                return;
            }

            
            if ($currentUser['role'] === 'coordinador') {
                $sqlArea = "
                    SELECT ac.id as area_id
                    FROM responsables_academicos ra
                    JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                    WHERE ra.user_id = ? AND ra.is_active = true AND ac.id = ?
                    LIMIT 1
                ";
                $stmtArea = $this->pdo->prepare($sqlArea);
                $stmtArea->execute([$currentUser['id'], $areaId]);
                $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
                
                if (!$areaCoordinador) {
                    Response::forbidden('No tienes permiso para publicar resultados de esta área');
                    return;
                }
            }

           
            $sqlCierre = "
                SELECT estado 
                FROM cierre_fase_areas 
                WHERE area_competencia_id = ? AND nivel_competencia_id IS NULL
                LIMIT 1
            ";
            $stmtCierre = $this->pdo->prepare($sqlCierre);
            $stmtCierre->execute([$areaId]);
            $cierre = $stmtCierre->fetch(PDO::FETCH_ASSOC);

            if (!$cierre || $cierre['estado'] !== 'cerrada') {
                Response::validationError(['fase' => 'La fase debe estar cerrada antes de publicar los resultados']);
                return;
            }

            
            if ($currentUser['role'] === 'coordinador') {
                $configModel = new ConfiguracionAreaEvaluacion();
                $config = $configModel->getByAreaId($areaId);
                
                if ($config) {
                    $now = new \DateTime();
                    $periodoInicio = new \DateTime($config['periodo_publicacion_inicio']);
                    $periodoFin = new \DateTime($config['periodo_publicacion_fin']);
                    
                    if ($now < $periodoInicio || $now > $periodoFin) {
                        Response::validationError([
                            'periodo' => 'No está dentro del período de publicación configurado. ' .
                                        'Período: ' . $periodoInicio->format('d/m/Y H:i') . ' - ' . $periodoFin->format('d/m/Y H:i')
                        ]);
                        return;
                    }
                }
            }

           
            $observaciones = $input['observaciones'] ?? null;
            $resultado = $this->publicacionModel->publicar($areaId, $currentUser['id'], $observaciones);

            Response::success($resultado, 'Resultados publicados exitosamente');
        } catch (\Exception $e) {
            error_log("Error al publicar resultados: " . $e->getMessage());
            Response::error('Error al publicar resultados: ' . $e->getMessage(), 500);
        }
    }

    
    public function despublicarResultados()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!$currentUser || !in_array($currentUser['role'], ['coordinador', 'admin'])) {
                Response::forbidden('Acceso no autorizado');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $areaId = $input['area_competencia_id'] ?? null;

            if (!$areaId) {
                Response::validationError(['area_competencia_id' => 'El ID del área es requerido']);
                return;
            }

            
            if ($currentUser['role'] === 'coordinador') {
                $sqlArea = "
                    SELECT ac.id as area_id
                    FROM responsables_academicos ra
                    JOIN areas_competencia ac ON ac.id = ra.area_competencia_id
                    WHERE ra.user_id = ? AND ra.is_active = true AND ac.id = ?
                    LIMIT 1
                ";
                $stmtArea = $this->pdo->prepare($sqlArea);
                $stmtArea->execute([$currentUser['id'], $areaId]);
                $areaCoordinador = $stmtArea->fetch(PDO::FETCH_ASSOC);
                
                if (!$areaCoordinador) {
                    Response::forbidden('No tienes permiso para despublicar resultados de esta área');
                    return;
                }
            }

            $observaciones = $input['observaciones'] ?? null;
            $resultado = $this->publicacionModel->despublicar($areaId, $currentUser['id'], $observaciones);

            Response::success($resultado, 'Resultados despublicados exitosamente');
        } catch (\Exception $e) {
            error_log("Error al despublicar resultados: " . $e->getMessage());
            Response::error('Error al despublicar resultados: ' . $e->getMessage(), 500);
        }
    }

    
    public function getEstadoPublicacion($areaId)
    {
        try {
            $publicacion = $this->publicacionModel->getByAreaId($areaId);
            
            Response::success($publicacion ?: [
                'area_competencia_id' => $areaId,
                'publicado' => false
            ], 'Estado de publicación obtenido');
        } catch (\Exception $e) {
            error_log("Error al obtener estado de publicación: " . $e->getMessage());
            Response::error('Error al obtener estado de publicación', 500);
        }
    }

    public function getAreasPublicadas()
    {
        try {
            $areas = $this->publicacionModel->getPublicadas();
            Response::success($areas, 'Áreas publicadas obtenidas');
        } catch (\Exception $e) {
            error_log("Error al obtener áreas publicadas: " . $e->getMessage());
            Response::error('Error al obtener áreas publicadas', 500);
        }
    }

    
    public function getResultadosPublicados($areaId = null)
    {
        try {
            
            if (!$areaId) {
                $areaId = $_GET['area_id'] ?? null;
            }

            if (!$areaId) {
                Response::validationError(['area_id' => 'El ID del área es requerido']);
                return;
            }

           
            if (!$this->publicacionModel->estaPublicada($areaId)) {
                Response::error('Los resultados de esta área no están publicados', 404);
                return;
            }

            
            $nivelId = $_GET['nivel_id'] ?? null;
            $departamentoId = $_GET['departamento_id'] ?? null;

           
            $sql = "
                SELECT 
                    ia.id as inscripcion_id,
                    o.nombre_completo,
                    d.nombre as departamento,
                    ue.nombre as unidad_educativa,
                    ac.nombre as area,
                    nc.nombre as nivel_nombre,
                    CASE 
                        WHEN nc.nombre ILIKE '%primaria%' THEN 'Primaria'
                        WHEN nc.nombre ILIKE '%secundaria%' THEN 'Secundaria'
                        ELSE nc.nombre
                    END as nivel,
                    o.grado_escolaridad as curso,
                    COALESCE(AVG(ec.puntuacion), 0) as puntaje,
                    CASE 
                        WHEN ia.estado = 'clasificado' THEN 'Clasificado'
                        WHEN ia.estado = 'no_clasificado' THEN 'No Clasificado'
                        WHEN ia.estado = 'desclasificado' THEN 'Desclasificado'
                        ELSE 'Pendiente'
                    END as observaciones,
                    ia.estado as estado_interno,
                    ia.nivel_competencia_id
                FROM inscripciones_areas ia
                INNER JOIN olimpistas o ON ia.olimpista_id = o.id
                INNER JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                LEFT JOIN evaluaciones_clasificacion ec ON ia.id = ec.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
            ";

            $params = [$areaId];

            if ($nivelId) {
                $sql .= " AND ia.nivel_competencia_id = ?";
                $params[] = $nivelId;
            }

            if ($departamentoId) {
                $sql .= " AND o.departamento_id = ?";
                $params[] = $departamentoId;
            }

            $sql .= " 
                GROUP BY 
                    ia.id, o.nombre_completo, d.nombre, ue.nombre, ac.nombre, 
                    nc.nombre, o.grado_escolaridad, ia.estado, ia.nivel_competencia_id
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultadosRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

           
            $resultados = [];
            $contadores = [];
            
            foreach ($resultadosRaw as $row) {
                $key = $row['estado_interno'] . '_' . $row['nivel_competencia_id'];
                if (!isset($contadores[$key])) {
                    $contadores[$key] = 0;
                }
                $contadores[$key]++;
                
                $row['numero'] = $contadores[$key];
                $resultados[] = $row;
            }

           
            usort($resultados, function($a, $b) {
                $ordenEstado = ['clasificado' => 1, 'no_clasificado' => 2, 'desclasificado' => 3];
                $ordenA = $ordenEstado[$a['estado_interno']] ?? 99;
                $ordenB = $ordenEstado[$b['estado_interno']] ?? 99;
                
                if ($ordenA !== $ordenB) {
                    return $ordenA <=> $ordenB;
                }
                
                if ($a['estado_interno'] === 'clasificado' && $b['estado_interno'] === 'clasificado') {
                    $puntajeA = (float)$a['puntaje'];
                    $puntajeB = (float)$b['puntaje'];
                    if (abs($puntajeA - $puntajeB) > 0.01) {
                        return $puntajeB <=> $puntajeA; 
                    }
                }
                
                return strcmp($a['nombre_completo'], $b['nombre_completo']);
            });

            
            $contadores = [];
            foreach ($resultados as &$row) {
                $key = $row['estado_interno'] . '_' . $row['nivel_competencia_id'];
                if (!isset($contadores[$key])) {
                    $contadores[$key] = 0;
                }
                $contadores[$key]++;
                $row['numero'] = $contadores[$key];
            }

            
            foreach ($resultados as &$resultado) {
                $resultado['numero'] = (int)$resultado['numero'];
                $resultado['puntaje'] = round((float)$resultado['puntaje'], 2);
                unset($resultado['inscripcion_id'], $resultado['estado_interno'], $resultado['nivel_competencia_id']);
            }

            Response::success([
                'resultados' => $resultados,
                'total' => count($resultados),
                'area_id' => $areaId
            ], 'Resultados obtenidos exitosamente');
        } catch (\Exception $e) {
            error_log("Error al obtener resultados publicados: " . $e->getMessage());
            Response::error('Error al obtener resultados: ' . $e->getMessage(), 500);
        }
    }
}

