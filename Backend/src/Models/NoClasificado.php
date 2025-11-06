<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;
use PDO;
use PDOException;

class NoClasificado
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
                INSERT INTO no_clasificados 
                (inscripcion_area_id, puntuacion, puntuacion_minima_requerida, motivo, evaluador_id, fase)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (inscripcion_area_id, fase) 
                DO UPDATE SET
                    puntuacion = EXCLUDED.puntuacion,
                    puntuacion_minima_requerida = EXCLUDED.puntuacion_minima_requerida,
                    motivo = EXCLUDED.motivo,
                    evaluador_id = EXCLUDED.evaluador_id,
                    updated_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([
                $data['inscripcion_area_id'],
                $data['puntuacion'],
                $data['puntuacion_minima_requerida'],
                $data['motivo'] ?? null,
                $data['evaluador_id'] ?? null,
                $data['fase'] ?? 'clasificacion'
            ]);
            
            $noClasificadoId = $this->db->lastInsertId();
            
            
            $stmt = $this->db->prepare("
                UPDATE inscripciones_areas 
                SET estado = 'no_clasificado'
                WHERE id = ?
            ");
            $stmt->execute([$data['inscripcion_area_id']]);
            
            $this->db->commit();
            return $noClasificadoId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al registrar no clasificado: " . $e->getMessage());
            throw new \Exception("Error al registrar no clasificado");
        }
    }

    
    public function getByInscripcion($inscripcionId, $fase = 'clasificacion')
    {
        try {
            $stmt = $this->db->prepare("
                SELECT nc.*, 
                       u.name as evaluador_nombre,
                       o.nombre_completo as participante_nombre,
                       o.documento_identidad,
                       ac.nombre as area_nombre,
                       ncomp.nombre as nivel_nombre
                FROM no_clasificados nc
                JOIN inscripciones_areas ia ON ia.id = nc.inscripcion_area_id
                JOIN olimpistas o ON o.id = ia.olimpista_id
                JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                JOIN niveles_competencia ncomp ON ncomp.id = ia.nivel_competencia_id
                LEFT JOIN users u ON u.id = nc.evaluador_id
                WHERE nc.inscripcion_area_id = ? AND nc.fase = ?
            ");
            $stmt->execute([$inscripcionId, $fase]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener no clasificado: " . $e->getMessage());
            return null;
        }
    }

    
    public function estaNoClasificado($inscripcionId, $fase = 'clasificacion')
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM no_clasificados 
                WHERE inscripcion_area_id = ? AND fase = ?
            ");
            $stmt->execute([$inscripcionId, $fase]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar no clasificado: " . $e->getMessage());
            return false;
        }
    }

    
    public function getEstadisticas($areaId, $fase = 'clasificacion')
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total,
                    AVG(nc.puntuacion) as promedio_puntuacion,
                    MIN(nc.puntuacion) as puntuacion_minima,
                    MAX(nc.puntuacion) as puntuacion_maxima,
                    COUNT(DISTINCT ia.nivel_competencia_id) as niveles_afectados
                FROM no_clasificados nc
                JOIN inscripciones_areas ia ON ia.id = nc.inscripcion_area_id
                WHERE ia.area_competencia_id = ? AND nc.fase = ?
            ");
            $stmt->execute([$areaId, $fase]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas de no clasificados: " . $e->getMessage());
            return [];
        }
    }

    
    public function eliminar($inscripcionId, $fase = 'clasificacion')
    {
        try {
            $this->db->beginTransaction();
            
            
            $stmt = $this->db->prepare("
                DELETE FROM no_clasificados 
                WHERE inscripcion_area_id = ? AND fase = ?
            ");
            $stmt->execute([$inscripcionId, $fase]);
            
           
            $stmt = $this->db->prepare("
                UPDATE inscripciones_areas 
                SET estado = 'evaluado'
                WHERE id = ? AND estado = 'no_clasificado'
            ");
            $stmt->execute([$inscripcionId]);
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error al eliminar no clasificado: " . $e->getMessage());
            throw new \Exception("Error al eliminar registro de no clasificado");
        }
    }
}

