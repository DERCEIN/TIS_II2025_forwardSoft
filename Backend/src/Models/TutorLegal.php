<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class TutorLegal
{
    private $db;
    private $table = 'tutores_legales';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (nombre_completo, documento_identidad, telefono, email, direccion, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['nombre_completo'],
                $data['documento_identidad'],
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['direccion'] ?? null,
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear tutor legal: " . $e->getMessage());
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
            error_log("Error al actualizar tutor legal: " . $e->getMessage());
            return false;
        }
    }
}
