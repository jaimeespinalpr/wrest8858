<?php
require __DIR__ . '/db.php';

function respond(array $payload, int $code = 200): void {
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

$table = 'wpl_storage';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  if (!empty($_GET['all'])) {
    $stmt = $pdo->query("SELECT storage_key, storage_value FROM {$table}");
    $rows = $stmt->fetchAll();
    $data = [];
    foreach ($rows as $row) {
      $data[$row['storage_key']] = $row['storage_value'];
    }
    respond(['data' => $data]);
  }

  $key = $_GET['key'] ?? '';
  if (!$key) {
    respond(['error' => 'missing_key'], 400);
  }

  $stmt = $pdo->prepare("SELECT storage_value FROM {$table} WHERE storage_key = ?");
  $stmt->execute([$key]);
  $value = $stmt->fetchColumn();
  if ($value === false) {
    respond(['error' => 'not_found'], 404);
  }
  respond(['value' => $value]);
}

$raw = file_get_contents('php://input');
$body = $raw !== '' ? json_decode($raw, true) : [];
if ($raw !== '' && $body === null) {
  respond(['error' => 'invalid_json'], 400);
}

if ($method === 'POST') {
  if (isset($body['entries']) && is_array($body['entries'])) {
    $entries = $body['entries'];
    if (!count($entries)) {
      respond(['ok' => true]);
    }
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
      "INSERT INTO {$table} (storage_key, storage_value) VALUES (?, ?) " .
      "ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value), updated_at = CURRENT_TIMESTAMP"
    );
    foreach ($entries as $key => $value) {
      $stmt->execute([$key, $value]);
    }
    $pdo->commit();
    respond(['ok' => true, 'count' => count($entries)]);
  }

  if (($body['action'] ?? '') === 'delete') {
    $key = $body['key'] ?? '';
    if (!$key) {
      respond(['error' => 'missing_key'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM {$table} WHERE storage_key = ?");
    $stmt->execute([$key]);
    respond(['ok' => true]);
  }

  if (isset($body['key']) && array_key_exists('value', $body)) {
    $stmt = $pdo->prepare(
      "INSERT INTO {$table} (storage_key, storage_value) VALUES (?, ?) " .
      "ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value), updated_at = CURRENT_TIMESTAMP"
    );
    $stmt->execute([$body['key'], $body['value']]);
    respond(['ok' => true]);
  }

  respond(['error' => 'invalid_payload'], 400);
}

if ($method === 'DELETE') {
  $key = $_GET['key'] ?? ($body['key'] ?? '');
  if (!$key) {
    respond(['error' => 'missing_key'], 400);
  }
  $stmt = $pdo->prepare("DELETE FROM {$table} WHERE storage_key = ?");
  $stmt->execute([$key]);
  respond(['ok' => true]);
}

respond(['error' => 'method_not_allowed'], 405);
