<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class InscripcionArea
{
    private $db;
    private $table = 'inscripciones_areas';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (olimpista_id, area_competencia_id, nivel_competencia_id, es_grupo, nombre_grupo, integrantes_grupo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['olimpista_id'],
                $data['area_competencia_id'],
                $data['nivel_competencia_id'],
                $data['es_grupo'] ? 1 : 0,
                $data['nombre_grupo'] ?? null,
                $data['integrantes_grupo'] ?? null,
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear inscripción: " . $e->getMessage());
            return false;
        }
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }

    public function getById($id)
    {
        return $this->findById($id);
    }

    public function findByOlimpistaAndAreaAndLevel($olimpistaId, $areaId, $nivelId)
    {
        $sql = "SELECT * FROM {$this->table} WHERE olimpista_id = ? AND area_competencia_id = ? AND nivel_competencia_id = ?";
        $stmt = $this->db->query($sql, [$olimpistaId, $areaId, $nivelId]);
        return $stmt->fetch();
    }

    public function getByOlimpista($olimpistaId)
    {
        $sql = "SELECT 
                    ia.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre
                FROM {$this->table} ia
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                WHERE ia.olimpista_id = ?
                ORDER BY ac.nombre, nc.nombre";
        
        $stmt = $this->db->query($sql, [$olimpistaId]);
        return $stmt->fetchAll();
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
            error_log("Error al actualizar inscripción: " . $e->getMessage());
            return false;
        }
    }

    public function getTotalCount()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getCountByArea()
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    COUNT(ia.id) as total
                FROM {$this->table} ia
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                GROUP BY ac.id, ac.nombre
                ORDER BY total DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getCountByLevel()
    {
        $sql = "SELECT 
                    nc.nombre as nivel,
                    COUNT(ia.id) as total
                FROM {$this->table} ia
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                GROUP BY nc.id, nc.nombre
                ORDER BY total DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getCountByEstado()
    {
        $sql = "SELECT 
                    estado,
                    COUNT(id) as total
                FROM {$this->table}
                GROUP BY estado
                ORDER BY total DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getClasificadosByArea()
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    COUNT(ia.id) as clasificados
                FROM {$this->table} ia
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                WHERE ia.estado IN ('clasificado', 'premiado')
                GROUP BY ac.id, ac.nombre
                ORDER BY clasificados DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getClasificadosByDepartamento()
    {
        $sql = "SELECT 
                    d.nombre as departamento,
                    COUNT(ia.id) as clasificados
                FROM {$this->table} ia
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE ia.estado IN ('clasificado', 'premiado')
                GROUP BY d.id, d.nombre
                ORDER BY clasificados DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getReporteInscripciones($filters = [])
    {
        $sql = "SELECT 
                    ia.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    d.nombre as departamento_nombre,
                    ue.nombre as unidad_educativa_nombre
                FROM {$this->table} ia
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                WHERE o.is_active = true";
        
        $params = [];
        
        if (!empty($filters['area_id'])) {
            $sql .= " AND ia.area_competencia_id = ?";
            $params[] = $filters['area_id'];
        }
        
        if (!empty($filters['nivel_id'])) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $filters['nivel_id'];
        }
        
        if (!empty($filters['departamento_id'])) {
            $sql .= " AND o.departamento_id = ?";
            $params[] = $filters['departamento_id'];
        }
        
        if (!empty($filters['estado'])) {
            $sql .= " AND ia.estado = ?";
            $params[] = $filters['estado'];
        }
        
        if (!empty($filters['fecha_desde'])) {
            $sql .= " AND ia.created_at >= ?";
            $params[] = $filters['fecha_desde'];
        }
        
        if (!empty($filters['fecha_hasta'])) {
            $sql .= " AND ia.created_at <= ?";
            $params[] = $filters['fecha_hasta'];
        }
        
        $sql .= " ORDER BY ia.created_at DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}
