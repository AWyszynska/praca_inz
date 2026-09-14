<?php

$serverName = "vetmell-database.database.windows.net"; 
$database   = "vetmell-db";                    
$username   = "";                     
$password   = "";                     

try {
    $dsn = "sqlsrv:Server=$serverName;Database=$database";

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, 
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC        
    ]);

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>