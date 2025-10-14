<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class Olimpista
{
    private $db;
    private $table = 'olimpistas';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (nombre, apellido, documento_identidad, fecha_nacimiento, telefono, email, grado_escolaridad, unidad_educativa, departamento, area_competencia, nivel_competencia, tutor_legal_id, tutor_academico_id, unidad_educativa_id, departamento_id, tutor_legal_nombre, tutor_legal_telefono, tutor_legal_email, tutor_academico_nombre, tutor_academico_telefono, tutor_academico_email, estado, migrado_desde_temp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['nombre'],
                $data['apellido'],
                $data['documento_identidad'],
                $data['fecha_nacimiento'] ?? null,
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['grado_escolaridad'],
                $data['unidad_educativa'],
                $data['departamento'],
                $data['area_competencia'],
                $data['nivel_competencia'],
                $data['tutor_legal_id'],
                $data['tutor_academico_id'],
                $data['unidad_educativa_id'],
                $data['departamento_id'],
                $data['tutor_legal_nombre'],
                $data['tutor_legal_telefono'] ?? null,
                $data['tutor_legal_email'] ?? null,
                $data['tutor_academico_nombre'] ?? null,
                $data['tutor_academico_telefono'] ?? null,
                $data['tutor_academico_email'] ?? null,
                $data['estado'] ?? 'activo',
                $data['migrado_desde_temp'] ?? false,
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear olimpista: " . $e->getMessage());
            return false;
        }
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }

    public function findByDocument($documento, $excludeId = null)
    {
        $sql = "SELECT * FROM {$this->table} WHERE documento_identidad = ?";
        $params = [$documento];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetch();
    }

    public function getByIdWithDetails($id)
    {
        $sql = "SELECT 
                    o.*,
                    tl.nombre_completo as tutor_legal_nombre,
                    tl.documento_identidad as tutor_legal_documento,
                    tl.telefono as tutor_legal_telefono,
                    tl.email as tutor_legal_email,
                    tl.direccion as tutor_legal_direccion,
                    ta.nombre_completo as tutor_academico_nombre,
                    ta.documento_identidad as tutor_academico_documento,
                    ta.telefono as tutor_academico_telefono,
                    ta.email as tutor_academico_email,
                    ta.especialidad as tutor_academico_especialidad,
                    ue.nombre as unidad_educativa_nombre,
                    ue.codigo as unidad_educativa_codigo,
                    d.nombre as departamento_nombre,
                    d.codigo as departamento_codigo
                FROM {$this->table} o
                LEFT JOIN tutores_legales tl ON o.tutor_legal_id = tl.id
                LEFT JOIN tutores_academicos ta ON o.tutor_academico_id = ta.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE o.id = ?";
        
        $stmt = $this->db->query($sql, [$id]);
        $olimpista = $stmt->fetch();
        
        if ($olimpista) {
            // Obtener inscripciones del olimpista
            $inscripcionesSql = "SELECT 
                                    ia.*,
                                    ac.nombre as area_nombre,
                                    nc.nombre as nivel_nombre
                                FROM inscripciones_areas ia
                                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                                WHERE ia.olimpista_id = ?";
            $inscripcionesStmt = $this->db->query($inscripcionesSql, [$id]);
            $olimpista['inscripciones'] = $inscripcionesStmt->fetchAll();
        }
        
        return $olimpista;
    }

    public function getAllWithFilters($filters = [])
    {
        try {
            // Primero verificar si la tabla olimpistas existe
            $checkTable = "SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'olimpistas'
            )";
            $tableExists = $this->db->query($checkTable)->fetchColumn();
            
            if (!$tableExists) {
                return [];
            }
            
            // Consulta simplificada sin JOINs problemáticos
            $sql = "SELECT 
                        o.*,
                        COALESCE(tl.nombre_completo, '') as tutor_legal_nombre,
                        COALESCE(ue.nombre, '') as unidad_educativa_nombre,
                        COALESCE(d.nombre, '') as departamento_nombre
                    FROM {$this->table} o
                    LEFT JOIN tutores_legales tl ON o.tutor_legal_id = tl.id
                    LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                    LEFT JOIN departamentos d ON o.departamento_id = d.id
                    WHERE o.is_active = true";
            
            $params = [];
            
            if (!empty($filters['search'])) {
                $sql .= " AND (o.nombre_completo ILIKE ? OR o.documento_identidad ILIKE ?)";
                $searchTerm = "%{$filters['search']}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if (!empty($filters['departamento_id'])) {
                $sql .= " AND o.departamento_id = ?";
                $params[] = $filters['departamento_id'];
            }
            
            $sql .= " ORDER BY o.created_at DESC";
            
            $stmt = $this->db->query($sql, $params);
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            error_log('Error en getAllWithFilters: ' . $e->getMessage());
            // Si hay error, intentar consulta básica
            try {
                $sql = "SELECT * FROM {$this->table} WHERE is_active = true ORDER BY created_at DESC";
                $stmt = $this->db->query($sql);
                return $stmt->fetchAll();
            } catch (\Exception $e2) {
                error_log('Error en consulta básica: ' . $e2->getMessage());
                return [];
            }
        }
    }

    public function getByAreaAndLevel($areaId, $nivelId = null)
    {
        $sql = "SELECT 
                    o.*,
                    ia.id as inscripcion_id,
                    ia.estado as inscripcion_estado,
                    ia.es_grupo,
                    ia.nombre_grupo,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    tl.nombre_completo as tutor_legal_nombre,
                    ue.nombre as unidad_educativa_nombre,
                    d.nombre as departamento_nombre
                FROM {$this->table} o
                INNER JOIN inscripciones_areas ia ON o.id = ia.olimpista_id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN tutores_legales tl ON o.tutor_legal_id = tl.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE ia.area_competencia_id = ? AND o.is_active = true";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " ORDER BY o.nombre_completo";
        
        $stmt = $this->db->query($sql, $params);
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
            error_log("Error al actualizar olimpista: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id)
    {
        $sql = "UPDATE {$this->table} SET is_active = false, updated_at = ? WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, [date('Y-m-d H:i:s'), $id]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al eliminar olimpista: " . $e->getMessage());
            return false;
        }
    }

    public function getTotalCount()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE is_active = true";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getCountByDepartamento()
    {
        $sql = "SELECT 
                    d.nombre as departamento,
                    COUNT(o.id) as total
                FROM {$this->table} o
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE o.is_active = true
                GROUP BY d.id, d.nombre
                ORDER BY total DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}
