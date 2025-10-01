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

        if (isset($input['role']) && !in_array($input['role'], ['admin', 'coordinador', 'evaluador'])) {
            $errors['role'] = 'Rol inválido';
        }

        return $errors;
    }
}
