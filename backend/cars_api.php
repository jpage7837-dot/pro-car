<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function getCarImageUrl(array $car): string
{
    $existing = trim((string)($car['image_url'] ?? ''));
    if ($existing !== '') {
        return $existing;
    }

    $imageMap = [
        'toyota corolla' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'toyota premio' => 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80',
        'honda fit' => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
        'mercedes c-class' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
        'nissan march' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'mazda axela' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'subaru impreza' => 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
        'bmw 320i' => 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
        'volkswagen golf' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'ford ranger' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'jeep wrangler' => 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80',
        'toyota land cruiser' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'hyundai elantra' => 'https://images.unsplash.com/photo-1471174617910-3b1d2f0f5b8e?auto=format&fit=crop&w=900&q=80',
        'kia sportage' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'tesla model 3' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
        'volvo xc60' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'audi a4' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'peugeot 208' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'chevrolet equinox' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'isuzu d-max' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'lexus es 300h' => 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80',
        'honda cr-v' => 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
        'toyota harrier' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'mercedes gle' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
        'nissan x-trail' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'volkswagen passat' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'ford explorer' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'hyundai santa fe' => 'https://images.unsplash.com/photo-1471174617910-3b1d2f0f5b8e?auto=format&fit=crop&w=900&q=80',
        'bmw x5' => 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
        'audi q5' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'toyota rav4' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'honda accord' => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
        'porsche macan' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'mitsubishi outlander' => 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
        'kia sorento' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'toyota prado' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'renault kiger' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'mini cooper' => 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
        'volvo v60' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'jaguar xe' => 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
        'mazda cx-5' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'tesla model y' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
        'lexus nx 350' => 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80',
        'honda hr-v' => 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
        'toyota sienta' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'nissan leaf' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'subaru forester' => 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
        'mazda mx-5' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'mercedes e-class' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
        'audi q3' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'volkswagen tiguan' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'ford mustang' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'jeep compass' => 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80',
        'kia ev6' => 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
        'volvo xc90' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'porsche cayenne' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'range rover evoque' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80'
    ];

    $categoryImageMap = [
        'economy' => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
        'sedan' => 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80',
        'luxury' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
        'suv' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'electric' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
        'hybrid' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'hatchback' => 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
        'pickup' => 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80',
        'convertible' => 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
        'executive' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
        'coupe' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80'
    ];

    $key = strtolower(trim(($car['make'] ?? '') . ' ' . ($car['model'] ?? '')));
    if (isset($imageMap[$key])) {
        return $imageMap[$key];
    }

    $category = strtolower(trim((string)($car['category'] ?? '')));
    if (isset($categoryImageMap[$category])) {
        return $categoryImageMap[$category];
    }

    return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80';
}

