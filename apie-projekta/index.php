<?php
require __DIR__ . '/../cms/layout.php';
$C = cv_content();
$A = $C['about'];
cv_head($C, 'Apie projektą – Centro Vila', 'Centro Vila – A klasės boutique daugiabutis Trakų g. 16, Kaune: bendra ir techninė informacija, bendros erdvės ir dalinė apdaila.', 'apie');
?>

<main>
<section class="ap-hero">
  <div class="ap-a" aria-hidden="true">A</div>
  <div class="wrap">
    <div class="eyebrow"><?= e($A['hero']['eyebrow']) ?></div>
    <h1><?= t($A['hero']['title']) ?></h1>
    <p><?= e($A['hero']['text']) ?></p>
  </div>
</section>

<section class="ap-facts" aria-labelledby="bendra">
  <div class="wrap">
    <h2 class="ap-label" id="bendra"><?= e($A['factsLabel']) ?></h2>
    <ul class="ap-grid">
<?php foreach ($A['facts'] as $f): ?>
      <li><b<?= !empty($f['word']) ? ' class="w"' : '' ?>><?= e($f['value']) ?><?= $f['small'] !== '' ? ' <small>' . e($f['small']) . '</small>' : '' ?></b><span><?= e($f['label']) ?></span></li>
<?php endforeach ?>
    </ul>
  </div>
</section>

<section class="ap-spec">
  <div class="wrap ap-split">
    <div class="ap-tabs" role="tablist" aria-label="Specifikacija">
<?php foreach ($A['tabs'] as $i => $tab): $n = $i + 1; ?>
        <button class="ap-tab" type="button" role="tab" id="t<?= $n ?>-tab" aria-controls="t<?= $n ?>" aria-selected="<?= $i ? 'false' : 'true' ?>"<?= $i ? ' tabindex="-1"' : '' ?>><span class="no"><?= sprintf('%02d', $n) ?></span><span class="tt"><?= e($tab['title']) ?></span><span class="ct"><?= count($tab['items']) ?></span></button>
<?php endforeach ?>
    </div>
    <div>
<?php foreach ($A['tabs'] as $i => $tab): $n = $i + 1; ?>
      <div class="ap-panel" role="tabpanel" id="t<?= $n ?>" aria-labelledby="t<?= $n ?>-tab"<?= $i ? ' hidden' : '' ?>>
        <p><?= e($tab['intro']) ?></p>
        <ul class="ap-items">
<?php foreach ($tab['items'] as $it): ?>
          <li><?= $it['title'] !== '' ? '<b>' . e($it['title']) . '</b>' . ($it['text'] !== '' ? ' – ' : '') : '' ?><?= e($it['text']) ?></li>
<?php endforeach ?>
        </ul>
      </div>
<?php endforeach ?>
    </div>
  </div>
</section>

</main>
<?php cv_foot($C, ['site', 'about']);
