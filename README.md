# Centro Vila – svetainė su turinio valdymu

PHP svetainė be duomenų bazės: turinys laikomas JSON failuose, puslapiai generuojami iš šablonų.
Talpinama Hostinger (laikinai https://juda.vedejasedvardas.lt/), įkeliama per Git iš šios repozitorijos.

```
index.php, apie-projekta/, galerija/, kontaktai/   puslapių šablonai
1-aukstas/index.php   butų puslapis (/1-aukstas/, /2-aukstas/, /3-aukstas/ – .htaccess)
1-butas … 6-butas/    butų puslapiai (bendras šablonas cms/butas.php)
cms/                  branduolys (core, layout, auth), pradinis turinys seed.json,
                      kontūrai konturai/*.html, logotipai partials/ – iš naršyklės neprieinama
prisijungimas/        turinio valdymas (/prisijungimas): prisijungimas, redaktoriai, API
css/, js/, img/       stiliai, skriptai, nuotraukos
_data/  (ne git)      live.json (paskelbta), draft.json (juodraštis), users.json, istorija/, žurnalas
uploads/ (ne git)     per valdymą įkeltos nuotraukos (WebP)
```

- Turinys: pirmą kartą `_data/live.json` sukuriamas iš `cms/seed.json`. Toliau keičiama tik per /prisijungimas.
- Pirmas administratorius – `cms/bootstrap.php` (naudojamas tik kai paskyrų dar nėra; prisijungus laikinu slaptažodžiu reikia susikurti savo).
- Juodraštis → „Peržiūrėti“ (mato tik administratorius) → „Paskelbti“. Prieš kiekvieną paskelbimą išsaugoma versija (`_data/istorija`).
- Kontūrai (aukštai hero nuotraukoje, butai aukštų planuose, patalpos butų planuose) – `cms/konturai/`, keičiami kontūrų redaktoriumi.
- Perkeliant į kliento domeną: nukopijuoti visus failus **kartu su `_data/` ir `uploads/`**, domeną įrašyti į `CV_HOSTS` (`cms/auth.php`).
- Lokaliai: `php -S 127.0.0.1:8812 cms/router.php` (2-3 aukštų adresams reikia .htaccess ar maršrutizatoriaus).

Kontaktų ir užklausos formos kol kas niekur nesiunčiamos (laukiama gavėjo el. pašto).
