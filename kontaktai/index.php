<?php
require __DIR__ . '/../cms/layout.php';
$C = cv_content();
$K = $C['contacts'];
$ct = $C['site']['contacts'];
cv_head($C, 'Kontaktai – Centro Vila', 'Susisiekite su Centro Vila – Trakų g. 16, Kaunas. Apžiūros, butų kainos ir išplanavimai.', 'kontaktai');
?>

<main>
<section class="ap-hero">
  <div class="ap-a ap-a--num" aria-hidden="true">16</div>
  <div class="wrap">
    <div class="eyebrow"><?= e($K['hero']['eyebrow']) ?></div>
    <h1><?= t($K['hero']['title']) ?></h1>
    <p><?= e($K['hero']['text']) ?></p>
  </div>
</section>

<section class="ct-cards" aria-label="Kontaktai">
  <div class="wrap">
    <ul class="ap-grid ap-grid--4">
<?php foreach ($ct['people'] as $p): ?>
      <li><span class="lbl"><?= e($p['name']) ?></span><a class="big" href="<?= e(cv_tel($p['phone'])) ?>"><?= e($p['phone']) ?></a></li>
<?php endforeach ?>
      <li><span class="lbl">El. paštas</span><a href="mailto:<?= e($ct['email']) ?>"><?= e($ct['email']) ?></a></li>
      <li><span class="lbl">Adresas</span><a href="<?= e($ct['mapsUrl']) ?>" target="_blank" rel="noopener"><?= e($ct['address']) ?></a></li>
    </ul>
  </div>
</section>

<section class="ct-main">
  <div class="wrap ct-split">
    <div class="ct-form">
      <h2><?= t($K['formTitle']) ?></h2>
      <form class="c-form" id="cForm" novalidate>
        <div class="field">
          <label for="fName">Vardas</label>
          <input id="fName" name="vardas" type="text" autocomplete="name" required>
          <small class="err">Įveskite savo vardą</small>
        </div>
        <div class="row">
          <div class="field">
            <label for="fEmail">El. paštas</label>
            <input id="fEmail" name="el_pastas" type="email" autocomplete="email" inputmode="email" required>
            <small class="err">Įveskite teisingą el. pašto adresą</small>
          </div>
          <div class="field">
            <label for="fPhone">Telefono numeris</label>
            <input id="fPhone" name="telefonas" type="tel" autocomplete="tel" inputmode="tel" placeholder="+370" pattern="[0-9+\s\(\)\-]{6,}" required>
            <small class="err">Įveskite telefono numerį</small>
          </div>
        </div>
        <div class="field">
          <label for="fMsg">Žinutė</label>
          <textarea id="fMsg" name="zinute" rows="5" required></textarea>
          <small class="err">Parašykite žinutę</small>
        </div>
        <div class="c-submit">
          <button class="cta" type="submit">Siųsti užklausą <?= CV_ARROW ?></button>
          <p class="note"><?= e($K['note']) ?></p>
        </div>
      </form>
      <div class="c-done" id="cDone" hidden tabindex="-1">
        <div class="eyebrow">Ačiū</div>
        <h3><?= e($K['doneTitle']) ?></h3>
        <p><?= e($K['doneText']) ?></p>
      </div>
    </div>
      <div class="c-map">
        <svg class="c-map-static" id="ctMap" viewBox="379 116 621 644" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Centro Vila žemėlapyje – <?= e($ct['address']) ?>"></svg>
        <a class="c-map-link" href="<?= e($ct['mapsUrl']) ?>" target="_blank" rel="noopener">Atidaryti „Google Maps“ <?= CV_ARROW ?></a>
      </div>
  </div>
</section>
</main>
<?php cv_foot($C, ['site', 'locmap', 'contact'], '', false, true);
