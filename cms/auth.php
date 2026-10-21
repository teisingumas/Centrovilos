<?php
/* Centro Vila TVS – prisijungimas: slaptažodžiai, bandymų ribojimas, CSRF, 2FA (TOTP), laiškai */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const CV_MAX_FAILS = 5;          /* nesėkmingi bandymai iki užrakto */
const CV_LOCK_SEC = 15 * 60;     /* užrakto trukmė */
const CV_DEVICE_DAYS = 30;       /* „Atsiminti šį įrenginį“ */

function cv_secret(): string
{
    $f = CV_DATA . '/secret.key';
    if (!is_file($f)) { cv_data_init(); file_put_contents($f, bin2hex(random_bytes(32)), LOCK_EX); chmod($f, 0600); }
    return trim((string)file_get_contents($f));
}

/* pirmas administratorius iš cms/bootstrap.php (naudojamas tik kol paskyrų dar nėra) */
function cv_bootstrap_users(): void
{
    if (is_file(CV_DATA . '/users.json')) return;
    $b = @include __DIR__ . '/bootstrap.php';
    if (!is_array($b)) return;
    cv_users_save([[
        'id' => bin2hex(random_bytes(6)), 'email' => strtolower($b['email']), 'name' => $b['name'], 'hash' => $b['hash'],
        'pwv' => 1, 'mustChange' => true, 'created' => date('c'), 'totp' => null, 'backup' => [],
    ]]);
}

/* pagrindinis administratorius: tik jis kuria, išjungia ir trina paskyras */
const CV_OWNER_EMAIL = 'deividas15@gmail.com';
function cv_is_owner(?array $u): bool { return $u !== null && strtolower((string)$u['email']) === CV_OWNER_EMAIL; }

function cv_find_user(string $field, string $val): ?array
{
    foreach (cv_users() as $u) if (strtolower((string)($u[$field] ?? '')) === strtolower($val)) return $u;
    return null;
}

function cv_update_user(string $id, callable $fn): ?array
{
    $all = cv_users(); $out = null;
    foreach ($all as $i => $u) if ($u['id'] === $id) { $all[$i] = $fn($u); $out = $all[$i]; }
    cv_users_save($all);
    return $out;
}

function cv_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? '0'); }

/* ---------- bandymų ribojimas ---------- */
function cv_limits(): array { return cv_json_read(CV_DATA . '/limits.json', []); }
function cv_locked(array $keys): int
{
    $L = cv_limits(); $max = 0;
    foreach ($keys as $k) if (isset($L[$k]['until']) && $L[$k]['until'] > time()) $max = max($max, $L[$k]['until'] - time());
    return $max;
}
function cv_fail(array $keys): void
{
    $L = cv_limits(); $now = time();
    foreach ($L as $k => $v) if (($v['t'] ?? 0) < $now - 86400) unset($L[$k]);
    foreach ($keys as $k) {
        $v = $L[$k] ?? ['n' => 0];
        if (($v['until'] ?? 0) && $v['until'] <= $now) $v = ['n' => 0];
        $v['n'] = ($v['n'] ?? 0) + 1; $v['t'] = $now;
        /* el. paštui – 5 bandymai, visam IP (pvz. biuro tinklui) – 20 */
        if ($v['n'] >= (str_starts_with($k, 'ip:') ? CV_MAX_FAILS * 4 : CV_MAX_FAILS)) $v['until'] = $now + CV_LOCK_SEC;
        $L[$k] = $v;
    }
    cv_json_write(CV_DATA . '/limits.json', $L);
}
function cv_clear_fails(array $keys): void
{
    $L = cv_limits(); foreach ($keys as $k) unset($L[$k]); cv_json_write(CV_DATA . '/limits.json', $L);
}

/* ---------- CSRF ---------- */
function cv_csrf(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function cv_csrf_ok(?string $t): bool { return is_string($t) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t); }

