<?php
/* Butų puslapis: /1-aukstas/, /2-aukstas/, /3-aukstas/ (2 ir 3 .htaccess nukreipia čia) */
require __DIR__ . '/../cms/layout.php';
$C = cv_content();
$P = $C['floorsPage'];
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$cur = preg_match('~/([1-3])-aukstas/?$~', $path, $m) ? (int)$m[1] : 1;
$curF = cv_floor_of($C, $cur);
function cv_butai(int $n): string { return $n . ' ' . ($n % 10 === 1 && $n % 100 !== 11 ? 'butas' : (($n % 10 === 0 || ($n % 100 >= 11 && $n % 100 <= 19)) ? 'butų' : 'butai')); }
cv_head($C, ($cur > 1 ? $curF['name'] . ' – ' : '') . 'Butai – Centro Vila', 'Centro Vila butai: šeši butai trijuose aukštuose, nuo 70 m² iki 131 m². Aukštų planai ir butų informacija.', 'butai', $cur === 1);
?>

<main>
<section class="ap-hero">
  <div class="ap-a ap-a--num" aria-hidden="true"><?= count($C['apartments']) ?></div>
  <div class="wrap">
    <div class="eyebrow"><?= e($P['hero']['eyebrow']) ?></div>
    <h1><?= t($P['hero']['title']) ?></h1>
    <p><?= e($P['hero']['text']) ?></p>
    <ul class="bt-stats">
<?php foreach ($P['stats'] as $s): ?>
      <li><b><?= e($s['value']) ?><?= $s['small'] !== '' ? ' <small>' . e($s['small']) . '</small>' : '' ?></b><span><?= e($s['label']) ?></span></li>
<?php endforeach ?>
    </ul>
  </div>
</section>

<section class="bt-sel" id="aukstai">
  <div class="wrap">
    <h2 class="ap-label" id="flLbl"><?= e($P['pickLabel']) ?></h2>
    <div class="bt-floors" role="tablist" aria-labelledby="flLbl">
<?php foreach ($C['floors'] as $f): $n = (int)$f['no']; $on = $n === $cur; ?>
      <button class="bt-floor" type="button" role="tab" id="fl<?= $n ?>" data-floor="<?= $n ?>" aria-controls="btPanel" aria-selected="<?= $on ? 'true' : 'false' ?>"<?= $on ? '' : ' tabindex="-1"' ?>>
        <?= cv_partial('aukstas-' . $n . '.svg') ?>

        <span class="bt-ft"><span class="t"><?= e($f['name']) ?></span><span class="s"><?= cv_butai(count(cv_floor_apts($C, $n))) ?> · žiūrėti planą</span></span>
        <span class="bt-radio" aria-hidden="true"></span>
      </button>
<?php endforeach ?>
    </div>
    <div class="bt-split" id="btPanel" role="tabpanel" aria-labelledby="fl<?= $cur ?>">
      <figure class="bt-plan">
        <div class="bt-planwrap">
          <img id="btPlan" src="/img/planai/aukstas-<?= $cur ?>.webp" width="2000" height="1587" alt="<?= e($curF['name']) ?> – butų planas">
          <svg class="bt-shapes" id="btShapes" viewBox="0 0 2000 1587" preserveAspectRatio="none" aria-hidden="true"></svg>
        </div>
        <button class="cta bt-zoom" type="button" id="btZoom" aria-haspopup="dialog">Didinti <?= CV_ZOOM ?></button>
      </figure>
      <div class="bt-apts" id="btApts">
<?php foreach (cv_floor_apts($C, $cur) as $a): ?>
        <article class="bt-apt" data-no="<?= e($a['no']) ?>">
          <div class="bt-apt-hd"><h2>Butas <?= e($a['no']) ?></h2><?= cv_badge($a['status']) ?></div>
          <dl><div><dt>Plotas</dt><dd><?= e($a['area']) ?></dd></div><div><dt>Aukštas</dt><dd><?= e(cv_card_floor($a['floorText'])) ?></dd></div><div><dt>Kambariai</dt><dd><?= e($a['rooms']) ?></dd></div><div><dt>Orientacija</dt><dd><?= e($a['orient']) ?></dd></div></dl>
          <a class="cta ghost" href="/<?= cv_aptno($a['no']) ?>-butas/">Plačiau <?= CV_ARROW ?></a>
        </article>
<?php endforeach ?>
      </div>
    </div>
  </div>
</section>

<dialog class="bt-dlg" id="planDlg" aria-label="Aukšto planas">
  <button class="bt-dlg-x" type="button" id="planDlgX" aria-label="Uždaryti">×</button>
  <img id="planDlgImg" src="/img/planai/aukstas-<?= $cur ?>.webp" width="2000" height="1587" alt="">
</dialog>
</main>
<?php
cv_foot($C, ['site', 'floors'], "<!-- BUTŲ KONTŪRAI AUKŠTŲ PLANUOSE (kontūrų redaktorius, „Kodas svetainei“) -->\n" . cv_contours('aukstai.html') . "\n" . cv_js_data(['floors' => cv_floors_js($C)]));
