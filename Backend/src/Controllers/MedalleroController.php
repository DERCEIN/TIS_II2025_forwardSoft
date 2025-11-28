<?php
namespace ForwardSoft\Controllers;
use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\Medaller;
class MedalleroController {
    private $medalleroModel;
    public function __construct() {
        $this->medalleroModel = new Medaller();
    }

    public function getAreas() {
        try {
            $areas = $this->medalleroModel->getAreas();
            Response::success($areas, 'Áreas obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error al obtener áreas del medallero: " . $e->getMessage());
            Response::serverError('Error al obtener áreas: ' . $e->getMessage());
        }
    }

    public function getMedallero() {
        try {
            $data = $this->medalleroModel->getMedalleroData();
            Response::success($data, 'Datos del medallero obtenidos exitosamente');
        } catch (\Exception $e) {
            error_log("Error al obtener datos del medallero: " . $e->getMessage());
            Response::serverError('Error al obtener datos del medallero: ' . $e->getMessage());
        }
    }
public function updateMedallero($request = null)
{
    if (!$request) {
        $input = file_get_contents('php://input');
        $request = json_decode($input, true);
    }

    if (!$request || !is_array($request)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        exit;
    }

    $allUpdated = true;
    foreach ($request as $medallero) {
        // ahora aceptamos id_medallero o id
        $id = $medallero['id_medallero'] ?? $medallero['id'] ?? null;
        if (!$id) continue;

        $updated = $this->medalleroModel->updateMedallero($id, $medallero);
        if (!$updated) $allUpdated = false;
    }

    echo json_encode([
        'success' => $allUpdated,
        'message' => $allUpdated ? 'Medallero modificado correctamente' : 'Error al modificar uno o más medalleros'
    ]);
    exit;
}
public function getAreasNombre(){
    try {
        $areas = $this->medalleroModel->getAreasNombre();
        Response::success($areas, 'Nombres de áreas obtenidos exitosamente');
    } catch (\Exception $e) {
        error_log("Error al obtener nombres de áreas: " . $e->getMessage());
        Response::serverError('Error al obtener nombres de áreas: ' . $e->getMessage());
    }
}

public function getOlimpistasFinales(){
    try {
        // Suponiendo que existe un método en el modelo para obtener los olimpistas finales
        $olimpistas = $this->medalleroModel->getOlimpistasFinales();
        Response::success($olimpistas, 'Olimpistas finales obtenidos exitosamente');
    } catch (\Exception $e) {
        error_log("Error al obtener olimpistas finales: " . $e->getMessage());
        Response::serverError('Error al obtener olimpistas finales: ' . $e->getMessage());
    }

}
public function getMedalleroFinal($tipo = "todo", $area = null, $nivel = null) {

    $configuraciones = $this->medalleroModel->getMedalleroFinal();
    $olimpistas = $this->medalleroModel->getOlimpistasFinales();
    $configPublicacion = $this->medalleroModel->getConfiguracionPublicacionFinal();

    // Indexar configuraciones por [area][nivel]
    $cfgIndex = [];
    foreach ($configuraciones as $c) {
        $cfgIndex[$c['area_nombre']][$c['nivel_nombre']] = $c;
    }

    $responseOlimpistas = [];
    foreach ($olimpistas as $o) {
        $areaO = $o['area'];
        $nivelO = $o['nivel'];
        // Filtros según el tipo de publicación
        if ($tipo === "area" && $area !== $areaO) continue;
        if ($tipo === "nivel" && $nivel !== $nivelO) continue;
        if ($tipo === "area-nivel" && ($area !== $areaO || $nivel !== $nivelO)) continue;

        if (!isset($cfgIndex[$areaO][$nivelO])) continue;

        $cfg = $cfgIndex[$areaO][$nivelO];

        $puntaje = $o['puntuacion'];
        $pos = $o['posicion'];

        $medalla = null;
        $tieneHonor = false;

        // ORO
        if ($puntaje >= $cfg['oro_min'] && $puntaje <= $cfg['oro_max']) {
            if ($pos <= $cfg['oro']) $medalla = "Oro";
            else $tieneHonor = true;
        }
        // PLATA
        elseif ($puntaje >= $cfg['plata_min'] && $puntaje <= $cfg['plata_max']) {
            if ($pos <= $cfg['plata']) $medalla = "Plata";
            else $tieneHonor = true;
        }
        // BRONCE
        elseif ($puntaje >= $cfg['bronce_min'] && $puntaje <= $cfg['bronce_max']) {
            if ($pos <= $cfg['bronce']) $medalla = "Bronce";
            else $tieneHonor = true;
        }

        $responseOlimpistas[] = [
            "id" => $o['id'],
            "nombre" => $o['olimpista'],
            "area" => $areaO,
            "nivel" => $nivelO,
            "calificacion" => $puntaje,
            "posicion" => intval($pos),
            "medalla" => $medalla,
            "tieneHonor" => $tieneHonor
        ];
    }

    $resultado = [
        "id" => uniqid(),
        "tipo" => $tipo,
        "area" => $area,
        "nivel" => $nivel,
        "olimpistas" => $responseOlimpistas,
        "configPublicacion" => $configPublicacion,
        "fechaPublicacion" => date('c'),  // ISO8601 para frontend
    ];

    // Debug: imprimir resultado completo
    header('Content-Type: application/json');
    echo json_encode($resultado);
    exit;
}

}