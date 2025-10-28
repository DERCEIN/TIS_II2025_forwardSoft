<?php

namespace ForwardSoft\Models;
use ForwardSoft\Config\Database;

Class tiemposEvaluadores {
    private $db;
    private $table = 'permisos_evaluadores';
      public function __construct()
    {
        $this->db = Database::getInstance();
    }
    public function createTiempoEvaluador($data)
{
    $sql = "INSERT INTO {$this->table} 
        (coordinador_id, evaluador_id, start_date, start_time, duration_days, status) 
        VALUES (?, ?, ?, ?, ?, ?)";

    try {
        // Usar el método query() de Database que ya maneja prepare() y execute()
        $stmt = $this->db->query($sql, [
            $data['coordinador_id'],
            $data['evaluador_id'],
            $data['start_date'],   
            $data['start_time'],   
            $data['duration_days'],
            $data['status']
        ]);

        return $this->db->lastInsertId();
    } catch (\Exception $e) {
        error_log("Error al crear tiempo del evaluador: " . $e->getMessage());
        error_log("Datos enviados: " . print_r($data, true));
        error_log("Trace: " . $e->getTraceAsString());
        throw new \Exception("Error al crear tiempo del evaluador: " . $e->getMessage());
    }
}





}