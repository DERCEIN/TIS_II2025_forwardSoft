<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;
use PDO;
use PDOException;

class Desclasificacion
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
                INSERT INTO desclasificaciones 
                (inscripcion_area_id, regla_desclasificacion_id, motivo, evaluador_id, coordinador_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['inscripcion_area_id'],
                $data['regla_desclasificacion_id'],
                $data['motivo'],
                $data['evaluador_id'] ?? null,
                $data['coordinador_id'] ?? null
            ]);
            
            $desclasificacionId = $this->db->lastInsertId();
            
            
            $stmt = $this->db->prepare("
                UPDATE inscripciones_areas 
                SET estado = 'desclasificado'
                WHERE id = ?
            ");
            $stmt->execute([$data['inscripcion_area_id']]);
            
            $this->db->commit();
            return $desclasificacionId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al registrar desclasificación: " . $e->getMessage());
            throw new \Exception("Error al registrar desclasificación");
        }
    }

    
    public function getByInscripcion($inscripcionId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, rd.nombre_regla, rd.descripcion as regla_descripcion, rd.tipo,
                       u1.name as evaluador_nombre, u2.name as coordinador_nombre
                FROM desclasificaciones d
                JOIN reglas_desclasificacion rd ON rd.id = d.regla_desclasificacion_id
                LEFT JOIN users u1 ON u1.id = d.evaluador_id
                LEFT JOIN users u2 ON u2.id = d.coordinador_id
                WHERE d.inscripcion_area_id = ? AND d.estado = 'activa'
                ORDER BY d.fecha_desclasificacion DESC
            ");
            $stmt->execute([$inscripcionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener desclasificaciones: " . $e->getMessage());
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
                FROM desclasificaciones d
                JOIN reglas_desclasificacion rd ON rd.id = d.regla_desclasificacion_id
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
            
            $sql .= " ORDER BY d.fecha_desclasificacion DESC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener desclasificaciones por área: " . $e->getMessage());
            return [];
        }
    }

    
    public function revocar($id, $motivoRevocacion = null)
    {
        try {
            $this->db->beginTransaction();
            
            
            $stmt = $this->db->prepare("
                UPDATE desclasificaciones 
                SET estado = 'revocada', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            
            $stmt = $this->db->prepare("
                SELECT inscripcion_area_id FROM desclasificaciones WHERE id = ?
            ");
            $stmt->execute([$id]);
            $desclasificacion = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($desclasificacion) {
                
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) as count FROM desclasificaciones 
                    WHERE inscripcion_area_id = ? AND estado = 'activa'
                ");
                $stmt->execute([$desclasificacion['inscripcion_area_id']]);
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                
               
                if ($count == 0) {
                    $stmt = $this->db->prepare("
                        UPDATE inscripciones_areas 
                        SET estado = 'evaluado'
                        WHERE id = ?
                    ");
                    $stmt->execute([$desclasificacion['inscripcion_area_id']]);
                }
            }
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al revocar desclasificación: " . $e->getMessage());
            throw new \Exception("Error al revocar desclasificación");
        }
    }

   
    public function estaDesclasificado($inscripcionId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM desclasificaciones 
                WHERE inscripcion_area_id = ? AND estado = 'activa'
            ");
            $stmt->execute([$inscripcionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar desclasificación: " . $e->getMessage());
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
                FROM desclasificaciones d
                JOIN reglas_desclasificacion rd ON rd.id = d.regla_desclasificacion_id
                JOIN inscripciones_areas ia ON ia.id = d.inscripcion_area_id
                WHERE ia.area_competencia_id = ?
                GROUP BY rd.tipo
                ORDER BY total DESC
            ");
            $stmt->execute([$areaId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas de desclasificaciones: " . $e->getMessage());
            return [];
        }
    }
}
