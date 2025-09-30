<?php

namespace ForwardSoft\Config;

use Exception;

class App
{
    public static function init()
    {
        // Cargar variables de entorno
        if (file_exists(__DIR__ . '/../../.env')) {
            try {
                $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
                $dotenv->load();
            } catch (Exception $e) {
                // Si falla, cargar variables por defecto
                $_ENV['APP_NAME'] = 'ForwardSoft';
                $_ENV['APP_ENV'] = 'development';
                $_ENV['APP_DEBUG'] = 'true';
                $_ENV['DB_CONNECTION'] = 'pgsql';
                $_ENV['DB_HOST'] = '127.0.0.1';
                $_ENV['DB_PORT'] = '5432';
                $_ENV['DB_DATABASE'] = 'forwardsoft_olimpiadas';
                $_ENV['DB_USERNAME'] = 'postgres';
                $_ENV['DB_PASSWORD'] = '';
                $_ENV['JWT_SECRET'] = 'default-secret-key';
            }
        }

        // Configurar zona horaria
        date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'America/Mexico_City');

        // Configurar manejo de errores
        if ($_ENV['APP_DEBUG'] ?? false) {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
        } else {
            error_reporting(0);
            ini_set('display_errors', 0);
        }

        // Configurar headers CORS
        self::setCorsHeaders();

        // Configurar autoloader
        require_once __DIR__ . '/../../vendor/autoload.php';
    }

    private static function setCorsHeaders()
    {
        $allowedOrigins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000');
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    public static function getEnv($key, $default = null)
    {
        return $_ENV[$key] ?? $default;
    }

    public static function isDebug()
    {
        return filter_var(self::getEnv('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN);
    }

    public static function getBaseUrl()
    {
        return self::getEnv('APP_URL', 'http://localhost:8000');
    }
}
