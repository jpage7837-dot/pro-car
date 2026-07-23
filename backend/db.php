<?php

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$MYSQL_HOST = getenv('MYSQL_HOST') ?: '127.0.0.1';
$MYSQL_PORT = getenv('MYSQL_PORT') ?: '3306';
$MYSQL_DB = getenv('MYSQL_DB') ?: 'pro_car';
$MYSQL_USER = getenv('MYSQL_USER') ?: 'root';
$MYSQL_PASS = getenv('MYSQL_PASS') ?: '';
$MYSQL_CHARSET = getenv('MYSQL_CHARSET') ?: 'utf8mb4';

function getMySqlConfig(): array
{
    global $MYSQL_HOST, $MYSQL_PORT, $MYSQL_DB, $MYSQL_USER, $MYSQL_PASS, $MYSQL_CHARSET;

    return [
        'host' => $MYSQL_HOST,
        'port' => $MYSQL_PORT,
        'database' => $MYSQL_DB,
        'user' => $MYSQL_USER,
        'pass' => $MYSQL_PASS,
        'charset' => $MYSQL_CHARSET,
    ];
}

function getMySqlConnection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = getMySqlConfig();
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';charset=' . $config['charset'];
    $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
    $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . $config['database'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

    $pdo = new PDO(
        'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';dbname=' . $config['database'] . ';charset=' . $config['charset'],
        $config['user'],
        $config['pass'],
        $options
    );

    createMySqlTables($pdo);
    seedMySqlDemoData($pdo);

    return $pdo;
}

function getMySqlTableName(string $collectionName): string
{
    $mapping = [
        'users' => 'users',
        'cars' => 'cars',
        'bookings' => 'bookings',
        'payments' => 'payments',
    ];

    return $mapping[$collectionName] ?? $collectionName;
}

function getAllowedColumns(string $table): array
{
    $mapping = [
        'users' => ['id', 'name', 'email', 'phone', 'password_hash', 'role_id', 'is_active', 'cv_path', 'created_at'],
        'cars' => ['id', 'make', 'model', 'category', 'year', 'price_per_day', 'available', 'location'],
        'bookings' => ['id', 'user_id', 'car_id', 'start_date', 'end_date', 'total_price', 'status', 'pickup_location', 'needs_driver', 'driver_id', 'driver_response', 'trip_status', 'vehicle_issue'],
        'reviews' => ['id', 'user_id', 'rating', 'comment', 'created_at'],
        'payments' => ['id', 'booking_id', 'amount', 'method', 'payment_reference', 'status'],
    ];

    return $mapping[$table] ?? [];
}

function buildWhereClause(array $filter, array $allowedColumns): array
{
    $conditions = [];
    $params = [];

    foreach ($filter as $field => $value) {
        if (!in_array($field, $allowedColumns, true)) {
            continue;
        }

        $conditions[] = '`' . $field . '` = ?';
        $params[] = $value;
    }

    return [
        $conditions ? implode(' AND ', $conditions) : '',
        $params,
    ];
}

function createMySqlTables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users ('
        . 'id INT PRIMARY KEY, '
        . 'name VARCHAR(150) NOT NULL, '
        . 'email VARCHAR(150) NOT NULL UNIQUE, '
        . 'phone VARCHAR(30) DEFAULT NULL, '
        . 'password_hash VARCHAR(255) NOT NULL, '
        . 'role_id TINYINT NOT NULL DEFAULT 1, '
        . 'is_active TINYINT NOT NULL DEFAULT 1, '
        . 'cv_path VARCHAR(255) DEFAULT NULL, '
        . 'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cars ('
        . 'id INT PRIMARY KEY, '
        . 'make VARCHAR(100) NOT NULL, '
        . 'model VARCHAR(100) NOT NULL, '
        . 'category VARCHAR(50) NOT NULL, '
        . 'year INT NOT NULL, '
        . 'price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00, '
        . 'available TINYINT NOT NULL DEFAULT 1, '
        . 'location VARCHAR(100) NOT NULL DEFAULT "Nairobi") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS bookings ('
        . 'id INT PRIMARY KEY, '
        . 'user_id INT NOT NULL, '
        . 'car_id INT NOT NULL, '
        . 'start_date DATE NOT NULL, '
        . 'end_date DATE NOT NULL, '
        . 'total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00, '
        . 'status VARCHAR(20) NOT NULL DEFAULT "pending", '
        . 'pickup_location VARCHAR(150) DEFAULT NULL, '
        . 'needs_driver TINYINT NOT NULL DEFAULT 0, '
        . 'driver_id INT DEFAULT NULL, '
        . 'driver_response TEXT DEFAULT NULL, '
        . 'trip_status VARCHAR(20) NOT NULL DEFAULT "not_started", '
        . 'vehicle_issue TEXT DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS payments ('
        . 'id INT PRIMARY KEY, '
        . 'booking_id INT NOT NULL, '
        . 'amount DECIMAL(10,2) NOT NULL DEFAULT 0.00, '
        . 'method VARCHAR(50) NOT NULL DEFAULT "offline", '
        . 'payment_reference VARCHAR(120) DEFAULT NULL, '
        . 'status VARCHAR(20) NOT NULL DEFAULT "completed") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    addMySqlColumnIfMissing($pdo, 'payments', 'payment_reference', 'VARCHAR(120) DEFAULT NULL');
    addMySqlColumnIfMissing($pdo, 'bookings', 'driver_id', 'INT DEFAULT NULL');
    addMySqlColumnIfMissing($pdo, 'bookings', 'driver_response', 'TEXT DEFAULT NULL');
    addMySqlColumnIfMissing($pdo, 'bookings', 'trip_status', 'VARCHAR(20) NOT NULL DEFAULT "not_started"');
    addMySqlColumnIfMissing($pdo, 'bookings', 'vehicle_issue', 'TEXT DEFAULT NULL');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS reviews ('
        . 'id INT PRIMARY KEY, '
        . 'user_id INT NOT NULL, '
        . 'rating TINYINT NOT NULL, '
        . 'comment TEXT NOT NULL, '
        . 'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

function addMySqlColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    $config = getMySqlConfig();
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?'
    );
    $statement->execute([$config['database'], $table, $column]);
    if ((int)$statement->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE `' . $table . '` ADD COLUMN `' . $column . '` ' . $definition);
    }
}

