<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class EvaluacionClasificacion
{
    private $db;
    private $table = 'evaluaciones_clasificacion';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        
        $isFinal = false;
        error_log("EvaluacionClasificacion::create - is_final raw value: " . var_export($data['is_final'], true));
        error_log("EvaluacionClasificacion::create - is_final type: " . gettype($data['is_final']));
        
        if (isset($data['is_final'])) {
            if (is_bool($data['is_final'])) {
                $isFinal = $data['is_final'];
            } elseif (is_string($data['is_final']) && $data['is_final'] !== '') {
                $isFinal = in_array(strtolower($data['is_final']), ['true', '1', 'yes', 'on']);
            } elseif (is_numeric($data['is_final'])) {
                $isFinal = (bool)$data['is_final'];
            }
        }
        
        error_log("EvaluacionClasificacion::create - is_final converted: " . var_export($isFinal, true));

        
        $fields = ['inscripcion_area_id', 'evaluador_id', 'puntuacion', 'observaciones', 'fecha_evaluacion', 'is_final', 'created_at'];
        $values = [
            (int)$data['inscripcion_area_id'],
            (int)$data['evaluador_id'],
            (float)$data['puntuacion'],
            isset($data['observaciones']) && !empty(trim($data['observaciones'])) ? trim($data['observaciones']) : null,
            $data['fecha_evaluacion'],
            $isFinal ? 'true' : 'false', 
            date('Y-m-d H:i:s')
        ];
        
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") VALUES ({$placeholders})";
        
        error_log("EvaluacionClasificacion::create - SQL: " . $sql);
        error_log("EvaluacionClasificacion::create - Fields: " . print_r($fields, true));
        error_log("EvaluacionClasificacion::create - Values: " . print_r($values, true));
        
        try {
            $stmt = $this->db->query($sql, $values);
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear evaluación de clasificación: " . $e->getMessage());
            return false;
        }
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }

    public function findByInscripcionAndEvaluador($inscripcionId, $evaluadorId)
    {
        $sql = "SELECT * FROM {$this->table} WHERE inscripcion_area_id = ? AND evaluador_id = ?";
        $stmt = $this->db->query($sql, [$inscripcionId, $evaluadorId]);
        return $stmt->fetch();
    }

    public function update($id, $data)
    {
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "{$key} = ?";
                
                
                switch ($key) {
                    case 'inscripcion_area_id':
                    case 'evaluador_id':
                        $values[] = (int)$value;
                        break;
                    case 'puntuacion':
                        $values[] = (float)$value;
                        break;
                    case 'is_final':
                        
                        $isFinal = false;
                        if (is_bool($value)) {
                            $isFinal = $value;
                        } elseif (is_string($value) && $value !== '') {
                            $isFinal = in_array(strtolower($value), ['true', '1', 'yes', 'on']);
                        } elseif (is_numeric($value)) {
                            $isFinal = (bool)$value;
                        }
                        $values[] = $isFinal ? 'true' : 'false'; 
                        break;
                    default:
                        $values[] = $value;
                        break;
                }
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        
        $fields[] = "modificaciones_count = modificaciones_count + 1";
        
        $values[] = (int)$id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, $values);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al actualizar evaluación de clasificación: " . $e->getMessage());
            return false;
        }
    }

    public function getByAreaAndLevel($areaId, $nivelId = null, $evaluadorId = null)
    {
        $sql = "SELECT 
                    ec.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ec
                LEFT JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ec.evaluador_id = u.id
                WHERE ia.area_competencia_id = ?";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        if ($evaluadorId) {
            $sql .= " AND ec.evaluador_id = ?";
            $params[] = $evaluadorId;
        }
        
        $sql .= " ORDER BY ec.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getByInscripcion($inscripcionId)
    {
        $sql = "SELECT 
                    ec.*,
                    u.name as evaluador_nombre
                FROM {$this->table} ec
                LEFT JOIN users u ON ec.evaluador_id = u.id
                WHERE ec.inscripcion_area_id = ?
                ORDER BY ec.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, [$inscripcionId]);
        return $stmt->fetchAll();
    }

    public function getByOlimpista($olimpistaId)
    {
        $sql = "SELECT 
                    ec.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ec
                LEFT JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ec.evaluador_id = u.id
                WHERE ia.olimpista_id = ?
                ORDER BY ec.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, [$olimpistaId]);
        return $stmt->fetchAll();
    }

    public function calcularClasificados($areaId, $nivelId = null)
    {
        $sql = "SELECT 
                    ia.id as inscripcion_area_id,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    AVG(ec.puntuacion) as puntuacion_promedio,
                    COUNT(ec.id) as total_evaluaciones
                FROM inscripciones_areas ia
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN {$this->table} ec ON ia.id = ec.inscripcion_area_id
                WHERE ia.area_competencia_id = ? AND ia.estado = 'inscrito'";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " GROUP BY ia.id, o.nombre_completo, o.documento_identidad
                  HAVING COUNT(ec.id) > 0
                  ORDER BY puntuacion_promedio DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getCountPendientes()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE is_final = false";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getCountCompletadas()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE is_final = true";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getCountByEvaluador($evaluadorId)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE evaluador_id = ?";
        $stmt = $this->db->query($sql, [$evaluadorId]);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getPromedioByEvaluador($evaluadorId)
    {
        $sql = "SELECT AVG(puntuacion) as promedio FROM {$this->table} WHERE evaluador_id = ?";
        $stmt = $this->db->query($sql, [$evaluadorId]);
        $result = $stmt->fetch();
        return round($result['promedio'], 2);
    }

    public function getPromedioPuntuacionesByArea()
    {
        $sql = "SELECT 
                    ac.nombre as area,
                    AVG(ec.puntuacion) as promedio_puntuacion
                FROM {$this->table} ec
                LEFT JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                GROUP BY ac.id, ac.nombre
                ORDER BY promedio_puntuacion DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getReporteEvaluaciones($filters = [])
    {
        $sql = "SELECT 
                    ec.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ec
                LEFT JOIN inscripciones_areas ia ON ec.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ec.evaluador_id = u.id
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
        
        if (!empty($filters['evaluador_id'])) {
            $sql .= " AND ec.evaluador_id = ?";
            $params[] = $filters['evaluador_id'];
        }
        
        if (!empty($filters['fecha_desde'])) {
            $sql .= " AND ec.fecha_evaluacion >= ?";
            $params[] = $filters['fecha_desde'];
        }
        
        if (!empty($filters['fecha_hasta'])) {
            $sql .= " AND ec.fecha_evaluacion <= ?";
            $params[] = $filters['fecha_hasta'];
        }
        
        $sql .= " ORDER BY ec.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}
