<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $reviews = findManyDocuments('reviews');
    foreach ($reviews as &$review) {
        $user = findOneDocument('users', ['id' => (int)($review['user_id'] ?? 0)]);
        $review['name'] = $user['name'] ?? 'Customer';
    }
    echo json_encode($reviews);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo = getMySqlConnection();
    $user = getCurrentUser($pdo);
    if (!$user || (int)($user['role_id'] ?? 0) !== 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Customer access required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $rating = max(1, min(5, (int)($input['rating'] ?? 0)));
    $comment = trim((string)($input['comment'] ?? ''));
    if ($comment === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Review text is required']);
        exit;
    }

    $id = insertDocument('reviews', [
        'id' => nextDocumentId('reviews'),
        'user_id' => (int)$user['id'],
        'rating' => $rating,
        'comment' => $comment,
        'created_at' => date('Y-m-d H:i:s')
    ]);
    echo json_encode(['id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
