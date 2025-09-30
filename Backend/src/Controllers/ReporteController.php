<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\Olimpista;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\ResultadoFinal;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\EvaluacionFinal;

class ReporteController
{
    private $olimpistaModel;
    private $inscripcionModel;
    private $resultadoModel;
    private $evalClasificacionModel;
    private $evalFinalModel;

    public function __construct()
    {
        $this->olimpistaModel = new Olimpista();
        $this->inscripcionModel = new InscripcionArea();
        $this->resultadoModel = new ResultadoFinal();
        $this->evalClasificacionModel = new EvaluacionClasificacion();
        $this->evalFinalModel = new EvaluacionFinal();
    }

    public function getEstadisticasGenerales()
    {
        $stats = [
            'total_olimpistas' => $this->olimpistaModel->getTotalCount(),
            'total_inscripciones' => $this->inscripcionModel->getTotalCount(),
            'inscripciones_por_area' => $this->inscripcionModel->getCountByArea(),
            'inscripciones_por_nivel' => $this->inscripcionModel->getCountByLevel(),
            'inscripciones_por_departamento' => $this->olimpistaModel->getCountByDepartamento(),
            'estados_inscripciones' => $this->inscripcionModel->getCountByEstado(),
            'evaluaciones_pendientes' => $this->evalClasificacionModel->getCountPendientes(),
            'evaluaciones_completadas' => $this->evalClasificacionModel->getCountCompletadas()
        ];

        Response::success($stats, 'Estadísticas generales obtenidas');
    }

