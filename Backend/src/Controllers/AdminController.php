<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Utils\EmailService;
use ForwardSoft\Models\User;
use PDO;
use PDOException;
use Exception;

class AdminController
{
    private $userModel;
    private $pdo;

    public function __construct()
    {
        $this->userModel = new User();
        $this->pdo = $this->getConnection();
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

    public function dashboard()
    {
        $stats = [
            'total_users' => $this->userModel->getTotalUsers(),
            'total_admins' => $this->userModel->getUsersByRole('admin'),
            'total_coordinadores' => $this->userModel->getUsersByRole('coordinador'),
            'total_evaluadores' => $this->userModel->getUsersByRole('evaluador'),
            'recent_users' => $this->userModel->getRecentUsers(5)
        ];

        Response::success($stats, 'Dashboard de administrador');
    }

    public function users()
    {
        $users = $this->userModel->getAll();
        
        // Obtener áreas asignadas para cada usuario
        
        foreach ($users as &$user) {
            unset($user['password']);
            
            // Obtener área del evaluador
            if ($user['role'] === 'evaluador') {
                $stmt = $this->pdo->prepare("
                    SELECT ac.nombre as area_nombre 
                    FROM evaluadores_areas ea 
                    JOIN areas_competencia ac ON ea.area_competencia_id = ac.id 
                    WHERE ea.user_id = ? AND ea.is_active = true
                ");
                $stmt->execute([$user['id']]);
                $area = $stmt->fetch(PDO::FETCH_ASSOC);
                $user['area'] = $area ? $area['area_nombre'] : null;
            }
            // Obtener área del coordinador
            elseif ($user['role'] === 'coordinador') {
                $stmt = $this->pdo->prepare("
                    SELECT ac.nombre as area_nombre 
                    FROM responsables_academicos ra 
                    JOIN areas_competencia ac ON ra.area_competencia_id = ac.id 
                    WHERE ra.user_id = ? AND ra.is_active = true
                ");
                $stmt->execute([$user['id']]);
                $area = $stmt->fetch(PDO::FETCH_ASSOC);
                $user['area'] = $area ? $area['area_nombre'] : null;
            }
        }

        Response::success($users, 'Lista de usuarios para administración');
    }

    public function createUser()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateUserCreation($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Verificar si el email ya existe
        if ($this->userModel->findByEmail($input['email'])) {
            Response::validationError(['email' => 'El email ya está registrado']);
        }

        // Generar contraseña temporal
        $passwordTemporal = $this->generarPasswordTemporal();
        
        // Crear usuario
        $userData = [
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'role' => $input['role'] ?? 'evaluador',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $userId = $this->userModel->create($userData);

        // Si es evaluador o coordinador y tiene área asignada, crear la relación
        if ($userId && isset($input['area_id']) && $input['area_id']) {
            $this->asignarAreaUsuario($userId, $input['area_id'], $input['role']);
        }

        if ($userId) {
            $newUser = $this->userModel->findById($userId);
            $currentAdmin = JWTManager::getCurrentUser();
            
            // Enviar credenciales por email
            $emailService = new EmailService();
            $emailEnviado = $emailService->enviarCredenciales($newUser, $passwordTemporal, $currentAdmin);
            
            if ($emailEnviado) {
                unset($newUser['password']);
                Response::success([
                    'user' => $newUser,
                    'credentials_sent' => true,
                    'temporary_password' => $passwordTemporal // Solo para mostrar en la respuesta del admin
                ], 'Usuario creado exitosamente y credenciales enviadas por email', 201);
            } else {
                // Usuario creado pero email no enviado
                unset($newUser['password']);
                Response::success([
                    'user' => $newUser,
                    'credentials_sent' => false,
                    'temporary_password' => $passwordTemporal,
                    'warning' => 'Usuario creado pero no se pudo enviar el email. Usa la contraseña temporal mostrada.'
                ], 'Usuario creado pero error al enviar credenciales por email', 201);
            }
        } else {
            Response::serverError('Error al crear el usuario');
        }
    }

    private function validateUserCreation($input)
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

        // La contraseña no es requerida al crear usuarios desde el panel admin,
        // se genera una contraseña temporal automáticamente.

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
    }

    private function generarPasswordTemporal()
    {
        // Generar contraseña temporal de 8 caracteres
        $caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        $longitud = 8;
        
        for ($i = 0; $i < $longitud; $i++) {
            $password .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        
        return $password;
    }

    public function reenviarCredenciales($userId)
    {
        $user = $this->userModel->findById($userId);
        
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        // Generar nueva contraseña temporal
        $passwordTemporal = $this->generarPasswordTemporal();
        
        // Actualizar contraseña en la base de datos
        $this->userModel->update($userId, [
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        $currentAdmin = JWTManager::getCurrentUser();
        
        // Enviar credenciales por email
        $emailService = new EmailService();
        $emailEnviado = $emailService->enviarCredenciales($user, $passwordTemporal, $currentAdmin);
        
        if ($emailEnviado) {
            Response::success([
                'user_id' => $userId,
                'email' => $user['email'],
                'credentials_sent' => true,
                'temporary_password' => $passwordTemporal
            ], 'Credenciales reenviadas exitosamente');
        } else {
            Response::success([
                'user_id' => $userId,
                'email' => $user['email'],
                'credentials_sent' => false,
                'temporary_password' => $passwordTemporal,
                'warning' => 'No se pudo enviar el email. Usa la contraseña temporal mostrada.'
            ], 'Credenciales actualizadas pero error al enviar email');
        }
    }

    private function asignarAreaUsuario($userId, $areaId, $role)
    {
        try {
            
            if ($role === 'evaluador') {
                // Insertar en evaluadores_areas
                $stmt = $this->pdo->prepare("INSERT INTO evaluadores_areas (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                $stmt->execute([$userId, $areaId]);
            } elseif ($role === 'coordinador') {
                // Insertar en responsables_academicos
                $stmt = $this->pdo->prepare("INSERT INTO responsables_academicos (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                $stmt->execute([$userId, $areaId]);
            }
        } catch (Exception $e) {
            error_log("Error al asignar área al usuario: " . $e->getMessage());
        }
    }
}
