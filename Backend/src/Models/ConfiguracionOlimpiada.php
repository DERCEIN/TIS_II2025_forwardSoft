<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class ConfiguracionOlimpiada
{
    private $db;
    private $table = 'configuracion_olimpiada';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    
    public function getConfiguracion()
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY id DESC LIMIT 1";
        $stmt = $this->db->query($sql);
        return $stmt->fetch();
    }

   
    public function create($data)
    {
        $sql = "
            INSERT INTO {$this->table} (
                nombre, descripcion, estado, 
                fecha_inicio, fecha_fin,
                clasificacion_fecha_inicio, clasificacion_fecha_fin,
                clasificacion_puntuacion_minima, clasificacion_puntuacion_maxima,
                final_fecha_inicio, final_fecha_fin,
                final_puntuacion_minima, final_puntuacion_maxima,
                tiempo_evaluacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";

        try {
            $stmt = $this->db->query($sql, [
                $data['nombre'] ?? 'Olimpiada Oh! SanSi',
                $data['descripcion'] ?? '',
                $data['estado'] ?? true,
                $data['fecha_inicio'] ?? date('Y-m-d'),
                $data['fecha_fin'] ?? date('Y-m-d', strtotime('+1 year')),
                $data['clasificacion_fecha_inicio'] ?? null,
                $data['clasificacion_fecha_fin'] ?? null,
                $data['clasificacion_puntuacion_minima'] ?? 51.00,
                $data['clasificacion_puntuacion_maxima'] ?? 100.00,
                $data['final_fecha_inicio'] ?? null,
                $data['final_fecha_fin'] ?? null,
                $data['final_puntuacion_minima'] ?? 0.00,
                $data['final_puntuacion_maxima'] ?? 100.00,
                $data['tiempo_evaluacion'] ?? 120
            ]);

            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear configuración: " . $e->getMessage());
            throw $e;
        }
    }

    
    public function updateConfiguracion($data)
    {
    
        $config = $this->getConfiguracion();
        if (!$config) {
            return $this->create($data);
        }

        $id = $config['id'];
        
        
        $setParts = [];
        $params = [];
        
        $fields = [
            'nombre', 'descripcion', 'estado',
            'fecha_inicio', 'fecha_fin',
            'clasificacion_fecha_inicio', 'clasificacion_fecha_fin',
            'clasificacion_puntuacion_minima', 'clasificacion_puntuacion_maxima',
            'final_fecha_inicio', 'final_fecha_fin',
            'final_puntuacion_minima', 'final_puntuacion_maxima',
            'tiempo_evaluacion'
        ];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $setParts[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        
        if (empty($setParts)) {
            return $id;
        }
        
        // Agregar updated_at
        $setParts[] = "updated_at = CURRENT_TIMESTAMP";
        
        $params[] = $id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $setParts) . " WHERE id = ?";

        try {
            error_log("SQL Update Config General: " . $sql);
            error_log("Params: " . json_encode($params));
            $stmt = $this->db->query($sql, $params);
            return $id;
        } catch (\Exception $e) {
            error_log("Error al actualizar configuración: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
}


