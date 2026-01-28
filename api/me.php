<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';

$pdo = db();
require_auth();

$uid = (int)($_SESSION['uid'] ?? 0);

$stmt = $pdo->prepare("SELECT id, email, name, created_at FROM users WHERE id = ? LIMIT 1");
$stmt->execute([$uid]);
$me = $stmt->fetch();

echo json_encode(['ok' => true, 'me' => $me]);
