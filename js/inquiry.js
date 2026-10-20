/* Centro Vila – užklausos langas buto puslapyje (forma kol kas niekur nesiunčiama, kaip ir kontaktų puslapyje) */
const inq=$("inq"), inqForm=$("inqForm");
document.querySelectorAll("[data-inq]").forEach(a=>a.addEventListener("click",e=>{
  e.preventDefault(); inq.showModal(); setTimeout(()=>$("iName").focus(),50);
}));
$("inqX").addEventListener("click",()=>inq.close());
inq.addEventListener("click",e=>{ if(e.target===inq) inq.close(); });
function inqCheck(el){ const ok=el.checkValidity()&&el.value.trim()!==""; el.closest(".field").classList.toggle("bad",!ok); el.setAttribute("aria-invalid",!ok); return ok; }
inqForm.querySelectorAll("input:not([type=hidden]),textarea").forEach(el=>{
  el.addEventListener("blur",()=>{ if(el.value) inqCheck(el); });
  el.addEventListener("input",()=>{ if(el.closest(".field").classList.contains("bad")) inqCheck(el); });
});
inqForm.addEventListener("submit",e=>{
  e.preventDefault();
  const bad=[...inqForm.querySelectorAll("input:not([type=hidden]),textarea")].filter(el=>!inqCheck(el));
  if(bad.length){ bad[0].focus(); return; }
  /* TODO: čia prijungti siuntimą */
  inqForm.hidden=true; $("inqDone").hidden=false; $("inqDone").focus();
});
