<?php
/* Centro Vila – bendra puslapių dalis: <head>, antraštė, poraštė */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const CV_NAV = [
    'home' => ['/', 'Pagrindinis'],
    'apie' => ['/apie-projekta/', 'Apie projektą'],
    'butai' => ['/1-aukstas/', 'Butai'],
    'galerija' => ['/galerija/', 'Galerija'],
    'kontaktai' => ['/kontaktai/', 'Kontaktai'],
];
const CV_ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg>';
const CV_ARROW_L = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M15 8H2M7 3L2 8l5 5"/></svg>';
const CV_ZOOM = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4M7 4.5v5M4.5 7h5"/></svg>';

function cv_partial(string $name): string { return (string)file_get_contents(__DIR__ . '/partials/' . $name); }
function cv_contours(string $name): string { return (string)file_get_contents(__DIR__ . '/konturai/' . $name); }

/* <head> + antraštė. $page – aktyvus meniu punktas; $current – ar meniu punktas yra būtent šis puslapis (aria-current) */
function cv_head(array $C, string $title, string $desc, string $page, bool $current = true, bool $home = false): void
{
    $nav = '';
    foreach (CV_NAV as $k => [$href, $label]) {
        $on = $k === $page && !$home;
        $nav .= '      <li><a' . ($on ? ' class="on"' : '') . ' href="' . $href . '"' . ($on && $current ? ' aria-current="page"' : '') . '>' . e($label) . "</a></li>\n";
    }
    $ppl = '';
    foreach ($C['site']['contacts']['people'] as $p) {
        $ppl .= '<div><b>' . e($p['name']) . '</b><a href="' . e(cv_tel($p['phone'])) . '">' . e($p['phone']) . '</a></div>';
    }
    $nav .= '      <li class="nav-meta"><div class="ppl">' . $ppl . '</div><a class="cta" href="/1-aukstas/">Rinkis butą ' . CV_ARROW . "</a></li>\n";
    ?><!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($title) ?></title>
<?php if ($home): ?><meta name="claude:viewport-fit-sides" content="cover">
<?php endif ?>
<meta name="description" content="<?= e($desc) ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Red+Hat+Display:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="/css/style.css?v=<?= CV_V ?>">
<?php if ($home): ?><script>/* įkėlimo animacija rodoma tik pirmą kartą per apsilankymą */try{if(sessionStorage.getItem("cvSeen"))document.documentElement.classList.add("ld-skip")}catch(e){}</script>
<?php endif ?>
</head>
<body<?= $home ? '' : ' class="inner"' ?>>
<?php cv_preview_bar(); ?>
<?php if ($home): ?>
<div id="loader" role="status" aria-live="polite">
  <div class="box">
    <?= cv_partial('loader.svg') ?>

    <div class="bar"><i id="ldBar"></i></div>
    <div class="pct"><span id="ldPct">0</span>%</div>
  </div>
</div>
<?php endif ?>

<header class="hdr<?= $home ? '' : ' solid' ?>" id="hdr">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Centro Vila – į pradžią"><?= cv_partial('logo.svg') ?></a>
    <ul class="nav" id="nav">
<?= $nav ?>    </ul>
    <div class="hdr-end">
      <a class="cta" href="/1-aukstas/">Rinkis butą</a>
      <button class="burger" id="burger" aria-label="Meniu" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
    </div>
  </div>
</header>
<?php
}