function seedMySqlDemoData(PDO $pdo): void
{
    $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($userCount === 0) {
        $pdo->prepare(
            'INSERT INTO users (id, name, email, phone, password_hash, role_id, is_active, cv_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)' 
        )->execute([
            1,
            'Admin Demo',
            'admin@procar.local',
            '0123456789',
            password_hash('Admin@123', PASSWORD_BCRYPT),
            4,
            1,
            null,
            date('Y-m-d H:i:s'),
        ]);

        $pdo->prepare(
            'INSERT INTO users (id, name, email, phone, password_hash, role_id, is_active, cv_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)' 
        )->execute([
            2,
            'Customer Demo',
            'customer@procar.local',
            '0722000000',
            password_hash('Customer@123', PASSWORD_BCRYPT),
            1,
            1,
            null,
            date('Y-m-d H:i:s'),
        ]);
    } else {
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')->execute([
            password_hash('Customer@123', PASSWORD_BCRYPT),
            'customer@procar.local'
        ]);
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')->execute([
            password_hash('Admin@123', PASSWORD_BCRYPT),
            'admin@procar.local'
        ]);
    }

    $carCount = (int) $pdo->query('SELECT COUNT(*) FROM cars')->fetchColumn();
    if ($carCount < 80) {
        $seedCars = [
            ['Toyota', 'Corolla', 'Economy', 2023, 55.00, 1, 'Nairobi'],
            ['Toyota', 'Premio', 'Sedan', 2022, 58.00, 1, 'Nairobi'],
            ['Honda', 'Fit', 'Economy', 2021, 52.00, 1, 'Kisumu'],
            ['Mercedes', 'C-Class', 'Luxury', 2024, 120.00, 1, 'Nairobi'],
            ['Nissan', 'March', 'Economy', 2020, 47.00, 1, 'Mombasa'],
            ['Mazda', 'Axela', 'Sedan', 2021, 57.00, 1, 'Nakuru'],
            ['Subaru', 'Impreza', 'Hatchback', 2020, 60.00, 1, 'Nairobi'],
            ['BMW', '320i', 'Luxury', 2022, 140.00, 1, 'Nairobi'],
            ['Volkswagen', 'Golf', 'Hatchback', 2019, 49.00, 1, 'Kisumu'],
            ['Ford', 'Ranger', 'Pickup', 2021, 85.00, 1, 'Nairobi'],
            ['Jeep', 'Wrangler', 'SUV', 2023, 110.00, 1, 'Nairobi'],
            ['Toyota', 'Land Cruiser', 'SUV', 2022, 95.00, 1, 'Nakuru'],
            ['Hyundai', 'Elantra', 'Sedan', 2021, 54.00, 1, 'Eldoret'],
            ['Kia', 'Sportage', 'SUV', 2024, 90.00, 1, 'Mombasa'],
            ['Tesla', 'Model 3', 'Electric', 2023, 125.00, 1, 'Nairobi'],
            ['Volvo', 'XC60', 'Luxury', 2021, 135.00, 1, 'Nairobi'],
            ['Audi', 'A4', 'Luxury', 2022, 130.00, 1, 'Nakuru'],
            ['Peugeot', '208', 'Economy', 2020, 45.00, 1, 'Kisumu'],
            ['Chevrolet', 'Equinox', 'SUV', 2021, 78.00, 1, 'Nairobi'],
            ['Isuzu', 'D-Max', 'Pickup', 2020, 82.00, 1, 'Mombasa'],
            ['Lexus', 'ES 300h', 'Hybrid', 2024, 115.00, 1, 'Nairobi'],
            ['Honda', 'CR-V', 'SUV', 2022, 88.00, 1, 'Nairobi'],
            ['Toyota', 'Harrier', 'SUV', 2023, 92.00, 1, 'Kisumu'],
            ['Mercedes', 'GLE', 'Luxury', 2023, 150.00, 1, 'Mombasa'],
            ['Nissan', 'X-Trail', 'SUV', 2021, 84.00, 1, 'Nakuru'],
            ['Volkswagen', 'Passat', 'Sedan', 2020, 62.00, 1, 'Eldoret'],
            ['Ford', 'Explorer', 'SUV', 2022, 96.00, 1, 'Nairobi'],
            ['Hyundai', 'Santa Fe', 'SUV', 2024, 104.00, 1, 'Nairobi'],
            ['BMW', 'X5', 'Luxury', 2024, 170.00, 1, 'Nairobi'],
            ['Audi', 'Q5', 'SUV', 2022, 148.00, 1, 'Nakuru'],
            ['Toyota', 'RAV4', 'SUV', 2023, 97.00, 1, 'Mombasa'],
            ['Honda', 'Accord', 'Sedan', 2022, 66.00, 1, 'Nairobi'],
            ['Porsche', 'Macan', 'Luxury', 2023, 180.00, 1, 'Nairobi'],
            ['Mitsubishi', 'Outlander', 'SUV', 2021, 81.00, 1, 'Kisumu'],
            ['Kia', 'Sorento', 'SUV', 2023, 94.00, 1, 'Nairobi'],
            ['Toyota', 'Prado', 'SUV', 2022, 108.00, 1, 'Nakuru'],
            ['Renault', 'Kiger', 'SUV', 2024, 79.00, 1, 'Nairobi'],
            ['Mini', 'Cooper', 'Convertible', 2023, 112.00, 1, 'Mombasa'],
            ['Volvo', 'V60', 'Executive', 2021, 118.00, 1, 'Nairobi'],
            ['Jaguar', 'XE', 'Executive', 2022, 145.00, 1, 'Nairobi'],
            ['Mazda', 'CX-5', 'SUV', 2023, 86.00, 1, 'Nairobi'],
            ['Tesla', 'Model Y', 'Electric', 2024, 132.00, 1, 'Nakuru'],
            ['Lexus', 'NX 350', 'SUV', 2024, 122.00, 1, 'Nairobi'],
            ['Honda', 'HR-V', 'SUV', 2022, 74.00, 1, 'Nairobi'],
            ['Toyota', 'Sienta', 'Hybrid', 2023, 69.00, 1, 'Kisumu'],
            ['Nissan', 'Leaf', 'Electric', 2021, 71.00, 1, 'Nakuru'],
            ['Subaru', 'Forester', 'SUV', 2023, 91.00, 1, 'Nairobi'],
            ['Mazda', 'MX-5', 'Convertible', 2022, 109.00, 1, 'Mombasa'],
            ['Mercedes', 'E-Class', 'Luxury', 2023, 155.00, 1, 'Nairobi'],
            ['Audi', 'Q3', 'SUV', 2021, 142.00, 1, 'Nakuru'],
            ['Volkswagen', 'Tiguan', 'SUV', 2022, 89.00, 1, 'Eldoret'],
            ['Ford', 'Mustang', 'Coupe', 2022, 126.00, 1, 'Nairobi'],
            ['Jeep', 'Compass', 'SUV', 2021, 80.00, 1, 'Nairobi'],
            ['Kia', 'EV6', 'Electric', 2024, 138.00, 1, 'Nakuru'],
            ['Volvo', 'XC90', 'Luxury', 2022, 160.00, 1, 'Nairobi'],
            ['Porsche', 'Cayenne', 'Luxury', 2023, 188.00, 1, 'Nairobi'],
            ['Range Rover', 'Evoque', 'Luxury', 2022, 172.00, 1, 'Mombasa']
        ];

        $existingCars = [];
        $existingStmt = $pdo->query('SELECT LOWER(CONCAT(make, "|", model, "|", year)) AS key_value FROM cars');
        while ($row = $existingStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingCars[$row['key_value']] = true;
        }

        $stmt = $pdo->prepare('INSERT INTO cars (id, make, model, category, year, price_per_day, available, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($seedCars as $car) {
            $carKey = strtolower($car[0] . '|' . $car[1] . '|' . $car[3]);
            if (isset($existingCars[$carKey])) {
                continue;
            }

            $stmt->execute([
                nextDocumentId('cars'),
                $car[0],
                $car[1],
                $car[2],
                $car[3],
                $car[4],
                $car[5],
                $car[6],
            ]);
            $existingCars[$carKey] = true;
        }
    }
}

