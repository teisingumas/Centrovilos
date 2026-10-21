<?php
/* Centro Vila TVS – valdymo skydelio API (JSON). Visi veiksmai tik prisijungus ir su CSRF žeton. */
declare(strict_types=1);
require __DIR__ . '/../cms/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function out($d, int $code = 200): never { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $m, int $code = 400): never { out(['error' => $m], $code); }

cv_data_init();
cv_session_start();
$me = cv_user();
if (!$me) fail('Sesija baigėsi – prisijunkite iš naujo.', 401);
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !cv_csrf_ok($_SERVER['HTTP_X_CSRF'] ?? null)) fail('Netinkama užklausa.', 403);

$a = (string)($_GET['a'] ?? '');
$in = [];
if (str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) fail('Netinkami duomenys.');
}
session_write_close(); /* sesijos nebekeičiame – leidžiame lygiagrečias užklausas */

$DRAFT = CV_DATA . '/draft.json';
$LIVE = CV_DATA . '/live.json';
$HIST = CV_DATA . '/istorija';

function pub_user(array $u, array $me): array
{
    return ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'twofa' => !empty($u['totp']['enabled']),
        'mustChange' => !empty($u['mustChange']), 'disabled' => !empty($u['disabled']), 'me' => $u['id'] === $me['id'],
        'backupLeft' => count($u['backup'] ?? [])];
}
function history_list(string $dir): array
{
    $out = [];
    foreach (glob($dir . '/*.json') ?: [] as $f) {
        $m = cv_json_read($f . '.meta', []);
        $out[] = ['id' => basename($f, '.json'), 't' => $m['t'] ?? date('c', filemtime($f)), 'who' => $m['who'] ?? '', 'note' => $m['note'] ?? ''];
    }
    usort($out, fn($a, $b) => strcmp($b['id'], $a['id']));
    return $out;
}
function snapshot(string $dir, array $data, string $who, string $note): void
{
    $id = date('Ymd-His') . '-' . bin2hex(random_bytes(2));
    cv_json_write("$dir/$id.json", $data);
    cv_json_write("$dir/$id.json.meta", ['t' => date('c'), 'who' => $who, 'note' => $note]);
    $all = glob($dir . '/*.json') ?: []; sort($all);
    foreach (array_slice($all, 0, max(0, count($all) - 60)) as $old) { @unlink($old); @unlink($old . '.meta'); }
}

/* ---------- turinio tikrinimas prieš išsaugant ---------- */
function clean_str($v, int $max = 3000): string
{
    $s = is_scalar($v) ? (string)$v : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr(trim($s), 0, $max);
}
/* rekursyviai: tik ta pati struktūra kaip šablone (seed) – nežinomi raktai atmetami, tipai suvienodinami */
function shape($new, $tpl)
{
    if (is_array($tpl) && array_is_list($tpl)) {
        if (!is_array($new) || !array_is_list($new)) return $tpl;
        $item = $tpl[0] ?? null;
        $out = [];
        foreach (array_slice($new, 0, 200) as $v) $out[] = $item === null ? clean_str($v) : shape($v, $item);
        return $out;
    }
    if (is_array($tpl)) {
        $out = [];
        foreach ($tpl as $k => $tv) $out[$k] = array_key_exists($k, is_array($new) ? $new : []) ? shape($new[$k], $tv) : $tv;
        return $out;
    }
    if (is_bool($tpl)) return (bool)$new;
    if (is_int($tpl) || is_float($tpl)) return is_numeric($new) ? $new + 0 : $tpl;
    if ($tpl === null) return null;
    return clean_str($new);
}
function img_ok(string $s): bool { return (bool)preg_match('~^/(img|uploads)/[A-Za-z0-9_\-./]+\.(webp|jpe?g|png)$~', $s) && !str_contains($s, '..'); }

