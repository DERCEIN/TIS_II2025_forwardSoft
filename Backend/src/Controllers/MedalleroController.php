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
            Response::json($areas, 200);
        } catch (\Exception $e) {
            Response::json(['error' => 'Error retrieving areas'], 500);
        }
    }

    public function getMedallero() {
        try {
            $data = $this->medalleroModel->getMedalleroData();
            Response::json($data, 200);
        } catch (\Exception $e) {
            Response::json(['error' => 'Error retrieving medallero'], 500);
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




}