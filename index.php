<?php
require __DIR__ . '/cms/layout.php';
$C = cv_content();
$H = $C['home'];
cv_head($C, 'Centro Vila', 'Centro Vila – boutique daugiabutis Trakų g. 16, Kaune. Tik 6 butai.', 'home', true, true);

/* hero aukštų langas: aukštai su butais */
$heroFloors = [];
foreach ($C['floors'] as $f) {
    $heroFloors['aukstas-' . $f['no']] = ['title' => $f['hero'], 'note' => $f['note'],
        'apts' => array_map(fn($a) => ['no' => $a['no'], 'area' => $a['area'], 'status' => $a['status']], cv_floor_apts($C, (int)$f['no']))];
}
$places = array_map(fn($p) => ['name' => $p['name'], 'min' => $p['min'], 'walk' => !empty($p['walk']), 'x' => (float)$p['x'], 'y' => (float)$p['y']], $H['location']['places']);
$g = $H['gallery']['items'];
$fig = function ($it, $cls = '') {
    return '<figure' . ($cls ? ' class="' . $cls . '"' : '') . '><img src="' . e($it['src']) . '" alt="' . e($it['alt']) . '" loading="lazy" width="' . (int)$it['w'] . '" height="' . (int)$it['h'] . '"><figcaption>' . e($it['caption']) . '</figcaption></figure>';
};
?>

<main>
<section class="hero" id="pagrindinis" style="padding:0">
  <div class="hero-media" id="heroMedia">
    <span id="butai" style="position:absolute;top:0"></span>
    <svg id="heroSvg" viewBox="0 0 2576 1288" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Centro Vila pastatas – pasirinkite aukštą">
      <g id="heroPic">
        <svg id="hpL" preserveAspectRatio="none"><image class="hp" href="/img/hero.webp" width="2576" height="1288"/></svg>
        <svg id="hpR" preserveAspectRatio="none"><image class="hp" href="/img/hero.webp" width="2576" height="1288"/></svg>
        <svg id="hpC" preserveAspectRatio="none"><image class="hp" href="/img/hero.webp" width="2576" height="1288"/></svg>
      </g>
      <g id="floors"></g>
    </svg>
    <div class="tip" id="tip"><b></b><span></span></div>
  </div>
  <div class="hero-copy">
    <div class="wrap">
      <div class="txt">
        <div class="eyebrow"><?= e($H['hero']['eyebrow']) ?></div>
        <h1><?= t($H['hero']['title']) ?></h1>
        <p><?= e($H['hero']['text']) ?></p>
        <a class="cta ghost" href="/apie-projekta/"><?= e($H['hero']['button']) ?> <?= CV_ARROW ?></a>
      </div>
      <div class="floors-ui" id="floorsUi" role="group" aria-label="Aukštai">
        <div class="lbl"><?= e($H['hero']['pickLabel']) ?></div>
      </div>
    </div>
  </div>
  <aside class="panel" id="panel" aria-live="polite">
    <button class="x" id="panelX" aria-label="Uždaryti">×</button>
    <div class="eyebrow">Aukštas</div>
    <h3 id="pTitle">—</h3>
    <div class="apts" id="pApts"></div>
    <p><?= e($H['hero']['panelText']) ?></p>
    <a class="cta" href="/1-aukstas/">Žiūrėti plane <?= CV_ARROW ?></a>
  </aside>
</section>

<section class="about" id="apie">
  <div class="wrap">
    <figure class="photo reveal">
      <img src="<?= e($H['about']['image']['src']) ?>" width="<?= (int)$H['about']['image']['w'] ?>" height="<?= (int)$H['about']['image']['h'] ?>" alt="<?= e($H['about']['image']['alt']) ?>" loading="lazy">
    </figure>
    <div class="reveal">
      <div class="eyebrow"><?= e($H['about']['eyebrow']) ?></div>
      <h2><?= t($H['about']['title']) ?></h2>
      <p class="strong"><?= e($H['about']['lead']) ?></p>
      <p><?= e($H['about']['text']) ?></p>
      <div class="facts">
<?php foreach ($H['about']['facts'] as $f): ?>
        <div><b><?= e($f['value']) ?><?= $f['small'] !== '' ? '<small>' . e($f['small']) . '</small>' : '' ?></b><span><?= e($f['label']) ?></span></div>
<?php endforeach ?>
      </div>
    </div>
  </div>
</section>

<section class="loc" id="vieta">
  <div class="wrap">
    <div class="loc-head reveal">
      <div>
        <div class="eyebrow"><?= e($H['location']['eyebrow']) ?></div>
        <h2><?= t($H['location']['title']) ?></h2>
      </div>
      <p><?= e($H['location']['text']) ?></p>
    </div>
    <div class="loc-body">
      <div class="map-col reveal">
        <div class="map-scroll" id="mapScroll">
          <div class="map">
            <svg id="locMap" viewBox="0 0 1000 760" role="img" aria-label="Centro Vila aplinkos žemėlapis: Trakų g. 16 ir laikas pėsčiomis iki svarbiausių vietų"></svg>
          </div>
        </div>
        <div class="map-note"><?= e($H['location']['note']) ?></div>
      </div>
      <ul class="places reveal" id="places"></ul>
    </div>
  </div>
</section>

<section id="galerija">
  <div class="wrap">
    <div class="gal-head reveal"><div class="eyebrow"><?= e($H['gallery']['eyebrow']) ?></div><h2><?= t($H['gallery']['title']) ?></h2></div>
    <div class="gal reveal">
      <?= $fig($g[0], 'a') ?>

      <?= $fig($g[1], 'b') ?>

    </div>
    <div class="gal gal-3 reveal">
      <?= $fig($g[2]) ?>

      <?= $fig($g[3]) ?>

      <?= $fig($g[4]) ?>

    </div>
    <div class="gal gal-2 reveal">
      <?= $fig($g[5]) ?>

      <?= $fig($g[6]) ?>

    </div>
  </div>
</section>
</main>
<?php
cv_foot($C, ['site', 'locmap', 'home'],
    cv_contours('hero.html') . "\n" . cv_js_data(['floors' => $heroFloors, 'places' => $places]), true);
