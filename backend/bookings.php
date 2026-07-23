<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['user_id'] ?? null;

function enrichBookingDetails(array $booking): array
{
    $enriched = $booking;

    if (!empty($booking['car_id'])) {
        $car = findOneDocument('cars', ['id' => (int)($booking['car_id'] ?? 0)]);
        if ($car) {
            $enriched['make'] = $car['make'] ?? '';
            $enriched['model'] = $car['model'] ?? '';
            $enriched['category'] = $car['category'] ?? '';
            $enriched['price_per_day'] = $car['price_per_day'] ?? 0;
        }
    }

    if (!empty($booking['user_id'])) {
        $user = findOneDocument('users', ['id' => (int)($booking['user_id'] ?? 0)]);
        if ($user) {
            $enriched['name'] = $user['name'] ?? '';
            $enriched['email'] = $user['email'] ?? '';
            $enriched['phone'] = $user['phone'] ?? '';
        }
    }

    if (!empty($booking['driver_id'])) {
        $driver = findOneDocument('users', ['id' => (int)($booking['driver_id'] ?? 0)]);
        if ($driver) {
            $enriched['driver_name'] = $driver['name'] ?? '';
            $enriched['driver_email'] = $driver['email'] ?? '';
        }
    }

    return $enriched;
}

if ($method === 'GET' && $userId) {
    $bookings = findManyDocuments('bookings');
    $filtered = array_values(array_filter($bookings, function ($booking) use ($userId) {
        return (int)($booking['user_id'] ?? 0) === (int)$userId;
    }));
    echo json_encode(array_map('enrichBookingDetails', $filtered));
    exit;
}

if ($method === 'GET' && isset($_GET['driver'])) {
    $pdo = getMySqlConnection();
    $driver = getCurrentUser($pdo);
    if (!$driver || (int)($driver['role_id'] ?? 0) !== 2) {
        http_response_code(403);
        echo json_encode(['error' => 'Driver access required']);
        exit;
    }

    $bookings = findManyDocuments('bookings', ['driver_id' => (int)$driver['id']]);
    echo json_encode(array_map('enrichBookingDetails', $bookings));
    exit;
}

if ($method === 'GET' && isset($_GET['admin'])) {
    echo json_encode(array_map('enrichBookingDetails', findManyDocuments('bookings')));
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $start = new DateTime($input['start_date'] ?? date('Y-m-d'));
    $end = new DateTime($input['end_date'] ?? date('Y-m-d'));
    $days = $end->diff($start)->days + 1;
    $carPrice = (float)($input['price_per_day'] ?? 50);
    $totalPrice = $carPrice * $days;

    $bookingId = insertDocument('bookings', [
        'id' => nextDocumentId('bookings'),
        'user_id' => (int)($input['user_id'] ?? 0),
        'car_id' => (int)($input['car_id'] ?? 0),
        'start_date' => $input['start_date'] ?? date('Y-m-d'),
        'end_date' => $input['end_date'] ?? date('Y-m-d'),
        'total_price' => (float)($input['total_price'] ?? $totalPrice),
        'status' => 'pending',
        'pickup_location' => trim((string)($input['pickup_location'] ?? '')),
        'needs_driver' => (int)($input['needs_driver'] ?? 0),
        'trip_status' => 'not_started'
    ]);

    echo json_encode(['id' => $bookingId, 'total_price' => (float)($input['total_price'] ?? $totalPrice)]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $updates = ['status' => $input['status'] ?? 'pending'];
    foreach (['driver_id', 'driver_response', 'trip_status', 'vehicle_issue'] as $field) {
        if (array_key_exists($field, $input)) {
            $updates[$field] = $input[$field];
        }
    }
    updateDocument('bookings', ['id' => (int)($input['id'] ?? 0)], $updates);
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    updateDocument('bookings', ['id' => (int)($input['id'] ?? 0)], ['status' => 'cancelled']);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
