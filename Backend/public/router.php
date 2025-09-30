<?php

// Obtener la ruta solicitada
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Si la ruta no es un archivo físico, redirigir a index.php
if (!file_exists(__DIR__ . $path) || is_dir(__DIR__ . $path)) {
    // Incluir index.php
    include __DIR__ . '/index.php';
} else {
    // Servir el archivo estático
    return false;
}


