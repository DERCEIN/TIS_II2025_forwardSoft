<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class TutorAcademico
{
    private $db;
    private $table = 'tutores_academicos';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (nombre_completo, documento_identidad, telefono, email, especialidad, unidad_educativa_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['nombre_completo'],
                $data['documento_identidad'] ?? null,
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['especialidad'] ?? null,
                $data['unidad_educativa_id'],
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear tutor académico: " . $e->getMessage());
            return false;
        }
    }

    public function findByDocument($documento)
    {
        $sql = "SELECT * FROM {$this->table} WHERE documento_identidad = ?";
        $stmt = $this->db->query($sql, [$documento]);
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
            error_log("Error al actualizar tutor académico: " . $e->getMessage());
            return false;
        }
    }
}
