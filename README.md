# Centro Vila – svetainė

Statinė svetainė (HTML + CSS + JS), jokio surinkimo nereikia – failus galima tiesiog įkelti į serverį.

```
index.html            pagrindinis puslapis
kontaktai/index.html  kontaktų puslapis (/kontaktai)
galerija/index.html   galerija (img/galerija/: -m.webp sąraše, didelės – peržiūroje)
1-butas..6-butas/       buto puslapiai + užklausos langas (js/inquiry.js) (planai img/butai/)
1-aukstas/index.html  butai (/1-aukstas/, /2-aukstas/, /3-aukstas/ – .htaccess nukreipia į tą patį failą): aukšto pasirinkimas, planai (img/planai/), butų duomenys js/floors.js
apie-projekta/index.html  apie projektą (/apie-projekta)
css/style.css         visi stiliai (spalvos ir šriftai – :root kintamieji viršuje)
js/site.js            bendra antraštė / meniu
js/home.js            pagrindinio puslapio logika (aukštai, žemėlapis, įkėlimo animacija)
js/contact.js         kontaktų formos tikrinimas
img/                  nuotraukos
```

Peržiūra lokaliai: `python3 -m http.server` ir atidaryti http://localhost:8000

Kontaktų forma kol kas niekur nesiunčiama – patikrina laukus ir parodo padėką.
Siuntimą prijungti `js/contact.js` (žymė `TODO`).

Talpinama Hostinger (laikinai https://juda.vedejasedvardas.lt/), įkeliama per Git iš šios repozitorijos.
Vidinės nuorodos – švarūs absoliutūs adresai (/, /apie-projekta/, /1-aukstas/, /3-butas/ ...); jiems reikia serverio su .htaccess (Apache / LiteSpeed).
Senos nuorodos (butas-01/, .../index.html) .htaccess nukreipiamos 301.
