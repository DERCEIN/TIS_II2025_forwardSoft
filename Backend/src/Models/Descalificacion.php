<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;
use PDO;
use PDOException;

class Descalificacion
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    
    public function create($data)
    {
        try {
            $this->db->beginTransaction();
            
            
            $stmt = $this->db->prepare("
                INSERT INTO descalificaciones 
                (inscripcion_area_id, regla_descalificacion_id, motivo, evaluador_id, coordinador_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['inscripcion_area_id'],
                $data['regla_descalificacion_id'],
                $data['motivo'],
                $data['evaluador_id'] ?? null,
                $data['coordinador_id'] ?? null
            ]);
            
            $descalificacionId = $this->db->lastInsertId();
            
            
            $stmt = $this->db->prepare("
                UPDATE inscripciones_areas 
                SET estado = 'descalificado'
                WHERE id = ?
            ");
            $stmt->execute([$data['inscripcion_area_id']]);
            
            $this->db->commit();
            return $descalificacionId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al registrar descalificación: " . $e->getMessage());
            throw new \Exception("Error al registrar descalificación");
        }
    }

    
    public function getByInscripcion($inscripcionId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, rd.nombre_regla, rd.descripcion as regla_descripcion, rd.tipo,
                       u1.name as evaluador_nombre, u2.name as coordinador_nombre
                FROM descalificaciones d
                JOIN reglas_descalificacion rd ON rd.id = d.regla_descalificacion_id
                LEFT JOIN users u1 ON u1.id = d.evaluador_id
                LEFT JOIN users u2 ON u2.id = d.coordinador_id
                WHERE d.inscripcion_area_id = ? AND d.estado = 'activa'
                ORDER BY d.fecha_descalificacion DESC
            ");
            $stmt->execute([$inscripcionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener descalificaciones: " . $e->getMessage());
            return [];
        }
    }

    
    public function getByArea($areaId, $filtros = [])
    {
        try {
            $sql = "
                SELECT d.*, rd.nombre_regla, rd.descripcion as regla_descripcion, rd.tipo,
                       ia.id as inscripcion_id, o.nombre as participante_nombre, o.documento,
                       ac.nombre as area_nombre, nc.nombre as nivel_nombre,
                       ue.nombre as unidad_educativa, d2.nombre as departamento,
                       u1.name as evaluador_nombre, u2.name as coordinador_nombre
                FROM descalificaciones d
                JOIN reglas_descalificacion rd ON rd.id = d.regla_descalificacion_id
                JOIN inscripciones_areas ia ON ia.id = d.inscripcion_area_id
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                JOIN unidad_educativa ue ON ue.id = o.unidad_educativa_id
                JOIN departamentos d2 ON d2.id = ue.departamento_id
                LEFT JOIN users u1 ON u1.id = d.evaluador_id
                LEFT JOIN users u2 ON u2.id = d.coordinador_id
                WHERE ac.id = ? AND d.estado = 'activa'
            ";
            
            $params = [$areaId];
            
            if (isset($filtros['tipo']) && !empty($filtros['tipo'])) {
                $sql .= " AND rd.tipo = ?";
                $params[] = $filtros['tipo'];
            }
            
            if (isset($filtros['nivel_id']) && !empty($filtros['nivel_id'])) {
                $sql .= " AND nc.id = ?";
                $params[] = $filtros['nivel_id'];
            }
            
            if (isset($filtros['departamento_id']) && !empty($filtros['departamento_id'])) {
                $sql .= " AND d2.id = ?";
                $params[] = $filtros['departamento_id'];
            }
            
            $sql .= " ORDER BY d.fecha_descalificacion DESC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener descalificaciones por área: " . $e->getMessage());
            return [];
        }
    }

    
    public function revocar($id, $motivoRevocacion = null)
    {
        try {
            $this->db->beginTransaction();
            
            
            $stmt = $this->db->prepare("
                UPDATE descalificaciones 
                SET estado = 'revocada', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            
            $stmt = $this->db->prepare("
                SELECT inscripcion_area_id FROM descalificaciones WHERE id = ?
            ");
            $stmt->execute([$id]);
            $descalificacion = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($descalificacion) {
                
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) as count FROM descalificaciones 
                    WHERE inscripcion_area_id = ? AND estado = 'activa'
                ");
                $stmt->execute([$descalificacion['inscripcion_area_id']]);
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                
               
                if ($count == 0) {
                    $stmt = $this->db->prepare("
                        UPDATE inscripciones_areas 
                        SET estado = 'evaluado'
                        WHERE id = ?
                    ");
                    $stmt->execute([$descalificacion['inscripcion_area_id']]);
                }
            }
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al revocar descalificación: " . $e->getMessage());
            throw new \Exception("Error al revocar descalificación");
        }
    }

   
    public function estaDescalificado($inscripcionId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM descalificaciones 
                WHERE inscripcion_area_id = ? AND estado = 'activa'
            ");
            $stmt->execute([$inscripcionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar descalificación: " . $e->getMessage());
            return false;
        }
    }

    
    public function getEstadisticas($areaId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    rd.tipo,
                    COUNT(*) as total,
                    COUNT(CASE WHEN d.estado = 'activa' THEN 1 END) as activas,
                    COUNT(CASE WHEN d.estado = 'revocada' THEN 1 END) as revocadas
                FROM descalificaciones d
                JOIN reglas_descalificacion rd ON rd.id = d.regla_descalificacion_id
                JOIN inscripciones_areas ia ON ia.id = d.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
                GROUP BY rd.tipo
                ORDER BY total DESC
            ");
            $stmt->execute([$areaId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas de descalificaciones: " . $e->getMessage());
            return [];
        }
    }
}
