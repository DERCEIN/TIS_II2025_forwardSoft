<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Models\AreaCompetencia;

class CatalogoController
{
    public function niveles()
    {
        try {
            $pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
            $stmt = $pdo->query("SELECT id, nombre FROM niveles_competencia WHERE is_active = true ORDER BY orden_display ASC, id ASC");
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
            Response::success($rows, 'Niveles obtenidos');
        } catch (\Exception $e) {
            error_log('Error al obtener niveles: ' . $e->getMessage());
            Response::serverError('Error al obtener niveles');
        }
    }

    public function areasCompetencia()
    {
        try {
            $areaModel = new AreaCompetencia();
            $areas = $areaModel->getAll();
            Response::success($areas, 'Áreas de competencia obtenidas');
        } catch (\Exception $e) {
            error_log('Error al obtener áreas de competencia: ' . $e->getMessage());
            Response::serverError('Error al obtener áreas de competencia');
        }
    }
}


