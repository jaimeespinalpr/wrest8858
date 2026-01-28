<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';

$pdo = db();

$data = json_input();
$email = normalize_email($data['email'] ?? '');
$password = (string)($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'invalid_input']);
  exit;
}

try {
  $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
  $user = $stmt->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'bad_credentials']);
    exit;
  }

  session_regenerate_id(true);
  $_SESSION['uid'] = (int)$user['id'];

  $user_id = (int)$user['id'];
  $user_type = $user['user_type'];

  unset($user['password_hash']);

  if ($user_type === 'coach') {
    $stmt = $pdo->prepare('SELECT * FROM coaches WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch();
  } else {
    $stmt = $pdo->prepare('SELECT * FROM athletes WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch();
  }

  $stored_profile = null;
  try {
    $storage_key = 'wpl_profile_user_' . $user_id;
    $stmt = $pdo->prepare('SELECT storage_value FROM wpl_storage WHERE storage_key = ?');
    $stmt->execute([$storage_key]);
    $stored_value = $stmt->fetchColumn();
    if ($stored_value !== false) {
      $decoded = json_decode($stored_value, true);
      if (is_array($decoded)) {
        $stored_profile = $decoded;
      }
    }
  } catch (PDOException $storageErr) {
    $stored_profile = null;
  }

  $base_profile = [
    'user_id' => $user_id,
    'email' => $user['email'],
    'role' => $user_type,
    'name' => $profile['name'] ?? $user['email']
  ];
  $profile_payload = is_array($stored_profile)
    ? array_merge($base_profile, $stored_profile)
    : array_merge($base_profile, is_array($profile) ? $profile : []);
  $profile_payload['user_id'] = $user_id;
  $profile_payload['email'] = $user['email'];
  $profile_payload['role'] = $user_type;
  if (empty($profile_payload['name'])) {
    $profile_payload['name'] = $profile['name'] ?? $user['email'];
  }

  send_json([
    'ok' => true,
    'success' => true,
    'user' => $user,
    'profile' => $profile_payload
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'server_error']);
}