function getFallbackCars(): array
{
    $catalog = [
        ['Toyota', 'Corolla', 'Economy', 2023, 55, 'Nairobi', 'images/car-placeholder.svg'],
        ['Toyota', 'Premio', 'Sedan', 2022, 58, 'Nairobi', 'images/car-placeholder.svg'],
        ['Honda', 'Fit', 'Economy', 2021, 52, 'Kisumu', 'images/car-placeholder.svg'],
        ['Mercedes', 'C-Class', 'Luxury', 2024, 120, 'Nairobi', 'images/car-placeholder.svg'],
        ['Nissan', 'March', 'Economy', 2020, 47, 'Mombasa', 'images/car-placeholder.svg'],
        ['Mazda', 'Axela', 'Sedan', 2021, 57, 'Nakuru', 'images/car-placeholder.svg'],
        ['Subaru', 'Impreza', 'Hatchback', 2020, 60, 'Nairobi', 'images/car-placeholder.svg'],
        ['BMW', '320i', 'Luxury', 2022, 140, 'Nairobi', 'images/car-placeholder.svg'],
        ['Volkswagen', 'Golf', 'Hatchback', 2019, 49, 'Kisumu', 'images/car-placeholder.svg'],
        ['Ford', 'Ranger', 'Pickup', 2021, 85, 'Nairobi', 'images/car-placeholder.svg'],
        ['Jeep', 'Wrangler', 'SUV', 2023, 110, 'Nairobi', 'images/car-placeholder.svg'],
        ['Toyota', 'Land Cruiser', 'SUV', 2022, 95, 'Nakuru', 'images/car-placeholder.svg'],
        ['Hyundai', 'Elantra', 'Sedan', 2021, 54, 'Eldoret', 'images/car-placeholder.svg'],
        ['Kia', 'Sportage', 'SUV', 2024, 90, 'Mombasa', 'images/car-placeholder.svg'],
        ['Tesla', 'Model 3', 'Electric', 2023, 125, 'Nairobi', 'images/car-placeholder.svg'],
        ['Volvo', 'XC60', 'Luxury', 2021, 135, 'Nairobi', 'images/car-placeholder.svg'],
        ['Audi', 'A4', 'Luxury', 2022, 130, 'Nakuru', 'images/car-placeholder.svg'],
        ['Peugeot', '208', 'Economy', 2020, 45, 'Kisumu', 'images/car-placeholder.svg'],
        ['Chevrolet', 'Equinox', 'SUV', 2021, 78, 'Nairobi', 'images/car-placeholder.svg'],
        ['Isuzu', 'D-Max', 'Pickup', 2020, 82, 'Mombasa', 'images/car-placeholder.svg'],
        ['Lexus', 'ES 300h', 'Hybrid', 2024, 115, 'Nairobi', 'images/car-placeholder.svg'],
        ['Honda', 'CR-V', 'SUV', 2022, 88, 'Nairobi', 'images/car-placeholder.svg'],
        ['Toyota', 'Harrier', 'SUV', 2023, 92, 'Kisumu', 'images/car-placeholder.svg'],
        ['Mercedes', 'GLE', 'Luxury', 2023, 150, 'Mombasa', 'images/car-placeholder.svg'],
        ['Nissan', 'X-Trail', 'SUV', 2021, 84, 'Nakuru', 'images/car-placeholder.svg'],
        ['Volkswagen', 'Passat', 'Sedan', 2020, 62, 'Eldoret', 'images/car-placeholder.svg'],
        ['Ford', 'Explorer', 'SUV', 2022, 96, 'Nairobi', 'images/car-placeholder.svg'],
        ['Hyundai', 'Santa Fe', 'SUV', 2024, 104, 'Nairobi', 'images/car-placeholder.svg'],
        ['BMW', 'X5', 'Luxury', 2024, 170, 'Nairobi', 'images/car-placeholder.svg'],
        ['Audi', 'Q5', 'SUV', 2022, 148, 'Nakuru', 'images/car-placeholder.svg'],
        ['Toyota', 'RAV4', 'SUV', 2023, 97, 'Mombasa', 'images/car-placeholder.svg'],
        ['Honda', 'Accord', 'Sedan', 2022, 66, 'Nairobi', 'images/car-placeholder.svg'],
        ['Porsche', 'Macan', 'Luxury', 2023, 180, 'Nairobi', 'images/car-placeholder.svg'],
        ['Mitsubishi', 'Outlander', 'SUV', 2021, 81, 'Kisumu', 'images/car-placeholder.svg'],
        ['Kia', 'Sorento', 'SUV', 2023, 94, 'Nairobi', 'images/car-placeholder.svg'],
        ['Toyota', 'Prado', 'SUV', 2022, 108, 'Nakuru', 'images/car-placeholder.svg'],
        ['Renault', 'Kiger', 'SUV', 2024, 79, 'Nairobi', 'images/car-placeholder.svg'],
        ['Mini', 'Cooper', 'Convertible', 2023, 112, 'Mombasa', 'images/car-placeholder.svg'],
        ['Volvo', 'V60', 'Executive', 2021, 118, 'Nairobi', 'images/car-placeholder.svg'],
        ['Jaguar', 'XE', 'Executive', 2022, 145, 'Nairobi', 'images/car-placeholder.svg'],
        ['Mazda', 'CX-5', 'SUV', 2023, 86, 'Nairobi', 'images/car-placeholder.svg'],
        ['Tesla', 'Model Y', 'Electric', 2024, 132, 'Nakuru', 'images/car-placeholder.svg'],
        ['Lexus', 'NX 350', 'SUV', 2024, 122, 'Nairobi', 'images/car-placeholder.svg'],
        ['Honda', 'HR-V', 'SUV', 2022, 74, 'Nairobi', 'images/car-placeholder.svg'],
        ['Toyota', 'Sienta', 'Hybrid', 2023, 69, 'Kisumu', 'images/car-placeholder.svg'],
        ['Nissan', 'Leaf', 'Electric', 2021, 71, 'Nakuru', 'images/car-placeholder.svg'],
        ['Subaru', 'Forester', 'SUV', 2023, 91, 'Nairobi', 'images/car-placeholder.svg'],
        ['Mazda', 'MX-5', 'Convertible', 2022, 109, 'Mombasa', 'images/car-placeholder.svg'],
        ['Mercedes', 'E-Class', 'Luxury', 2023, 155, 'Nairobi', 'images/car-placeholder.svg'],
        ['Audi', 'Q3', 'SUV', 2021, 142, 'Nakuru', 'images/car-placeholder.svg'],
        ['Volkswagen', 'Tiguan', 'SUV', 2022, 89, 'Eldoret', 'images/car-placeholder.svg'],
        ['Ford', 'Mustang', 'Coupe', 2022, 126, 'Nairobi', 'images/car-placeholder.svg'],
        ['Jeep', 'Compass', 'SUV', 2021, 80, 'Nairobi', 'images/car-placeholder.svg'],
        ['Kia', 'EV6', 'Electric', 2024, 138, 'Nakuru', 'images/car-placeholder.svg'],
        ['Volvo', 'XC90', 'Luxury', 2022, 160, 'Nairobi', 'images/car-placeholder.svg'],
        ['Porsche', 'Cayenne', 'Luxury', 2023, 188, 'Nairobi', 'images/car-placeholder.svg'],
        ['Range Rover', 'Evoque', 'Luxury SUV', 2024, 250, 'Mombasa', 'images/car-placeholder.svg'],
        ['Ferrari', 'F8 Tributo', 'Exotic', 2024, 500, 'Nairobi', 'images/car-placeholder.svg'],
        ['Lamborghini', 'Revuelto', 'Exotic', 2024, 550, 'Nairobi', 'images/car-placeholder.svg'],
        ['Porsche', '911 Turbo', 'Exotic', 2023, 450, 'Mombasa', 'images/car-placeholder.svg'],
        ['Rolls Royce', 'Ghost', 'Exotic Luxury', 2024, 800, 'Nairobi', 'images/car-placeholder.svg'],
        ['Bentley', 'Continental GT', 'Exotic Luxury', 2023, 700, 'Nairobi', 'images/car-placeholder.svg'],
        ['Maserati', 'MC20', 'Exotic', 2024, 480, 'Mombasa', 'images/car-placeholder.svg'],
        ['Aston Martin', 'DB11', 'Exotic Luxury', 2024, 720, 'Nairobi', 'images/car-placeholder.svg'],
        ['McLaren', '720S', 'Exotic', 2024, 760, 'Nairobi', 'images/car-placeholder.svg'],
        ['Mercedes', 'Maybach S-Class', 'Luxury', 2024, 900, 'Nairobi', 'images/car-placeholder.svg']
    ];

    $cars = [];
    $index = 1;
    foreach ($catalog as $car) {
        $cars[] = [
            'id' => $index,
            'make' => $car[0],
            'model' => $car[1],
            'category' => $car[2],
            'year' => $car[3],
            'price_per_day' => $car[4],
            'available' => 1,
            'location' => $car[5],
            'image_url' => $car[6],
        ];
        $index++;
    }

    return $cars;
}

