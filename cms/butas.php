<?php
/* Buto puslapis. Naudojimas: $CV_APT = '03'; require .../cms/butas.php */
require_once __DIR__ . '/layout.php';
$C = cv_content();
$a = null;
foreach ($C['apartments'] as $i => $x) if ($x['no'] === $CV_APT) { $a = $x; $idx = $i; }
if (!$a) { http_response_code(404); exit('Butas nerastas'); }
$no = $a['no'];
$all = $C['apartments'];
$prev = $all[$idx - 1] ?? null;
$next = $all[$idx + 1] ?? null;
$floorUrl = (int)$a['floor'] === 1 ? '/1-aukstas/#aukstai' : '/' . (int)$a['floor'] . '-aukstas/';
$ct = $C['site']['contacts'];
$plans = $a['plans'];
$multi = count($plans) > 1;
$price = trim((string)($a['price'] ?? ''));

cv_head($C, 'Butas Nr. ' . $no . ' – Centro Vila',
    'Centro Vila butas Nr. ' . $no . ': ' . $a['area'] . ', ' . $a['floorText'] . ', langų orientacija ' . $a['orient'] . '. ' . $a['finish'] . ' apdaila.', 'butai', false);

$ICONS = [
    'parking' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 16v-4l2.2-5.2A2 2 0 0 1 7 5.5h10a2 2 0 0 1 1.8 1.3L21 12v4"/><path d="M3 12h18M3 16h18v2.5H3z"/><circle cx="7" cy="14" r=".9"/><circle cx="17" cy="14" r=".9"/></svg>',
    'storage' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/></svg>',
    'dot' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
];

$fig = function (array $p, int $i) use ($no, $multi): string {
    $alt = 'Buto Nr. ' . $no . ($multi && $p['caption'] !== '' ? ' – ' . $p['caption'] . ' planas' : ' planas') . ' su sunumeruotomis patalpomis';
    return '<figure class="bt-plan apt-plan">' . ($p['caption'] !== '' ? '<figcaption>' . e($p['caption']) . '</figcaption>' : '') . "\n"
        . '        <img src="' . e($p['img']) . '" width="1024" height="1024" alt="' . e($alt) . '">' . "\n"
        . '        <button class="cta bt-zoom" type="button" aria-haspopup="dialog">Didinti ' . CV_ZOOM . "</button>\n      </figure>";
};
$rooms = function (array $p): string {
    $s = '<div class="apt-rooms">' . "\n" . '        <h2 class="ap-label">' . e($p['label']) . "</h2>\n        <ol>\n";
    foreach ($p['rooms'] as $r) {
        $s .= '          <li><span class="n">' . e($r['n']) . '</span><span class="t">' . e($r['name']) . '</span><span class="m">' . e($r['area']) . "</span></li>\n";
    }
    $s .= "        </ol>\n";
    if (($p['total'] ?? '') !== '') $s .= '        <p class="apt-total"><span>Viso aukšte</span><span>' . e($p['total']) . "</span></p>\n";
    return $s . "      </div>\n";
};
$dl = '<dl class="apt-dl">' . "\n"
    . '        <div><dt>Būsena</dt><dd>' . cv_badge($a['status']) . "</dd></div>\n"
    . '        <div><dt>Plotas</dt><dd class="big">' . e($a['area']) . "</dd></div>\n"
    . '        <div><dt>Aukštas</dt><dd>' . e($a['floorText']) . "</dd></div>\n"
    . '        <div><dt>Langų orientacija</dt><dd>' . e($a['orient']) . "</dd></div>\n"
    . '        <div><dt>Apdaila</dt><dd>' . e($a['finish']) . "</dd></div>\n"
    . '        <div><dt>Kaina</dt><dd' . ($price !== '' ? ' class="big">' . e($price) : '><a href="/kontaktai/?butas=' . e($no) . '" data-inq>Teirautis</a>') . "</dd></div>\n"
    . "      </dl>\n";
$tail = '<ul class="apt-feat">' . "\n";
foreach ($a['features'] as $f) $tail .= '        <li>' . ($ICONS[$f['icon'] ?? 'dot'] ?? $ICONS['dot']) . '<span>' . e($f['text']) . "</span></li>\n";
$tail .= "      </ul>\n"
    . '      <div class="apt-ctas">' . "\n"
    . '        <a class="cta" href="/kontaktai/?butas=' . e($no) . '" data-inq>Teirautis dėl buto ' . CV_ARROW . "</a>\n"
    . '        <a class="cta ghost" href="' . $floorUrl . '">Aukšto planas</a>' . "\n      </div>\n";
?>

<main>
<section class="ap-hero apt-hero">
  <div class="ap-a ap-a--num" aria-hidden="true"><?= e($no) ?></div>
  <div class="wrap">
    <a class="apt-back" href="<?= $floorUrl ?>"><?= CV_ARROW_L ?> Grįžti į aukšto planą</a>
    <div class="eyebrow"><?= e($a['floorText']) ?></div>
    <h1>Butas Nr. <em><?= e($no) ?></em></h1>
    <div class="apt-sub"><?= cv_badge($a['status']) ?><span><?= e($a['area']) ?></span><span>Orientacija <?= e($a['orient']) ?></span><?= $price !== '' ? '<span>' . e($price) . '</span>' : '' ?><?= ($a['subtitle'] ?? '') !== '' ? '<span>' . e($a['subtitle']) . '</span>' : '' ?></div>
  </div>
