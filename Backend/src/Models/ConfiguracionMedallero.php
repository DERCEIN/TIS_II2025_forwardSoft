<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class ConfiguracionMedallero
{
    private $db;
    private $table = 'configuracion_medallero';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getByAreaAndLevel($areaId, $nivelId = null, $gradoEscolaridad = null)
    {
        
        if ($gradoEscolaridad) {
            $sql = "SELECT * FROM {$this->table} 
                    WHERE area_competencia_id = ? 
                    AND grado_escolaridad = ?";
            $params = [$areaId, $gradoEscolaridad];
            
            if ($nivelId) {
                $sql .= " AND nivel_competencia_id = ?";
                $params[] = $nivelId;
            } else {
                $sql .= " AND nivel_competencia_id IS NULL";
            }
            
            $stmt = $this->db->query($sql, $params);
            $result = $stmt->fetch();
            
           
            if ($result) {
                return $result;
            }
        }
        
       
        $sql = "SELECT * FROM {$this->table} 
                WHERE area_competencia_id = ? 
                AND (grado_escolaridad IS NULL OR grado_escolaridad = '')";
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND nivel_competencia_id = ?";
            $params[] = $nivelId;
        } else {
            $sql .= " AND nivel_competencia_id IS NULL";
        }
        
        $sql .= " ORDER BY grado_escolaridad NULLS LAST LIMIT 1";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetch();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (area_competencia_id, nivel_competencia_id, oro, plata, bronce, mencion_honor, total_participantes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['area_competencia_id'],
                $data['nivel_competencia_id'] ?? null,
                $data['oro'] ?? 1,
                $data['plata'] ?? 1,
                $data['bronce'] ?? 1,
                $data['mencion_honor'] ?? 0,
                $data['total_participantes'] ?? null,
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear configuración de medallero: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $data)
    {
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "{$key} = ?";
                $values[] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, $values);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al actualizar configuración de medallero: " . $e->getMessage());
            return false;
        }
    }
}
