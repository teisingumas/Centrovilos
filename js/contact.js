/* Centro Vila – kontaktų forma (el. paštas dar neprijungtas: forma tik patikrinama ir parodo padėką) */
const form=$("cForm");
/* atėjus iš aukšto pasirinkimo (?aukstas=3) – žinutė užpildoma */
const floor=new URLSearchParams(location.search).get("aukstas");
if(/^[1-3]$/.test(floor||"")) $("fMsg").value=`Sveiki, domina ${floor} aukšto butai. Norėčiau sužinoti daugiau.`;
/* atėjus iš butų puslapio (?butas=01) */
const apt=new URLSearchParams(location.search).get("butas");
if(/^0[1-6]$/.test(apt||"")) $("fMsg").value=`Sveiki, domina butas ${apt}. Norėčiau sužinoti daugiau.`;

function check(el){ const ok=el.checkValidity() && el.value.trim()!==""; el.closest(".field").classList.toggle("bad",!ok); el.setAttribute("aria-invalid",!ok); return ok; }
form.querySelectorAll("input,textarea").forEach(el=>{
  el.addEventListener("blur",()=>{ if(el.value) check(el); });
  el.addEventListener("input",()=>{ if(el.closest(".field").classList.contains("bad")) check(el); });
});
form.addEventListener("submit",e=>{
  e.preventDefault();
  const fields=[...form.querySelectorAll("input,textarea")];
  const bad=fields.filter(el=>!check(el));
  if(bad.length){ bad[0].focus(); return; }
  /* TODO: čia prijungti siuntimą (pvz. fetch į serverio skriptą ar formų paslaugą) */
  form.hidden=true; $("cDone").hidden=false; $("cDone").focus();
});

/* žemėlapis: tik Centro Vila taškas, be maršrutų */
locMap($("ctMap"),[],{lp:{"Laisvės al.":.75}});
