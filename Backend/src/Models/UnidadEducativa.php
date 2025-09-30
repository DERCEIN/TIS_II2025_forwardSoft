<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class UnidadEducativa
{
    private $db;
    private $table = 'unidad_educativa';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (nombre, codigo, departamento_id, direccion, telefono, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['nombre'],
                $data['codigo'] ?? null,
                $data['departamento_id'],
                $data['direccion'] ?? null,
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                date('Y-m-d H:i:s')
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear unidad educativa: " . $e->getMessage());
            return false;
        }
    }

    public function findByName($nombre)
    {
        $sql = "SELECT * FROM {$this->table} WHERE nombre ILIKE ?";
        $stmt = $this->db->query($sql, [$nombre]);
        return $stmt->fetch();
    }

    public function getAll()
    {
        $sql = "SELECT 
                    ue.*,
                    d.nombre as departamento_nombre
                FROM {$this->table} ue
                LEFT JOIN departamentos d ON ue.departamento_id = d.id
                WHERE ue.is_active = true
                ORDER BY ue.nombre";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}
