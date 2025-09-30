<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;

class CoordinadorController
{
    public function dashboard()
    {
        $stats = [
            'total_proyectos' => 0, // Implementar cuando se agregue el modelo de proyectos
            'proyectos_activos' => 0,
            'evaluaciones_pendientes' => 0,
            'evaluadores_disponibles' => 0
        ];

        Response::success($stats, 'Dashboard de coordinador');
    }

    public function proyectos()
    {
        // Implementar cuando se agregue el modelo de proyectos
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
}
