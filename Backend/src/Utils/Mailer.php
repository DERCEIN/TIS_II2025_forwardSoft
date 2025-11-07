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
    public function enviar($para, $asunto, $mensaje, $de = null, $nombre = null)
    {
        try {
            $this->mail->setFrom($de ?? 'forwardsoft.official@gmail.com', $nombre ?? 'Sistema Olimpiada Oh - SanSi');
            $this->mail->addAddress($para);
            $this->mail->isHTML(true);
            $this->mail->Subject = $asunto;

            // Envolvemos el mensaje en una plantilla HTML más bonita
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
                  © ' . date('Y') . 'Olimpiada Oh-SanSi. Todos los derechos reservados.
                </div>
              </div>
            </body>
            </html>';

            $this->mail->AltBody = strip_tags($mensaje);

            $this->mail->send();
            return true;
        } catch (Exception $e) {
            return "Error al enviar correo: {$this->mail->ErrorInfo}";
        }

    }
    public function enviarMensajeEvaluadoresCierre($area, $nombreCoordinador, $correoCoordinador)
        {   $nombreArea=$this->encontrarAreaPorID($area);
        error_log("Nombre del área encontrada: " . $nombreArea);

    $evaluadores = $this->obtenerEvaluadoresPorArea($area);
        error_log(  "Evaluadores encontrados: " . print_r($evaluadores, true));
    foreach ($evaluadores as $eval) {
        try {
            $this->mail->clearAddresses();
            $this->mail->setFrom(
                'forwardsoft.official@gmail.com',
                'Sistema Olimpiada Oh - SanSi'
            );
            $this->mail->addAddress($eval['email'], $eval['nombre']);
            $this->mail->isHTML(true);
            $this->mail->Subject = "Cierre de Evaluaciones - Área: $nombreArea";

            $mensaje = "
                <p>Estimado(a) <b>{$eval['nombre']}</b>,</p>
                <p>Le informamos que el proceso de <b>evaluación del área {$nombreArea}</b> ha sido oficialmente cerrado por el coordinador <b>{$nombreCoordinador}</b>.</p>
                <p>Agradecemos su participación y compromiso en esta etapa de la Olimpiada Oh! - SanSi.</p>
                <p>Si tiene alguna observación o requiere información adicional, puede responder a este correo: <b>$correoCoordinador</b></p>
                <br>
                <p>Atentamente,</p>
                <p><b>{$nombreCoordinador}</b><br>
                <small>Coordinador del área {$nombreArea}</small></p>
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
            $this->mail->send();
        } catch (Exception $e) {
            error_log("Error al enviar correo a {$eval['email']}: {$this->mail->ErrorInfo}");
            return false;
        }
    }
            return true;
}

    public function cerrarAreaComoAdministrador($areaId,)
{   
    $nombreArea = $this->encontrarAreaPorID($areaId);
    $usuarios = $this->obtenerUsuariosNotificarPorArea($areaId);

    if (empty($usuarios)) {
        return "No hay usuarios para notificar en esta área.";
    }

    $mailer = new Mailer();

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

        // Enviar correo con remitente fijo
        $mailer->enviar(
            $user['email'],                         // destinatario
            "Cierre de Evaluaciones - Área: {$nombreArea}", // asunto
            $mensaje,                               // mensaje HTML
            'forwardsoft.official@gmail.com',       // remitente fijo
            'Administrador General - Olimpiada Oh! - SanSi' // nombre fijo
        );
    }

    return "Área '{$nombreArea}' cerrada y notificaciones enviadas a coordinadores y evaluadores.";
}
    public function enviarMensajeOtorgado($correo, $nombreDestinatario, $idArea, $nivel)
{
    // Obtenemos el nombre del área desde tu función existente
    $nombreArea = $this->encontrarAreaPorID($idArea);
    error_log("Área encontrada: " . $nombreArea);
    try {
        $this->mail->clearAddresses();
        // Desde este correo se enviará el mensaje
        $this->mail->setFrom('forwardsoft.official@gmail.com', 'Sistema Olimpiada Oh - SanSi');
        $this->mail->addAddress($correo, $nombreDestinatario);

        $this->mail->isHTML(true);
        $this->mail->Subject = "Nivel Otorgado - Área: $nombreArea";
        $mensaje = "
            <p>Estimado(a) <b>{$nombreDestinatario}</b>,</p>
            <p>Le informamos que en el área <b>{$nombreArea}</b> se le ha asignado el siguiente nivel: <b>{$nivel}</b>.</p>
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
        return true;
    } catch (Exception $e) {
        error_log("Error al enviar correo a {$correo}: {$this->mail->ErrorInfo}");
        return false;
    }
}

public function enviarMensajeEvaluadorTerminado($nombre, $correo, $idArea)
{
    try {
        // 1️⃣ Obtener información del evaluador y del coordinador
        $coordinador = $this->obtenerCoordinadorPorArea($idArea);
        $nombreArea = $this->encontrarAreaPorID($idArea);

        // 2️⃣ Configurar el correo
        $this->mail->clearAddresses();
        $this->mail->setFrom('forwardsoft.official@gmail.com', 'Sistema Olimpiada Oh - SanSi');
        $this->mail->addAddress($coordinador['email'], $coordinador['nombre']);
        $this->mail->isHTML(true);
        $this->mail->Subject = "Evaluador ha completado sus evaluaciones - Área: $nombreArea";

        // 3️⃣ Contenido del mensaje
        $mensaje = "
            <p>Estimado(a) <b>{$coordinador['nombre']}</b>,</p>
            <p>Le informamos que el evaluador <b>$nombre</b> ha completado todas sus evaluaciones asignadas en el área de <b>{$nombreArea}</b>.</p>
            <p>Por favor, revise y valide los resultados correspondientes.</p>
            <br>
            <p>Si tiene alguna queja puede comunicarse con el evaluador directamente a su correo: <b>$correo</b></p>
            <p>Atentamente,</p>
            <p><b>Sistema Olimpiada Oh! - SanSi</b></p>
        ";

        // 4️⃣ Plantilla HTML elegante
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

        // 5️⃣ Enviar
        $this->mail->send();
        error_log("Correo enviado al coordinador {$coordinador['email']} sobre el evaluador $nombre");
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
        Select u.name AS nombre, u.email
        FROM users as u JOIN evaluadores_areas as a ON a.user_id= u.id
        JOIN areas_competencia ac ON ac.id =a.area_competencia_id 
        JOIN niveles_competencia nv ON nv.id=a.nivel_competencia_id
        Where a.area_competencia_id=?
    ";

    $stmt = $this->pdo->prepare($query);
    $stmt->execute( [$areaId]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
public function obtenerUsuariosNotificarPorArea($areaId)
{
    $usuarios = [];

    // 1️⃣ Coordinadores del área
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

    // 2️⃣ Evaluadores con nivel_competencia asignado
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
}