/* poraštė + skriptai */
function cv_foot(array $C, array $scripts, string $before = '', bool $home = false, bool $min = false): void
{
    $ct = $C['site']['contacts'];
    $f = $C['site']['footer'];
    ?>
<footer class="foot<?= $min ? ' foot-min' : '' ?>"<?= $home ? ' id="kontaktai"' : '' ?>>
  <div class="wrap">
<?php if (!$min): ?>
    <div class="grid">
      <div>
        <div class="eyebrow"><?= e($f['eyebrow']) ?></div>
        <h2><?= t($f['title']) ?></h2>
      </div>
      <dl class="c4">
        <div><dt>El. paštas</dt><dd><a href="mailto:<?= e($ct['email']) ?>"><?= e($ct['email']) ?></a></dd></div>
        <div><dt>Adresas</dt><dd><a href="<?= e($ct['mapsUrl']) ?>" target="_blank" rel="noopener"><?= e($ct['address']) ?></a></dd></div>
<?php foreach ($ct['people'] as $p): ?>
        <div><dt><?= e($p['name']) ?></dt><dd class="tel"><a href="<?= e(cv_tel($p['phone'])) ?>"><?= e($p['phone']) ?></a></dd></div>
<?php endforeach ?>
      </dl>
    </div>
<?php endif ?>
    <div class="base">
      <span class="brand" aria-hidden="true"><?= cv_partial('logo-foot.svg') ?></span>
      <nav class="fnav" aria-label="Apačios meniu">
        <ul><?php foreach (CV_NAV as [$href, $label]) echo '<li><a href="' . $href . '">' . e($label) . '</a></li>'; ?></ul>
        <?= str_replace('https://www.facebook.com/centrovilakaune', e($ct['facebook']), cv_partial('fb.html')) ?>

      </nav>
      <span><?= e($f['copy']) ?></span>
    </div>
  </div>
</footer>
<?= $before ?>
<?php foreach ($scripts as $s): ?>
<script src="/js/<?= $s ?>.js?v=<?= CV_V ?>"></script>
<?php endforeach ?>
</body>
</html>
<?php
}

/* duomenys skriptams */
function cv_js_data(array $d): string
{
    return '<script>window.CV=' . json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) . ';</script>' . "\n";
}

/* butų sąrašas pagal aukštą */
function cv_floor_apts(array $C, int $floor): array
{
    return array_values(array_filter($C['apartments'], fn($a) => (int)$a['floor'] === $floor));
}
function cv_floor_of(array $C, int $n): array
{
    foreach ($C['floors'] as $f) if ((int)$f['no'] === $n) return $f;
    return ['no' => $n, 'name' => $n . ' aukštas', 'hero' => $n . ' aukštas', 'note' => ''];
}
/* kortelės „Aukštas“ reikšmė: „1 aukštas“ -> „1“, „3 aukštas + mansarda“ -> „3 + mansarda“ */
function cv_card_floor(string $s): string { return trim(preg_replace('/\s*aukštas\s*/u', ' ', $s)); }

function cv_floors_js(array $C): array
{
    $out = [];
    foreach ($C['floors'] as $f) {
        $apts = [];
        foreach (cv_floor_apts($C, (int)$f['no']) as $a) {
            $apts[] = ['no' => $a['no'], 'area' => $a['area'], 'floor' => cv_card_floor($a['floorText']), 'rooms' => $a['rooms'],
                'orient' => $a['orient'], 'status' => $a['status'], 'href' => '/' . cv_aptno($a['no']) . '-butas/'];
        }
        $out[(string)$f['no']] = ['name' => $f['name'], 'title' => $f['hero'], 'note' => $f['note'], 'apts' => $apts];
    }
    return $out;
}

/* juodraščio peržiūros juosta (matoma tik administratoriui) */
function cv_preview_bar(): void
{
    if (empty($GLOBALS['CV_PREVIEW'])) return;
    echo '<div style="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:200;background:#161311;color:#F1ECE5;font:500 13px/1.3 \'Red Hat Display\',sans-serif;letter-spacing:.04em;padding:10px 12px 10px 18px;display:flex;gap:14px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.3)">'
        . '<span>Peržiūrite <b style="color:#CF8045">juodraštį</b> – lankytojai jo nemato</span>'
        . '<a href="/prisijungimas/?a=preview&amp;off=1" style="color:#161311;background:#CF8045;padding:6px 12px;text-decoration:none">Baigti peržiūrą</a></div>';
}
