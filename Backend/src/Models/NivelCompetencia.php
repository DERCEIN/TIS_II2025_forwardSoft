<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class NivelCompetencia
{
    private $db;
    private $table = 'niveles_competencia';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByName($nombre)
    {
        $sql = "SELECT * FROM {$this->table} WHERE nombre ILIKE ?";
        $stmt = $this->db->query($sql, [$nombre]);
        return $stmt->fetch();
    }

    public function getAll()
    {
        $sql = "SELECT * FROM {$this->table} WHERE is_active = true ORDER BY orden_display, nombre";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}
