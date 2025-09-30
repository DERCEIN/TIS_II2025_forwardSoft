<?php

namespace ForwardSoft\Models;

use ForwardSoft\Config\Database;

class User
{
    private $db;
    private $table = 'users';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)";
        
        try {
            $stmt = $this->db->query($sql, [
                $data['name'],
                $data['email'],
                $data['password'],
                $data['role'],
                $data['created_at']
            ]);
            
            return $this->db->lastInsertId();
        } catch (\Exception $e) {
            error_log("Error al crear usuario: " . $e->getMessage());
            return false;
        }
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }

    public function findByEmail($email)
    {
        $sql = "SELECT * FROM {$this->table} WHERE email = ?";
        $stmt = $this->db->query($sql, [$email]);
        return $stmt->fetch();
    }

    public function getAll()
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY created_at DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getUsersByRole($role)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE role = ?";
        $stmt = $this->db->query($sql, [$role]);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getTotalUsers()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function getRecentUsers($limit = 10)
    {
        $sql = "SELECT id, name, email, role, created_at FROM {$this->table} ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->query($sql, [$limit]);
        return $stmt->fetchAll();
    }

    public function update($id, $data)
    {
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "{$key} = ?";
                $values[] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, $values);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id)
    {
        $sql = "DELETE FROM {$this->table} WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, [$id]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al eliminar usuario: " . $e->getMessage());
            return false;
        }
    }

    public function updateLastLogin($id)
    {
        $sql = "UPDATE {$this->table} SET last_login = ? WHERE id = ?";
        
        try {
            $stmt = $this->db->query($sql, [date('Y-m-d H:i:s'), $id]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error al actualizar último login: " . $e->getMessage());
            return false;
        }
    }

    public function search($query, $limit = 20)
    {
        $sql = "SELECT id, name, email, role, created_at FROM {$this->table} 
                WHERE name LIKE ? OR email LIKE ? 
                ORDER BY name ASC LIMIT ?";
        
        $searchTerm = "%{$query}%";
        $stmt = $this->db->query($sql, [$searchTerm, $searchTerm, $limit]);
        return $stmt->fetchAll();
    }
}
