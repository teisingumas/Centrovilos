/* Centro Vila – turinio valdymo skydelis */
"use strict";
const CSRF = document.querySelector('meta[name="csrf"]').content;
const $ = s => document.querySelector(s);
const MAX_UP = 1024 * 1024;
const STATUSES = ["Laisvas", "Rezervuotas", "Parduotas"];
const ICONS = { parking: "Automobilis", storage: "Sandėliukas", dot: "Varnelė" };

/* ---------- DOM pagalbininkas ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const svgI = d => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 16 16"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.4"); s.innerHTML = d; return s; };
const I = {
  grip: () => svgI('<circle cx="6" cy="4" r=".9" fill="currentColor"/><circle cx="10" cy="4" r=".9" fill="currentColor"/><circle cx="6" cy="8" r=".9" fill="currentColor"/><circle cx="10" cy="8" r=".9" fill="currentColor"/><circle cx="6" cy="12" r=".9" fill="currentColor"/><circle cx="10" cy="12" r=".9" fill="currentColor"/>'),
  del: () => svgI('<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>'),
  up: () => svgI('<path d="M8 13V3M4 7l4-4 4 4"/>'),
  down: () => svgI('<path d="M8 3v10M4 9l4 4 4-4"/>'),
};

/* ---------- API ---------- */
async function api(a, body, form) {
  let res;
  try {
    res = await fetch("api.php?a=" + a, {
      method: "POST", credentials: "same-origin",
      headers: form ? { "X-CSRF": CSRF } : { "X-CSRF": CSRF, "Content-Type": "application/json" },
      body: form ? body : JSON.stringify(body || {}),
    });
  } catch (e) { throw new Error("Nėra ryšio su serveriu. Patikrinkite internetą."); }
  let j = {};
  try { j = await res.json(); } catch (e) { j = { error: res.status === 413 ? "Failas per didelis. Didžiausias leidžiamas – 1 MB." : "Serverio klaida (" + res.status + ")." }; }
  if (res.status === 401) { alert(j.error || "Sesija baigėsi."); location.href = "/prisijungimas/"; throw new Error("401"); }
  if (!res.ok || j.error) throw new Error(j.error || "Klaida");
  return j;
}
function toast(msg, bad) {
  const t = $("#toast"); t.textContent = msg; t.className = "toast on" + (bad ? " bad" : "");
  clearTimeout(toast.tm); toast.tm = setTimeout(() => t.className = "toast", bad ? 6000 : 2800);
}
function dialog(title, body, actions) {
  return new Promise(res => {
    const d = h("dialog", { class: "dlg" });
    const acts = h("div", { class: "acts" }, ...actions.map(([label, val, cls]) => h("button", { class: "btn " + (cls || ""), type: "button", onclick: () => { d.close(); res(val); } }, label)));
    d.append(h("div", { class: "in" }, h("h3", {}, title), typeof body === "string" ? h("p", {}, body) : body, acts));
    d.addEventListener("close", () => { d.remove(); res(null); });
    document.body.append(d); d.showModal();
  });
}
const confirmDlg = (title, text, yes = "Taip", cls = "") => dialog(title, text, [["Atšaukti", false, "ghost"], [yes, true, cls]]);

/* ---------- būsena ---------- */
let S = {};          /* iš serverio: draft, dirty, me, users, history, log, contours */
let D = null;        /* redaguojamas juodraštis */
let savedJSON = "";  /* paskutinis išsaugotas juodraštis */
const unsaved = () => D && JSON.stringify(D) !== savedJSON;

function setState() {
  const el = $("#state");
  const u = unsaved();
  el.className = "top-state" + (u ? " unsaved" : S.dirty ? " dirty" : "");
  el.innerHTML = "";
  el.append(h("span", { class: "dot" }), u ? "Yra neišsaugotų pakeitimų" : S.dirty ? "Juodraštis išsaugotas · dar nepaskelbtas" : "Viskas paskelbta – svetainė atnaujinta");
  $("#bSave").disabled = !u;
  $("#bPublish").disabled = !u && !S.dirty;
}
const changed = () => setState();

