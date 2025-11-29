<?php
namespace ForwardSoft\Models;
use ForwardSoft\Config\Database;
class Medaller{
    private $db;
    private $table = 'users';
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
     public function getMedalleroData()
    {
        $sql = "
            SELECT 
              c.id,
              a.nombre AS area_nombre,
              a.id As area_id,
              n.nombre AS nivel_nombre,
              n.id As nivel_id,
              c.oro, 
              c.oro_min, 
              c.oro_max,
              c.plata, 
              c.plata_min, 
              c.plata_max,
              c.bronce, 
              c.bronce_min, 
              c.bronce_max
            FROM configuracion_medallero c
            JOIN areas_competencia a ON c.area_competencia_id = a.id
            JOIN niveles_competencia n ON c.nivel_competencia_id = n.id
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    public function getAreas(){
        $sql="SELECT id,nombre FROM areas_competencia";
        $stmt = $this->db->query($sql); 
        return $stmt->fetchAll();
        
    }
  public function updateMedallero($id, $data)
{
    $allowedColumns = [
        'area_id' => 'area_competencia_id',
        'nivel_id' => 'nivel_competencia_id',
        'oro' => 'oro',
        'plata' => 'plata',
        'bronce' => 'bronce',
        'oro_min' => 'oro_min',
        'oro_max' => 'oro_max',
        'plata_min' => 'plata_min',
        'plata_max' => 'plata_max',
        'bronce_min' => 'bronce_min',
        'bronce_max' => 'bronce_max',
    ];

    $fields = [];
    $values = [];

    foreach ($data as $key => $value) {
        // ignoramos id_medallero y id
        if ($key === 'id' || $key === 'id_medallero') continue;
        if (!isset($allowedColumns[$key])) continue;

        $column = $allowedColumns[$key];
        $fields[] = "$column = ?";

        // convertir a int los campos numéricos
        if (str_contains($key, 'oro') || str_contains($key, 'plata') || str_contains($key, 'bronce')) {
            $values[] = (int)$value;
        } else {
            $values[] = $value;
        }
    }

    if (empty($fields)) return true;

    $values[] = (int)$id; // id de la fila
    $sql = "UPDATE configuracion_medallero SET " . implode(', ', $fields) . " WHERE id = ?";

    try {
        $stmt = $this->db->query($sql, $values);
        return $stmt !== false;
    } catch (\Exception $e) {
        error_log("Error al actualizar medallero: " . $e->getMessage());
        return false;
    }
}
public function getAreasNombre(){
    $sql="SELECT nombre FROM areas_competencia";
    $stmt = $this->db->query($sql); 
    return $stmt->fetchAll();
}
public function getOlimpistasFinales(){
    $sql="SELECT 
    o.id AS id,
    o.nombre || ' ' || o.apellido AS olimpista,
    a.nombre AS area,
    n.nombre AS nivel,
    e.puntuacion,
    ROW_NUMBER() OVER (
        PARTITION BY a.id, n.id
        ORDER BY e.puntuacion DESC
    ) AS posicion
FROM evaluaciones_finales e
JOIN inscripciones_areas i ON e.inscripcion_area_id = i.id
JOIN olimpistas o ON i.olimpista_id = o.id
JOIN areas_competencia a ON i.area_competencia_id = a.id
JOIN niveles_competencia n ON i.nivel_competencia_id = n.id
WHERE (e.observaciones = '' OR e.observaciones IS NULL)
ORDER BY a.id, n.id, posicion;

";        
    $stmt = $this->db->query($sql);
    $result= $stmt->fetchAll();
    return $result; 


}

public function getMedalleroFinal() {
    $sql = "SELECT 
    c.id, 
    a.nombre AS area_nombre, 
    n.nombre AS nivel_nombre,  
    c.oro, 
    c.plata, 
    c.bronce, 
    c.oro_min, 
    c.oro_max, 
    c.plata_min, 
    c.plata_max, 
    c.bronce_min, 
    c.bronce_max  
FROM configuracion_medallero c  
JOIN areas_competencia a ON c.area_competencia_id = a.id  
JOIN niveles_competencia n ON c.nivel_competencia_id = n.id;
";        
    $stmt = $this->db->query($sql);
    return $stmt->fetchAll();
}
public function getConfiguracionPublicacionFinal()
{
    $sql = "
        SELECT 
            a.nombre AS area_nombre,
            c.periodo_publicacion_final_inicio AS publicacion_inicio,
            c.periodo_publicacion_final_fin AS publicacion_fin
        FROM configuracion_areas_evaluacion c
        JOIN areas_competencia a ON a.id = c.area_competencia_id
    ";
    $stmt = $this->db->query($sql);
    return $stmt->fetchAll();
}

}