function findManyDocuments(string $collectionName, array $filter = []): array
{
    $table = getMySqlTableName($collectionName);
    $allowedColumns = getAllowedColumns($table);
    [$whereClause, $params] = buildWhereClause($filter, $allowedColumns);

    $sql = 'SELECT * FROM `' . $table . '`';
    if ($whereClause !== '') {
        $sql .= ' WHERE ' . $whereClause;
    }

    $pdo = getMySqlConnection();
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    return $statement->fetchAll();
}

function findOneDocument(string $collectionName, array $filter = []): ?array
{
    $table = getMySqlTableName($collectionName);
    $allowedColumns = getAllowedColumns($table);
    [$whereClause, $params] = buildWhereClause($filter, $allowedColumns);

    $sql = 'SELECT * FROM `' . $table . '`';
    if ($whereClause !== '') {
        $sql .= ' WHERE ' . $whereClause;
    }
    $sql .= ' LIMIT 1';

    $pdo = getMySqlConnection();
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    $row = $statement->fetch();
    return $row ?: null;
}

function nextDocumentId(string $collectionName): int
{
    $table = getMySqlTableName($collectionName);
    $pdo = getMySqlConnection();
    $statement = $pdo->query('SELECT MAX(id) AS max_id FROM `' . $table . '`');
    $row = $statement->fetch();
    return (int) ($row['max_id'] ?? 0) + 1;
}