async function save(quiet) {
  if (!unsaved()) return true;
  $("#bSave").disabled = true;
  try {
    const r = await api("save", { data: D, what: pageTitle() });
    D = r.draft; savedJSON = JSON.stringify(D); S.dirty = r.dirty;
    setState(); if (!quiet) toast("Juodraštis išsaugotas");
    return true;
  } catch (e) { toast(e.message, true); setState(); return false; }
}
$("#bSave").onclick = async () => { if (await save()) render(); };
$("#bPublish").onclick = async () => {
  if (!(await save(true))) return;
  if (!S.dirty) { toast("Nėra ką skelbti"); return; }
  if (!(await confirmDlg("Paskelbti pakeitimus?", "Visi išsaugoti juodraščio pakeitimai iškart atsiras svetainėje. Ankstesnė versija bus išsaugota istorijoje.", "Paskelbti"))) return;
  try { const r = await api("publish"); S.dirty = false; S.history = r.history; setState(); toast("Paskelbta! Svetainė atnaujinta."); if (route === "istorija") render(); }
  catch (e) { toast(e.message, true); }
};
$("#bPreview").onclick = async e => {
  if (!unsaved()) return;
  e.preventDefault();
  const w = window.open("about:blank", "_blank");
  if (await save(true)) { if (w) w.location = "/prisijungimas/?a=preview&on=1"; else location.href = "/prisijungimas/?a=preview&on=1"; }
  else if (w) w.close();
};
addEventListener("beforeunload", e => { if (unsaved()) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- laukai ---------- */
function fld(label, obj, key, o = {}) {
  const input = o.area ? h("textarea", { rows: o.rows || 3 }) : o.options ? h("select", {}, ...o.options.map(x => h("option", { value: x }, x))) : h("input", { type: o.type || "text", inputmode: o.inputmode });
  input.value = obj[key] ?? "";
  if (o.placeholder) input.placeholder = o.placeholder;
  const orig = input.value;
  input.addEventListener("input", () => { obj[key] = o.num ? (input.value === "" ? 0 : +input.value) : input.value; input.classList.toggle("changed", input.value !== orig); changed(); o.oninput && o.oninput(); });
  input.addEventListener("change", () => { obj[key] = o.num ? +input.value : input.value; changed(); o.onchange && o.onchange(); });
  return h("label", { class: "f" + (o.wide ? " wide" : "") }, h("span", {}, label), input, o.hint ? h("small", {}, o.hint) : null);
}
const EM_HINT = "Žodį tarp žvaigždučių (*žodis*) svetainė parodys vario spalvos kursyvu.";
function card(title, ...kids) { return h("section", { class: "card" }, h("h2", {}, ...[].concat(title)), ...kids); }
function grid(n, ...kids) { return h("div", { class: n === 3 ? "grid3" : "grid2" }, ...kids); }

/* rūšiavimas tempiant (pelė ir lietimas): konteinerio vaikai = masyvo elementai */
function sortable(box, arr, onDone, handleSel = ".grip") {
  box.addEventListener("pointerdown", e => {
    const hd = e.target.closest(handleSel); if (!hd || !box.contains(hd)) return;
    const item = [...box.children].find(c => c.contains(hd)); if (!item || item.dataset.fixed) return;
    e.preventDefault();
    const from = [...box.children].indexOf(item);
    item.classList.add("drag");
    const move = ev => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const over = el && [...box.children].find(c => c.contains(el) && c !== item && !c.dataset.fixed);
      if (!over) return;
      const r = over.getBoundingClientRect();
      const horiz = getComputedStyle(box).display === "grid" && r.width < box.clientWidth * .8;
      const after = horiz ? ev.clientX > r.left + r.width / 2 : ev.clientY > r.top + r.height / 2;
      over[after ? "after" : "before"](item);
    };
    const up = () => {
      removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      item.classList.remove("drag");
      const to = [...box.children].indexOf(item);
      if (to !== from && to >= 0) { const [x] = arr.splice(from, 1); arr.splice(to, 0, x); changed(); }
      onDone && onDone();
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  });
}
/* sąrašo redaktorius: eilutės su tempimo rankenėle ir trynimu */
function listEd(arr, rowFn, newFn, o = {}) {
  const box = h("div", { class: "list" });
  const draw = () => {
    box.innerHTML = "";
    arr.forEach((it, i) => {
      const row = h("div", { class: "row" + (o.stack ? " stack" : "") }, h("span", { class: "grip", title: "Tempkite, kad pakeistumėte tvarką" }, I.grip()));
      row.append(...[].concat(rowFn(it, i, row)));
      if (!o.noDelete) row.append(h("button", { class: "icon-btn del", type: "button", title: "Pašalinti", "aria-label": "Pašalinti", onclick: async () => {
        if (o.min && arr.length <= o.min) { toast("Turi likti bent " + o.min + ".", true); return; }
        if (o.confirm && !(await confirmDlg("Pašalinti?", o.confirm, "Pašalinti", "danger"))) return;
        arr.splice(i, 1); changed(); draw(); o.after && o.after();
      } }, I.del()));
      box.append(row);
    });
  };
  draw();
  sortable(box, arr, () => { draw(); o.after && o.after(); });
  const wrap = h("div", {}, box);
  if (newFn) wrap.append(h("button", { class: "btn ghost small add", type: "button", onclick: () => { arr.push(newFn()); changed(); draw(); o.after && o.after(); const last = box.lastElementChild?.querySelector("input"); last && last.focus(); } }, o.addLabel || "+ Pridėti"));
  wrap.redraw = draw;
  return wrap;
}
const inp = (obj, key, o = {}) => {
  const x = h("input", { type: "text", class: o.cls, placeholder: o.ph || "", "aria-label": o.ph || key, inputmode: o.inputmode });
  x.value = obj[key] ?? "";
  x.addEventListener("input", () => { obj[key] = o.num ? +x.value : x.value; changed(); o.oninput && o.oninput(x.value); });
  return x;
};

/* ---------- nuotraukos ---------- */
async function upload(file) {
  if (!file) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast("Tinka tik JPG, PNG arba WebP nuotraukos.", true); return null; }
  if (file.size > MAX_UP) { toast(`Failas per didelis (${(file.size / 1048576).toFixed(1).replace(".", ",")} MB). Didžiausias leidžiamas – 1 MB.`, true); return null; }
  const fd = new FormData(); fd.append("file", file);
  toast("Įkeliama…");
  try { const r = await api("upload", fd, true); toast("Nuotrauka įkelta"); return r; }
  catch (e) { toast(e.message, true); return null; }
}
function pickFile(multiple) {
  return new Promise(res => {
    const i = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple });
    i.onchange = () => res([...i.files]); i.click();
  });
}
/* viena nuotrauka su aprašymu; ratio – rekomenduojama proporcija (plotis/aukštis) */
function imgField(obj, o = {}) {
  const th = h("div", { class: "thumb" + (o.ratio && o.ratio < 1 ? " portrait" : ""), style: { backgroundImage: `url("${obj.src}")` } });
  const warn = h("small", { class: "warn" });
  const checkRatio = () => {
    warn.textContent = "";
    if (o.ratio && obj.w && obj.h && Math.abs(obj.w / obj.h - o.ratio) / o.ratio > .15)
      warn.textContent = `Šios nuotraukos proporcija ${(obj.w / obj.h).toFixed(2).replace(".", ",")}, o šiai vietai tinka ~${o.ratioLabel}. Nuotrauka bus apkirpta.`;
  };
  checkRatio();
  const btn = h("button", { class: "btn ghost small", type: "button", onclick: async () => {
    const [f] = await pickFile(false); const r = await upload(f); if (!r) return;
    obj.src = r.thumb; obj.w = r.w; obj.h = r.h; th.style.backgroundImage = `url("${r.thumb}")`; checkRatio(); changed();
  } }, "Keisti nuotrauką");
  return h("div", { class: "imgf" }, th, h("div", { class: "side-f" },
    h("div", { class: "up" }, btn, h("small", {}, "JPG, PNG ar WebP iki 1 MB" + (o.ratioLabel ? " · proporcija " + o.ratioLabel : ""))),
    warn,
    o.caption ? fld("Užrašas po nuotrauka", obj, "caption") : null,
    fld("Aprašymas (neregintiems ir paieškai)", obj, "alt")));
}

