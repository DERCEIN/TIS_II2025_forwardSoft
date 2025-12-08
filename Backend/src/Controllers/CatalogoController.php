<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
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
                    COALESCE(ac.permite_grupos, false) as permite_grupos,
                    COUNT(DISTINCT ia.olimpista_id) as participantes_count,
                    COUNT(DISTINCT CASE WHEN ea.is_active = true AND u.is_active = true THEN ea.user_id END) as evaluadores_count,
                    300 as capacidad
                FROM areas_competencia ac
                LEFT JOIN inscripciones_areas ia ON ia.area_competencia_id = ac.id
                LEFT JOIN evaluadores_areas ea ON ea.area_competencia_id = ac.id
                LEFT JOIN users u ON u.id = ea.user_id
                GROUP BY ac.id, ac.nombre, ac.descripcion, ac.orden_display, ac.is_active, ac.permite_grupos
                ORDER BY ac.is_active DESC, ac.orden_display, ac.nombre
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

    public function toggleAreaStatus()
    {
        try {
            $userData = JWTManager::getCurrentUser();
            if (!$userData || $userData['role'] !== 'admin') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id']) || !isset($data['is_active'])) {
                Response::error('ID y estado son requeridos', 400);
                return;
            }

            $pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
            $stmt = $pdo->prepare("UPDATE areas_competencia SET is_active = ? WHERE id = ?");
            $stmt->execute([$data['is_active'] ? 1 : 0, $data['id']]);

            if ($stmt->rowCount() > 0) {
                Response::success(null, $data['is_active'] ? 'Área activada exitosamente' : 'Área desactivada exitosamente');
            } else {
                Response::error('Área no encontrada', 404);
            }
        } catch (\Exception $e) {
            error_log('Error al cambiar estado del área: ' . $e->getMessage());
            Response::serverError('Error al cambiar estado del área: ' . $e->getMessage());
        }
    }

    public function togglePermiteGrupos()
    {
        try {
            $userData = JWTManager::getCurrentUser();
            if (!$userData || $userData['role'] !== 'admin') {
                Response::unauthorized('Acceso no autorizado');
                return;
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id']) || !isset($data['permite_grupos'])) {
                Response::error('ID y permite_grupos son requeridos', 400);
                return;
            }

            $pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
            
            // Verificar si la columna permite_grupos existe, si no, crearla
            try {
                $stmt = $pdo->prepare("UPDATE areas_competencia SET permite_grupos = ? WHERE id = ?");
                $stmt->execute([$data['permite_grupos'] ? 1 : 0, $data['id']]);
            } catch (\Exception $e) {
                // Si la columna no existe, crearla
                if (strpos($e->getMessage(), 'permite_grupos') !== false) {
                    $pdo->exec("ALTER TABLE areas_competencia ADD COLUMN IF NOT EXISTS permite_grupos BOOLEAN DEFAULT false");
                    $stmt = $pdo->prepare("UPDATE areas_competencia SET permite_grupos = ? WHERE id = ?");
                    $stmt->execute([$data['permite_grupos'] ? 1 : 0, $data['id']]);
                } else {
                    throw $e;
                }
            }

            if ($stmt->rowCount() > 0) {
                Response::success(null, $data['permite_grupos'] ? 'Permiso de grupos activado' : 'Permiso de grupos desactivado');
            } else {
                Response::error('Área no encontrada', 404);
            }
        } catch (\Exception $e) {
            error_log('Error al cambiar permiso de grupos: ' . $e->getMessage());
            Response::serverError('Error al cambiar permiso de grupos: ' . $e->getMessage());
        }
    }
}


