# Centro Vila – svetainė

Statinė svetainė (HTML + CSS + JS), jokio surinkimo nereikia – failus galima tiesiog įkelti į serverį.

```
index.html            pagrindinis puslapis
kontaktai/index.html  kontaktų puslapis (/kontaktai)
1-aukstas/index.html  butai: aukšto pasirinkimas, planai (img/planai/), butų duomenys js/floors.js
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

Ta pati svetainė publikuojama ir kaip Claude artifaktas: https://claude.ai/artifact/WMG5YkZ496ozyUHPn3QCoM
Vidinės nuorodos rašomos su `index.html` (pvz. `kontaktai/index.html`), kad veiktų ir artifakte, ir serveryje.
