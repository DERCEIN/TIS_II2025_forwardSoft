<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Config\Database;
use ForwardSoft\Models\User;
use PDO;
use PDOException;
use Exception;

class AuthController
{
    private $db;
    private $userModel;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->userModel = new User();
    }

    public function login()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            Response::validationError(['email' => 'Email es requerido', 'password' => 'Contraseña es requerida']);
        }

        $email = trim($input['email']);
        $password = $input['password'];
        $role = isset($input['role']) ? trim($input['role']) : null;

        // Validar email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['email' => 'Email inválido']);
        }

        // Buscar usuario
        $user = $this->userModel->findByEmail($email);
        
        // Debug: log para verificar
        error_log("Login attempt - Email: " . $email . ", Role: " . ($role ?: 'NULL'));
        error_log("User found: " . ($user ? 'YES' : 'NO'));
        if ($user) {
            error_log("User role: " . $user['role'] . ", Expected role: " . ($role ?: 'NULL'));
            error_log("Password provided: " . $password);
            error_log("Password hash in DB: " . substr($user['password'], 0, 20) . "...");
            error_log("Password verify: " . (password_verify($password, $user['password']) ? 'YES' : 'NO'));
        }
        
        if (!$user || !password_verify($password, $user['password'])) {
            Response::unauthorized('Credenciales inválidas');
        }
        
        // Verificar que el rol coincida (solo si se proporciona rol)
        if ($role && $user['role'] !== $role) {
            Response::unauthorized('Rol incorrecto para este usuario');
        }

        // Generar token JWTManager
        $tokenPayload = [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role']
        ];

        $token = JWTManager::generateToken($tokenPayload);

        // Actualizar último login
        $this->userModel->updateLastLogin($user['id']);

        Response::success([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ],
            'token' => $token
        ], 'Login exitoso');
    }

    public function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateRegistration($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Verificar si el email ya existe
        if ($this->userModel->findByEmail($input['email'])) {
            Response::validationError(['email' => 'El email ya está registrado']);
        }

        // Crear usuario
        $userData = [
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'password' => password_hash($input['password'], PASSWORD_DEFAULT),
            'role' => $input['role'] ?? 'evaluador',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $userId = $this->userModel->create($userData);

        if ($userId) {
            Response::success([
                'id' => $userId,
                'email' => $userData['email'],
                'name' => $userData['name'],
                'role' => $userData['role']
            ], 'Usuario registrado exitosamente', 201);
        } else {
            Response::serverError('Error al crear el usuario');
        }
    }

    public function logout()
    {
        // En una implementación más avanzada, podrías invalidar el token
        Response::success(null, 'Logout exitoso');
    }

    public function me()
    {
        $user = JWTManager::getCurrentUser();
        
        if (!$user) {
            Response::unauthorized('Token inválido');
        }

        // Obtener áreas asignadas para evaluadores y coordinadores
        if ($user['role'] === 'evaluador' || $user['role'] === 'coordinador') {
            try {
                $pdo = $this->getConnection();
                
                if ($user['role'] === 'evaluador') {
                    $stmt = $pdo->prepare("
                        SELECT ac.id as area_id, ac.nombre as area_nombre 
                        FROM evaluadores_areas ea 
                        JOIN areas_competencia ac ON ea.area_competencia_id = ac.id 
                        WHERE ea.user_id = ? AND ea.is_active = true
                    ");
                } else {
                    $stmt = $pdo->prepare("
                        SELECT ac.id as area_id, ac.nombre as area_nombre 
                        FROM responsables_academicos ra 
                        JOIN areas_competencia ac ON ra.area_competencia_id = ac.id 
                        WHERE ra.user_id = ? AND ra.is_active = true
                    ");
                }
                
                $stmt->execute([$user['id']]);
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $user['areas'] = $areas; // Mantener toda la información de las áreas
                
                // Agregar información adicional
                if (!empty($areas)) {
                    $user['area_nombre'] = $areas[0]['area_nombre']; // Primera área como principal
                    $user['area_id'] = $areas[0]['area_id']; // ID de la primera área
                }
            } catch (Exception $e) {
                error_log("Error al obtener áreas del usuario: " . $e->getMessage());
                $user['areas'] = [];
            }
        } else {
            $user['areas'] = [];
        }

        Response::success($user, 'Información del usuario');
    }

    private function validateRegistration($input)
    {
        $errors = [];

        if (empty($input['name'])) {
            $errors['name'] = 'El nombre es requerido';
        } elseif (strlen($input['name']) < 2) {
            $errors['name'] = 'El nombre debe tener al menos 2 caracteres';
        }

        if (empty($input['email'])) {
            $errors['email'] = 'El email es requerido';
        } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email inválido';
        }

        if (empty($input['password'])) {
            $errors['password'] = 'La contraseña es requerida';
        } elseif (strlen($input['password']) < 6) {
            $errors['password'] = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (isset($input['password_confirmation']) && $input['password'] !== $input['password_confirmation']) {
            $errors['password_confirmation'] = 'Las contraseñas no coinciden';
        }

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
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
} 
