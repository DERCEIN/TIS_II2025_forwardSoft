<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;

class EvaluadorController
{
    public function dashboard()
    {
        $stats = [
            'evaluaciones_asignadas' => 0, // Implementar cuando se agregue el modelo de evaluaciones
            'evaluaciones_completadas' => 0,
            'evaluaciones_pendientes' => 0,
            'proyectos_evaluando' => 0
        ];

        Response::success($stats, 'Dashboard de evaluador');
    }

    public function evaluaciones()
    {
        // Implementar cuando se agregue el modelo de evaluaciones
        $evaluaciones = [
            [
                'id' => 1,
                'proyecto_id' => 1,
                'proyecto_nombre' => 'Proyecto de ejemplo',
                'estado' => 'pendiente',
                'fecha_asignacion' => '2024-01-01',
                'fecha_limite' => '2024-01-15'
            ]
        ];

        Response::success($evaluaciones, 'Lista de evaluaciones asignadas');
    }
}
