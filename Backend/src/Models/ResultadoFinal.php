<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class ResultadoFinal
{
    private $db;
    private $table = 'resultados_finales';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (inscripcion_area_id, fase, posicion, medalla, puntuacion_final, fecha_resultado, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['inscripcion_area_id'],
                $data['fase'],
                $data['posicion'],
                $data['medalla'],
                $data['puntuacion_final'],
                $data['fecha_resultado'] ?? date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear resultado final: " . $e->getMessage());
            return false;
        }
    }

    public function getByAreaAndLevel($areaId, $nivelId = null, $fase = 'premiacion')
    {
        $sql = "SELECT 
                    rf.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    d.nombre as departamento_nombre,
                    ue.nombre as unidad_educativa_nombre
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                WHERE ia.area_competencia_id = ? AND rf.fase = ?";
        
        $params = [$areaId, $fase];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " ORDER BY rf.posicion";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getByOlimpista($olimpistaId)
    {
        $sql = "SELECT 
                    rf.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                WHERE ia.olimpista_id = ?
                ORDER BY rf.fase, rf.posicion";
        
        $stmt = $this->db->query($sql, [$olimpistaId]);
        return $stmt->fetchAll();
    }

    public function getMedallero($areaId, $nivelId = null)
    {
        $sql = "SELECT 
                    rf.medalla,
                    COUNT(*) as cantidad
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                WHERE ia.area_competencia_id = ? AND rf.fase = 'premiacion'";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " GROUP BY rf.medalla
                  ORDER BY 
                    CASE rf.medalla 
                        WHEN 'oro' THEN 1 
                        WHEN 'plata' THEN 2 
                        WHEN 'bronce' THEN 3 
                        WHEN 'mencion_honor' THEN 4 
                        ELSE 5 
                    END";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getMedalleroCompleto($filters = [])
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    nc.nombre as nivel,
                    rf.medalla,
                    COUNT(*) as cantidad
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                WHERE rf.fase = 'premiacion'";
        
        $params = [];
        
        if (!empty($filters['area_id'])) {
            $sql .= " AND ia.area_competencia_id = ?";
            $params[] = $filters['area_id'];
        }
        
        if (!empty($filters['nivel_id'])) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $filters['nivel_id'];
        }
        
        $sql .= " GROUP BY ac.id, ac.nombre, nc.id, nc.nombre, rf.medalla
                  ORDER BY ac.nombre, nc.nombre, 
                    CASE rf.medalla 
                        WHEN 'oro' THEN 1 
                        WHEN 'plata' THEN 2 
                        WHEN 'bronce' THEN 3 
                        WHEN 'mencion_honor' THEN 4 
                        ELSE 5 
                    END";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getRankingByArea($areaId, $nivelId = null, $fase = 'premiacion')
    {
        $sql = "SELECT 
                    rf.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    d.nombre as departamento_nombre,
                    ue.nombre as unidad_educativa_nombre
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                WHERE ia.area_competencia_id = ? AND rf.fase = ?";
        
        $params = [$areaId, $fase];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " ORDER BY rf.posicion
                  LIMIT 10";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getPremiadosByArea()
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    COUNT(rf.id) as premiados
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                WHERE rf.fase = 'premiacion' AND rf.medalla != 'sin_medalla'
                GROUP BY ac.id, ac.nombre
                ORDER BY premiados DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getPremiadosByDepartamento()
    {
        $sql = "SELECT 
                    d.nombre as departamento,
                    COUNT(rf.id) as premiados
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE rf.fase = 'premiacion' AND rf.medalla != 'sin_medalla'
                GROUP BY d.id, d.nombre
                ORDER BY premiados DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getMedallasByArea()
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    rf.medalla,
                    COUNT(*) as cantidad
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                WHERE rf.fase = 'premiacion'
                GROUP BY ac.id, ac.nombre, rf.medalla
                ORDER BY ac.nombre, 
                    CASE rf.medalla 
                        WHEN 'oro' THEN 1 
                        WHEN 'plata' THEN 2 
                        WHEN 'bronce' THEN 3 
                        WHEN 'mencion_honor' THEN 4 
                        ELSE 5 
                    END";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getMedallasByDepartamento()
    {
        $sql = "SELECT 
                    d.nombre as departamento,
                    rf.medalla,
                    COUNT(*) as cantidad
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                WHERE rf.fase = 'premiacion'
                GROUP BY d.id, d.nombre, rf.medalla
                ORDER BY d.nombre, 
                    CASE rf.medalla 
                        WHEN 'oro' THEN 1 
                        WHEN 'plata' THEN 2 
                        WHEN 'bronce' THEN 3 
                        WHEN 'mencion_honor' THEN 4 
                        ELSE 5 
                    END";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getReporteResultados($filters = [])
    {
        $sql = "SELECT 
                    rf.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    d.nombre as departamento_nombre,
                    ue.nombre as unidad_educativa_nombre
                FROM {$this->table} rf
                LEFT JOIN inscripciones_areas ia ON rf.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN departamentos d ON o.departamento_id = d.id
                LEFT JOIN unidad_educativa ue ON o.unidad_educativa_id = ue.id
                WHERE 1=1";
        
        $params = [];
        
        if (!empty($filters['area_id'])) {
            $sql .= " AND ia.area_competencia_id = ?";
            $params[] = $filters['area_id'];
        }
        
        if (!empty($filters['nivel_id'])) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $filters['nivel_id'];
        }
        
        if (!empty($filters['fase'])) {
            $sql .= " AND rf.fase = ?";
            $params[] = $filters['fase'];
        }
        
        if (!empty($filters['medalla'])) {
            $sql .= " AND rf.medalla = ?";
            $params[] = $filters['medalla'];
        }
        
        $sql .= " ORDER BY rf.fase, rf.posicion";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}
