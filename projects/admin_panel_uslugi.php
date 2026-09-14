<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

function out_json(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : $_POST;
}

function clean_text($value, int $max = 255): string {
    $value = trim((string)$value);
    return mb_substr($value, 0, $max);
}

function clean_description($value): string {
    return trim((string)$value);
}

function parse_price($value): float {
    $value = trim((string)$value);
    $value = str_replace(',', '.', $value);

    if ($value === '' || !is_numeric($value)) {
        return 0.0;
    }

    return max(0, (float)$value);
}

function parse_duration($value): int {
    $n = (int)$value;
    if ($n <= 0) return 30;
    if ($n > 600) return 600;
    return $n;
}

function money_pl($value): string {
    return number_format((float)$value, 2, ',', ' ') . ' zł';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$body = get_body();
$action = (string)($body['action'] ?? $_GET['action'] ?? 'list');

try {
    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT
                id,
                name,
                description,
                is_active,
                price,
                default_duration_min
            FROM dbo.service
            ORDER BY is_active DESC, name ASC
        ");

        $services = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $services[] = [
                'id' => (int)$row['id'],
                'name' => (string)($row['name'] ?? ''),
                'description' => (string)($row['description'] ?? ''),
                'is_active' => (bool)($row['is_active'] ?? false),
                'price' => (float)($row['price'] ?? 0),
                'price_label' => money_pl($row['price'] ?? 0),
                'default_duration_min' => (int)($row['default_duration_min'] ?? 30),
            ];
        }

        out_json([
            'ok' => true,
            'services' => $services
        ]);
    }

    if ($action === 'save') {
        $id = (int)($body['id'] ?? 0);
        $name = clean_text($body['name'] ?? '', 255);
        $description = clean_description($body['description'] ?? '');
        $price = parse_price($body['price'] ?? 0);
        $duration = parse_duration($body['default_duration_min'] ?? 30);
        $isActive = !empty($body['is_active']) ? 1 : 0;

        if ($name === '') {
            out_json([
                'ok' => false,
                'message' => 'Nazwa usługi jest wymagana.'
            ], 422);
        }

        if ($id > 0) {
            $stmt = $pdo->prepare("
                UPDATE dbo.service
                SET
                    name = :name,
                    description = :description,
                    is_active = :is_active,
                    price = :price,
                    default_duration_min = :default_duration_min
                WHERE id = :id
            ");

            $stmt->execute([
                ':name' => $name,
                ':description' => $description,
                ':is_active' => $isActive,
                ':price' => $price,
                ':default_duration_min' => $duration,
                ':id' => $id
            ]);

            out_json([
                'ok' => true,
                'message' => 'Usługa została zaktualizowana.'
            ]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO dbo.service
                (name, description, is_active, price, default_duration_min)
            OUTPUT INSERTED.id
            VALUES
                (:name, :description, :is_active, :price, :default_duration_min)
        ");

        $stmt->execute([
            ':name' => $name,
            ':description' => $description,
            ':is_active' => $isActive,
            ':price' => $price,
            ':default_duration_min' => $duration
        ]);

        $newId = (int)$stmt->fetchColumn();

        out_json([
            'ok' => true,
            'message' => 'Usługa została dodana.',
            'id' => $newId
        ]);
    }

    if ($action === 'set_active') {
        $id = (int)($body['id'] ?? 0);
        $isActive = !empty($body['is_active']) ? 1 : 0;

        if ($id <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID usługi.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.service
            SET is_active = :is_active
            WHERE id = :id
        ");

        $stmt->execute([
            ':is_active' => $isActive,
            ':id' => $id
        ]);

        out_json([
            'ok' => true,
            'message' => 'Status usługi został zmieniony.'
        ]);
    }

    if ($action === 'delete') {
        $id = (int)($body['id'] ?? 0);

        if ($id <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID usługi.'
            ], 422);
        }

        try {
            $stmt = $pdo->prepare("
                DELETE FROM dbo.service
                WHERE id = :id
            ");

            $stmt->execute([
                ':id' => $id
            ]);

            out_json([
                'ok' => true,
                'message' => 'Usługa została usunięta.'
            ]);
        } catch (Throwable $e) {
            // Jeżeli usługa jest już użyta w wizytach, nie usuwamy jej fizycznie,
            // tylko wyłączamy w cenniku.
            $stmt = $pdo->prepare("
                UPDATE dbo.service
                SET is_active = 0
                WHERE id = :id
            ");

            $stmt->execute([
                ':id' => $id
            ]);

            out_json([
                'ok' => true,
                'message' => 'Usługa jest używana w wizytach, więc została wyłączona zamiast usunięta.'
            ]);
        }
    }

    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
} catch (Throwable $e) {
    error_log('[admin_panel_uslugi.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd obsługi usług.'
    ], 500);
}