</section>

<section class="apt-sec">
<?php if (!$multi): $p = $plans[0]; ?>
  <div class="wrap apt-split">
    <div class="apt-plans">
      <?= $fig($p, 0) ?>

    </div>

    <div class="apt-info">
      <?= $dl ?>
      <?= $rooms($p) ?>
      <?= $tail ?>
    </div>
  </div>
<?php else: foreach ($plans as $i => $p): $last = $i === count($plans) - 1; ?>
  <div class="wrap apt-split apt-row">
      <?= $fig($p, $i) ?>

    <div class="apt-info">
<?php if ($i === 0): ?>      <?= $dl ?><?php endif ?>
      <?= $rooms($p) ?>
<?php if ($last): ?>      <?= $tail ?><?php endif ?>
    </div>
  </div>
<?php endforeach; endif ?>
  <nav class="wrap ap-nav" aria-label="Kiti butai"><?php
    echo $prev ? '<a class="ap-nav-link" href="/' . cv_aptno($prev['no']) . '-butas/">' . CV_ARROW_L . ' Butas ' . e($prev['no']) . '</a>' : '<span></span>';
    echo '<a class="ap-nav-mid" href="' . $floorUrl . '">Visi butai</a>';
    echo $next ? '<a class="ap-nav-link" href="/' . cv_aptno($next['no']) . '-butas/">Butas ' . e($next['no']) . ' ' . CV_ARROW . '</a>' : '<span></span>';
  ?></nav>
</section>

<dialog class="bt-dlg" id="planDlg" aria-label="Buto planas">
  <button class="bt-dlg-x" type="button" id="planDlgX" aria-label="Uždaryti">×</button>
  <img id="planDlgImg" src="<?= e($plans[0]['img']) ?>" width="1024" height="1024" alt="">
</dialog>
<dialog class="inq" id="inq" aria-labelledby="inqTitle">
  <button class="inq-x" type="button" id="inqX" aria-label="Uždaryti">×</button>
  <div class="inq-grid">
    <div class="inq-form">
      <div class="eyebrow">Butas Nr. <?= e($no) ?></div>
      <h2 id="inqTitle">Teiraukitės dėl <em>buto</em></h2>
      <p class="inq-lead">Atsakysime per vieną darbo dieną.</p>
      <form id="inqForm" novalidate>
        <div class="row">
          <div class="field"><label for="iName">Vardas</label><input id="iName" name="vardas" type="text" autocomplete="given-name" required><small class="err">Įveskite vardą</small></div>
          <div class="field"><label for="iSurname">Pavardė</label><input id="iSurname" name="pavarde" type="text" autocomplete="family-name" required><small class="err">Įveskite pavardę</small></div>
        </div>
        <div class="field"><label for="iPhone">Tel. numeris</label><input id="iPhone" name="telefonas" type="tel" autocomplete="tel" inputmode="tel" placeholder="+370" pattern="[0-9+\s\(\)\-]{6,}" required><small class="err">Įveskite telefono numerį</small></div>
        <div class="field"><label for="iMsg">Žinutė</label><textarea id="iMsg" name="zinute" rows="4" required>Sveiki, domina butas Nr. <?= e($no) ?>. Norėčiau sužinoti daugiau.</textarea><small class="err">Parašykite žinutę</small></div>
        <input type="hidden" name="butas" value="<?= e($no) ?>">
        <div class="c-submit"><button class="cta" type="submit">Siųsti užklausą <?= CV_ARROW ?></button><p class="note"><?= e($C['contacts']['note']) ?></p></div>
      </form>
      <div class="c-done" id="inqDone" hidden tabindex="-1"><div class="eyebrow">Ačiū</div><h3>Jūsų užklausa gauta.</h3><p>Susisieksime su jumis artimiausiu metu.</p></div>
      <div class="inq-brand">
        <img class="inq-logo" src="/img/juda-logo-dark.png" width="500" height="188" alt="JUDA nekilnojamasis turtas">
        <img class="inq-photo" src="/img/brokeriai.webp" width="446" height="378" alt="Brokeriai Juras Sadauskas ir Darius Uleckas">
      </div>
    </div>
    <div class="inq-side">
      <div class="eyebrow">Susisiekite</div>
      <ul class="inq-contacts">
<?php foreach ($ct['people'] as $p): ?>
        <li><span><?= e($p['name']) ?></span><a class="tel" href="<?= e(cv_tel($p['phone'])) ?>"><?= e($p['phone']) ?></a></li>
<?php endforeach ?>
        <li><span>El. paštas</span><a href="mailto:<?= e($ct['email']) ?>"><?= e($ct['email']) ?></a></li>
        <li><span>Adresas</span><a href="<?= e($ct['mapsUrl']) ?>" target="_blank" rel="noopener"><?= e($ct['address']) ?></a></li>
      </ul>
    </div>
  </div>
</dialog>
</main>
<?php
cv_foot($C, ['site', 'apartment', 'inquiry'], "<!-- PATALPŲ KONTŪRAI BUTO PLANE (kontūrų redaktorius, „Kodas svetainei“; nuoroda = #patalpa-N) -->\n" . cv_contours('butas-' . $no . '.html'));
