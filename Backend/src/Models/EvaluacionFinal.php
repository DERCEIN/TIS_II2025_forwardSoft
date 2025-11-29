<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class EvaluacionFinal
{
    private $db;
    private $table = 'evaluaciones_finales';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (inscripcion_area_id, evaluador_id, puntuacion, observaciones, fecha_evaluacion, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['inscripcion_area_id'],
                $data['evaluador_id'],
                $data['puntuacion'],
                $data['observaciones'] ?? null,
                $data['fecha_evaluacion'],
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear evaluación final: " . $e->getMessage());
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
            error_log("Error al actualizar evaluación final: " . $e->getMessage());
            return false;
        }
    }

    public function getByAreaAndLevel($areaId, $nivelId = null, $evaluadorId = null)
    {
        $sql = "SELECT 
                    ef.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ef
                LEFT JOIN inscripciones_areas ia ON ef.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ef.evaluador_id = u.id
                WHERE ia.area_competencia_id = ?";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        if ($evaluadorId) {
            $sql .= " AND ef.evaluador_id = ?";
            $params[] = $evaluadorId;
        }
        
        $sql .= " ORDER BY ef.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function getByInscripcion($inscripcionId)
    {
        $sql = "SELECT 
                    ef.*,
                    u.name as evaluador_nombre
                FROM {$this->table} ef
                LEFT JOIN users u ON ef.evaluador_id = u.id
                WHERE ef.inscripcion_area_id = ?
                ORDER BY ef.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, [$inscripcionId]);
        return $stmt->fetchAll();
    }

    public function getByOlimpista($olimpistaId)
    {
        $sql = "SELECT 
                    ef.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ef
                LEFT JOIN inscripciones_areas ia ON ef.inscripcion_area_id = ia.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ef.evaluador_id = u.id
                WHERE ia.olimpista_id = ?
                ORDER BY ef.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, [$olimpistaId]);
        return $stmt->fetchAll();
    }

    public function calcularPremiados($areaId, $nivelId = null, $medalleroConfig = null)
    {
        $sql = "SELECT 
                    ia.id as inscripcion_area_id,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    o.grado_escolaridad,
                    AVG(ef.puntuacion) as puntuacion_final,
                    COUNT(ef.id) as total_evaluaciones
                FROM inscripciones_areas ia
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN {$this->table} ef ON ia.id = ef.inscripcion_area_id
                WHERE ia.area_competencia_id = ? AND ia.estado = 'clasificado'";
        
        $params = [$areaId];
        
        if ($nivelId) {
            $sql .= " AND ia.nivel_competencia_id = ?";
            $params[] = $nivelId;
        }
        
        $sql .= " GROUP BY ia.id, o.nombre_completo, o.documento_identidad, o.grado_escolaridad
                  HAVING COUNT(ef.id) > 0
                  ORDER BY o.grado_escolaridad, puntuacion_final DESC";
        
        $stmt = $this->db->query($sql, $params);
        $resultados = $stmt->fetchAll();
        
       
        if ($medalleroConfig) {
           
            $resultadosPorGrado = [];
            foreach ($resultados as $resultado) {
                $grado = $resultado['grado_escolaridad'] ?? 'sin_grado';
                if (!isset($resultadosPorGrado[$grado])) {
                    $resultadosPorGrado[$grado] = [];
                }
                $resultadosPorGrado[$grado][] = $resultado;
            }
            
           
            $resultadosFinales = [];
            $medalleroModel = new \ForwardSoft\Models\ConfiguracionMedallero();
            
            foreach ($resultadosPorGrado as $grado => $participantesGrado) {
              
                $configGrado = null;
                if ($grado !== 'sin_grado') {
                    
                    $nivelId = null;
                    if (!empty($participantesGrado)) {
                        $sqlNivel = "SELECT ia.nivel_competencia_id 
                                     FROM inscripciones_areas ia 
                                     WHERE ia.id = ?";
                        $stmtNivel = $this->db->query($sqlNivel, [$participantesGrado[0]['inscripcion_area_id']]);
                        $nivelData = $stmtNivel->fetch();
                        $nivelId = $nivelData['nivel_competencia_id'] ?? null;
                    }
                    
                   
                    $configGrado = $medalleroModel->getByAreaAndLevel($areaId, $nivelId, $grado);
                }
                
               
                if (!$configGrado) {
                    $configGrado = $medalleroConfig;
                }
                
                $oro = $configGrado['oro'] ?? 1;
                $plata = $configGrado['plata'] ?? 1;
                $bronce = $configGrado['bronce'] ?? 1;
                $mencion = $configGrado['mencion_honor'] ?? 0;
                
                $posicion = 1;
                foreach ($participantesGrado as &$participante) {
                    if ($posicion <= $oro) {
                        $participante['medalla'] = 'oro';
                    } elseif ($posicion <= $oro + $plata) {
                        $participante['medalla'] = 'plata';
                    } elseif ($posicion <= $oro + $plata + $bronce) {
                        $participante['medalla'] = 'bronce';
                    } elseif ($posicion <= $oro + $plata + $bronce + $mencion) {
                        $participante['medalla'] = 'mencion_honor';
                    } else {
                        $participante['medalla'] = 'sin_medalla';
                    }
                    $posicion++;
                    $resultadosFinales[] = $participante;
                }
            }
            
            return $resultadosFinales;
        }
        
        return $resultados;
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

    public function getReporteEvaluaciones($filters = [])
    {
        $sql = "SELECT 
                    ef.*,
                    o.nombre_completo as olimpista_nombre,
                    o.documento_identidad as olimpista_documento,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre,
                    u.name as evaluador_nombre
                FROM {$this->table} ef
                LEFT JOIN inscripciones_areas ia ON ef.inscripcion_area_id = ia.id
                LEFT JOIN olimpistas o ON ia.olimpista_id = o.id
                LEFT JOIN areas_competencia ac ON ia.area_competencia_id = ac.id
                LEFT JOIN niveles_competencia nc ON ia.nivel_competencia_id = nc.id
                LEFT JOIN users u ON ef.evaluador_id = u.id
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
            $sql .= " AND ef.evaluador_id = ?";
            $params[] = $filters['evaluador_id'];
        }
        
        if (!empty($filters['fecha_desde'])) {
            $sql .= " AND ef.fecha_evaluacion >= ?";
            $params[] = $filters['fecha_desde'];
        }
        
        if (!empty($filters['fecha_hasta'])) {
            $sql .= " AND ef.fecha_evaluacion <= ?";
            $params[] = $filters['fecha_hasta'];
        }
        
        $sql .= " ORDER BY ef.fecha_evaluacion DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}
