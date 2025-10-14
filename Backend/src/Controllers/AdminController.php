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
        
        
        
        foreach ($users as &$user) {
            unset($user['password']);
            
           
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

        
        $existingUser = $this->userModel->findByEmail($input['email']);
        if ($existingUser) {
            error_log("🔍 Debug - Usuario ya existe: {$input['email']}");
            Response::validationError(['email' => 'El email ya está registrado']);
        }

        
        $passwordTemporal = $this->generarPasswordTemporal();
        
        
        $userData = [
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'role' => $input['role'] ?? 'evaluador',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $userId = $this->userModel->create($userData);

       
        if ($userId && isset($input['area_id']) && $input['area_id']) {
            error_log("🔍 Debug - Asignando área al usuario: UserID=$userId, AreaID={$input['area_id']}, Role={$input['role']}");
            $this->asignarAreaUsuario($userId, $input['area_id'], $input['role']);
        } else {
            error_log("🔍 Debug - No se asignó área: UserID=$userId, AreaID=" . ($input['area_id'] ?? 'no definido') . ", Role={$input['role']}");
        }

        if ($userId) {
            $newUser = $this->userModel->findById($userId);
            $currentAdmin = JWTManager::getCurrentUser();
            
           
            $emailService = new EmailService();
            $emailEnviado = $emailService->enviarCredenciales($newUser, $passwordTemporal, $currentAdmin);
            
            if ($emailEnviado) {
                unset($newUser['password']);
                Response::success([
                    'user' => $newUser,
                    'credentials_sent' => true,
                    'temporary_password' => $passwordTemporal 
                ], 'Usuario creado exitosamente y credenciales enviadas por email', 201);
            } else {
                
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

        

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
    }

    private function generarPasswordTemporal()
    {
        
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

        
        $passwordTemporal = $this->generarPasswordTemporal();
        
        
        $this->userModel->update($userId, [
            'password' => password_hash($passwordTemporal, PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        $currentAdmin = JWTManager::getCurrentUser();
        
        
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
            error_log("🔍 Debug - asignarAreaUsuario: UserID=$userId, AreaID=$areaId, Role=$role");
            
            if ($role === 'evaluador') {
                
                $stmt = $this->pdo->prepare("SELECT id FROM evaluadores_areas WHERE user_id = ? AND is_active = true");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    
                    $stmt = $this->pdo->prepare("UPDATE evaluadores_areas SET area_competencia_id = ?, fecha_asignacion = NOW() WHERE user_id = ? AND is_active = true");
                    $stmt->execute([$areaId, $userId]);
                    error_log("✅ Debug - Área actualizada para evaluador: UserID=$userId, AreaID=$areaId");
                } else {
                    
                    $stmt = $this->pdo->prepare("INSERT INTO evaluadores_areas (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                    $stmt->execute([$userId, $areaId]);
                    error_log("✅ Debug - Área asignada a evaluador: UserID=$userId, AreaID=$areaId");
                }
            } elseif ($role === 'coordinador') {
                
                $stmt = $this->pdo->prepare("SELECT id FROM responsables_academicos WHERE user_id = ? AND is_active = true");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    
                    $stmt = $this->pdo->prepare("UPDATE responsables_academicos SET area_competencia_id = ?, fecha_asignacion = NOW() WHERE user_id = ? AND is_active = true");
                    $stmt->execute([$areaId, $userId]);
                    error_log("✅ Debug - Área actualizada para coordinador: UserID=$userId, AreaID=$areaId");
                } else {
                    
                    $stmt = $this->pdo->prepare("INSERT INTO responsables_academicos (user_id, area_competencia_id, fecha_asignacion, is_active) VALUES (?, ?, NOW(), true)");
                    $stmt->execute([$userId, $areaId]);
                    error_log("✅ Debug - Área asignada a coordinador: UserID=$userId, AreaID=$areaId");
                }
            } else {
                error_log("❌ Debug - Rol no reconocido para asignación: $role");
            }
        } catch (Exception $e) {
            error_log("❌ Error al asignar área al usuario: " . $e->getMessage());
        }
    }
}
