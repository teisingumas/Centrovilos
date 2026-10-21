<?php
/* Centro Vila TVS – bendras branduolys: duomenys, sesija, pagalbinės funkcijos.
   Duomenys laikomi /_data (neįtraukta į git, uždaryta nuo naršyklės). */
declare(strict_types=1);

const CV_V = '20261021k';             /* CSS/JS versija (naršyklės podėlio atnaujinimui) */
define('CV_ROOT', dirname(__DIR__));
define('CV_DATA', CV_ROOT . '/_data');
define('CV_UPLOADS', CV_ROOT . '/uploads');

function cv_json_read(string $f, $def = null)
{
    if (!is_file($f)) return $def;
    $j = json_decode((string)file_get_contents($f), true);
    return $j === null ? $def : $j;
}

function cv_json_write(string $f, $data): void
{
    $dir = dirname($f);
    if (!is_dir($dir)) mkdir($dir, 0750, true);
    $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $f);
}

/* pirmas paleidimas: sukuriami duomenų aplankai ir turinys iš cms/seed.json */
function cv_data_init(): void
{
    foreach ([CV_DATA, CV_DATA . '/istorija', CV_DATA . '/sesijos', CV_UPLOADS] as $d) {
        if (!is_dir($d)) mkdir($d, 0750, true);
    }
    if (!is_file(CV_DATA . '/.htaccess')) file_put_contents(CV_DATA . '/.htaccess', "Require all denied\n");
    if (!is_file(CV_UPLOADS . '/.htaccess')) {
        /* įkeltuose failuose kodas niekada nevykdomas */
        file_put_contents(CV_UPLOADS . '/.htaccess', "Options -Indexes -ExecCGI\nRemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar\nRemoveType .php .phtml .phar\n<FilesMatch \"\\.(php\\d?|phtml|phar|pl|py|cgi|sh|html?|svg|js)$\">\nRequire all denied\n</FilesMatch>\n");
    }
    if (!is_file(CV_DATA . '/live.json')) copy(CV_ROOT . '/cms/seed.json', CV_DATA . '/live.json');
    if (!is_file(CV_DATA . '/draft.json')) copy(CV_DATA . '/live.json', CV_DATA . '/draft.json');
}

function cv_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || (int)($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

function cv_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    cv_data_init();
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '28800');
    session_save_path(CV_DATA . '/sesijos');
    session_name('cvadm');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => cv_https(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

const CV_IDLE = 8 * 3600; /* sesija baigiasi po 8 val. neveiklumo */

function cv_users(): array { return cv_json_read(CV_DATA . '/users.json', []); }
function cv_users_save(array $u): void { cv_json_write(CV_DATA . '/users.json', array_values($u)); }

/* prisijungęs administratorius arba null (tik visiškai prisijungęs: slaptažodis + 2FA, jei įjungta) */
function cv_user(): ?array
{
    if (session_status() !== PHP_SESSION_ACTIVE) return null;
    $id = $_SESSION['uid'] ?? null;
    if (!$id || empty($_SESSION['full'])) return null;
    if (time() - (int)($_SESSION['seen'] ?? 0) > CV_IDLE) { cv_logout(); return null; }
    foreach (cv_users() as $u) {
        if ($u['id'] === $id && empty($u['disabled'])) {
            if (($u['pwv'] ?? 0) !== ($_SESSION['pwv'] ?? -1)) { cv_logout(); return null; } /* slaptažodis pakeistas kitur */
            $_SESSION['seen'] = time();
            return $u;
        }
    }
    cv_logout();
    return null;
}

function cv_logout(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) return;
    $_SESSION = [];
    $p = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => $p['samesite']]);
    session_destroy();
}

/* turinys svetainei: paskelbtas, o administratoriui įjungus peržiūrą – juodraštis */
function cv_content(): array
{
    cv_data_init();
    static $c = null;
    if ($c !== null) return $c;
    $file = CV_DATA . '/live.json';
    if (isset($_COOKIE['cvadm'])) {
        cv_session_start();
        if (cv_user() && !empty($_SESSION['preview'])) { $file = CV_DATA . '/draft.json'; $GLOBALS['CV_PREVIEW'] = true; }
        session_write_close();
    }
    $c = cv_json_read($file) ?? cv_json_read(CV_ROOT . '/cms/seed.json');
    return $c;
}

/* ---------- išvedimo pagalbininkai ---------- */
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
/* tekstas su *žodžiu* -> <em>žodžiu</em> (vario kursyvas) */
function t($s): string { return preg_replace('/\*([^*]+)\*/u', '<em>$1</em>', e($s)); }
function cv_tel(string $p): string { return 'tel:' . preg_replace('/[^0-9+]/', '', $p); }
function cv_aptno(string $no): string { return (string)(int)$no; }
function cv_badge(string $status, string $extra = ''): string
{
    if ($status === '') return '';
    $cls = 'bt-badge' . ($status === 'Laisvas' ? ' bt-badge--free' : ($status === 'Parduotas' ? ' bt-badge--sold' : '')) . $extra;
    return '<span class="' . $cls . '">' . e($status) . '</span>';
}
