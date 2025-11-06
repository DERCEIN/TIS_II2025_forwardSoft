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

    
    public function areasCompetenciaConEstadisticas()
    {
        try {
            $pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
            
           
            $sql = "
                SELECT 
                    ac.id,
                    ac.nombre,
                    ac.descripcion,
                    ac.orden_display,
                    ac.is_active,
                    COUNT(DISTINCT ia.olimpista_id) as participantes_count,
                    COUNT(DISTINCT CASE WHEN ea.is_active = true AND u.is_active = true THEN ea.user_id END) as evaluadores_count,
                    300 as capacidad
                FROM areas_competencia ac
                LEFT JOIN inscripciones_areas ia ON ia.area_competencia_id = ac.id
                LEFT JOIN evaluadores_areas ea ON ea.area_competencia_id = ac.id
                LEFT JOIN users u ON u.id = ea.user_id
                WHERE ac.is_active = true
                GROUP BY ac.id, ac.nombre, ac.descripcion, ac.orden_display, ac.is_active
                ORDER BY ac.orden_display, ac.nombre
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $areas = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            Response::success($areas, 'Áreas de competencia con estadísticas obtenidas');
        } catch (\Exception $e) {
            error_log('Error al obtener áreas con estadísticas: ' . $e->getMessage());
            Response::serverError('Error al obtener áreas con estadísticas');
        }
    }
}