    public function getReporteInscripciones()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null,
            'departamento_id' => $_GET['departamento_id'] ?? null,
            'estado' => $_GET['estado'] ?? null,
            'fecha_desde' => $_GET['fecha_desde'] ?? null,
            'fecha_hasta' => $_GET['fecha_hasta'] ?? null
        ];

        $inscripciones = $this->inscripcionModel->getReporteInscripciones($filters);
        
        Response::success($inscripciones, 'Reporte de inscripciones obtenido');
    }

    public function getReporteEvaluaciones()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null,
            'evaluador_id' => $_GET['evaluador_id'] ?? null,
            'fase' => $_GET['fase'] ?? 'clasificacion', // clasificacion o final
            'fecha_desde' => $_GET['fecha_desde'] ?? null,
            'fecha_hasta' => $_GET['fecha_hasta'] ?? null
        ];

        if ($filters['fase'] === 'final') {
            $evaluaciones = $this->evalFinalModel->getReporteEvaluaciones($filters);
        } else {
            $evaluaciones = $this->evalClasificacionModel->getReporteEvaluaciones($filters);
        }
        
        Response::success($evaluaciones, 'Reporte de evaluaciones obtenido');
    }

    public function getReporteResultados()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null,
            'fase' => $_GET['fase'] ?? 'premiacion', // clasificacion o premiacion
            'medalla' => $_GET['medalla'] ?? null
        ];

        $resultados = $this->resultadoModel->getReporteResultados($filters);
        
        Response::success($resultados, 'Reporte de resultados obtenido');
    }

    public function getMedalleroCompleto()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null
        ];

        $medallero = $this->resultadoModel->getMedalleroCompleto($filters);
        
        Response::success($medallero, 'Medallero completo obtenido');
    }

    public function getRankingPorArea($areaId)
    {
        $nivelId = $_GET['nivel_id'] ?? null;
        $fase = $_GET['fase'] ?? 'premiacion';
        
        $ranking = $this->resultadoModel->getRankingByArea($areaId, $nivelId, $fase);
        
        Response::success($ranking, 'Ranking por área obtenido');
    }

    public function getEstadisticasPorDepartamento()
    {
        $stats = [
            'total_por_departamento' => $this->olimpistaModel->getCountByDepartamento(),
            'clasificados_por_departamento' => $this->inscripcionModel->getClasificadosByDepartamento(),
            'premiados_por_departamento' => $this->resultadoModel->getPremiadosByDepartamento(),
            'medallas_por_departamento' => $this->resultadoModel->getMedallasByDepartamento()
        ];

        Response::success($stats, 'Estadísticas por departamento obtenidas');
    }

    public function getEstadisticasPorArea()
    {
        $stats = [
            'inscripciones_por_area' => $this->inscripcionModel->getCountByArea(),
            'clasificados_por_area' => $this->inscripcionModel->getClasificadosByArea(),
            'premiados_por_area' => $this->resultadoModel->getPremiadosByArea(),
            'medallas_por_area' => $this->resultadoModel->getMedallasByArea(),
            'promedio_puntuaciones_por_area' => $this->evalClasificacionModel->getPromedioPuntuacionesByArea()
        ];

        Response::success($stats, 'Estadísticas por área obtenidas');
    }

    public function getReporteDetalladoOlimpista($olimpistaId)
    {
        $olimpista = $this->olimpistaModel->getByIdWithDetails($olimpistaId);
        
        if (!$olimpista) {
            Response::notFound('Olimpista no encontrado');
        }

        $reporte = [
            'olimpista' => $olimpista,
            'inscripciones' => $this->inscripcionModel->getByOlimpista($olimpistaId),
            'evaluaciones_clasificacion' => $this->evalClasificacionModel->getByOlimpista($olimpistaId),
            'evaluaciones_finales' => $this->evalFinalModel->getByOlimpista($olimpistaId),
            'resultados' => $this->resultadoModel->getByOlimpista($olimpistaId)
        ];

        Response::success($reporte, 'Reporte detallado del olimpista obtenido');
    }

    public function getReporteEvaluador($evaluadorId)
    {
        $filters = [
            'evaluador_id' => $evaluadorId,
            'fecha_desde' => $_GET['fecha_desde'] ?? null,
            'fecha_hasta' => $_GET['fecha_hasta'] ?? null
        ];

        $reporte = [
            'evaluaciones_clasificacion' => $this->evalClasificacionModel->getReporteEvaluaciones($filters),
            'evaluaciones_finales' => $this->evalFinalModel->getReporteEvaluaciones($filters),
            'estadisticas' => [
                'total_evaluaciones' => $this->evalClasificacionModel->getCountByEvaluador($evaluadorId) + 
                                      $this->evalFinalModel->getCountByEvaluador($evaluadorId),
                'promedio_puntuaciones' => $this->evalClasificacionModel->getPromedioByEvaluador($evaluadorId)
            ]
        ];

        Response::success($reporte, 'Reporte del evaluador obtenido');
    }

    public function exportarInscripciones()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null,
            'departamento_id' => $_GET['departamento_id'] ?? null,
            'estado' => $_GET['estado'] ?? null
        ];

        $inscripciones = $this->inscripcionModel->getReporteInscripciones($filters);
        
        $filename = 'inscripciones_' . date('Y-m-d_H-i-s') . '.csv';
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        $output = fopen('php://output', 'w');
        
        // Escribir BOM para UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Escribir headers
        $headers = [
            'ID Inscripción',
            'Olimpista',
            'Documento',
            'Área',
            'Nivel',
            'Departamento',
            'Unidad Educativa',
            'Estado',
            'Fecha Inscripción'
        ];
        fputcsv($output, $headers);
        
        // Escribir datos
        foreach ($inscripciones as $inscripcion) {
            fputcsv($output, [
                $inscripcion['id'],
                $inscripcion['olimpista_nombre'],
                $inscripcion['olimpista_documento'],
                $inscripcion['area_nombre'],
                $inscripcion['nivel_nombre'],
                $inscripcion['departamento_nombre'],
                $inscripcion['unidad_educativa_nombre'],
                $inscripcion['estado'],
                $inscripcion['created_at']
            ]);
        }
        
        fclose($output);
        exit;
    }

    public function exportarResultados()
    {
        $filters = [
            'area_id' => $_GET['area_id'] ?? null,
            'nivel_id' => $_GET['nivel_id'] ?? null,
            'fase' => $_GET['fase'] ?? 'premiacion'
        ];

        $resultados = $this->resultadoModel->getReporteResultados($filters);
        
        $filename = 'resultados_' . date('Y-m-d_H-i-s') . '.csv';
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        $output = fopen('php://output', 'w');
        
        // Escribir BOM para UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Escribir headers
        $headers = [
            'Posición',
            'Olimpista',
            'Documento',
            'Área',
            'Nivel',
            'Departamento',
            'Unidad Educativa',
            'Medalla',
            'Puntuación Final',
            'Fecha Resultado'
        ];
        fputcsv($output, $headers);
        
        // Escribir datos
        foreach ($resultados as $resultado) {
            fputcsv($output, [
                $resultado['posicion'],
                $resultado['olimpista_nombre'],
                $resultado['olimpista_documento'],
                $resultado['area_nombre'],
                $resultado['nivel_nombre'],
                $resultado['departamento_nombre'],
                $resultado['unidad_educativa_nombre'],
                $resultado['medalla'],
                $resultado['puntuacion_final'],
                $resultado['fecha_resultado']
            ]);
        }
        
        fclose($output);
        exit;
    }
}
