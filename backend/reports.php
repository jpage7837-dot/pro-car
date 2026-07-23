<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

requireAnyRole(getMySqlConnection(), ['admin', 'company']);
$users = findManyDocuments('users');
$bookings = findManyDocuments('bookings');
$payments = findManyDocuments('payments');
$cars = findManyDocuments('cars');
$byStatus = [];
foreach ($bookings as $booking) {
    $status = (string)($booking['status'] ?? 'pending');
    $byStatus[$status] = ($byStatus[$status] ?? 0) + 1;
}

echo json_encode([
    'users' => count($users),
    'cars' => count($cars),
    'bookings' => count($bookings),
    'payments' => count($payments),
    'revenue' => array_sum(array_map(static fn($payment) => (float)($payment['amount'] ?? 0), $payments)),
    'bookings_by_status' => $byStatus
]);
