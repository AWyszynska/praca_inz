# VetMell

Aplikacja internetowa wspomagająca zarządzanie lecznicą weterynaryjną.

## Uruchomienie bazy danych

Do projektu dołączony jest plik bazy danych w formacie `.bacpac`.

### Wymagania

Do uruchomienia bazy danych wymagane są:

- Microsoft SQL Server,
- SQL Server Management Studio (SSMS),
- XAMPP z PHP,
- Microsoft ODBC Driver for SQL Server,
- rozszerzenia PHP:
  - `sqlsrv`,
  - `pdo_sqlsrv`.

---

## 1. Import bazy danych

1. Uruchom SQL Server Management Studio (SSMS).
2. Połącz się ze swoją lokalną instancją SQL Server.
3. W panelu po lewej kliknij prawym przyciskiem myszy na:

   `Databases`

4. Wybierz:

   `Import Data-tier Application...`

5. Kliknij `Next`.
6. Wybierz opcję:

   `Import from local disk`

7. Wskaż znajdujący się w projekcie plik:

   `vetmell-db-2026-9-14.bacpac`

8. Jako nazwę bazy ustaw:

   `vetmell-db`

9. Przejdź dalej i rozpocznij import.
10. Po zakończeniu baza `vetmell-db` powinna być widoczna w SSMS.

---

## 2. Konfiguracja połączenia z bazą

Po zaimportowaniu bazy należy skonfigurować plik:

`db.php`

Plik znajduje się w głównym katalogu projektu.

Przykładowa konfiguracja dla lokalnego SQL Server Express:

```php
<?php

$serverName = "localhost\\SQLEXPRESS";
$database   = "vetmell-db";
$username   = "LOGIN_SQL";
$password   = "HASLO_SQL";

try {
    $dsn = "sqlsrv:Server=$serverName;Database=$database";

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>