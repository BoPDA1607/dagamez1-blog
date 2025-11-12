<?php
/**
 * Save Posts API
 * Nhận dữ liệu JSON từ client và lưu vào file posts.json
 */

// Cho phép CORS (nếu cần)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Xử lý preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Chỉ chấp nhận POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Đọc dữ liệu từ request body
    $jsonData = file_get_contents('php://input');
    $posts = json_decode($jsonData, true);
    
    // Validate dữ liệu
    if (!is_array($posts)) {
        throw new Exception('Invalid data format');
    }
    
    // Đường dẫn file lưu trữ
    $filePath = __DIR__ . '/posts.json';
    
    // Lưu vào file với format đẹp
    $result = file_put_contents(
        $filePath, 
        json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
    
    if ($result === false) {
        throw new Exception('Failed to write file');
    }
    
    // Trả về kết quả thành công
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Posts saved successfully',
        'count' => count($posts)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
