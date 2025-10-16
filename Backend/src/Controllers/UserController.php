<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\User;

class UserController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function index()
    {
        $currentUser = JWTManager::getCurrentUser();
        
        
        if ($currentUser['role'] !== 'admin') {
            Response::forbidden('Acceso denegado');
        }

        $users = $this->userModel->getAll();
        
        
        $users = array_map(function($user) {
            unset($user['password']);
            return $user;
        }, $users);

        Response::success($users, 'Lista de usuarios obtenida');
    }

    public function show($id)
    {
        $currentUser = JWTManager::getCurrentUser();
        
       
        if ($currentUser['role'] !== 'admin' && $currentUser['id'] != $id) {
            Response::forbidden('Acceso denegado');
        }

        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        
        unset($user['password']);

        Response::success($user, 'Usuario encontrado');
    }

    public function update($id)
    {
        $currentUser = JWTManager::getCurrentUser();
        
        
        if ($currentUser['role'] !== 'admin' && $currentUser['id'] != $id) {
            Response::forbidden('Acceso denegado');
        }

        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateUpdate($input, $id);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $updateData = [];
        
        if (isset($input['name'])) {
            $updateData['name'] = trim($input['name']);
        }
        
        if (isset($input['email'])) {
            $updateData['email'] = trim($input['email']);
        }
        
        if (isset($input['password']) && !empty($input['password'])) {
            $updateData['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

       
        if (isset($input['role']) && $currentUser['role'] === 'admin') {
            $updateData['role'] = $input['role'];
        }

        $updateData['updated_at'] = date('Y-m-d H:i:s');

        if ($this->userModel->update($id, $updateData)) {
            $updatedUser = $this->userModel->findById($id);
            unset($updatedUser['password']);
            
            Response::success($updatedUser, 'Usuario actualizado exitosamente');
        } else {
            Response::serverError('Error al actualizar el usuario');
        }
    }

    public function delete($id)
    {
        $currentUser = JWTManager::getCurrentUser();
        
        
        if ($currentUser['role'] !== 'admin') {
            Response::forbidden('Acceso denegado');
        }

        
        if ($currentUser['id'] == $id) {
            Response::validationError(['general' => 'No puedes eliminar tu propia cuenta']);
        }

        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        if ($this->userModel->delete($id)) {
            Response::success(null, 'Usuario eliminado exitosamente');
        } else {
            Response::serverError('Error al eliminar el usuario');
        }
    }

    private function validateUpdate($input, $userId)
    {
        $errors = [];

        if (isset($input['name']) && empty($input['name'])) {
            $errors['name'] = 'El nombre es requerido';
        } elseif (isset($input['name']) && strlen($input['name']) < 2) {
            $errors['name'] = 'El nombre debe tener al menos 2 caracteres';
        }

        if (isset($input['email'])) {
            if (empty($input['email'])) {
                $errors['email'] = 'El email es requerido';
            } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Email inválido';
            } else {
                
                $existingUser = $this->userModel->findByEmail($input['email']);
                if ($existingUser && $existingUser['id'] != $userId) {
                    $errors['email'] = 'El email ya está en uso por otro usuario';
                }
            }
        }

        if (isset($input['password']) && !empty($input['password']) && strlen($input['password']) < 6) {
            $errors['password'] = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador', 'responsable_academico'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
    }

    public function changePassword($id)
    {
        $currentUser = JWTManager::getCurrentUser();
        if (!$currentUser) {
            Response::unauthorized('No autenticado');
        }

        if ($currentUser['role'] !== 'admin' && (int)$currentUser['id'] !== (int)$id) {
            Response::forbidden('No puedes cambiar la contraseña de otro usuario');
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';
        $confirmPassword = $input['confirm_password'] ?? '';

        $errors = [];
        if (strlen($newPassword) < 6) {
            $errors['new_password'] = 'La contraseña debe tener al menos 6 caracteres';
        }
        if ($newPassword !== $confirmPassword) {
            $errors['confirm_password'] = 'La confirmación no coincide';
        }
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $user = $this->userModel->findById($id);
        if (!$user) {
            Response::notFound('Usuario no encontrado');
        }

        if (!password_verify($currentPassword, $user['password'])) {
            Response::validationError(['current_password' => 'La contraseña actual es incorrecta']);
        }

        $updated = $this->userModel->update($id, [
            'password' => password_hash($newPassword, PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        if ($updated) {
            Response::success(null, 'Contraseña actualizada exitosamente');
        }
        Response::serverError('No se pudo actualizar la contraseña');
    }

    public function uploadAvatar()
    {
        $currentUser = JWTManager::getCurrentUser();
        if (!$currentUser) {
            Response::unauthorized('No autenticado');
        }

        if (!isset($_FILES['avatar'])) {
            Response::validationError(['avatar' => 'Archivo requerido']);
        }

        $file = $_FILES['avatar'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::validationError(['avatar' => 'Error al cargar el archivo']);
        }

        $allowed = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'];
        $mime = mime_content_type($file['tmp_name']);
        if (!isset($allowed[$mime])) {
            Response::validationError(['avatar' => 'Formato no permitido. Use PNG, JPG o WEBP']);
        }

        if ($file['size'] > 2 * 1024 * 1024) { // 2MB
            Response::validationError(['avatar' => 'El archivo excede 2MB']);
        }

        $ext = $allowed[$mime];
        $uploadsDir = __DIR__ . '/../../public/uploads/avatars';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0775, true);
        }

        $filename = (int)$currentUser['id'] . '-' . time() . '.' . $ext;
        $destPath = $uploadsDir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::serverError('No se pudo guardar el archivo');
        }

        
        $publicPath = '/api/avatar/' . $filename;

        
        try {
            $existing = $this->userModel->findById($currentUser['id']);
            if ($existing && !empty($existing['avatar_url'])) {
                $old = __DIR__ . '/../../public' . $existing['avatar_url'];
                if (is_file($old)) { @unlink($old); }
            }
        } catch (\Throwable $e) {
           
        }

        
        $updated = false;
        try {
            error_log("🔍 Debug Avatar - Intentando actualizar usuario ID: " . $currentUser['id']);
            error_log("🔍 Debug Avatar - Datos a actualizar: " . json_encode([
                'avatar_url' => $publicPath,
                'updated_at' => date('Y-m-d H:i:s')
            ]));
            
            $updated = $this->userModel->update($currentUser['id'], [
                'avatar_url' => $publicPath,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            error_log("🔍 Debug Avatar - Resultado de actualización: " . ($updated ? 'ÉXITO' : 'FALLO'));
        } catch (\Throwable $e) {
            error_log("❌ Debug Avatar - Error al actualizar: " . $e->getMessage());
        }

        $responseData = [
            'avatar_url' => $publicPath,
            'saved' => $updated ? true : false
        ];

        if (!$updated) {
            $responseData['warning'] = "Agregue la columna 'avatar_url' a la tabla 'users' (VARCHAR(255) NULL) para persistir la URL.";
        }

        Response::success($responseData, 'Avatar actualizado');
    }
}