/* ---------- maršrutai ---------- */
let route = "";
const PAGES = () => [
  ["Svetainė", [["apzvalga", "Apžvalga"], ["pagrindinis", "Pagrindinis"], ["apie", "Apie projektą"], ["galerija", "Galerija"], ["kontaktai", "Kontaktai"], ["butai", "Butai"]]],
  ["Butai", D.apartments.map(a => ["butas-" + a.no, "Butas " + a.no, a.status])],
  ["Sistema", [["istorija", "Istorija"], ["paskyros", "Paskyros"], ["mano", "Mano paskyra"]]],
];
function pageTitle() { for (const [, items] of PAGES()) for (const [k, l] of items) if (k === route) return l; return ""; }
function drawSide() {
  const side = $("#side"); side.innerHTML = "";
  for (const [title, items] of PAGES()) {
    side.append(h("h4", {}, title));
    for (const [k, label, st] of items) side.append(h("a", { href: "#" + k, class: k === route ? "on" : "" }, label,
      st ? h("small", { class: st === "Laisvas" ? "free" : st === "Parduotas" ? "sold" : "" }, st) : null));
  }
  side.append(h("div", { class: "out" }, h("button", { type: "button", onclick: async () => {
    if (unsaved() && !(await confirmDlg("Atsijungti?", "Turite neišsaugotų pakeitimų – jie dings.", "Atsijungti", "danger"))) return;
    D = null; $("#logoutForm").submit();
  } }, "Atsijungti (" + S.me.name + ")")));
}
function head(title, sub, viewUrl) {
  return h("div", { class: "page-h" }, h("div", {}, h("h1", {}, title), sub ? h("p", {}, sub) : null),
    viewUrl ? h("a", { class: "view", href: viewUrl, target: "_blank", rel: "noopener" }, "Atidaryti svetainėje ↗") : null);
}
function render() {
  route = (location.hash || "#apzvalga").slice(1);
  document.body.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false");
  drawSide();
  const m = $("#main"); m.innerHTML = "";
  const v = VIEWS[route] || (route.startsWith("butas-") ? () => viewApt(route.slice(6)) : VIEWS.apzvalga);
  m.append(...[].concat(v()));
  setState();
  scrollTo(0, 0);
}
addEventListener("hashchange", render);
$("#menuBtn").onclick = () => { const o = document.body.classList.toggle("nav-open"); $("#menuBtn").setAttribute("aria-expanded", o); };

/* ---------- puslapiai ---------- */
const VIEWS = {};

function aptTable() {
  const tb = h("tbody");
  D.apartments.forEach(a => {
    const sel = h("select", { "aria-label": "Būsena" }, ...STATUSES.map(s => h("option", { value: s, selected: a.status === s }, s)));
    sel.onchange = () => { a.status = sel.value; changed(); drawSide(); };
    tb.append(h("tr", {},
      h("td", {}, h("a", { href: "#butas-" + a.no }, "Butas " + a.no)),
      h("td", { class: "hide-s" }, a.floorText),
      h("td", { class: "hide-s" }, a.area),
      h("td", {}, sel),
      h("td", {}, inp(a, "price", { ph: "Teirautis" }))));
  });
  return h("table", { class: "apt-tbl" }, h("thead", {}, h("tr", {}, h("th", {}, "Butas"), h("th", { class: "hide-s" }, "Aukštas"), h("th", { class: "hide-s" }, "Plotas"), h("th", {}, "Būsena"), h("th", {}, "Kaina"))), tb);
}

VIEWS.apzvalga = () => [
  head("Sveiki, " + S.me.name, "Čia keičiate svetainės tekstus, nuotraukas ir butų duomenis."),
  card("Kaip tai veikia",
    h("ol", { style: { margin: 0, paddingLeft: "20px", lineHeight: "1.8" } },
      h("li", {}, "Pakeiskite, ką reikia, ir spauskite ", h("b", {}, "„Išsaugoti juodraštį“"), " – lankytojai pakeitimų dar nemato."),
      h("li", {}, h("b", {}, "„Peržiūrėti“"), " atidaro svetainę su jūsų juodraščiu (matote tik jūs)."),
      h("li", {}, h("b", {}, "„Paskelbti“"), " – pakeitimai iškart atsiranda svetainėje. Ankstesnė versija lieka „Istorijoje“."))),
  card("Butai – greitas keitimas", h("p", { class: "hint" }, "Būsena ir kaina. Tuščia kaina – svetainėje rodoma „Teirautis“."), aptTable()),
  card("Paskutiniai veiksmai", logList(S.log.slice(0, 8))),
];

