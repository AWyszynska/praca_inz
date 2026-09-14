<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php'; // musi istnieć: C:\xampp\htdocs\praca_inz\db.php

function send_json(bool $ok, string $message, array $extra = []): never {
    echo json_encode(array_merge([
        'ok' => $ok,
        'message' => $message,
    ], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function post_str(string $key): string {
    return trim((string)($_POST[$key] ?? ''));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(false, 'Nieprawidłowa metoda żądania.');
}

$firstName = post_str('first_name');
$lastName  = post_str('last_name');
$email     = post_str('email');
$phone     = post_str('phone');
$birthDate = post_str('birth_date');

$password  = (string)($_POST['password'] ?? '');
$password2 = (string)($_POST['password_confirm'] ?? '');
$terms     = (string)($_POST['terms'] ?? '');

$errors = [];

if ($firstName === '') {
    $errors[] = 'Imię jest wymagane.';
}

if ($lastName === '') {
    $errors[] = 'Nazwisko jest wymagane.';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Podaj poprawny adres e-mail.';
}

if ($password === '' || strlen($password) < 6) {
    $errors[] = 'Hasło musi mieć minimum 6 znaków.';
}

if ($password !== $password2) {
    $errors[] = 'Hasła nie są takie same.';
}

if ($terms !== '1') {
    $errors[] = 'Musisz zaakceptować politykę prywatności.';
}

$birthDateForDb = null;

if ($birthDate !== '') {
    $d = DateTime::createFromFormat('Y-m-d', $birthDate);

    if ($d && $d->format('Y-m-d') === $birthDate) {
        $birthDateForDb = $birthDate;
    } else {
        $errors[] = 'Nieprawidłowy format daty urodzenia.';
    }
}

if (!empty($errors)) {
    send_json(false, 'Popraw błędy w formularzu.', [
        'errors' => $errors,
    ]);
}

try {
    $check = $pdo->prepare("SELECT COUNT(*) FROM dbo.client WHERE email = :email");
    $check->execute([
        ':email' => $email,
    ]);

    if ((int)$check->fetchColumn() > 0) {
        send_json(false, 'Konto z tym adresem e-mail już istnieje.', [
            'errors' => ['Konto z tym adresem e-mail już istnieje.'],
        ]);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $sql = "
        INSERT INTO dbo.client
            (first_name, last_name, birth_date, email, password_hash, phone)
        VALUES
            (:first_name, :last_name, :birth_date, :email, :password_hash, :phone)
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':first_name'    => $firstName,
        ':last_name'     => $lastName,
        ':birth_date'    => $birthDateForDb,
        ':email'         => $email,
        ':password_hash' => $hash,
        ':phone'         => $phone !== '' ? $phone : null,
    ]);

    send_json(true, 'Konto zostało utworzone.', [
        'redirect' => 'final_view.php?file=login.xml',
    ]);
} catch (PDOException $e) {
    send_json(false, 'Błąd bazy danych. Spróbuj ponownie później.', [
        'errors' => ['Błąd bazy danych. Spróbuj ponownie później.'],

        // TYLKO DO TESTÓW możesz na chwilę odkomentować:
        // 'debug' => $e->getMessage(),
    ]);
}