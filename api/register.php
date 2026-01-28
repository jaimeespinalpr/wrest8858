<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';

$pdo = db();

$data = json_input();
$email = normalize_email($data['email'] ?? '');
$password = (string)($data['password'] ?? '');
$user_type = $data['user_type'] ?? null;
$name = trim((string)($data['name'] ?? ''));
$profile_payload = $data['profile'] ?? null;

if (!$email || !$password || !$user_type || !$name) {
    send_json(['ok' => false, 'error' => 'missing_fields'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(['ok' => false, 'error' => 'invalid_email'], 400);
}

if (strlen($password) < 8) {
    send_json(['ok' => false, 'error' => 'weak_password'], 400);
}

if (!in_array($user_type, ['coach', 'athlete'], true)) {
    send_json(['ok' => false, 'error' => 'invalid_user_type'], 400);
}

// Limitar y filtrar profile para evitar basura / payload gigante
$profile_data = is_array($profile_payload) ? $profile_payload : [];
$allowed_keys = [
  'preferred_moves',
  'experience_years',
  'stance',
  'weight_class',
  'notes'
];
$filtered = [];
foreach ($allowed_keys as $k) {
  if (array_key_exists($k, $profile_data)) $filtered[$k] = $profile_data[$k];
}
$profile_data = $filtered;

// Limitar tamaño total del JSON (evita abuso)
$storage_value_test = json_encode($profile_data, JSON_UNESCAPED_UNICODE);
if ($storage_value_test !== false && strlen($storage_value_test) > 20000) { // 20KB
    send_json(['ok' => false, 'error' => 'profile_too_large'], 413);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Si tienes UNIQUE en email, esto igual está ok
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        send_json(['ok' => false, 'error' => 'email_exists'], 409);
    }

    $pdo->beginTransaction();

    // OJO: esta columna debe existir: user_type
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, user_type, created_at) VALUES (?, ?, ?, NOW())');
    $stmt->execute([$email, $hash, $user_type]);
    $user_id = (int)$pdo->lastInsertId();

    if ($user_type === 'coach') {
        $stmt = $pdo->prepare('INSERT INTO coaches (user_id, name, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$user_id, $name]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO athletes (user_id, name, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$user_id, $name]);
    }

    // Perfil mínimo “servidor manda”, no el cliente
    $profile_data['user_id'] = $user_id;
    $profile_data['email'] = $email;
    $profile_data['role'] = $user_type;
    $profile_data['name'] = $name;

    $storage_key = 'wpl_profile_user_' . $user_id;
    $storage_value = json_encode($profile_data, JSON_UNESCAPED_UNICODE);

    if ($storage_value !== false) {
        // Esto requiere storage_key UNIQUE
        $stmt = $pdo->prepare(
            "INSERT INTO wpl_storage (storage_key, storage_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value), updated_at = CURRENT_TIMESTAMP"
        );
        $stmt->execute([$storage_key, $storage_value]);
    }

    $pdo->commit();

    session_regenerate_id(true);
    $_SESSION['uid'] = $user_id;

    send_json(['ok' => true, 'success' => true, 'user_id' => $user_id], 201);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    // NO devuelvas detalles del error al cliente (seguridad)
    $message = $e->getMessage();
    if (str_contains($message, 'Duplicate')) {
        send_json(['ok' => false, 'error' => 'email_exists'], 409);
    }
    send_json(['ok' => false, 'error' => 'server_error'], 500);
}
