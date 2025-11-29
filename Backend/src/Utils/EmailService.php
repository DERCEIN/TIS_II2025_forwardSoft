<?php

namespace ForwardSoft\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private $mailer;
    private $smtpHost;
    private $smtpPort;
    private $smtpUsername;
    private $smtpPassword;
    private $smtpEncryption;
    private $fromEmail;
    private $fromName;

    public function __construct()
    {
        $this->smtpHost = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
        $this->smtpPort = (int)($_ENV['MAIL_PORT'] ?? 587);
        $this->smtpUsername = $_ENV['MAIL_USERNAME'] ?? '';
        $this->smtpPassword = $_ENV['MAIL_PASSWORD'] ?? '';
        $this->smtpEncryption = $_ENV['MAIL_ENCRYPTION'] ?? 'tls';
        $this->fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? $_ENV['MAIL_USERNAME'] ?? 'noreply@forwardsoft.com';
        $this->fromName = $_ENV['MAIL_FROM_NAME'] ?? 'ForwardSoft';

        $this->mailer = new PHPMailer(true);
        $this->configureMailer();
    }

    private function configureMailer()
    {
        try {
            
            $this->mailer->isSMTP();
            $this->mailer->Host = $this->smtpHost;
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->smtpUsername;
            $this->mailer->Password = $this->smtpPassword;
            $this->mailer->SMTPSecure = $this->smtpEncryption;
            $this->mailer->Port = $this->smtpPort;
            $this->mailer->CharSet = 'UTF-8';

            
            $this->mailer->setFrom($this->fromEmail, $this->fromName);
        } catch (Exception $e) {
            error_log("Error configurando EmailService: " . $e->getMessage());
        }
    }

    public function enviarCredenciales($usuario, $passwordTemporal, $enviadoPor)
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($usuario['email'], $usuario['name']);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Credenciales de acceso - ForwardSoft';

            $htmlContent = $this->generarTemplateCredenciales($usuario, $passwordTemporal, $enviadoPor);
            $this->mailer->Body = $htmlContent;

            $this->mailer->send();

            
            $this->registrarEnvioCredenciales($usuario['id'], $usuario['email'], $passwordTemporal, $enviadoPor);

            return true;
        } catch (Exception $e) {
            error_log("Error enviando credenciales: " . $e->getMessage());
            return false;
        }
    }

    private function generarTemplateCredenciales($usuario, $passwordTemporal, $enviadoPor)
    {
        $adminName = $enviadoPor['name'] ?? 'Administrador';
        $appUrl = $_ENV['APP_URL'] ?? 'http://forwardsoft.tis.cs.umss.edu.bo/';
        $loginUrl = $appUrl . 'htpp://forwardsoft.tis.cs.umss.edu.bo/login';

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Credenciales de Acceso - ForwardSoft</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .credential-item { margin: 10px 0; }
                .label { font-weight: bold; color: #374151; }
                .value { font-family: monospace; background: #f3f4f6; padding: 8px; border-radius: 4px; margin-left: 10px; }
                .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🚀 ForwardSoft</h1>
                    <p>Sistema de Evaluación de Proyectos</p>
                </div>
                
                <div class='content'>
                    <h2>¡Bienvenido/a, {$usuario['name']}!</h2>
                    
                    <p>Has sido registrado/a en el sistema ForwardSoft con el rol de <strong>{$usuario['role']}</strong>.</p>
                    
                    <div class='credentials'>
                        <h3>🔐 Tus Credenciales de Acceso</h3>
                        <div class='credential-item'>
                            <span class='label'>Email:</span>
                            <span class='value'>{$usuario['email']}</span>
                        </div>
                        <div class='credential-item'>
                            <span class='label'>Contraseña temporal:</span>
                            <span class='value'>{$passwordTemporal}</span>
                        </div>
                        <div class='credential-item'>
                            <span class='label'>Rol:</span>
                            <span class='value'>{$usuario['role']}</span>
                        </div>
                    </div>
                    
                    <div class='warning'>
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Esta es una contraseña temporal que debes cambiar en tu primer inicio de sesión</li>
                            <li>Guarda estas credenciales en un lugar seguro</li>
                            <li>No compartas esta información con otras personas</li>
                        </ul>
                    </div>
                    
                    <div style='text-align: center;'>
                        <a href='{$loginUrl}' class='button'>Iniciar Sesión</a>
                    </div>
                    
                    <p>Si tienes alguna pregunta, contacta al administrador: <strong>{$adminName}</strong></p>
                </div>
                
                <div class='footer'>
                    <p>Este email fue enviado automáticamente por el sistema ForwardSoft</p>
                    <p>© " . date('Y') . " ForwardSoft. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>";
    }

    private function registrarEnvioCredenciales($usuarioId, $email, $passwordTemporal, $enviadoPor)
    {
        try {
            $db = \ForwardSoft\Config\Database::getInstance();
            $sql = "INSERT INTO credenciales_enviadas (usuario_id, email_enviado, password_temporal, enviado_por, fecha_envio) VALUES (?, ?, ?, ?, ?)";
            $db->query($sql, [
                $usuarioId,
                $email,
                password_hash($passwordTemporal, PASSWORD_DEFAULT),
                $enviadoPor['id'],
                date('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            error_log("Error registrando envío de credenciales: " . $e->getMessage());
        }
    }

    public function enviarEmailRecuperacion($email, $token)
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($email);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Recuperación de contraseña - ForwardSoft';

            $resetUrl = ($_ENV['APP_URL'] ?? 'http://forwardsoft.tis.cs.umss.edu.bo/') . '/reset-password?token=' . $token;
            
            $htmlContent = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <title>Recuperación de Contraseña</title>
            </head>
            <body>
                <h2>Recuperación de Contraseña</h2>
                <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace:</p>
                <a href='{$resetUrl}'>Restablecer Contraseña</a>
                <p>Este enlace expirará en 1 hora.</p>
            </body>
            </html>";

            $this->mailer->Body = $htmlContent;
            $this->mailer->send();

            return true;
        } catch (Exception $e) {
            error_log("Error enviando email de recuperación: " . $e->getMessage());
            return false;
        }
    }
}