function getCarsFromStorage(): array
{
    try {
        $cars = findManyDocuments('cars');
        if (!empty($cars)) {
            return array_values($cars);
        }
    } catch (Throwable $e) {
        error_log('cars_api: unable to read cars from storage - ' . $e->getMessage());
    }

    return getFallbackCars();
}

function ensureSeedCars(): void
{
    try {
        $cars = findManyDocuments('cars');
        if (!empty($cars)) {
            return;
        }
    } catch (Throwable $e) {
        error_log('cars_api: unable to seed cars - ' . $e->getMessage());
        return;
    }

    $seedCars = getFallbackCars();

    foreach ($seedCars as $car) {
        try {
            insertDocument('cars', $car);
        } catch (Throwable $e) {
            error_log('cars_api: unable to insert seed car - ' . $e->getMessage());
        }
    }
}

function mergeCars($dbCars, $fallbackCars)
{
    $merged = [];
    $seen = [];

    foreach (array_merge($dbCars, $fallbackCars) as $car) {
        $key = strtolower(trim(($car['make'] ?? '') . '|' . ($car['model'] ?? '') . '|' . ($car['year'] ?? '') . '|' . ($car['category'] ?? '') . '|' . ($car['location'] ?? '')));
        if (!isset($seen[$key])) {
            $seen[$key] = true;
            $merged[] = $car;
        }
    }

    return $merged;
}

function getBookedCarIds(): array
{
    $bookings = findManyDocuments('bookings');
    $ids = [];
    foreach ($bookings as $booking) {
        $status = strtolower((string)($booking['status'] ?? ''));
        if ($status !== 'cancelled' && $status !== 'rejected') {
            $ids[] = (int)($booking['car_id'] ?? 0);
        }
    }
    return $ids;
}

