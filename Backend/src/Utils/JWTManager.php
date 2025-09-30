<?php

namespace ForwardSoft\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTManager
{
    private static $secret;
    private static $algorithm;

    public static function init()
    {
        self::$secret = $_ENV['JWT_SECRET'] ?? 'default-secret-key';
        self::$algorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';
    }

    public static function generateToken($payload, $expiration = null)
    {
        // Asegurar que esté inicializado
        if (self::$secret === null || self::$algorithm === null) {
            self::init();
        }
        
        if (!$expiration) {
            $expiration = time() + (int)($_ENV['JWT_EXPIRATION'] ?? 3600);
        }

        $tokenPayload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
            'aud' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
            'iat' => time(),
            'exp' => $expiration,
            'data' => $payload
        ];

        return JWT::encode($tokenPayload, self::$secret, self::$algorithm);
    }

    public static function validateToken($token)
    {
        try {
            // Asegurar que esté inicializado
            if (self::$secret === null || self::$algorithm === null) {
                self::init();
            }
            
            $decoded = JWT::decode($token, new Key(self::$secret, self::$algorithm));
            return (array) $decoded->data;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function getTokenFromHeader()
    {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    public static function getCurrentUser()
    {
        $token = self::getTokenFromHeader();
        if ($token) {
            return self::validateToken($token);
        }
        return false;
    }
}
