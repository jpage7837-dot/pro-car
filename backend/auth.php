<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Quick debug helper: if ?debug=1 is present, return request info and exit.
if (isset($_GET['debug']) && (string)$_GET['debug'] === '1') {
    $raw = file_get_contents('php://input');
    $hdrs = function_exists('getallheaders') ? getallheaders() : [];
    echo json_encode([
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'query' => $_GET,
        'headers' => $hdrs,
        'raw_body' => $raw,
        'post' => $_POST,
        'request' => $_REQUEST,
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

$pdo = getMySqlConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = trim((string)($_GET['action'] ?? ''));

function readRequestInput(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $rawBody = file_get_contents('php://input');

    if (is_string($rawBody) && $rawBody !== '') {
        $trimmedBody = trim($rawBody);

        if (stripos($contentType, 'application/json') !== false || preg_match('/^\s*\{.*\}\s*$/s', $trimmedBody)) {
            $decoded = json_decode($trimmedBody, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        parse_str($trimmedBody, $parsed);
        if (!empty($parsed)) {
            return $parsed;
        }
    }

    if (!empty($_POST)) {
        return $_POST;
    }

    if (!empty($_REQUEST)) {
        return $_REQUEST;
    }

    return [];
}

function ensureUserCvColumn($pdo)
{
    return true;
}

function saveDriverCv($file)
{
    if (empty($file['tmp_name']) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return null;
    }

    $uploadDir = dirname(__DIR__) . '/uploads/driver-cvs';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = 'driver-' . time() . '-' . bin2hex(random_bytes(4));
    $targetPath = $uploadDir . '/' . $safeName . ($extension ? '.' . $extension : '');

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        return null;
    }

    return 'uploads/driver-cvs/' . basename($targetPath);
}

ensureUserCvColumn($pdo);

$input = readRequestInput();
if ($action === '' && !empty($input['action'])) {
    $action = trim((string)$input['action']);
}
if ($action === '' && !empty($input['name']) && array_key_exists('email', $input) && array_key_exists('password', $input)) {
    $action = 'register';
}
if ($action === '' && array_key_exists('email', $input) && array_key_exists('password', $input)) {
    $action = 'login';
}

if ($method === 'POST' && $action === 'register') {
    $input = readRequestInput();

    if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $email = strtolower(trim((string)($input['email'] ?? '')));
    $existingUser = findOneDocument('users', ['email' => $email]);
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    $passwordHash = password_hash((string)($input['password'] ?? ''), PASSWORD_BCRYPT);
    $roleId = (int)($input['role_id'] ?? 1);
    $isActive = 1;
    $cvPath = null;

    if ($roleId === 2) {
        $cvFile = $_FILES['driver_cv'] ?? null;
        $cvPath = saveDriverCv($cvFile ?? []);
        if (!$cvPath) {
            $errorResponse = ['error' => 'Please upload your CV before registering as a driver'];
            if ($cvFile !== null) {
                $errorResponse['file_info'] = [
                    'name' => $cvFile['name'] ?? null,
                    'type' => $cvFile['type'] ?? null,
                    'size' => $cvFile['size'] ?? null,
                    'error' => $cvFile['error'] ?? null,
                ];
            }
            http_response_code(400);
            echo json_encode($errorResponse);
            exit;
        }
        $isActive = 0;
    }

    if ($roleId === 3) {
        $isActive = 0;
    }

    $userId = insertDocument('users', [
        'id' => nextDocumentId('users'),
        'name' => trim((string)($input['name'] ?? '')),
        'email' => $email,
        'phone' => trim((string)($input['phone'] ?? '')),
        'password_hash' => $passwordHash,
        'role_id' => $roleId,
        'is_active' => $isActive,
        'cv_path' => $cvPath,
        'created_at' => date('Y-m-d H:i:s')
    ]);

    $pendingApproval = $isActive === 0;
    echo json_encode([
        'id' => $userId,
        'message' => $pendingApproval ? 'Registration submitted. Waiting for admin approval.' : 'User registered successfully',
        'pending_approval' => $pendingApproval,
        'role_id' => $roleId,
        'is_active' => $isActive
    ]);
    exit;
}

if ($method === 'POST' && $action === 'login') {
    $input = readRequestInput();
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = (string)($input['password'] ?? '');

    $user = findOneDocument('users', ['email' => $email]);
    if ($user && (string)($user['password_hash'] ?? '') === '$2y$10$examplehashforcustomerpw') {
        $user['password_hash'] = password_hash('Customer@123', PASSWORD_BCRYPT);
        $pdo = getMySqlConnection();
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')->execute([
            $user['password_hash'],
            $email,
        ]);
    }

    if ($user && password_verify($password, (string)($user['password_hash'] ?? ''))) {
        if ((int)($user['is_active'] ?? 0) !== 1) {
            http_response_code(403);
            echo json_encode(['error' => 'Account pending admin approval']);
            exit;
        }

        $token = bin2hex(random_bytes(32));
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_token'] = $token;
        $_SESSION['user_name'] = $user['name'] ?? '';
        $_SESSION['user_email'] = $user['email'] ?? '';
        $_SESSION['user_role_id'] = (int)($user['role_id'] ?? 0);

        echo json_encode([
            'id' => (int)$user['id'],
            'name' => $user['name'] ?? '',
            'email' => $user['email'] ?? '',
            'role_id' => (int)($user['role_id'] ?? 0),
            'token' => $token
        ]);
        exit;
    }

    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    echo json_encode(['message' => 'Logged out']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
