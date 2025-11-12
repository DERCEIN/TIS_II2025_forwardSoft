<?php

namespace ForwardSoft\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PDO;
use PDOException;
class Mailer
{
    private $mail;
    private $pdo;
    public function __construct()
    {
        $this->mail = new PHPMailer(true);
        $this->pdo = $this->getConnection();
        // Configuración SMTP (Gmail)
        $this->mail->isSMTP();
        $this->mail->Host       = 'smtp.gmail.com';
        $this->mail->SMTPAuth   = true;
        $this->mail->Username   = 'forwardsoft.official@gmail.com';
        $this->mail->Password   = 'dugtybsbpgirpudk'; // contraseña de aplicación
        $this->mail->SMTPSecure = 'tls';
        $this->mail->Port       = 587;
        $this->mail->CharSet    = 'UTF-8';
    }
    private function getConnection()
    {
        try {
            $pdo = new PDO(
                "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
                $_ENV['DB_USERNAME'],
                $_ENV['DB_PASSWORD']
            );
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }

    /**
     * Reinicializar PHPMailer para un nuevo correo
     */
    private function reinicializarMailer()
    {
        $this->mail->clearAddresses();
        $this->mail->clearAttachments();
        $this->mail->clearCustomHeaders();
        $this->mail->clearReplyTos();
        $this->mail->clearAllRecipients();
        $this->mail->clearBCCs();
        $this->mail->clearCCs();
        
        // Reinicializar configuración SMTP
        $this->mail->isSMTP();
        $this->mail->Host       = 'smtp.gmail.com';
        $this->mail->SMTPAuth   = true;
        $this->mail->Username   = 'forwardsoft.official@gmail.com';
        $this->mail->Password   = 'dugtybsbpgirpudk';
        $this->mail->SMTPSecure = 'tls';
        $this->mail->Port       = 587;
        $this->mail->CharSet    = 'UTF-8';
    }
    public function enviar($para, $asunto, $mensaje, $de = null, $nombre = null)
    {
        try {
            $this->mail->setFrom($de ?? 'forwardsoft.official@gmail.com', $nombre ?? 'Sistema Olimpiada Oh - SanSi');
            $this->mail->addAddress($para);
            $this->mail->isHTML(true);
            $this->mail->Subject = $asunto;

           
            $this->mail->Body = '
            <html>
            <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
              <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 0 8px rgba(0,0,0,0.1); overflow:hidden;">
                <div style="background-color:#004aad; color:#fff; text-align:center; padding:15px;">
                  <h2>Olimpiada Oh!- SanSi - Credenciales de Acceso</h2>
                </div>
                <div style="padding:20px; color:#333;">
                  ' . $mensaje . '
                </div>
                <div style="background-color:#f4f4f4; text-align:center; padding:10px; font-size:12px; color:#666;">
                  © ' . date('Y') . ' Olimpiada Oh! - SanSi. Todos los derechos reservados.
                </div>
              </div>
            </body>
            </html>';

            $this->mail->AltBody = strip_tags($mensaje);

            $this->mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Error al enviar correo: {$this->mail->ErrorInfo}");
            return false;
        }

    }
    public function enviarMensajeEvaluadoresCierre($area, $nombreCoordinador, $correoCoordinador)
    {
        
        
        try {
           
            if (empty($nombreCoordinador)) {
                
                return false;
            }

            if (empty($correoCoordinador) || !filter_var($correoCoordinador, FILTER_VALIDATE_EMAIL)) {
                return false;
            }

            
            $nombreArea = $this->encontrarAreaPorID($area);
            if (!$nombreArea) {
                $nombreArea = "Área ID: {$area}";
               
            }

            error_log("Enviando notificaciones de cierre - Área: {$nombreArea}, Coordinador: {$nombreCoordinador}");

           
            $evaluadores = $this->obtenerEvaluadoresPorArea($area);
            
            
            if (!empty($evaluadores)) {
                error_log("Lista de evaluadores: " . json_encode(array_map(function($e) {
                    return ['nombre' => $e['nombre'], 'email' => $e['email']];
                }, $evaluadores)));
            }

            if (empty($evaluadores)) {
                
                return true;
            }

            $emailsEnviados = 0;
            $errores = [];

            foreach ($evaluadores as $eval) {
                try {
                    
                    if (empty($eval['email']) || !filter_var($eval['email'], FILTER_VALIDATE_EMAIL)) {
                        error_log("Correo inválido del evaluador: " . ($eval['email'] ?? 'vacío'));
                        $errores[] = $eval['email'] ?? 'email desconocido';
                        continue;
                    }

                    if (empty($eval['nombre'])) {
                        error_log("Nombre vacío del evaluador con email: {$eval['email']}");
                        $errores[] = $eval['email'];
                        continue;
                    }

                   
                    $this->reinicializarMailer();
                    $this->mail->setFrom(
                        'forwardsoft.official@gmail.com',
                        'Sistema Olimpiada Oh - SanSi'
                    );
                    $this->mail->addAddress($eval['email'], $eval['nombre']);
                    $this->mail->isHTML(true);
                    $this->mail->Subject = "Cierre de Evaluaciones - Área: " . htmlspecialchars($nombreArea);

                    
                    $nombreEvaluadorEscapado = htmlspecialchars($eval['nombre']);
                    $nombreAreaEscapado = htmlspecialchars($nombreArea);
                    $nombreCoordinadorEscapado = htmlspecialchars($nombreCoordinador);
                    $correoCoordinadorEscapado = htmlspecialchars($correoCoordinador);

                    $mensaje = "
                        <p>Estimado(a) <b>{$nombreEvaluadorEscapado}</b>,</p>
                        <p>Le informamos que el proceso de <b>evaluación del área {$nombreAreaEscapado}</b> ha sido oficialmente cerrado por el coordinador <b>{$nombreCoordinadorEscapado}</b>.</p>
                        <p>Agradecemos su participación y compromiso en esta etapa de la Olimpiada Oh! - SanSi.</p>
                        <p>Si tiene alguna observación o requiere información adicional, puede comunicarse con el coordinador a su correo: <b>{$correoCoordinadorEscapado}</b></p>
                        <br>
                        <p>Atentamente,</p>
                        <p><b>{$nombreCoordinadorEscapado}</b><br>
                        <small>Coordinador del área {$nombreAreaEscapado}</small></p>
                    ";

                    $this->mail->Body = '
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
                      <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 0 8px rgba(0,0,0,0.1); overflow:hidden;">
                        <div style="background-color:#004aad; color:#fff; text-align:center; padding:15px;">
                          <h2>Notificación de Cierre de Evaluaciones</h2>
                        </div>
                        <div style="padding:20px; color:#333;">
                          ' . $mensaje . '
                        </div>
                        <div style="background-color:#f4f4f4; text-align:center; padding:10px; font-size:12px; color:#666;">
                          © ' . date('Y') . ' Olimpiada Oh! - SanSi. Todos los derechos reservados.
                        </div>
                      </div>
                    </body>
                    </html>';

                    $this->mail->AltBody = strip_tags($mensaje);
                    
                   
                    $enviado = $this->mail->send();
                    
                    if ($enviado) {
                        $emailsEnviados++;
                       
                    } else {
                        $errorInfo = $this->mail->ErrorInfo ?? 'Error desconocido';
                       
                        $errores[] = $eval['email'];
                    }
                } catch (Exception $e) {
                    $errorInfo = $this->mail->ErrorInfo ?? 'Error desconocido';
                   
                    $errores[] = $eval['email'];
                }
            }

            if ($emailsEnviados > 0) {
                error_log("Notificaciones enviadas: {$emailsEnviados} de " . count($evaluadores) . " evaluadores" . 
                         (!empty($errores) ? ". Errores en: " . implode(', ', $errores) : ''));
                return true;
            } else {
                error_log("No se pudieron enviar notificaciones a ningún evaluador. Errores: " . implode(', ', $errores));
                return false;
            }
        } catch (Exception $e) {
            error_log("Error general en enviarMensajeEvaluadoresCierre: " . $e->getMessage());
            return false;
        }
    }

    public function cerrarAreaComoAdministrador($areaId)
{   
    $nombreArea = $this->encontrarAreaPorID($areaId);
    $usuarios = $this->obtenerUsuariosNotificarPorArea($areaId);

    if (empty($usuarios)) {
        return "No hay usuarios para notificar en esta área.";
    }

    $emailsEnviados = 0;
    $errores = [];

    foreach ($usuarios as $user) {
        $mensaje = "
            <p>Estimado(a) <b>{$user['nombre']}</b>,</p>
            <p>Le informamos que el proceso de <b>evaluaciones del área {$nombreArea}</b> ha sido cerrado oficialmente por el Administrador General del sistema.</p>
            <p>Le agradecemos por su participación en esta etapa de la Olimpiada Oh! - SanSi.</p>
        ";

        if ($user['tipo'] === 'coordinador') {
            $mensaje .= "<p>Como coordinador del área, puede revisar el estado final y los resultados dentro del sistema.</p>";
        } else {
            $mensaje .= "<p>Como evaluador, ya no podrá realizar modificaciones a las evaluaciones asignadas.</p>";
        }

        $mensaje .= "
            <br><p>Atentamente,</p>
            <p><b>Administrador General</b><br>
            <small>Olimpiada Oh! - SanSi</small></p>
        ";

        
        $resultado = $this->enviar(
            $user['email'],                         
            "Cierre de Evaluaciones - Área: {$nombreArea}", 
            $mensaje,                              
            'forwardsoft.official@gmail.com',      
            'Administrador General - Olimpiada Oh! - SanSi' 
        );

        if ($resultado === true) {
            $emailsEnviados++;
        } else {
            $errores[] = $user['email'];
        }
    }

    if ($emailsEnviados > 0) {
        return "Área '{$nombreArea}' cerrada. Notificaciones enviadas a {$emailsEnviados} usuario(s)." . 
               (!empty($errores) ? " Errores al enviar a: " . implode(', ', $errores) : '');
    } else {
        return "Error: No se pudieron enviar las notificaciones para el área '{$nombreArea}'.";
    }
}
    public function enviarMensajeOtorgado($correo, $nombreDestinatario, $idArea, $nivel)
{
    try {
       
        if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            error_log("Correo inválido para enviar mensaje de nivel otorgado: {$correo}");
            return false;
        }

        if (empty($nombreDestinatario)) {
            error_log("Nombre del destinatario vacío para enviar mensaje de nivel otorgado");
            return false;
        }

       
        $nombreArea = $this->encontrarAreaPorID($idArea);
        
        
        if (!$nombreArea) {
            $nombreArea = "Área ID: {$idArea}";
            error_log("No se encontró nombre del área para ID: {$idArea}, usando valor por defecto");
        }

        error_log("Enviando notificación de nivel otorgado - Área: {$nombreArea}, Nivel: {$nivel}, Destinatario: {$correo}");

        $this->mail->clearAddresses();
        
        $this->mail->setFrom('forwardsoft.official@gmail.com', 'Sistema Olimpiada Oh - SanSi');
        $this->mail->addAddress($correo, $nombreDestinatario);

        $this->mail->isHTML(true);
        $this->mail->Subject = "Nivel Otorgado - Área: " . htmlspecialchars($nombreArea);
        
       
        $nombreDestinatarioEscapado = htmlspecialchars($nombreDestinatario);
        $nombreAreaEscapado = htmlspecialchars($nombreArea);
        $nivelEscapado = htmlspecialchars($nivel);
        
        $mensaje = "
            <p>Estimado(a) <b>{$nombreDestinatarioEscapado}</b>,</p>
            <p>Le informamos que en el área <b>{$nombreAreaEscapado}</b> se le ha asignado el siguiente nivel: <b>{$nivelEscapado}</b>.</p>
            <p>Agradecemos su participación y compromiso en la Olimpiada Oh! - SanSi.</p>
            <br>
            <p>Atentamente,</p>
            <p><b>Sistema Olimpiada Oh! - SanSi</b></p>
        ";
        
        $this->mail->Body = '
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 0 8px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="background-color:#004aad; color:#fff; text-align:center; padding:15px;">
              <h2>Notificación de Nivel Otorgado</h2>
            </div>
            <div style="padding:20px; color:#333;">
              ' . $mensaje . '
            </div>
            <div style="background-color:#f4f4f4; text-align:center; padding:10px; font-size:12px; color:#666;">
              © ' . date('Y') . ' Olimpiada Oh! - SanSi. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>';

        $this->mail->AltBody = strip_tags($mensaje);
        $this->mail->send();
        
        error_log("Correo de nivel otorgado enviado exitosamente a {$correo}");
        return true;
    } catch (Exception $e) {
        error_log("Error al enviar correo de nivel otorgado a {$correo}: {$this->mail->ErrorInfo} - " . $e->getMessage());
        return false;
    }
}

public function enviarMensajeEvaluadorTerminado($nombre, $correo, $idArea)
{
    try {
       
        $coordinador = $this->obtenerCoordinadorPorArea($idArea);
        $nombreArea = $this->encontrarAreaPorID($idArea);

        
        if (!$coordinador || !isset($coordinador['email']) || !isset($coordinador['nombre'])) {
            error_log("No se encontró coordinador para el área {$idArea}. No se puede enviar notificación.");
            return false;
        }

        
        if (!$nombreArea) {
            $nombreArea = "Área ID: {$idArea}";
        }

       
        $this->mail->clearAddresses();
        $this->mail->setFrom('forwardsoft.official@gmail.com', 'Sistema Olimpiada Oh - SanSi');
        $this->mail->addAddress($coordinador['email'], $coordinador['nombre']);
        $this->mail->isHTML(true);
        $this->mail->Subject = "Evaluador ha completado sus evaluaciones - Área: $nombreArea";

        
        $mensaje = "
            <p>Estimado(a) <b>{$coordinador['nombre']}</b>,</p>
            <p>Le informamos que el evaluador <b>" . htmlspecialchars($nombre) . "</b> ha completado todas sus evaluaciones asignadas en el área de <b>" . htmlspecialchars($nombreArea) . "</b>.</p>
            <p>Por favor, revise y valide los resultados correspondientes.</p>
            <br>
            <p>Si tiene alguna observación puede comunicarse con el evaluador directamente a su correo: <b>" . htmlspecialchars($correo) . "</b></p>
            <p>Atentamente,</p>
            <p><b>Sistema Olimpiada Oh! - SanSi</b></p>
        ";

        
        $this->mail->Body = '
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 0 8px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="background-color:#004aad; color:#fff; text-align:center; padding:15px;">
              <h2>Evaluador ha finalizado sus evaluaciones</h2>
            </div>
            <div style="padding:20px; color:#333;">
              ' . $mensaje . '
            </div>
            <div style="background-color:#f4f4f4; text-align:center; padding:10px; font-size:12px; color:#666;">
              © ' . date('Y') . ' Olimpiada Oh! - SanSi. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>';

        $this->mail->AltBody = strip_tags($mensaje);

        
        $this->mail->send();
        error_log("Correo enviado al coordinador {$coordinador['email']} sobre el evaluador {$nombre}");
        return true;

    } catch (\Exception $e) {
        error_log("Error al enviar mensaje de evaluador terminado: " . $e->getMessage());
        return false;
    }
}


public function obtenerCoordinadorPorArea($areaId)
{
    $query = "
        SELECT u.name AS nombre, u.email
        FROM users u
        JOIN responsables_academicos ra ON u.id = ra.user_id
        WHERE ra.area_competencia_id = :areaId
        LIMIT 1
    ";
    $stmt = $this->pdo->prepare($query);
    $stmt->bindParam(':areaId', $areaId);
    $stmt->execute();

    return $stmt->fetch(PDO::FETCH_ASSOC);
}
public function obtenerEvaluadoresPorArea($areaId)
{
    
    $query = "
        SELECT DISTINCT u.name AS nombre, u.email
        FROM users u
        JOIN evaluadores_areas ea ON ea.user_id = u.id
        WHERE ea.area_competencia_id = ?
        AND ea.is_active = true
        AND u.is_active = true
        AND u.role = 'evaluador'
    ";

    $stmt = $this->pdo->prepare($query);
    $stmt->execute([$areaId]);

    $evaluadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Evaluadores encontrados para área {$areaId} (todos los activos): " . count($evaluadores));
    
    if (!empty($evaluadores)) {
        error_log("Lista de evaluadores encontrados: " . json_encode(array_map(function($e) {
            return ['nombre' => $e['nombre'], 'email' => $e['email']];
        }, $evaluadores)));
    }
    
    return $evaluadores;
}
public function obtenerUsuariosNotificarPorArea($areaId)
{
    $usuarios = [];

   
    $queryCoordinadores = "
        SELECT name AS nombre, email, role AS tipo
        FROM users 
        Join responsables_academicos ON users.id = responsables_academicos.user_id
        WHERE responsables_academicos.area_competencia_id = :areaId
    ";

    $stmt = $this->pdo->prepare($queryCoordinadores);
    $stmt->bindParam(':areaId', $areaId);
    $stmt->execute();
    $coordinadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    
    $queryEvaluadores = "
        Select u.name AS nombre, u.email, role AS tipo
        FROM users as u JOIN evaluadores_areas as a ON a.user_id= u.id
        JOIN areas_competencia ac ON ac.id =a.area_competencia_id 
        JOIN niveles_competencia nv ON nv.id=a.nivel_competencia_id
        Where a.area_competencia_id=?
    ";

    $stmt = $this->pdo->prepare($queryEvaluadores);
    $stmt->execute([$areaId]);
    $evaluadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $usuarios = array_merge($coordinadores, $evaluadores);

    return $usuarios;
}
public function encontrarAreaPorID($areaId): mixed
    {
        try {
            $stmt = $this->pdo->prepare("SELECT nombre FROM areas_competencia WHERE id = ?");
            $stmt->execute([$areaId]);
            $area = $stmt->fetch(PDO::FETCH_ASSOC);
            return $area ? $area['nombre'] : null;
        } catch (Exception $e) {
            error_log("Error al encontrar área por ID: " . $e->getMessage());
            return null;
        }
    }

   
    public function obtenerTodosUsuariosNotificar()
    {
        $usuarios = [];

        
        $queryCoordinadores = "
            SELECT DISTINCT u.name AS nombre, u.email, u.role AS tipo
            FROM users u
            JOIN responsables_academicos ra ON u.id = ra.user_id
            WHERE ra.is_active = true
        ";

        $stmt = $this->pdo->prepare($queryCoordinadores);
        $stmt->execute();
        $coordinadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        
        $queryEvaluadores = "
            SELECT DISTINCT u.name AS nombre, u.email, u.role AS tipo
            FROM users u
            JOIN evaluadores_areas ea ON u.id = ea.user_id
            WHERE ea.is_active = true
        ";

        $stmt = $this->pdo->prepare($queryEvaluadores);
        $stmt->execute();
        $evaluadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

       
        $usuarios = array_merge($coordinadores, $evaluadores);
        $usuariosUnicos = [];
        $emailsVistos = [];

        foreach ($usuarios as $usuario) {
            if (!in_array($usuario['email'], $emailsVistos)) {
                $usuariosUnicos[] = $usuario;
                $emailsVistos[] = $usuario['email'];
            }
        }

        return $usuariosUnicos;
    }

   
    public function enviarNotificacionCierreFaseGeneral($nombreAdmin, $areasCerradas, $clasificadosMigrados)
    {
        $usuarios = $this->obtenerTodosUsuariosNotificar();

        if (empty($usuarios)) {
            return "No hay usuarios para notificar.";
        }

        $emailsEnviados = 0;
        $errores = [];

        foreach ($usuarios as $user) {
            $mensaje = "
                <p>Estimado(a) <b>{$user['nombre']}</b>,</p>
                <p>Le informamos que la <b>Fase Clasificatoria de la Olimpiada Oh! - SanSi</b> ha sido oficialmente cerrada por el Administrador General del sistema.</p>
                <p><strong>Resumen del cierre:</strong></p>
                <ul>
                    <li>Áreas cerradas: <b>{$areasCerradas}</b></li>
                    <li>Participantes clasificados migrados a fase final: <b>{$clasificadosMigrados}</b></li>
                </ul>
                <p>Le agradecemos por su participación y compromiso en esta etapa de la Olimpiada Oh! - SanSi.</p>
            ";

            if ($user['tipo'] === 'coordinador') {
                $mensaje .= "<p>Como coordinador, puede revisar el estado final y los resultados dentro del sistema.</p>";
            } else {
                $mensaje .= "<p>Como evaluador, la fase clasificatoria ha finalizado. Los participantes clasificados han sido migrados a la fase final.</p>";
            }

            $mensaje .= "
                <br><p>Atentamente,</p>
                <p><b>{$nombreAdmin}</b><br>
                <small>Administrador General - Olimpiada Oh! - SanSi</small></p>
            ";

           
            $resultado = $this->enviar(
                $user['email'],
                "Cierre de Fase Clasificatoria - Olimpiada Oh! - SanSi",
                $mensaje,
                'forwardsoft.official@gmail.com',
                'Administrador General - Olimpiada Oh! - SanSi'
            );

            if ($resultado === true) {
                $emailsEnviados++;
            } else {
                $errores[] = $user['email'];
            }
        }

        if ($emailsEnviados > 0) {
            return "Notificaciones enviadas a {$emailsEnviados} usuario(s)." . 
                   (!empty($errores) ? " Errores al enviar a: " . implode(', ', $errores) : '');
        } else {
            return "Error: No se pudieron enviar las notificaciones.";
        }
    }
}
