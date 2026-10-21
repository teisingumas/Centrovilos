<?php
require __DIR__ . '/../cms/layout.php';
$C = cv_content();
$G = $C['gallery'];
cv_head($C, 'Galerija – Centro Vila', 'Centro Vila galerija: Trakų g. 16 sklypas ir Kauno centro apylinkės iš paukščio skrydžio.', 'galerija');
?>

<main>
<section class="ap-hero gl-hero">
  <div class="ap-a ap-a--num" aria-hidden="true">G</div>
  <div class="wrap">
    <div class="eyebrow"><?= e($G['hero']['eyebrow']) ?></div>
    <h1><?= t($G['hero']['title']) ?></h1>
    <p><?= e($G['hero']['text']) ?></p>
  </div>
</section>

<section class="gl">
  <div class="wrap">
    <ul class="gl-grid">
<?php foreach ($G['items'] as $i => $it): ?>
      <li><button class="gl-item" type="button" data-i="<?= $i ?>" data-full="<?= e($it['src']) ?>" aria-label="Didinti: <?= e($it['alt']) ?>"><img src="<?= e($it['thumb']) ?>" width="<?= (int)$it['w'] ?>" height="<?= (int)$it['h'] ?>" alt="<?= e($it['alt']) ?>" loading="<?= $i < 2 ? 'eager' : 'lazy' ?>"><span class="gl-zoom" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4M7 4.5v5M4.5 7h5"/></svg></span></button></li>
<?php endforeach ?>
    </ul>
  </div>
</section>

<dialog class="lb" id="lb" aria-label="Nuotraukų peržiūra">
  <figure class="lb-fig"><img id="lbImg" src="<?= e($G['items'][0]['src'] ?? '') ?>" alt=""><figcaption id="lbCap"></figcaption></figure>
  <button class="lb-btn lb-x" type="button" id="lbX" aria-label="Uždaryti">×</button>
  <button class="lb-btn lb-prev" type="button" id="lbPrev" aria-label="Ankstesnė nuotrauka"><?= CV_ARROW_L ?></button>
  <button class="lb-btn lb-next" type="button" id="lbNext" aria-label="Kita nuotrauka"><?= CV_ARROW ?></button>
  <div class="lb-count" id="lbCount" aria-live="polite"></div>
</dialog>
</main>
<?php cv_foot($C, ['site', 'gallery']);