VIEWS.pagrindinis = () => {
  const H = D.home;
  const placesBox = h("div");
  const mapCard = card("Vieta ir žemėlapis",
    grid(2, fld("Mažoji antraštė", H.location, "eyebrow"), fld("Antraštė", H.location, "title", { hint: EM_HINT }),
      fld("Aprašymas", H.location, "text", { area: true, rows: 6, wide: true }), fld("Pastaba po žemėlapiu", H.location, "note", { wide: true })),
    h("h2", { class: "mt", style: { marginTop: "26px" } }, "Taškai žemėlapyje"),
    h("p", { class: "hint", style: { marginTop: "-8px" } }, "Tempkite taškus žemėlapyje į reikiamą vietą. Sąrašo tvarką keiskite tempdami už ⋮⋮ – numeriai persinumeruoja patys."),
    placesBox);
  drawPlaces(placesBox, H.location.places);
  const g = H.gallery.items;
  const slots = [["Fasadas – didelė", 1.29, "4:3"], ["Fasadas – antra", 1.29, "4:3"], ["Laiptinė 1", .75, "3:4"], ["Laiptinė 2", .75, "3:4"], ["Laiptinė 3", .75, "3:4"], ["Iš viršaus 1", 1.33, "4:3"], ["Iš viršaus 2", 1.33, "4:3"]];
  return [
    head("Pagrindinis", null, "/"),
    card("Pirmas ekranas", grid(2,
      fld("Adresas virš antraštės", H.hero, "eyebrow"), fld("Mygtuko tekstas", H.hero, "button"),
      fld("Antraštė", H.hero, "title", { wide: true, hint: EM_HINT }),
      fld("Aprašymas", H.hero, "text", { area: true, wide: true }),
      fld("Užrašas virš aukštų mygtukų", H.hero, "pickLabel"), fld("Tekstas aukšto lange", H.hero, "panelText"))),
    card("Apie projektą", grid(2,
      fld("Mažoji antraštė", H.about, "eyebrow"), fld("Antraštė", H.about, "title", { hint: EM_HINT }),
      fld("Pirma pastraipa (paryškinta)", H.about, "lead", { area: true, wide: true }),
      fld("Antra pastraipa", H.about, "text", { area: true, wide: true })),
      h("div", { class: "mt" }, imgField(H.about.image, { ratio: 1.12, ratioLabel: "~9:8" })),
      h("h2", { style: { marginTop: "26px" } }, "Skaičiai"),
      listEd(H.about.facts, f => [inp(f, "value", { ph: "Skaičius", cls: "w-s" }), inp(f, "small", { ph: "Prierašas (min)", cls: "w-m" }), h("span", { class: "grow" }, inp(f, "label", { ph: "Paaiškinimas" }))],
        () => ({ value: "", small: "", label: "" }), { min: 1 })),
    mapCard,
    card("Galerija", grid(2, fld("Mažoji antraštė", H.gallery, "eyebrow"), fld("Antraštė", H.gallery, "title", { hint: EM_HINT })),
      h("p", { class: "hint mt" }, "7 nuotraukų vietos – išdėstymas suprojektuotas, todėl keičiama nuotrauka vietoje."),
      ...g.map((it, i) => h("div", { style: { padding: "16px 0", borderTop: "1px solid var(--line)" } }, h("b", { style: { display: "block", marginBottom: "10px", fontSize: "13px" } }, (i + 1) + ". " + slots[i][0]),
        imgField(it, { ratio: slots[i][1], ratioLabel: slots[i][2], caption: true })))),
  ];
};

function drawPlaces(box, places) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 760");
  const wrap = h("div", { class: "mapwrap" }, svg);
  let hot = -1;
  const paint = () => {
    locMap(svg, places.map(p => ({ x: +p.x, y: +p.y })));
    svg.querySelectorAll(".lm-route").forEach(r => r.classList.toggle("on", +r.dataset.i === hot));
    svg.querySelectorAll(".lm-pin").forEach(p => p.classList.toggle("on", +p.dataset.i === hot));
  };
  const toXY = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [Math.round(r.x), Math.round(r.y)]; };
  svg.addEventListener("pointerdown", e => {
    const pin = e.target.closest(".lm-pin"); if (!pin) return;
    e.preventDefault(); const i = +pin.dataset.i; hot = i; wrap.classList.add("dragging");
    const mv = ev => { const [x, y] = toXY(ev); places[i].x = Math.max(10, Math.min(990, x)); places[i].y = Math.max(10, Math.min(750, y)); changed(); paint(); };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); wrap.classList.remove("dragging"); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
  const list = listEd(places, (p, i, row) => {
    row.addEventListener("pointerenter", () => { hot = i; paint(); });
    row.addEventListener("pointerleave", () => { hot = -1; paint(); });
    const walk = h("input", { type: "checkbox" }); walk.checked = !!p.walk; walk.onchange = () => { p.walk = walk.checked; changed(); };
    return [h("span", { class: "num" }, i + 1), h("span", { class: "grow" }, inp(p, "name", { ph: "Vieta" })), inp(p, "min", { ph: "min", cls: "w-xs", inputmode: "numeric" }), h("span", { class: "muted", style: { fontSize: "13px" } }, "min."),
      h("label", { class: "ck" }, walk, "pėsčiomis")];
  }, () => ({ name: "Nauja vieta", min: "5", walk: false, x: 640, y: 420 }), { after: paint, addLabel: "+ Pridėti vietą" });
  paint();
  box.append(h("div", { class: "mapbox" }, wrap, list));
}