function insertDocument(string $collectionName, array $document): int
{
    $table = getMySqlTableName($collectionName);
    $allowedColumns = getAllowedColumns($table);
    $document = array_intersect_key($document, array_flip($allowedColumns));
    $document['id'] = $document['id'] ?? nextDocumentId($collectionName);

    $fields = array_keys($document);
    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    $sql = 'INSERT INTO `' . $table . '` (`' . implode('`, `', $fields) . '`) VALUES (' . $placeholders . ')';

    $pdo = getMySqlConnection();
    $statement = $pdo->prepare($sql);
    $statement->execute(array_values($document));

    return (int) $document['id'];
}

function updateDocument(string $collectionName, array $filter, array $update): bool
{
    $table = getMySqlTableName($collectionName);
    $allowedColumns = getAllowedColumns($table);
    $setParts = [];
    $setValues = [];

    foreach ($update as $field => $value) {
        if (!in_array($field, $allowedColumns, true)) {
            continue;
        }

        $setParts[] = '`' . $field . '` = ?';
        $setValues[] = $value;
    }

    if ($setParts === []) {
        return false;
    }

    [$whereClause, $whereValues] = buildWhereClause($filter, $allowedColumns);
    $sql = 'UPDATE `' . $table . '` SET ' . implode(', ', $setParts);
    if ($whereClause !== '') {
        $sql .= ' WHERE ' . $whereClause;
    }

    $pdo = getMySqlConnection();
    $statement = $pdo->prepare($sql);
    $statement->execute(array_merge($setValues, $whereValues));

    return $statement->rowCount() > 0;
}

function deleteDocument(string $collectionName, array $filter): bool
{
    $table = getMySqlTableName($collectionName);
    $allowedColumns = getAllowedColumns($table);
    [$whereClause, $params] = buildWhereClause($filter, $allowedColumns);

    $sql = 'DELETE FROM `' . $table . '`';
    if ($whereClause !== '') {
        $sql .= ' WHERE ' . $whereClause;
    }

    $pdo = getMySqlConnection();
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    return $statement->rowCount() > 0;
}

function getCurrentUser($pdo): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $user = findOneDocument('users', ['id' => (int) $_SESSION['user_id']]);
    return $user ?: null;
}

function requireRole($pdo, string $requiredRole): void
{
    $user = getCurrentUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $roleMap = [
        'customer' => 1,
        'driver' => 2,
        'company' => 3,
        'admin' => 4,
    ];

    $actualRole = (int) ($user['role_id'] ?? 0);
    $requiredLevel = (int) ($roleMap[$requiredRole] ?? 0);
    if ($actualRole < $requiredLevel) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

function requireAnyRole(PDO $pdo, array $requiredRoles): void
{
    $user = getCurrentUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $roleMap = ['customer' => 1, 'driver' => 2, 'company' => 3, 'admin' => 4];
    if (!in_array((int)($user['role_id'] ?? 0), array_map(static fn($role) => $roleMap[$role] ?? 0, $requiredRoles), true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Insufficient permissions']);
        exit;
    }
}

// Connection is initialized lazily and reused via the static PDO instance.