/* ---------- slaptažodžiai ---------- */
function cv_pw_problem(string $pw): ?string
{
    if (mb_strlen($pw) < 10) return 'Slaptažodis turi būti bent 10 simbolių.';
    if (mb_strlen($pw) > 200) return 'Slaptažodis per ilgas.';
    return null;
}
function cv_temp_password(): string
{
    $a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $s = '';
    for ($i = 0; $i < 14; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
    return substr($s, 0, 4) . '-' . substr($s, 4, 5) . '-' . substr($s, 9);
}

/* ---------- TOTP (RFC 6238), suderinama su Google Authenticator ir kt. ---------- */
function cv_b32enc(string $bin): string
{
    $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
    foreach (str_split($bin) as $c) $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    foreach (str_split($bits, 5) as $chunk) $out .= $map[bindec(str_pad($chunk, 5, '0'))];
    return $out;
}
function cv_b32dec(string $s): string
{
    $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
    foreach (str_split(strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $s))) as $c) $bits .= str_pad(decbin(strpos($map, $c)), 5, '0', STR_PAD_LEFT);
    foreach (str_split($bits, 8) as $b) if (strlen($b) === 8) $out .= chr(bindec($b));
    return $out;
}
function cv_totp(string $secret, int $step): string
{
    $h = hash_hmac('sha1', pack('N2', 0, $step), cv_b32dec($secret), true);
    $o = ord($h[19]) & 0xf;
    $n = ((ord($h[$o]) & 0x7f) << 24) | (ord($h[$o + 1]) << 16) | (ord($h[$o + 2]) << 8) | ord($h[$o + 3]);
    return str_pad((string)($n % 1000000), 6, '0', STR_PAD_LEFT);
}
/* grąžina panaudotą žingsnį arba null; tas pats kodas antrą kartą nepriimamas */
function cv_totp_check(string $secret, string $code, int $lastStep = 0): ?int
{
    $code = preg_replace('/\D/', '', $code);
    if (strlen($code) !== 6) return null;
    $now = intdiv(time(), 30);
    for ($d = -1; $d <= 1; $d++) {
        $s = $now + $d;
        if ($s > $lastStep && hash_equals(cv_totp($secret, $s), $code)) return $s;
    }
    return null;
}

/* „Atsiminti šį įrenginį“ – pasirašytas slapukas */
function cv_device_cookie_set(array $u): void
{
    $exp = time() + CV_DEVICE_DAYS * 86400;
    $v = $u['id'] . '.' . $exp . '.' . hash_hmac('sha256', $u['id'] . '|' . $exp . '|' . ($u['totp']['secret'] ?? ''), cv_secret());
    setcookie('cvdev_' . $u['id'], $v, ['expires' => $exp, 'path' => '/prisijungimas/', 'secure' => cv_https(), 'httponly' => true, 'samesite' => 'Strict']);
}
function cv_device_ok(array $u): bool
{
    $v = $_COOKIE['cvdev_' . $u['id']] ?? '';
    $p = explode('.', $v);
    if (count($p) !== 3 || $p[0] !== $u['id'] || (int)$p[1] < time()) return false;
    return hash_equals(hash_hmac('sha256', $p[0] . '|' . $p[1] . '|' . ($u['totp']['secret'] ?? ''), cv_secret()), $p[2]);
}

/* ---------- žurnalas ---------- */
function cv_log(string $who, string $what): void
{
    $f = CV_DATA . '/zurnalas.json';
    $L = cv_json_read($f, []);
    array_unshift($L, ['t' => date('c'), 'who' => $who, 'what' => $what, 'ip' => cv_ip()]);
    cv_json_write($f, array_slice($L, 0, 500));
}

/* ---------- laiškai ---------- */
function cv_mail(string $to, string $subject, string $body): bool
{
    $host = preg_replace('~^https?://(www\.)?|:\d+$~', '', cv_base_url());
    $headers = "From: Centro Vila <no-reply@{$host}>\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

/* nuorodoms laiškuose naudojamas tik leidžiamas domenas (apsauga nuo suklastotos Host antraštės).
   Perkeliant į kliento domeną – įrašykite jį į CV_HOSTS. */
const CV_HOSTS = ['juda.vedejasedvardas.lt', 'centrovila.lt', 'www.centrovila.lt', '127.0.0.1:8812'];
function cv_base_url(): string
{
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    if (!in_array($host, CV_HOSTS, true)) $host = CV_HOSTS[0];
    return ($host === '127.0.0.1:8812' ? 'http://' : 'https://') . $host;
}