function validate(array $new, array $old): array
{
    $seed = cv_json_read(CV_ROOT . '/cms/seed.json');
    /* šablonas sąrašų elementams – pilniausi pavyzdžiai iš seed */
    $tpl = $seed;
    $tpl['about']['tabs'][0]['items'][0] = ['title' => '', 'text' => ''];
    $tpl['about']['facts'][0] = ['value' => '', 'small' => '', 'label' => '', 'word' => false];
    $tpl['apartments'][0]['plans'][0]['rooms'][0] = ['n' => '', 'name' => '', 'area' => ''];
    $tpl['apartments'][0]['features'][0] = ['text' => '', 'icon' => 'dot'];
    $tpl['gallery']['items'][0] = ['src' => '', 'thumb' => '', 'alt' => '', 'w' => 0, 'h' => 0];
    $tpl['home']['location']['places'][0] = ['name' => '', 'min' => '', 'walk' => false, 'x' => 0, 'y' => 0];
    $d = shape($new, $tpl);

    $ct = &$d['site']['contacts'];
    foreach (['mapsUrl', 'facebook'] as $k) if (!preg_match('~^https://~i', $ct[$k])) throw new RuntimeException('Nuoroda turi prasidėti „https://“: ' . $ct[$k]);
    if (!filter_var($ct['email'], FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Neteisingas el. pašto adresas: ' . $ct['email']);
    if ($d['contacts']['formEmail'] !== '' && !filter_var($d['contacts']['formEmail'], FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Neteisingas formos gavėjo el. paštas.');
    foreach ($ct['people'] as $p) if ($p['phone'] !== '' && !preg_match('~^[0-9+ ()\-]{6,20}$~', $p['phone'])) throw new RuntimeException('Neteisingas telefono numeris: ' . $p['phone']);

    /* nuotraukos – tik iš /img/ ar /uploads/ */
    $imgs = [&$d['home']['about']['image']['src']];
    foreach ($d['home']['gallery']['items'] as $i => $_) $imgs[] = &$d['home']['gallery']['items'][$i]['src'];
    foreach ($d['gallery']['items'] as $i => $_) { $imgs[] = &$d['gallery']['items'][$i]['src']; $imgs[] = &$d['gallery']['items'][$i]['thumb']; }
    foreach ($imgs as &$s) if (!img_ok($s)) throw new RuntimeException('Netinkamas nuotraukos kelias.');
    unset($s);
    /* pagrindinio puslapio galerijoje – visada 7 vietos */
    if (count($d['home']['gallery']['items']) !== 7) $d['home']['gallery']['items'] = $old['home']['gallery']['items'];

    /* žemėlapio taškai žemėlapio ribose */
    foreach ($d['home']['location']['places'] as &$p) { $p['x'] = max(10, min(990, round((float)$p['x']))); $p['y'] = max(10, min(750, round((float)$p['y']))); }
    unset($p);

    /* butai: skaičius, numeriai, aukštai ir planų nuotraukos keičiami tik kode */
    $byNo = [];
    foreach ($old['apartments'] as $o) $byNo[$o['no']] = $o;
    $apts = [];
    foreach ($d['apartments'] as $ap) {
        if (!isset($byNo[$ap['no']])) continue;
        $o = $byNo[$ap['no']];
        $ap['floor'] = $o['floor'];
        if (!in_array($ap['status'], ['Laisvas', 'Rezervuotas', 'Parduotas'], true)) $ap['status'] = $o['status'];
        $plans = [];
        foreach ($o['plans'] as $i => $op) {
            $np = $ap['plans'][$i] ?? $op;
            $np['img'] = $op['img'];
            if (count($o['plans']) === 1) $np['caption'] = $op['caption'];
            $plans[] = $np;
        }
        $ap['plans'] = $plans;
        foreach ($ap['features'] as &$f) if (!in_array($f['icon'], ['parking', 'storage', 'dot'], true)) $f['icon'] = 'dot';
        unset($f);
        $apts[] = $ap;
    }
    if (count($apts) !== count($old['apartments'])) throw new RuntimeException('Butų sąrašas neatitinka.');
    $d['apartments'] = $apts;
    $d['floors'] = $old['floors'];
    if (count($d['about']['tabs']) < 1) throw new RuntimeException('Turi likti bent vienas skirtukas.');
    return $d;
}

/* ---------- nuotraukų įkėlimas ---------- */
const CV_MAX_UPLOAD = 1024 * 1024; /* 1 MB */
function upload_image(array $f): array
{
    if (($f['error'] ?? 1) === UPLOAD_ERR_INI_SIZE || ($f['size'] ?? 0) > CV_MAX_UPLOAD) fail('Failas per didelis (' . number_format(($f['size'] ?? 0) / 1048576, 1, ',', '') . ' MB). Didžiausias leidžiamas – 1 MB.');
    if (($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) fail('Nepavyko įkelti failo.');
    $info = @getimagesize($f['tmp_name']);
    $type = $info[2] ?? 0;
    $src = match ($type) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($f['tmp_name']),
        IMAGETYPE_PNG => @imagecreatefrompng($f['tmp_name']),
        IMAGETYPE_WEBP => @imagecreatefromwebp($f['tmp_name']),
        default => false,
    };
    if (!$src) fail('Tinka tik JPG, PNG arba WebP nuotraukos.');
    if ($type === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $o = (int)(@exif_read_data($f['tmp_name'])['Orientation'] ?? 1);
        if ($o === 3) $src = imagerotate($src, 180, 0); elseif ($o === 6) $src = imagerotate($src, -90, 0); elseif ($o === 8) $src = imagerotate($src, 90, 0);
    }
    $w = imagesx($src); $h = imagesy($src);
    if ($w < 300 || $h < 200) fail('Nuotrauka per maža (mažiausiai 300×200 px).');
    $base = preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', pathinfo((string)$f['name'], PATHINFO_FILENAME)) ?: 'foto'));
    $base = trim(substr($base, 0, 40), '-') ?: 'foto';
    $dir = date('Y-m');
    @mkdir(CV_UPLOADS . '/' . $dir, 0755, true);
    $name = $base . '-' . bin2hex(random_bytes(3));
    $save = function (int $max, string $suffix) use ($src, $w, $h, $dir, $name): array {
        $k = min(1, $max / max($w, $h)); $nw = (int)round($w * $k); $nh = (int)round($h * $k);
        $im = imagecreatetruecolor($nw, $nh);
        imagealphablending($im, false); imagesavealpha($im, true);
        imagecopyresampled($im, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        $rel = "/uploads/$dir/$name$suffix.webp";
        imagewebp($im, CV_ROOT . $rel, 82);
        imagedestroy($im);
        return [$rel, $nw, $nh];
    };
    [$big, $bw, $bh] = $save(2000, '');
    [$mid, $mw, $mh] = $save(1100, '-m');
    imagedestroy($src);
    return ['src' => $big, 'thumb' => $mid, 'w' => $mw, 'h' => $mh, 'bw' => $bw, 'bh' => $bh];
}

function users_out(array $me): array { return array_map(fn($u) => pub_user($u, $me), cv_users()); }

/* ---------- veiksmai ---------- */
try {
    switch ($a) {
        case 'state':
            $draft = cv_json_read($DRAFT); $live = cv_json_read($LIVE);
            out(['draft' => $draft, 'dirty' => $draft != $live, 'me' => pub_user($me, $me), 'users' => users_out($me),
                'history' => history_list($HIST), 'log' => array_slice(cv_json_read(CV_DATA . '/zurnalas.json', []), 0, 60),
                'contours' => array_combine(array_map(fn($a) => $a['no'], $draft['apartments']), array_map(fn($a) => cv_contours_raw($a['no']), $draft['apartments']))]);

        case 'save':
            $d = validate($in['data'] ?? [], cv_json_read($LIVE));
            cv_json_write($DRAFT, $d);
            cv_log($me['name'], 'Išsaugojo juodraštį' . (!empty($in['what']) ? ' (' . clean_str($in['what'], 80) . ')' : ''));
            out(['ok' => true, 'draft' => $d, 'dirty' => $d != cv_json_read($LIVE)]);

        case 'publish':
            $draft = cv_json_read($DRAFT); $live = cv_json_read($LIVE);
            if ($draft == $live) out(['ok' => true, 'dirty' => false, 'history' => history_list($HIST)]);
            snapshot($HIST, $live, $me['name'], 'Prieš paskelbimą');
            cv_json_write($LIVE, $draft);
            cv_log($me['name'], 'Paskelbė pakeitimus');
            out(['ok' => true, 'dirty' => false, 'history' => history_list($HIST)]);

        case 'discard':
            copy($LIVE, $DRAFT);
            cv_log($me['name'], 'Atmetė nepaskelbtus pakeitimus');
            out(['ok' => true, 'draft' => cv_json_read($DRAFT), 'dirty' => false]);

        case 'restore':
            $id = preg_replace('/[^0-9a-f\-]/', '', (string)($in['id'] ?? ''));
            $snap = cv_json_read("$HIST/$id.json");
            if (!$snap) fail('Versija nerasta.');
            cv_json_write($DRAFT, $snap);
            cv_log($me['name'], 'Atkūrė versiją ' . $id . ' į juodraštį');
            out(['ok' => true, 'draft' => $snap, 'dirty' => $snap != cv_json_read($LIVE)]);

        case 'upload':
            if (empty($_FILES['file'])) fail('Failas negautas (gal didesnis nei 1 MB?).');
            $r = upload_image($_FILES['file']);
            cv_log($me['name'], 'Įkėlė nuotrauką ' . $r['src']);
            out(['ok' => true] + $r);

        case 'password':
            if (!password_verify((string)($in['old'] ?? ''), $me['hash'])) fail('Dabartinis slaptažodis neteisingas.');
            if ($e = cv_pw_problem((string)($in['new'] ?? ''))) fail($e);
            $u = cv_update_user($me['id'], fn($x) => array_merge($x, ['hash' => password_hash((string)$in['new'], PASSWORD_DEFAULT), 'pwv' => ($x['pwv'] ?? 0) + 1]));
            session_start(); $_SESSION['pwv'] = $u['pwv']; session_write_close(); /* ši sesija lieka, kitos atjungiamos */
            cv_log($me['name'], 'Pasikeitė slaptažodį');
            out(['ok' => true]);

        case '2fa-setup':
            $secret = cv_b32enc(random_bytes(20));
            session_start(); $_SESSION['totp_new'] = $secret; session_write_close();
            $label = rawurlencode('Centro Vila:' . $me['email']);
            out(['secret' => $secret, 'uri' => "otpauth://totp/$label?secret=$secret&issuer=" . rawurlencode('Centro Vila') . '&digits=6&period=30']);

        case '2fa-enable':
            session_start(); $secret = $_SESSION['totp_new'] ?? ''; session_write_close();
            if (!$secret) fail('Pradėkite iš naujo.');
            $step = cv_totp_check($secret, (string)($in['code'] ?? ''));
            if (!$step) fail('Kodas neteisingas. Patikrinkite, ar telefono laikas teisingas, ir bandykite dar kartą.');
            $codes = []; $hashes = [];
            for ($i = 0; $i < 10; $i++) { $c = strtolower(bin2hex(random_bytes(4))); $codes[] = substr($c, 0, 4) . '-' . substr($c, 4); $hashes[] = password_hash($c, PASSWORD_DEFAULT); }
            cv_update_user($me['id'], fn($x) => array_merge($x, ['totp' => ['secret' => $secret, 'enabled' => true, 'last' => $step], 'backup' => $hashes]));
            session_start(); unset($_SESSION['totp_new']); session_write_close();
            cv_log($me['name'], 'Įjungė dviejų žingsnių patvirtinimą');
            out(['ok' => true, 'codes' => $codes]);

        case '2fa-disable':
            if (!password_verify((string)($in['password'] ?? ''), $me['hash'])) fail('Slaptažodis neteisingas.');
            cv_update_user($me['id'], fn($x) => array_merge($x, ['totp' => null, 'backup' => []]));
            cv_log($me['name'], 'Išjungė dviejų žingsnių patvirtinimą');
            out(['ok' => true, 'me' => pub_user(cv_find_user('id', $me['id']), $me)]);

        case 'user-add':
            $name = clean_str($in['name'] ?? '', 60); $email = strtolower(clean_str($in['email'] ?? '', 120));
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Įveskite vardą ir teisingą el. paštą.');
            if (cv_find_user('email', $email)) fail('Toks el. paštas jau yra.');
            $temp = cv_temp_password();
            $all = cv_users();
            $all[] = ['id' => bin2hex(random_bytes(6)), 'email' => $email, 'name' => $name, 'hash' => password_hash($temp, PASSWORD_DEFAULT),
                'pwv' => 1, 'mustChange' => true, 'created' => date('c'), 'totp' => null, 'backup' => []];
            cv_users_save($all);
            cv_log($me['name'], 'Sukūrė paskyrą ' . $email);
            out(['ok' => true, 'temp' => $temp, 'users' => users_out($me)]);

        case 'user-reset':
            $id = (string)($in['id'] ?? '');
            $u = cv_find_user('id', $id);
            if (!$u) fail('Paskyra nerasta.');
            $temp = cv_temp_password();
            cv_update_user($id, fn($x) => array_merge($x, ['hash' => password_hash($temp, PASSWORD_DEFAULT), 'mustChange' => true, 'pwv' => ($x['pwv'] ?? 0) + 1,
                'totp' => !empty($in['reset2fa']) ? null : ($x['totp'] ?? null), 'backup' => !empty($in['reset2fa']) ? [] : ($x['backup'] ?? [])]));
            cv_log($me['name'], 'Nustatė laikiną slaptažodį: ' . $u['email'] . (!empty($in['reset2fa']) ? ' (ir išjungė 2FA)' : ''));
            out(['ok' => true, 'temp' => $temp, 'users' => users_out($me)]);

        case 'user-toggle':
            $id = (string)($in['id'] ?? '');
            if ($id === $me['id']) fail('Savo paskyros išjungti negalima.');
            $u = cv_update_user($id, fn($x) => array_merge($x, ['disabled' => empty($x['disabled'])]));
            if (!$u) fail('Paskyra nerasta.');
            cv_log($me['name'], ($u['disabled'] ? 'Išjungė' : 'Įjungė') . ' paskyrą ' . $u['email']);
            out(['ok' => true, 'users' => users_out($me)]);

        case 'user-delete':
            $id = (string)($in['id'] ?? '');
            if ($id === $me['id']) fail('Savo paskyros ištrinti negalima.');
            $u = cv_find_user('id', $id);
            if (!$u) fail('Paskyra nerasta.');
            cv_users_save(array_filter(cv_users(), fn($x) => $x['id'] !== $id));
            cv_log($me['name'], 'Ištrynė paskyrą ' . $u['email']);
            out(['ok' => true, 'users' => users_out($me)]);
    }
    fail('Nežinomas veiksmas.', 404);
} catch (RuntimeException $e) {
    fail($e->getMessage());
}

function cv_contours_raw(string $no): string
{
    $f = CV_ROOT . '/cms/konturai/butas-' . preg_replace('/\D/', '', $no) . '.html';
    return is_file($f) ? (string)file_get_contents($f) : '';
}
