<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class ConfiguracionAreaEvaluacion
{
    private $db;
    private $table = 'configuracion_areas_evaluacion';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

   
    public function getByAreaId($areaId)
    {
        $sql = "SELECT * FROM {$this->table} WHERE area_competencia_id = ?";
        $stmt = $this->db->query($sql, [$areaId]);
        return $stmt->fetch();
    }

    
    public function getAllWithAreaInfo()
    {
        $sql = "
            SELECT 
                cae.*,
                ac.nombre AS area_nombre,
                ac.descripcion AS area_descripcion
            FROM {$this->table} cae
            INNER JOIN areas_competencia ac ON ac.id = cae.area_competencia_id
            WHERE ac.is_active = true
            ORDER BY ac.orden_display, ac.nombre
        ";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getCronogramaPublico()
    {
        $sql = "
            SELECT 
                ac.id AS area_competencia_id,
                ac.nombre AS area_nombre,
                ac.descripcion AS area_descripcion,
                ac.orden_display,
                cae.periodo_evaluacion_inicio,
                cae.periodo_evaluacion_fin,
                cae.periodo_publicacion_inicio,
                cae.periodo_publicacion_fin,
                cae.tiempo_evaluacion_minutos,
                cae.periodo_evaluacion_final_inicio,
                cae.periodo_evaluacion_final_fin,
                cae.periodo_publicacion_final_inicio,
                cae.periodo_publicacion_final_fin,
                cae.tiempo_evaluacion_final_minutos
            FROM areas_competencia ac
            LEFT JOIN {$this->table} cae ON cae.area_competencia_id = ac.id
            WHERE ac.is_active = true
            ORDER BY 
                CASE WHEN cae.periodo_evaluacion_inicio IS NULL THEN 1 ELSE 0 END,
                cae.periodo_evaluacion_inicio,
                ac.orden_display,
                ac.nombre
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

   
    public function createOrUpdate($areaId, $data)
    {
        $existing = $this->getByAreaId($areaId);
        
        if ($existing) {
            return $this->update($areaId, $data);
        } else {
            return $this->create($areaId, $data);
        }
    }

    
    public function create($areaId, $data)
    {
        $sql = "
            INSERT INTO {$this->table} (
                area_competencia_id,
                tiempo_evaluacion_minutos,
                periodo_evaluacion_inicio,
                periodo_evaluacion_fin,
                periodo_publicacion_inicio,
                periodo_publicacion_fin,
                tiempo_evaluacion_final_minutos,
                periodo_evaluacion_final_inicio,
                periodo_evaluacion_final_fin,
                periodo_publicacion_final_inicio,
                periodo_publicacion_final_fin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";

        try {
            $stmt = $this->db->query($sql, [
                $areaId,
                $data['tiempo_evaluacion_minutos'] ?? 120,
                $data['periodo_evaluacion_inicio'] ?? null,
                $data['periodo_evaluacion_fin'] ?? null,
                $data['periodo_publicacion_inicio'] ?? null,
                $data['periodo_publicacion_fin'] ?? null,
                $data['tiempo_evaluacion_final_minutos'] ?? 120,
                $data['periodo_evaluacion_final_inicio'] ?? null,
                $data['periodo_evaluacion_final_fin'] ?? null,
                $data['periodo_publicacion_final_inicio'] ?? null,
                $data['periodo_publicacion_final_fin'] ?? null
            ]);

            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear configuración de área: " . $e->getMessage());
            throw $e;
        }
    }

    
    public function update($areaId, $data)
    {
        $setParts = [];
        $params = [];
        
        $fields = [
            'tiempo_evaluacion_minutos',
            'periodo_evaluacion_inicio',
            'periodo_evaluacion_fin',
            'periodo_publicacion_inicio',
            'periodo_publicacion_fin',
            'tiempo_evaluacion_final_minutos',
            'periodo_evaluacion_final_inicio',
            'periodo_evaluacion_final_fin',
            'periodo_publicacion_final_inicio',
            'periodo_publicacion_final_fin'
        ];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $setParts[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($setParts)) {
            return $this->getByAreaId($areaId);
        }
        
        // Agregar updated_at
        $setParts[] = "updated_at = CURRENT_TIMESTAMP";
        
        $params[] = $areaId;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $setParts) . " WHERE area_competencia_id = ?";

        try {
            error_log("SQL Update: " . $sql);
            error_log("Params: " . json_encode($params));
            $stmt = $this->db->query($sql, $params);
            return $this->getByAreaId($areaId);
        } catch (\Exception $e) {
            error_log("Error al actualizar configuración de área: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

   
    public function getByAreaIds($areaIds)
    {
        if (empty($areaIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($areaIds), '?'));
        $sql = "
            SELECT 
                cae.*,
                ac.nombre AS area_nombre
            FROM {$this->table} cae
            INNER JOIN areas_competencia ac ON ac.id = cae.area_competencia_id
            WHERE cae.area_competencia_id IN ($placeholders)
            ORDER BY cae.periodo_evaluacion_inicio
        ";
        
        $stmt = $this->db->query($sql, $areaIds);
        return $stmt->fetchAll();
    }

    
    public function validarChoquesHorarios($areaIds)
    {
        $configuraciones = $this->getByAreaIds($areaIds);
        $conflictos = [];
        
        
        if (count($configuraciones) < 2) {
            return [];
        }
        
        
        for ($i = 0; $i < count($configuraciones); $i++) {
            for ($j = $i + 1; $j < count($configuraciones); $j++) {
                $area1 = $configuraciones[$i];
                $area2 = $configuraciones[$j];
                
                
                $inicio1 = new \DateTime($area1['periodo_evaluacion_inicio']);
                $fin1 = clone $inicio1;
                $fin1->modify("+{$area1['tiempo_evaluacion_minutos']} minutes");
                
                $inicio2 = new \DateTime($area2['periodo_evaluacion_inicio']);
                $fin2 = clone $inicio2;
                $fin2->modify("+{$area2['tiempo_evaluacion_minutos']} minutes");
                
               
                if ($inicio1 < $fin2 && $inicio2 < $fin1) {
                    $conflictos[] = [
                        'area1_id' => $area1['area_competencia_id'],
                        'area1_nombre' => $area1['area_nombre'],
                        'area1_inicio' => $area1['periodo_evaluacion_inicio'],
                        'area1_tiempo' => $area1['tiempo_evaluacion_minutos'],
                        'area2_id' => $area2['area_competencia_id'],
                        'area2_nombre' => $area2['area_nombre'],
                        'area2_inicio' => $area2['periodo_evaluacion_inicio'],
                        'area2_tiempo' => $area2['tiempo_evaluacion_minutos']
                    ];
                }
            }
        }
        
        return $conflictos;
    }
}







