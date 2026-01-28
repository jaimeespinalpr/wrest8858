<?php
require __DIR__ . '/db.php';
$pdo->query('SELECT 1');
echo json_encode(['ok' => true]);
