<?php

namespace ForwardSoft\Config;

class SimpleConfig
{
    private static $config = [
        'APP_NAME' => 'ForwardSoft',
        'APP_ENV' => 'development',
        'APP_DEBUG' => 'true',
        'APP_URL' => 'http://localhost:8000',
        'DB_CONNECTION' => 'pgsql',
        'DB_HOST' => '127.0.0.1',
        'DB_PORT' => '5432',
        'DB_DATABASE' => 'forwardsoft_olimpiadas',
        'DB_USERNAME' => 'postgres',
        'DB_PASSWORD' => '',
        'JWT_SECRET' => 'default-secret-key-change-in-production',
        'JWT_ALGORITHM' => 'HS256',
        'JWT_EXPIRATION' => '3600',
        'LOG_LEVEL' => 'debug',
        'LOG_FILE' => 'logs/app.log'
    ];

    public static function init()
    {
        // Cargar variables de entorno si existe .env
        if (file_exists(__DIR__ . '/../../.env')) {
            $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                    list($key, $value) = explode('=', $line, 2);
                    self::$config[trim($key)] = trim($value);
                }
            }
        }

        // Establecer variables de entorno
        foreach (self::$config as $key => $value) {
            $_ENV[$key] = $value;
        }

        // Configurar zona horaria
        date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'America/Mexico_City');

        // Configurar manejo de errores
        if ($_ENV['APP_DEBUG'] === 'true') {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
        } else {
            error_reporting(0);
            ini_set('display_errors', 0);
        }
    }

    public static function get($key, $default = null)
    {
        return self::$config[$key] ?? $default;
    }
}
