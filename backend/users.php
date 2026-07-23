<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/db.php';

$pdo = getMySqlConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $users = findManyDocuments('users');
    $mapped = [];
    foreach ($users as $user) {
        $roleName = (int)($user['role_id'] ?? 0) === 4 ? 'admin' : ((int)($user['role_id'] ?? 0) === 3 ? 'company' : ((int)($user['role_id'] ?? 0) === 2 ? 'driver' : 'customer'));
        $mapped[] = [
            'id' => $user['id'],
            'name' => $user['name'] ?? '',
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
            'is_active' => (int)($user['is_active'] ?? 0),
            'cv_path' => $user['cv_path'] ?? null,
            'role' => $roleName,
            'role_id' => (int)($user['role_id'] ?? 0),
            'created_at' => $user['created_at'] ?? null
        ];
    }
    echo json_encode($mapped);
    exit;
}

if ($method === 'PUT') {
    requireRole($pdo, 'admin');
    $input = json_decode(file_get_contents('php://input'), true);
    updateDocument('users', ['id' => (int)($input['id'] ?? 0)], [
        'is_active' => (int)($input['is_active'] ?? 0)
    ]);

    $approved = (int)($input['is_active'] ?? 0) === 1;
    $message = $approved ? 'User approved successfully.' : 'User status updated.';
    echo json_encode(['ok' => true, 'approved' => $approved, 'message' => $message]);
    exit;
}

if ($method === 'DELETE') {
    requireRole($pdo, 'admin');
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = (int)($input['id'] ?? 0);
    $user = findOneDocument('users', ['id' => $userId]);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $cvPath = str_replace('\\', '/', trim((string)($user['cv_path'] ?? '')));
    if (strpos($cvPath, 'uploads/driver-cvs/') === 0) {
        $absoluteCvPath = dirname(__DIR__) . '/' . $cvPath;
        if (is_file($absoluteCvPath)) {
            unlink($absoluteCvPath);
        }
    }

    deleteDocument('users', ['id' => $userId]);
    echo json_encode([
        'ok' => true,
        'message' => ($input['action'] ?? '') === 'reject'
            ? 'Driver rejected and removed.'
            : 'User deleted successfully.'
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
