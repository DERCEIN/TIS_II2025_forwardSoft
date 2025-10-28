<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;
use PDO;
use PDOException;

class ReglaDescalificacion
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener todas las reglas de descalificación por área
     */
    public function getByArea($areaId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT rd.*, ac.nombre as area_nombre
                FROM reglas_descalificacion rd
                JOIN areas_competencia ac ON ac.id = rd.area_competencia_id
                WHERE rd.area_competencia_id = ? AND rd.activa = true
                ORDER BY rd.tipo, rd.nombre_regla
            ");
            $stmt->execute([$areaId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener reglas de descalificación: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener regla por ID
     */
    public function getById($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT rd.*, ac.nombre as area_nombre
                FROM reglas_descalificacion rd
                JOIN areas_competencia ac ON ac.id = rd.area_competencia_id
                WHERE rd.id = ?
            ");
            $stmt->execute([$id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener regla de descalificación: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Obtener reglas por tipo
     */
    public function getByTipo($areaId, $tipo)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT rd.*, ac.nombre as area_nombre
                FROM reglas_descalificacion rd
                JOIN areas_competencia ac ON ac.id = rd.area_competencia_id
                WHERE rd.area_competencia_id = ? AND rd.tipo = ? AND rd.activa = true
                ORDER BY rd.nombre_regla
            ");
            $stmt->execute([$areaId, $tipo]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener reglas por tipo: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Crear nueva regla de descalificación
     */
    public function create($data)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO reglas_descalificacion 
                (area_competencia_id, nombre_regla, descripcion, tipo, activa)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['area_competencia_id'],
                $data['nombre_regla'],
                $data['descripcion'],
                $data['tipo'],
                $data['activa'] ?? true
            ]);
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error al crear regla de descalificación: " . $e->getMessage());
            throw new \Exception("Error al crear regla de descalificación");
        }
    }

    /**
     * Actualizar regla de descalificación
     */
    public function update($id, $data)
    {
        try {
            $fields = [];
            $values = [];
            
            foreach ($data as $key => $value) {
                if (in_array($key, ['nombre_regla', 'descripcion', 'tipo', 'activa'])) {
                    $fields[] = "$key = ?";
                    $values[] = $value;
                }
            }
            
            if (empty($fields)) {
                return false;
            }
            
            $fields[] = "updated_at = CURRENT_TIMESTAMP";
            $values[] = $id;
            
            $sql = "UPDATE reglas_descalificacion SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Error al actualizar regla de descalificación: " . $e->getMessage());
            throw new \Exception("Error al actualizar regla de descalificación");
        }
    }

    /**
     * Desactivar regla de descalificación
     */
    public function deactivate($id)
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE reglas_descalificacion 
                SET activa = false, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Error al desactivar regla de descalificación: " . $e->getMessage());
            throw new \Exception("Error al desactivar regla de descalificación");
        }
    }

    /**
     * Verificar si un participante debe ser descalificado por puntuación
     */
    public function verificarDescalificacionPuntuacion($areaId, $puntuacion)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT rd.*
                FROM reglas_descalificacion rd
                WHERE rd.area_competencia_id = ? 
                AND rd.tipo = 'puntuacion' 
                AND rd.activa = true
            ");
            $stmt->execute([$areaId]);
            $reglas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($reglas as $regla) {
                // Para reglas de puntuación, verificamos si la puntuación es menor al mínimo
                if (strpos($regla['descripcion'], 'menor a') !== false) {
                    preg_match('/menor a (\d+)/', $regla['descripcion'], $matches);
                    if (isset($matches[1]) && $puntuacion < (int)$matches[1]) {
                        return $regla;
                    }
                }
            }
            
            return null;
        } catch (PDOException $e) {
            error_log("Error al verificar descalificación por puntuación: " . $e->getMessage());
            return null;
        }
    }
}
