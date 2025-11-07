<?php
// Cargar el autoloader de Composer (ajustar ruta según tu estructura)
require __DIR__ . '/../../vendor/autoload.php'; // Ajusta según tu ruta
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../'); // Ruta a tu .env
$dotenv->load();
use ForwardSoft\Utils\Mailer;

// Crear una nueva instancia de Mailer
$mailer = new Mailer();

try {
    // Ejecutar el método de prueba
    $mailer->cerrarAreaComoAdministrador(1);
    echo "Mensaje enviado correctamente ✅";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
