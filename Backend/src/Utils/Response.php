<?php

namespace ForwardSoft\Utils;

class Response
{
    public static function json($data, $statusCode = 200, $headers = [])
    {
       
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        http_response_code($statusCode);
        
        foreach ($headers as $header => $value) {
            header("{$header}: {$value}");
        }
        
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    public static function success($data = null, $message = 'Operación exitosa', $statusCode = 200)
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        self::json($response, $statusCode);
    }

    public static function error($message = 'Error en la operación', $statusCode = 400, $errors = null)
    {
        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        self::json($response, $statusCode);
    }

    public static function validationError($errors, $message = 'Errores de validación')
    {
        self::error($message, 422, $errors);
    }

    public static function unauthorized($message = 'No autorizado')
    {
        self::error($message, 401);
    }

    public static function forbidden($message = 'Acceso denegado')
    {
        self::error($message, 403);
    }

    public static function notFound($message = 'Recurso no encontrado')
    {
        self::error($message, 404);
    }

    public static function serverError($message = 'Error interno del servidor')
    {
        self::error($message, 500);
    }
}