function applyCarFilters($cars, $filters)
{
    $filtered = $cars;

    if (!empty($filters['category'])) {
        $filtered = array_values(array_filter($filtered, function ($car) use ($filters) {
            return strtolower((string)($car['category'] ?? '')) === strtolower((string)$filters['category']);
        }));
    }

    if (!empty($filters['price_min'])) {
        $filtered = array_values(array_filter($filtered, function ($car) use ($filters) {
            return (float)($car['price_per_day'] ?? 0) >= (float)$filters['price_min'];
        }));
    }

    if (!empty($filters['price_max'])) {
        $filtered = array_values(array_filter($filtered, function ($car) use ($filters) {
            return (float)($car['price_per_day'] ?? 0) <= (float)$filters['price_max'];
        }));
    }

    if (!empty($filters['year_min'])) {
        $filtered = array_values(array_filter($filtered, function ($car) use ($filters) {
            return (int)($car['year'] ?? 0) >= (int)$filters['year_min'];
        }));
    }

    if (!empty($filters['year_max'])) {
        $filtered = array_values(array_filter($filtered, function ($car) use ($filters) {
            return (int)($car['year'] ?? 0) <= (int)$filters['year_max'];
        }));
    }

    return $filtered;
}

ensureSeedCars();

if ($method === 'GET' && isset($_GET['admin'])) {
    requireAnyRole(getMySqlConnection(), ['admin', 'company']);
    $cars = getCarsFromStorage();
    $cars = array_map(function ($car) {
        $car['image_url'] = getCarImageUrl($car);
        return $car;
    }, $cars);
    echo json_encode($cars, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $filters = [
        'category' => isset($_GET['category']) ? $_GET['category'] : '',
        'price_min' => isset($_GET['price_min']) ? $_GET['price_min'] : '',
        'price_max' => isset($_GET['price_max']) ? $_GET['price_max'] : '',
        'year_min' => isset($_GET['year_min']) ? $_GET['year_min'] : '',
        'year_max' => isset($_GET['year_max']) ? $_GET['year_max'] : ''
    ];

    $cars = getCarsFromStorage();
    $cars = array_values(array_filter($cars, function ($car) {
        return (int)($car['available'] ?? 1) === 1;
    }));

    $cars = applyCarFilters($cars, $filters);
    $bookedCarIds = getBookedCarIds();
    $cars = array_map(function ($car) use ($bookedCarIds) {
        $carId = (int)($car['id'] ?? 0);
        $isBooked = in_array($carId, $bookedCarIds, true);
        $car['booked'] = $isBooked;
        $car['available'] = $isBooked ? 0 : (int)($car['available'] ?? 1);
        $car['image_url'] = getCarImageUrl($car);
        return $car;
    }, $cars);

    echo json_encode(array_slice($cars, 0, $limit), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    requireAnyRole(getMySqlConnection(), ['admin', 'company']);
    $input = json_decode(file_get_contents('php://input'), true);
    $carId = insertDocument('cars', [
        'id' => nextDocumentId('cars'),
        'make' => trim((string)($input['make'] ?? '')),
        'model' => trim((string)($input['model'] ?? '')),
        'category' => trim((string)($input['category'] ?? 'Economy')),
        'year' => (int)($input['year'] ?? 0),
        'price_per_day' => (float)($input['price_per_day'] ?? 0),
        'available' => (int)($input['available'] ?? 1),
        'location' => trim((string)($input['location'] ?? 'Nationwide'))
    ]);

    echo json_encode(['id' => $carId]);
    exit;
}

if ($method === 'PUT') {
    requireAnyRole(getMySqlConnection(), ['admin', 'company']);
    $input = json_decode(file_get_contents('php://input'), true);
    updateDocument('cars', ['id' => (int)($input['id'] ?? 0)], [
        'make' => trim((string)($input['make'] ?? '')),
        'model' => trim((string)($input['model'] ?? '')),
        'category' => trim((string)($input['category'] ?? 'Economy')),
        'year' => (int)($input['year'] ?? 0),
        'price_per_day' => (float)($input['price_per_day'] ?? 0),
        'available' => (int)($input['available'] ?? 1),
        'location' => trim((string)($input['location'] ?? 'Nationwide'))
    ]);

    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    requireAnyRole($pdo, ['admin', 'company']);
    $input = json_decode(file_get_contents('php://input'), true);
    deleteDocument('cars', ['id' => (int)($input['id'] ?? 0)]);

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
