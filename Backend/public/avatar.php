<?php
// Servir imágenes de avatar
$filename = $_GET['file'] ?? '';


if (!preg_match('/^[0-9]+-[0-9]+\.(png|jpg|jpeg|gif|webp)$/i', $filename)) {
    http_response_code(404);
    exit('Archivo no válido');
}

$filePath = __DIR__ . '/uploads/avatars/' . $filename;

if (file_exists($filePath) && is_file($filePath)) {
    
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml'
    ];
    
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    
    // Configurar headers para archivos estáticos
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, max-age=31536000'); // Cache por 1 año
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($filePath)) . ' GMT');
    
   
    readfile($filePath);
} else {
    http_response_code(404);
    exit('Avatar no encontrado');
}
?>
