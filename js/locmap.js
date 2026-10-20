/* Centro Vila – schematinis bronzinių linijų Kauno centro žemėlapis (1000×760).
   locMap(svg, places): nupiešia žemėlapį į <svg>; places – taškai su maršrutais (gali būti tuščias). */
const LM_W=1000, LM_H=760, LM_HX=792, LM_HY=486;
function locMap(svg,places){
  const W=LM_W,H=LM_H,HX=LM_HX,HY=LM_HY;
  const C={bg:"#120f0c",major:"#7a5232",minor:"#3d2a1b",water:"#5a3d26",label:"#a37a55",area:"#6b4e35",waterLabel:"#8a6444",accent:"#e09a5e",house:"#f4e6d4"};
  let seed=11; const R=()=>(seed=(seed*9301+49297)%233280)/233280;
  const P=a=>"M"+a.map(p=>p.map(v=>+v.toFixed(1)).join(",")).join(" L");
  const NEMUNAS="M0,520 C200,532 380,552 500,598 C580,628 640,690 680,760 L548,760 C520,706 470,672 380,654 C262,632 150,622 0,612 Z";
  const ISLAND="M352,622 C392,604 470,606 520,626 C500,646 440,652 372,644 C352,640 342,630 352,622 Z";
  const NERIS="M318,0 C292,150 190,300 0,404 L0,470 C214,356 330,190 382,0 Z";
  const NBANK=[[0,520],[200,532],[380,552],[500,598],[580,628],[640,690],[680,760]];
  const bankY=x=>{for(let i=0;i<NBANK.length-1;i++){const a=NBANK[i],b=NBANK[i+1];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return 900};
  const AZ="M880,96 C940,84 1000,90 1000,90 L1000,420 C960,416 920,404 902,384 C884,330 870,180 880,96 Z";
  const RAMYBE="M736,556 L828,552 L842,636 L746,642 Z";
  const MAJOR=[
    {n:"Savanorių pr.",p:[[378,384],[560,250],[770,0]],lp:.62},
    {n:"Laisvės al.",p:[[190,432],[400,420],[600,404]],lp:.45},
    {n:"Karaliaus Mindaugo pr.",p:[[0,496],[200,508],[380,528],[490,568],[580,600],[650,668],[700,760]],lp:.2},
    {n:"Vytauto pr.",p:[[868,0],[872,200],[886,420],[936,760]],lp:.7},
    {n:"Kęstučio g.",p:[[300,330],[700,300],[1000,262]],lp:.35}
  ];
  const MINOR=[];
  [460,520,560].forEach(y=>MINOR.push([[230,y-20+R()*8],[860,y-28+R()*8]]));
  [350,380].forEach(y=>MINOR.push([[260,y+40],[880,y]]));
  for(let x=260;x<=860;x+=58){const yb=Math.min(bankY(x)-26,610);MINOR.push([[x+R()*6,300+(x>600?-20:0)],[x+14+R()*6,yb]])}
  for(let i=0;i<9;i++){const x=470+i*52;MINOR.push([[x,0],[x-150,250+R()*20]])}
  for(let i=0;i<6;i++){const y=40+i*44;MINOR.push([[420+i*20,y+60],[860,y-10]])}
  for(let i=0;i<6;i++){const y=660+i*22;MINOR.push([[0,y],[360-i*30,y+18]])}
  [[60,640],[140,650],[220,660]].forEach(([x,y])=>MINOR.push([[x,y],[x+20,760]]));
  for(let i=0;i<4;i++)MINOR.push([[40+i*50,470-i*24],[150+i*40,560]]);
  MINOR.push([[786,420],[798,560]]); /* Trakų g. */
  const AREAS=[{t:"Senamiestis",x:96,y:470},{t:"Centras",x:520,y:470},{t:"Žaliakalnis",x:700,y:150},{t:"Aleksotas",x:120,y:716},{t:"Ąžuolynas",x:934,y:340},{t:"Ramybės parkas",x:790,y:604},{t:"Nemunas",x:240,y:586,water:1},{t:"Neris",x:200,y:250,water:1,rot:-38}];
  const route=p=>{const mx=(HX+p.x)/2,my=(HY+p.y)/2,dx=p.x-HX,dy=p.y-HY;return `M${HX},${HY} Q${mx-dy*.12},${my+dx*.12} ${p.x},${p.y}`};
  let s=`<defs><pattern id="lmPk" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${C.bg}"/><circle cx="3" cy="3" r=".8" fill="${C.water}"/></pattern>
    <clipPath id="lmWc"><path d="${NEMUNAS}"/><path d="${NERIS}"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    <path d="${AZ}" fill="url(#lmPk)"/><path d="${RAMYBE}" fill="url(#lmPk)"/><path d="${ISLAND}" fill="url(#lmPk)"/>
    <path d="${NEMUNAS}" fill="none" stroke="${C.water}" stroke-width="1.2"/><path d="${NERIS}" fill="none" stroke="${C.water}" stroke-width="1.2"/>
    <path d="${ISLAND}" fill="none" stroke="${C.water}" stroke-width="1.2"/>`;
  for(let y=530;y<760;y+=9) s+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.water}" stroke-width=".6" clip-path="url(#lmWc)"/>`;
  s+=`<ellipse cx="948" cy="256" rx="34" ry="22" fill="none" stroke="${C.minor}" stroke-width="2"/>`;
  MINOR.forEach(m=>s+=`<path d="${P(m)}" stroke="${C.minor}" stroke-width=".9" fill="none" stroke-linecap="round"/>`);
  MAJOR.forEach(m=>s+=`<path d="${P(m.p)}" stroke="${C.major}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  MAJOR.forEach(m=>{const k=Math.min(m.p.length-2,Math.floor(m.lp*(m.p.length-1))),a=m.p[k],b=m.p[k+1];let r=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(r>90||r<-90)r+=180;const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
    s+=`<text x="${x}" y="${y-9}" transform="rotate(${r} ${x} ${y})" text-anchor="middle" font-family="Red Hat Display,sans-serif" font-size="12.5" letter-spacing="1.6" fill="${C.label}">${m.n.toUpperCase()}</text>`});
  AREAS.forEach(a=>{const col=a.water?C.waterLabel:a.t==="Ąžuolynas"||a.t==="Ramybės parkas"?C.waterLabel:C.area;
    s+=`<text x="${a.x}" y="${a.y}" ${a.rot?`transform="rotate(${a.rot} ${a.x} ${a.y})"`:""} text-anchor="middle" font-family="${a.water?"Bodoni Moda,serif":"Red Hat Display,sans-serif"}" font-style="${a.water?"italic":"normal"}" font-size="${a.water?18:13}" letter-spacing="${a.water?0:2.2}" fill="${col}">${a.water?a.t:a.t.toUpperCase()}</text>`});
  places.forEach((p,i)=>s+=`<path class="lm-route" data-i="${i}" d="${route(p)}"/>`);
  places.forEach((p,i)=>s+=`<g class="lm-pin" data-i="${i}"><g class="s"><circle cx="${p.x}" cy="${p.y}" r="13" fill="${C.accent}"/><text x="${p.x}" y="${p.y+4.2}" text-anchor="middle" font-family="Red Hat Display,sans-serif" font-weight="700" font-size="12" fill="${C.bg}">${i+1}</text></g></g>`);
  s+=`<circle cx="${HX}" cy="${HY}" r="22" fill="none" stroke="${C.accent}" stroke-width="1"/><circle cx="${HX}" cy="${HY}" r="9" fill="${C.accent}"/>
    <text x="${HX+26}" y="${HY-2}" font-family="Bodoni Moda,serif" font-size="22" fill="${C.house}" paint-order="stroke" stroke="${C.bg}" stroke-width="5">Centro Vila</text>
    <text x="${HX+27}" y="${HY+16}" font-family="Red Hat Display,sans-serif" font-size="10.5" letter-spacing="2.2" fill="${C.accent}" paint-order="stroke" stroke="${C.bg}" stroke-width="4">TRAKŲ G. 16</text>`;
  svg.innerHTML=s;
}