VIEWS.apie = () => {
  const A = D.about;
  const tabsBox = h("div");
  const drawTabs = () => {
    tabsBox.innerHTML = "";
    A.tabs.forEach((t, i) => {
      const acts = h("span", { style: { display: "flex", gap: "6px" } },
        i > 0 ? h("button", { class: "icon-btn", type: "button", title: "Aukščiau", onclick: () => { [A.tabs[i - 1], A.tabs[i]] = [A.tabs[i], A.tabs[i - 1]]; changed(); drawTabs(); } }, I.up()) : null,
        i < A.tabs.length - 1 ? h("button", { class: "icon-btn", type: "button", title: "Žemiau", onclick: () => { [A.tabs[i + 1], A.tabs[i]] = [A.tabs[i], A.tabs[i + 1]]; changed(); drawTabs(); } }, I.down()) : null,
        h("button", { class: "icon-btn del", type: "button", title: "Pašalinti skirtuką", onclick: async () => {
          if (A.tabs.length < 2) { toast("Turi likti bent vienas skirtukas.", true); return; }
          if (!(await confirmDlg("Pašalinti skirtuką?", `„${t.title}“ ir visi jo punktai bus pašalinti iš juodraščio.`, "Pašalinti", "danger"))) return;
          A.tabs.splice(i, 1); changed(); drawTabs();
        } }, I.del()));
      const count = h("span", { class: "muted" });
      const upd = () => count.textContent = t.items.length + " punkt.";
      upd();
      tabsBox.append(card([h("span", {}, String(i + 1).padStart(2, "0") + " · " + (t.title || "Skirtukas"), " ", count), acts],
        grid(2, fld("Skirtuko pavadinimas", t, "title"), fld("Įvadinis sakinys", t, "intro")),
        h("h2", { style: { marginTop: "22px" } }, "Punktai"),
        h("p", { class: "hint" }, "Paryškinta dalis neprivaloma: jei įrašyta, svetainėje bus „Pavadinimas – tekstas“."),
        listEd(t.items, it => [h("span", { class: "w-m" }, inp(it, "title", { ph: "Paryškinta (nebūtina)" })), h("span", { class: "grow" }, inp(it, "text", { ph: "Tekstas" }))],
          () => ({ title: "", text: "" }), { after: upd, addLabel: "+ Pridėti punktą", stack: false })));
    });
  };
  drawTabs();
  return [
    head("Apie projektą", null, "/apie-projekta/"),
    card("Pirmas ekranas", grid(2, fld("Mažoji antraštė", A.hero, "eyebrow"), fld("Antraštė", A.hero, "title", { hint: EM_HINT }), fld("Aprašymas", A.hero, "text", { area: true, wide: true }))),
    card("Bendra informacija", fld("Bloko antraštė", A, "factsLabel"),
      h("p", { class: "hint mt" }, "Skaičius ar žodis (pvz. „2027“ ar „Liftas“), mažas prierašas šalia (pvz. „III ketv.“) ir paaiškinimas. Pažymėkite „žodis“, kai vietoj skaičiaus rašomas žodis."),
      listEd(A.facts, f => {
        const w = h("input", { type: "checkbox" }); w.checked = !!f.word; w.onchange = () => { f.word = w.checked; changed(); };
        return [inp(f, "value", { ph: "Skaičius / žodis", cls: "w-m" }), inp(f, "small", { ph: "Prierašas", cls: "w-s" }), h("span", { class: "grow" }, inp(f, "label", { ph: "Paaiškinimas" })), h("label", { class: "ck" }, w, "žodis")];
      }, () => ({ value: "", small: "", label: "", word: false }), { min: 1 })),
    h("div", { class: "page-h", style: { marginTop: "30px" } }, h("div", {}, h("h1", { style: { fontSize: "26px" } }, "Skirtukai"), h("p", {}, "Punktų skaičius prie skirtuko atsinaujina pats."))),
    tabsBox,
    h("button", { class: "btn ghost", type: "button", onclick: () => { A.tabs.push({ title: "Naujas skirtukas", intro: "", items: [{ title: "", text: "" }] }); changed(); drawTabs(); } }, "+ Pridėti skirtuką"),
  ];
};

VIEWS.galerija = () => {
  const G = D.gallery;
  const box = h("div", { class: "gal-grid" });
  const addFiles = async files => {
    for (const f of files) { const r = await upload(f); if (r) { G.items.push({ src: r.src, thumb: r.thumb, alt: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), w: r.w, h: r.h }); changed(); draw(); } }
  };
  const draw = () => {
    box.innerHTML = "";
    G.items.forEach((it, i) => {
      const ta = h("textarea", { "aria-label": "Aprašymas", placeholder: "Aprašymas (rodomas peržiūroje)" }); ta.value = it.alt; ta.oninput = () => { it.alt = ta.value; changed(); };
      box.append(h("div", { class: "gal-it" }, h("div", { class: "ph grip", style: { backgroundImage: `url("${it.thumb}")` }, title: "Tempkite, kad pakeistumėte tvarką" }, h("b", {}, i + 1)),
        h("div", { class: "bd" }, ta, h("div", { class: "acts" },
          h("button", { class: "btn ghost small", type: "button", onclick: async () => { const [f] = await pickFile(false); const r = await upload(f); if (r) { Object.assign(it, { src: r.src, thumb: r.thumb, w: r.w, h: r.h }); changed(); draw(); } } }, "Keisti"),
          h("button", { class: "icon-btn del", type: "button", title: "Pašalinti", onclick: async () => { if (await confirmDlg("Pašalinti nuotrauką?", "Nuotrauka bus pašalinta iš galerijos (juodraštyje).", "Pašalinti", "danger")) { G.items.splice(i, 1); changed(); draw(); } } }, I.del())))));
    });
    const drop = h("div", { class: "drop", "data-fixed": "1", tabindex: 0, role: "button", onclick: async () => addFiles(await pickFile(true)) }, h("div", {}, h("b", {}, "+ Įkelti nuotraukas"), h("br"), h("small", {}, "arba nutempkite failus čia · iki 1 MB kiekviena")));
    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); addFiles([...e.dataTransfer.files]); });
    box.append(drop);
  };
  draw();
  sortable(box, G.items, draw);
  return [
    head("Galerija", null, "/galerija/"),
    card("Pirmas ekranas", grid(2, fld("Mažoji antraštė", G.hero, "eyebrow"), fld("Antraštė", G.hero, "title", { hint: EM_HINT }), fld("Aprašymas", G.hero, "text", { area: true, wide: true }))),
    card("Nuotraukos (" + G.items.length + ")", h("p", { class: "hint" }, "Tvarką keiskite tempdami nuotrauką. Aprašymas rodomas didelėje peržiūroje ir naudojamas paieškai."), box),
  ];
};

