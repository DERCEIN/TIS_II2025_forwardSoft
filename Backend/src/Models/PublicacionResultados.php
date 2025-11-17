<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class PublicacionResultados
{
    private $db;
    private $table = 'publicacion_resultados';

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

    
    public function getPublicadas()
    {
        $sql = "SELECT pr.*, ac.nombre as area_nombre 
                FROM {$this->table} pr
                INNER JOIN areas_competencia ac ON ac.id = pr.area_competencia_id
                WHERE pr.publicado = true AND ac.is_active = true
                ORDER BY ac.nombre";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

   
    public function publicar($areaId, $userId, $observaciones = null)
    {
        $existing = $this->getByAreaId($areaId);
        
        if ($existing) {
            
            $sql = "UPDATE {$this->table} 
                    SET publicado = true,
                        publicado_por = ?,
                        fecha_publicacion = CURRENT_TIMESTAMP,
                        fecha_despublicacion = NULL,
                        observaciones = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE area_competencia_id = ?";
            $this->db->query($sql, [$userId, $observaciones, $areaId]);
            return $this->getByAreaId($areaId);
        } else {
            
            $sql = "INSERT INTO {$this->table} (
                        area_competencia_id,
                        publicado,
                        publicado_por,
                        fecha_publicacion,
                        observaciones
                    ) VALUES (?, true, ?, CURRENT_TIMESTAMP, ?)";
            $this->db->query($sql, [$areaId, $userId, $observaciones]);
            return $this->getByAreaId($areaId);
        }
    }

    
    public function despublicar($areaId, $userId, $observaciones = null)
    {
        $existing = $this->getByAreaId($areaId);
        
        if ($existing) {
            $sql = "UPDATE {$this->table} 
                    SET publicado = false,
                        fecha_despublicacion = CURRENT_TIMESTAMP,
                        observaciones = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE area_competencia_id = ?";
            $this->db->query($sql, [$observaciones, $areaId]);
            return $this->getByAreaId($areaId);
        }
        
        return null;
    }

    
    public function estaPublicada($areaId)
    {
        $result = $this->getByAreaId($areaId);
        return $result && $result['publicado'] === true;
    }
}

