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




}