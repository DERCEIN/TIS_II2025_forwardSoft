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
        
        if (self::$secret === null || self::$algorithm === null) {
            self::init();
        }
        
        if (!$expiration) {
            $expiration = time() + (int)($_ENV['JWT_EXPIRATION'] ?? 3600);
        }

        $tokenPayload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://forwardsoft.tis.cs.umss.edu.bo/',
            'aud' => $_ENV['APP_URL'] ?? 'http://forwardsoft.tis.cs.umss.edu.bo/',
            'iat' => time(),
            'exp' => $expiration,
            'data' => $payload
        ];

        return JWT::encode($tokenPayload, self::$secret, self::$algorithm);
    }

    public static function validateToken($token)
    {
        try {
            
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
        error_log("🔍 Debug JWT - Headers: " . json_encode($headers));
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            error_log("🔍 Debug JWT - Authorization header: " . $authHeader);
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                error_log("🔍 Debug JWT - Token extracted: " . substr($matches[1], 0, 20) . "...");
                return $matches[1];
            }
        }
        
        error_log("❌ Debug JWT - No valid token found in headers");
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
