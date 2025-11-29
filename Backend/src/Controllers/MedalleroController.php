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

public function getMedalleroFinal() {
    try {
        
        $tipo = $_GET['tipo'] ?? "todo";
        $area = $_GET['area'] ?? null;
        $nivel = $_GET['nivel'] ?? null;

        
        $configuraciones = $this->medalleroModel->getMedalleroFinal();
        
        
        $olimpistas = $this->medalleroModel->getOlimpistasFinales();
        
        
        $configPublicacion = $this->medalleroModel->getConfiguracionPublicacionFinal();

        
        $cfgIndex = [];
        foreach ($configuraciones as $c) {
            $cfgIndex[$c['area_nombre']][$c['nivel_nombre']] = $c;
        }

       
        $participantesPorAreaNivel = [];
        foreach ($olimpistas as $o) {
            $areaO = $o['area'];
            $nivelO = $o['nivel'];
            
           
            if ($tipo === "area" && $area !== $areaO) continue;
            if ($tipo === "nivel" && $nivel !== $nivelO) continue;
            if ($tipo === "area-nivel" && ($area !== $areaO || $nivel !== $nivelO)) continue;

            
            if (!isset($cfgIndex[$areaO][$nivelO])) continue;

            $key = $areaO . '|' . $nivelO;
            if (!isset($participantesPorAreaNivel[$key])) {
                $participantesPorAreaNivel[$key] = [];
            }
            $participantesPorAreaNivel[$key][] = $o;
        }

        $responseOlimpistas = [];
        
        
        foreach ($participantesPorAreaNivel as $key => $participantes) {
            if (empty($participantes)) continue;
            
            $areaO = $participantes[0]['area'];
            $nivelO = $participantes[0]['nivel'];
            $cfg = $cfgIndex[$areaO][$nivelO];

           
            $cantidadOro = isset($cfg['oro']) ? intval($cfg['oro']) : 0;
            $cantidadPlata = isset($cfg['plata']) ? intval($cfg['plata']) : 0;
            $cantidadBronce = isset($cfg['bronce']) ? intval($cfg['bronce']) : 0;
            
           
            $rangosConfigurados = isset($cfg['oro_min']) && $cfg['oro_min'] !== null && $cfg['oro_min'] !== '' &&
                                  isset($cfg['oro_max']) && $cfg['oro_max'] !== null && $cfg['oro_max'] !== '' &&
                                  isset($cfg['plata_min']) && $cfg['plata_min'] !== null && $cfg['plata_min'] !== '' &&
                                  isset($cfg['plata_max']) && $cfg['plata_max'] !== null && $cfg['plata_max'] !== '' &&
                                  isset($cfg['bronce_min']) && $cfg['bronce_min'] !== null && $cfg['bronce_min'] !== '' &&
                                  isset($cfg['bronce_max']) && $cfg['bronce_max'] !== null && $cfg['bronce_max'] !== '';

            if ($rangosConfigurados) {
              
                $oroMin = floatval($cfg['oro_min']);
                $oroMax = floatval($cfg['oro_max']);
                $plataMin = floatval($cfg['plata_min']);
                $plataMax = floatval($cfg['plata_max']);
                $bronceMin = floatval($cfg['bronce_min']);
                $bronceMax = floatval($cfg['bronce_max']);

                
                $oroMinNormalizado = min($oroMin, $oroMax);
                $oroMaxNormalizado = max($oroMin, $oroMax);
                $plataMinNormalizado = min($plataMin, $plataMax);
                $plataMaxNormalizado = max($plataMin, $plataMax);
                $bronceMinNormalizado = min($bronceMin, $bronceMax);
                $bronceMaxNormalizado = max($bronceMin, $bronceMax);
                
              
                $enRangoOro = [];
                $enRangoPlata = [];
                $enRangoBronce = [];
                
                foreach ($participantes as $o) {
                    $puntaje = floatval($o['puntuacion'] ?? 0);
                    $pos = intval($o['posicion'] ?? 0);
                    
                    $estaEnRangoOro = ($puntaje >= $oroMinNormalizado && $puntaje <= $oroMaxNormalizado);
                    $estaEnRangoPlata = ($puntaje >= $plataMinNormalizado && $puntaje <= $plataMaxNormalizado);
                    $estaEnRangoBronce = ($puntaje >= $bronceMinNormalizado && $puntaje <= $bronceMaxNormalizado);
                    
                   
                    if ($estaEnRangoOro) {
                        $enRangoOro[] = ['participante' => $o, 'puntaje' => $puntaje, 'posicion' => $pos];
                    } elseif ($estaEnRangoPlata) {
                        $enRangoPlata[] = ['participante' => $o, 'puntaje' => $puntaje, 'posicion' => $pos];
                    } elseif ($estaEnRangoBronce) {
                        $enRangoBronce[] = ['participante' => $o, 'puntaje' => $puntaje, 'posicion' => $pos];
                    }
                }
               
                usort($enRangoOro, function($a, $b) {
                    return $a['posicion'] <=> $b['posicion'];
                });
                usort($enRangoPlata, function($a, $b) {
                    return $a['posicion'] <=> $b['posicion'];
                });
                usort($enRangoBronce, function($a, $b) {
                    return $a['posicion'] <=> $b['posicion'];
                });
                
                
                $contadorOro = 0;
                $contadorPlata = 0;
                $contadorBronce = 0;
                
               
                foreach ($participantes as $o) {
                    $puntaje = floatval($o['puntuacion'] ?? 0);
                    $pos = intval($o['posicion'] ?? 0);
                    $medalla = null;
                    $tieneHonor = false;
                    
                    $estaEnRangoOro = ($puntaje >= $oroMinNormalizado && $puntaje <= $oroMaxNormalizado);
                    $estaEnRangoPlata = ($puntaje >= $plataMinNormalizado && $puntaje <= $plataMaxNormalizado);
                    $estaEnRangoBronce = ($puntaje >= $bronceMinNormalizado && $puntaje <= $bronceMaxNormalizado);
                    
                   
                    if ($estaEnRangoOro && $contadorOro < $cantidadOro) {
                        $medalla = "Oro";
                        $contadorOro++;
                    }
                    elseif ($estaEnRangoPlata && $contadorPlata < $cantidadPlata) {
                        $medalla = "Plata";
                        $contadorPlata++;
                    }
                    elseif ($estaEnRangoBronce && $contadorBronce < $cantidadBronce) {
                        $medalla = "Bronce";
                        $contadorBronce++;
                    }
                    else {
                      
                        $tieneHonor = true;
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
            } else {
              
                foreach ($participantes as $o) {
                    $puntaje = floatval($o['puntuacion'] ?? 0);
                    $pos = intval($o['posicion'] ?? 0);
                    
                    $responseOlimpistas[] = [
                        "id" => $o['id'],
                        "nombre" => $o['olimpista'],
                        "area" => $areaO,
                        "nivel" => $nivelO,
                        "calificacion" => $puntaje,
                        "posicion" => intval($pos),
                        "medalla" => null,
                        "tieneHonor" => true
                    ];
                }
            }
        }

        $resultado = [
            "id" => uniqid(),
            "tipo" => $tipo,
            "area" => $area,
            "nivel" => $nivel,
            "olimpistas" => $responseOlimpistas,
            "configPublicacion" => $configPublicacion,
            "fechaPublicacion" => date('c'), 
        ];

       
        Response::success($resultado, 'Medallero final obtenido exitosamente');
    } catch (\Exception $e) {
        error_log("Error al obtener medallero final: " . $e->getMessage());
        Response::serverError('Error al obtener medallero final: ' . $e->getMessage());
    }
}

}