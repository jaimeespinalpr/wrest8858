<?php
require __DIR__ . '/security.php';
echo json_encode(['ok' => true, 'session_active' => session_status() === PHP_SESSION_ACTIVE]);