VIEWS.kontaktai = () => {
  const K = D.contacts, C = D.site.contacts, F = D.site.footer;
  return [
    head("Kontaktai", null, "/kontaktai/"),
    card("Pirmas ekranas", grid(2, fld("Mažoji antraštė", K.hero, "eyebrow"), fld("Antraštė", K.hero, "title", { hint: EM_HINT }), fld("Aprašymas", K.hero, "text", { area: true, wide: true }))),
    card("Kontaktai", h("p", { class: "hint" }, "Šie duomenys rodomi visoje svetainėje: kontaktų puslapyje, poraštėje, mobiliame meniu ir užklausos lange."),
      grid(2, fld("El. paštas", C, "email", { type: "email" }), fld("Adresas", C, "address"),
        fld("„Google Maps“ nuoroda", C, "mapsUrl", { type: "url" }), fld("„Facebook“ nuoroda", C, "facebook", { type: "url" })),
      h("h2", { style: { marginTop: "24px" } }, "Žmonės"),
      listEd(C.people, p => [h("span", { class: "grow" }, inp(p, "name", { ph: "Vardas Pavardė" })), inp(p, "phone", { ph: "+370 600 00000", cls: "w-m", inputmode: "tel" })],
        () => ({ name: "", phone: "" }), { min: 1, addLabel: "+ Pridėti žmogų" })),
    card("Forma", grid(2, fld("Formos antraštė", K, "formTitle", { hint: EM_HINT }), fld("Pastaba po mygtuku", K, "note"),
      fld("Padėkos antraštė", K, "doneTitle"), fld("Padėkos tekstas", K, "doneText"),
      fld("Kur siųsti užklausas (el. paštas)", K, "formEmail", { type: "email", wide: true, hint: "Formų siuntimas bus įjungtas, kai nurodysite el. paštą." }))),
    card("Poraštė", grid(3, fld("Mažoji antraštė", F, "eyebrow"), fld("Antraštė", F, "title", { hint: EM_HINT }), fld("Apatinė eilutė", F, "copy"))),
  ];
};

VIEWS.butai = () => {
  const P = D.floorsPage;
  return [
    head("Butai", "Aukštų puslapio tekstai ir visų butų sąrašas.", "/1-aukstas/"),
    card("Pirmas ekranas", grid(2, fld("Mažoji antraštė", P.hero, "eyebrow"), fld("Antraštė", P.hero, "title", { hint: EM_HINT }), fld("Aprašymas", P.hero, "text", { area: true, wide: true })),
      h("h2", { style: { marginTop: "24px" } }, "Skaičiai"),
      listEd(P.stats, s => [inp(s, "value", { ph: "Skaičius", cls: "w-s" }), inp(s, "small", { ph: "Prierašas", cls: "w-s" }), h("span", { class: "grow" }, inp(s, "label", { ph: "Paaiškinimas" }))], () => ({ value: "", small: "", label: "" }), { min: 1 }),
      h("div", { class: "mt" }, fld("Užrašas virš aukštų", P, "pickLabel"))),
    card("Butai", h("p", { class: "hint" }, "Spauskite buto numerį, kad keistumėte visus jo duomenis ir patalpas."), aptTable()),
  ];
};

function viewApt(no) {
  const a = D.apartments.find(x => x.no === no);
  if (!a) return [head("Butas nerastas")];
  const multi = a.plans.length > 1;
  const tpl = document.createElement("div"); tpl.innerHTML = S.contours[no] || "";
  const tpls = [...tpl.querySelectorAll("template")];
  const st = h("select", {}, ...STATUSES.map(s => h("option", { value: s, selected: a.status === s }, s)));
  st.onchange = () => { a.status = st.value; changed(); drawSide(); };
  const plans = a.plans.map((p, pi) => {
    /* plano nuotrauka su patalpų kontūrais */
    const pic = h("div", { class: "plan-pic" }, h("img", { src: p.img, alt: "Planas" }));
    const svgSrc = tpls[pi]?.content.querySelector("svg");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const nums = new Set();
    if (svgSrc) {
      svg.setAttribute("viewBox", svgSrc.getAttribute("viewBox")); svg.setAttribute("preserveAspectRatio", "none");
      svgSrc.querySelectorAll("a.bldg").forEach(src => {
        const n = (src.getAttribute("href") || "").replace("#patalpa-", ""); nums.add(n);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.dataset.n = n;
        src.querySelectorAll("path").forEach(q => { const x = document.createElementNS("http://www.w3.org/2000/svg", "path"); x.setAttribute("d", q.getAttribute("d")); g.append(x); });
        svg.append(g);
      });
      pic.append(svg);
    }
    if (multi) pic.append(h("span", { class: "cap" }, p.caption));
    const warn = h("small", { class: "warn" });
    let list;
    const hot = (n, on) => { svg.querySelectorAll(`g[data-n="${CSS.escape(n)}"]`).forEach(g => g.classList.toggle("hot", on)); list?.querySelectorAll(".row").forEach((r, i) => { if (p.rooms[i] && p.rooms[i].n === n) r.classList.toggle("hot", on); }); };
    svg.addEventListener("pointerover", e => { const g = e.target.closest("g"); if (g) hot(g.dataset.n, true); });
    svg.addEventListener("pointerout", e => { const g = e.target.closest("g"); if (g) hot(g.dataset.n, false); });
    const check = () => {
      const miss = p.rooms.map(r => r.n).filter(n => n && !nums.has(n));
      warn.textContent = miss.length ? `Patalpų ${miss.join(", ")} plane nėra kontūro – sąraše jos bus rodomos, bet plane nepasižymės. Kontūrą nubrėžia programuotojas.` : "";
    };
    list = listEd(p.rooms, (r, i, row) => {
      row.addEventListener("pointerenter", () => hot(r.n, true)); row.addEventListener("pointerleave", () => hot(r.n, false));
      return [inp(r, "n", { ph: "Nr.", cls: "w-xs", inputmode: "numeric", oninput: check }), h("span", { class: "grow" }, inp(r, "name", { ph: "Pavadinimas" })), inp(r, "area", { ph: "0,00 m²", cls: "w-s" })];
    }, () => ({ n: String(p.rooms.reduce((m, r) => Math.max(m, parseInt(r.n) || 0), 0) + 1), name: "Kambarys", area: "" }), { after: check, addLabel: "+ Patalpa" });
    check();
    return card(multi ? p.caption || "Planas " + (pi + 1) : "Patalpos",
      h("div", { class: "plan-ed" }, pic, h("div", {},
        grid(2, fld("Sąrašo antraštė", p, "label"), fld("Viso aukšte (nebūtina)", p, "total", { placeholder: "pvz. 66,81 m²" })),
        multi ? h("div", { class: "mt" }, fld("Užrašas ant plano", p, "caption")) : null,
        h("p", { class: "hint mt" }, "Užveskite pelę ant eilutės – patalpa pasižymės plane. Numeris turi sutapti su numeriu plane."),
        list, warn)));
  });
  return [
    head("Butas Nr. " + no, a.floorText, "/" + (+no) + "-butas/"),
    card("Duomenys", h("p", { class: "hint" }, "Viskas rašoma ranka, taip kaip turi atrodyti svetainėje."),
      grid(3,
        h("label", { class: "f" }, h("span", {}, "Būsena"), st),
        fld("Plotas", a, "area", { placeholder: "70,90 m²" }),
        fld("Kaina", a, "price", { placeholder: "Tuščia – „Teirautis“", hint: "pvz. 185 000 €" }),
        fld("Aukštas", a, "floorText", { placeholder: "2 aukštas" }),
        fld("Langų orientacija", a, "orient", { placeholder: "R / V / Š" }),
        fld("Apdaila", a, "finish", { placeholder: "Dalinė" }),
        fld("Kambariai (aukšto plano kortelėje)", a, "rooms", { placeholder: "1–3" }),
        fld("Papildomas užrašas (nebūtina)", a, "subtitle", { placeholder: "pvz. Dviejų aukštų butas" }))),
    ...plans,
    card("Ypatybės", listEd(a.features, f => {
      const s = h("select", { class: "w-m", "aria-label": "Ženkliukas" }, ...Object.entries(ICONS).map(([k, l]) => h("option", { value: k, selected: f.icon === k }, l)));
      s.onchange = () => { f.icon = s.value; changed(); };
      return [s, h("span", { class: "grow" }, inp(f, "text", { ph: "Tekstas" }))];
    }, () => ({ text: "", icon: "dot" }), { addLabel: "+ Pridėti ypatybę" })),
  ];
}

