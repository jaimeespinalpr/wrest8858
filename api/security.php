<?php
$config = require __DIR__ . '/config.php';

// Headers básicos
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

// session cookies seguros
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'domain' => $config['cookie_domain'] ?? '',
  'secure' => $config['cookie_secure'] ?? true,
  'httponly' => true,
  'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

function require_auth()
{
  if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized']);
    exit;
  }
}

function send_json($payload, $code = 200)
{
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

function json_input()
{
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) return [];
  return $data;
}

function normalize_email($email)
{
  return strtolower(trim($email));
}
