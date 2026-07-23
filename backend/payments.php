<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['admin'])) {
        requireAnyRole(getMySqlConnection(), ['admin', 'company']);
        echo json_encode(findManyDocuments('payments'));
        exit;
    }
    $bookingId = $_GET['booking_id'] ?? null;
    if ($bookingId) {
        $payments = findManyDocuments('payments');
        $filtered = array_values(array_filter($payments, function ($payment) use ($bookingId) {
            return (int)($payment['booking_id'] ?? 0) === (int)$bookingId;
        }));
        echo json_encode($filtered);
        exit;
    }
}

if ($method === 'POST') {
    $pdo = getMySqlConnection();
    $currentUser = getCurrentUser($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $booking = findOneDocument('bookings', ['id' => (int)($input['booking_id'] ?? 0)]);
    if (!$currentUser || !$booking || ((int)($currentUser['role_id'] ?? 0) === 1 && (int)$booking['user_id'] !== (int)$currentUser['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'You cannot pay for this booking']);
        exit;
    }
    $paymentId = insertDocument('payments', [
        'id' => nextDocumentId('payments'),
        'booking_id' => (int)($input['booking_id'] ?? 0),
        'amount' => (float)($input['amount'] ?? 0),
        'method' => $input['method'] ?? 'offline',
        'payment_reference' => $input['payment_reference'] ?? null,
        'status' => 'completed'
    ]);

    echo json_encode(['id' => $paymentId]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