function logList(items) {
  if (!items.length) return h("p", { class: "muted" }, "Kol kas nieko.");
  return h("div", { class: "hist" }, ...items.map(l => h("div", {}, h("time", {}, fmt(l.t)), h("span", {}, h("b", {}, l.who), " · ", l.what))));
}
const fmt = t => { const d = new Date(t); return d.toLocaleDateString("lt-LT") + " " + d.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" }); };

VIEWS.istorija = () => [
  head("Istorija", "Prieš kiekvieną paskelbimą išsaugoma ankstesnė svetainės versija."),
  S.dirty || unsaved() ? card("Nepaskelbti pakeitimai", h("p", { class: "hint" }, "Juodraštyje yra pakeitimų, kurių lankytojai dar nemato."),
    h("button", { class: "btn danger", type: "button", onclick: async () => {
      if (!(await confirmDlg("Atmesti visus nepaskelbtus pakeitimus?", "Juodraštis grįš į tokią būseną, kokia dabar matoma svetainėje.", "Atmesti", "danger"))) return;
      try { const r = await api("discard"); D = r.draft; savedJSON = JSON.stringify(D); S.dirty = false; toast("Pakeitimai atmesti"); render(); } catch (e) { toast(e.message, true); }
    } }, "Atmesti pakeitimus")) : null,
  card("Ankstesnės versijos", S.history.length ? h("div", { class: "hist" }, ...S.history.map(v => h("div", {}, h("time", {}, fmt(v.t)), h("span", {}, "Versija prieš ", h("b", {}, v.who), " paskelbimą"),
    h("button", { class: "btn ghost small", type: "button", onclick: async () => {
      if (!(await confirmDlg("Atkurti šią versiją?", "Versija bus įkelta į juodraštį. Peržiūrėkite ir spauskite „Paskelbti“, kad ji atsirastų svetainėje.", "Atkurti"))) return;
      try { const r = await api("restore", { id: v.id }); D = r.draft; savedJSON = JSON.stringify(D); S.dirty = r.dirty; toast("Versija atkurta į juodraštį"); render(); } catch (e) { toast(e.message, true); }
    } }, "Atkurti")))) : h("p", { class: "muted" }, "Dar nieko nepaskelbta.")),
  card("Veiksmų žurnalas", logList(S.log)),
];

VIEWS.paskyros = () => {
  const box = h("div", { class: "users" });
  const showTemp = (u, temp) => dialog("Laikinas slaptažodis", h("div", {},
    h("p", {}, `Perduokite ${u} šį slaptažodį (geriausia telefonu ar asmeniškai). Prisijungus sistema paprašys susikurti savo.`),
    h("div", { class: "secret" }, temp)), [["Nukopijavau", true]]);
  const draw = () => {
    box.innerHTML = "";
    S.users.forEach(u => box.append(h("div", { class: "user" },
      h("div", { class: "who" }, h("b", {}, u.name + (u.me ? " (jūs)" : "")), h("small", {}, u.email)),
      u.twofa ? h("span", { class: "tag ok" }, "2FA įjungta") : h("span", { class: "tag" }, "Be 2FA"),
      u.mustChange ? h("span", { class: "tag" }, "Laukia prisijungimo") : null,
      u.disabled ? h("span", { class: "tag bad" }, "Išjungta") : null,
      u.me ? null : h("span", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
        h("button", { class: "btn ghost small", type: "button", onclick: async () => {
          const ck = h("input", { type: "checkbox" });
          const ok = await dialog("Naujas laikinas slaptažodis", h("div", {}, h("p", {}, `${u.name} bus atjungtas ir turės prisijungti su nauju laikinu slaptažodžiu.`),
            u.twofa ? h("label", { class: "f", style: { display: "flex", gap: "8px", alignItems: "center" } }, ck, h("span", { style: { textTransform: "none", letterSpacing: 0, fontWeight: 400, fontSize: "14px" } }, "Taip pat išjungti 2FA (jei pametė telefoną)")) : ""), [["Atšaukti", false, "ghost"], ["Sukurti", true]]);
          if (!ok) return;
          try { const r = await api("user-reset", { id: u.id, reset2fa: ck.checked }); S.users = r.users; draw(); showTemp(u.name, r.temp); } catch (e) { toast(e.message, true); }
        } }, "Laikinas slaptažodis"),
        h("button", { class: "btn ghost small", type: "button", onclick: async () => { try { const r = await api("user-toggle", { id: u.id }); S.users = r.users; draw(); } catch (e) { toast(e.message, true); } } }, u.disabled ? "Įjungti" : "Išjungti"),
        h("button", { class: "btn danger small", type: "button", onclick: async () => {
          if (!(await confirmDlg("Ištrinti paskyrą?", `${u.name} (${u.email}) nebegalės prisijungti.`, "Ištrinti", "danger"))) return;
          try { const r = await api("user-delete", { id: u.id }); S.users = r.users; draw(); } catch (e) { toast(e.message, true); }
        } }, "Ištrinti")))));
  };
  draw();
  const nu = { name: "", email: "" };
  return [
    head("Paskyros", "Administratoriai su vienodomis teisėmis."),
    card("Administratoriai", box),
    card("Nauja paskyra", h("p", { class: "hint" }, "Sistema sukurs laikiną slaptažodį – perduokite jį žmogui. Prisijungęs jis susikurs savo."),
      grid(2, fld("Vardas", nu, "name"), fld("El. paštas", nu, "email", { type: "email" })),
      h("button", { class: "btn mt", type: "button", onclick: async () => {
        try { const r = await api("user-add", nu); S.users = r.users; draw(); showTemp(nu.name, r.temp); } catch (e) { toast(e.message, true); }
      } }, "Sukurti paskyrą")),
  ];
};

VIEWS.mano = () => {
  const pw = { old: "", new: "", rep: "" };
  const tf = h("div");
  const drawTF = () => {
    tf.innerHTML = "";
    if (S.me.twofa) {
      const p = { password: "" };
      tf.append(h("p", {}, h("span", { class: "tag ok" }, "Įjungta"), " Prisijungiant reikia kodo iš telefono. Atsarginių kodų liko: ", h("b", {}, S.me.backupLeft), "."),
        h("div", { style: { maxWidth: "360px" } }, fld("Slaptažodis išjungimui", p, "password", { type: "password" })),
        h("button", { class: "btn danger mt", type: "button", onclick: async () => {
          try { const r = await api("2fa-disable", p); S.me = r.me; toast("Dviejų žingsnių patvirtinimas išjungtas"); drawTF(); } catch (e) { toast(e.message, true); }
        } }, "Išjungti 2FA"));
    } else {
      tf.append(h("p", { class: "hint" }, "Be slaptažodžio prisijungiant reikės 6 skaitmenų kodo iš telefono programėlės (Google Authenticator, Microsoft Authenticator ar iPhone „Slaptažodžiai“). Net nutekėjęs slaptažodis tada nieko neduoda."),
        h("button", { class: "btn", type: "button", onclick: async () => {
          let r; try { r = await api("2fa-setup"); } catch (e) { toast(e.message, true); return; }
          const qr = qrcode(0, "M"); qr.addData(r.uri); qr.make();
          const c = { code: "" };
          tf.innerHTML = "";
          tf.append(h("div", { class: "twocol" }, h("div", { class: "qr", html: qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) }),
            h("div", {}, h("ol", { style: { margin: "0 0 14px", paddingLeft: "20px", lineHeight: "1.8" } },
              h("li", {}, "Atsidarykite programėlę telefone ir pasirinkite „+“ / „Pridėti paskyrą“."),
              h("li", {}, "Nuskenuokite QR kodą (arba įveskite raktą ranka)."),
              h("li", {}, "Įveskite programėlėje rodomą 6 skaitmenų kodą.")),
              h("div", { class: "secret" }, r.secret.replace(/(.{4})/g, "$1 ").trim()),
              h("div", { style: { maxWidth: "220px" }, class: "mt" }, fld("Kodas", c, "code", { inputmode: "numeric" })),
              h("button", { class: "btn mt", type: "button", onclick: async () => {
                try {
                  const x = await api("2fa-enable", c);
                  S.me.twofa = true; S.me.backupLeft = x.codes.length;
                  await dialog("Atsarginiai kodai", h("div", {}, h("p", {}, "Išsisaugokite šiuos kodus (atsispausdinkite ar įsirašykite į slaptažodžių tvarkyklę). Kiekvienas tinka vieną kartą, jei neturėsite telefono."),
                    h("div", { class: "codes" }, ...x.codes.map(k => h("span", {}, k)))), [["Išsisaugojau", true]]);
                  drawTF(); toast("Dviejų žingsnių patvirtinimas įjungtas");
                } catch (e) { toast(e.message, true); }
              } }, "Patvirtinti"))));
        } }, "Įjungti 2FA"));
    }
  };
  drawTF();
  return [
    head("Mano paskyra", S.me.name + " · " + S.me.email),
    card("Slaptažodžio keitimas", h("div", { style: { maxWidth: "420px", display: "grid", gap: "14px" } },
      fld("Dabartinis slaptažodis", pw, "old", { type: "password" }), fld("Naujas slaptažodis", pw, "new", { type: "password", hint: "Bent 10 simbolių" }), fld("Pakartokite", pw, "rep", { type: "password" })),
      h("button", { class: "btn mt", type: "button", onclick: async () => {
        if (pw.new !== pw.rep) { toast("Slaptažodžiai nesutampa.", true); return; }
        try { await api("password", { old: pw.old, new: pw.new }); toast("Slaptažodis pakeistas. Kituose įrenginiuose būsite atjungti."); render(); } catch (e) { toast(e.message, true); }
      } }, "Pakeisti slaptažodį")),
    card("Dviejų žingsnių patvirtinimas (2FA)", tf),
  ];
};

/* ---------- pradžia ---------- */
(async () => {
  try {
    S = await api("state");
    D = S.draft; savedJSON = JSON.stringify(D);
    render();
  } catch (e) { $("#main").innerHTML = ""; $("#main").append(h("p", { class: "note bad" }, e.message)); }
})();
