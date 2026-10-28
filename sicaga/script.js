const KEY="sciaga-v1",TKEY="sciaga-theme";
const PAL=["#ff6b6b","#ffa62b","#2ec4b6","#4d96ff","#9b5de5","#f15bb5"];
let cards=[];const open=new Set();
const $=s=>document.querySelector(s), list=$("#list"), status=$("#status");
const uid=()=>Math.random().toString(36).slice(2,9);
const ci=c=>Number.isInteger(c.color)?c.color:[...c.id].reduce((h,ch)=>h+ch.charCodeAt(0),0)%PAL.length;
const words=t=>t.trim()?t.trim().split(/\s+/).length:0;
const wl=n=>n===1?"słowo":(n%10>=2&&n%10<=4&&(n%100<12||n%100>14))?"słowa":"słów";
const firstLine=t=>(t.split("\n").find(l=>l.trim())||"").trim();
const order=()=>cards.sort((a,b)=>(!!b.pin)-(!!a.pin));
let activeTag="";
const parseTags=v=>[...new Set(String(v).split(",").map(x=>x.trim().replace(/^#/,"").toLowerCase()).filter(Boolean))].slice(0,8);
function renderTags(){
  const bar=$("#tagbar"),m=new Map();
  cards.forEach(c=>(c.tags||[]).forEach(g=>m.set(g,(m.get(g)||0)+1)));
  const tg=[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"pl"));
  if(activeTag&&!m.has(activeTag))activeTag="";
  bar.innerHTML="";bar.hidden=!tg.length;
  if(!tg.length)return;
  const mk=(label,val)=>{const b=document.createElement("button");b.className="tagpill";b.textContent=label;b.setAttribute("aria-pressed",String(activeTag===val));b.onclick=()=>setTag(val);bar.append(b)};
  mk("Wszystkie","");tg.forEach(([g,n])=>mk("#"+g+" · "+n,g));
}
function setTag(g){activeTag=g;renderTags();filter()}

function load(){
  try{const r=localStorage.getItem(KEY);if(r){cards=JSON.parse(r);order();return}}catch(e){}
  cards=[
    {id:uid(),title:"Jak tego używać",tags:["start"],text:"Kliknij w tytuł lub tekst i pisz — wszystko zapisuje się samo.\nUżyj '+ Nowa sekcja', żeby dodać kolejną kartę.\nGwiazdka ★ przypina sekcję na górze, „Kolor” zmienia barwę karty.\nTagi (pole na dole karty) filtrują sekcje. Skróty: N — nowa sekcja, / lub Ctrl+K — szukaj. Usunięcie można cofnąć. Szukajka u góry filtruje karty na bieżąco (Esc ją czyści)."},
    {id:uid(),title:"Przykład: wzory",tags:["matma"],text:"Pole koła = π·r²\nObwód koła = 2·π·r\nDelta = b² − 4ac"}
  ];
}
let t;
function flash(m){status.textContent=m;clearTimeout(t);t=setTimeout(()=>status.textContent="",2200)}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(cards));flash("Zapisano ✓ "+new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}));return true}
  catch(e){flash("Nie można zapisać w tej przeglądarce — użyj Eksport");return false}
}
let tt;
function toast(msg,act,fn){
  const el=$("#toast");el.innerHTML="";
  const s=document.createElement("span");s.textContent=msg;el.append(s);
  if(act){const b=document.createElement("button");b.textContent=act;b.onclick=()=>{fn();el.classList.remove("show")};el.append(b)}
  el.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>el.classList.remove("show"),act?6000:2200);
}
function download(url,name){const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove()}
function exportJSON(){
  const u=URL.createObjectURL(new Blob([JSON.stringify(cards,null,2)],{type:"application/json"}));
  download(u,"sciaga.json");setTimeout(()=>URL.revokeObjectURL(u),2000);
}
function grow(el){el.style.height="auto";el.style.height=el.scrollHeight+"px"}

function render(){
  list.innerHTML="";
  cards.forEach((c,i)=>{
    const d=document.createElement("section");d.className="card";d.dataset.id=c.id;
    d.style.setProperty("--ac",PAL[ci(c)]);d.style.setProperty("--i",i);
    d.innerHTML=`<div class="head"><button class="tog" aria-label="Zwiń lub rozwiń sekcję" aria-expanded="false"></button><input class="title" placeholder="Tytuł sekcji" aria-label="Tytuł"><button class="pin" aria-label="Przypnij na górze" title="Przypnij na górze">★</button></div><div class="prev"></div><div class="tagrow" hidden></div><div class="fold"><div class="fold-in"><textarea class="body" placeholder="Wpisz tu swoją ściągę…" aria-label="Treść"></textarea><input class="tagin" placeholder="Tagi (po przecinku), np. matma, wzory" aria-label="Tagi"><div class="row"><span class="meta"></span><button class="copy">Kopiuj</button><button class="dup">Powiel</button><button class="clr" title="Zmień kolor karty">Kolor</button><button class="del">Usuń</button></div></div></div>`;
    const ti=d.querySelector(".title"),bo=d.querySelector(".body"),pv=d.querySelector(".prev"),mt=d.querySelector(".meta"),pn=d.querySelector(".pin");
    ti.value=c.title;bo.value=c.text;
    const upd=()=>{const n=words(c.text);mt.textContent=n+" "+wl(n);pv.textContent=firstLine(c.text)||"(pusto)"};upd();
    const tr=d.querySelector(".tagrow"),tin=d.querySelector(".tagin");
    const drawTags=()=>{tr.innerHTML="";(c.tags||[]).forEach(g=>{const b=document.createElement("button");b.className="tagchip";b.textContent="#"+g;b.title="Pokaż tylko #"+g;b.onclick=()=>setTag(activeTag===g?"":g);tr.append(b)});tr.hidden=!(c.tags&&c.tags.length)};
    tin.value=(c.tags||[]).join(", ");drawTags();
    tin.onchange=()=>{c.tags=parseTags(tin.value);tin.value=c.tags.join(", ");save();drawTags();renderTags();filter()};
    d.classList.toggle("pinned",!!c.pin);pn.setAttribute("aria-pressed",String(!!c.pin));
    const tog=d.querySelector(".tog");
    tog.onclick=()=>{open.has(c.id)?open.delete(c.id):open.add(c.id);sync(d,$("#q").value.trim())};
    ti.onclick=()=>{if(d.classList.contains("collapsed"))tog.click()};
    pv.onclick=()=>tog.click();
    ti.oninput=()=>{c.title=ti.value;save();filter()};
    bo.oninput=()=>{c.text=bo.value;grow(bo);upd();save();filter()};
    pn.onclick=()=>{c.pin=!c.pin;order();save();render();toast(c.pin?"Przypięto na górze":"Odpięto sekcję")};
    d.querySelector(".clr").onclick=()=>{c.color=(ci(c)+1)%PAL.length;d.style.setProperty("--ac",PAL[c.color]);save()};
    d.querySelector(".dup").onclick=()=>{
      const n={id:uid(),title:c.title?c.title+" (kopia)":"",text:c.text,color:c.color,tags:[...(c.tags||[])]};
      cards.splice(cards.indexOf(c)+1,0,n);open.add(n.id);save();render();toast("Powielono sekcję");
    };
    d.querySelector(".copy").onclick=async()=>{
      try{await navigator.clipboard.writeText(c.title+"\n\n"+c.text);toast("Skopiowano do schowka")}
      catch(x){bo.select();toast("Zaznaczono tekst — skopiuj Ctrl+C")}
    };
    d.querySelector(".del").onclick=()=>{
      const idx=cards.indexOf(c);cards.splice(idx,1);save();render();
      toast("Usunięto „"+(c.title||"bez tytułu")+"”","Cofnij",()=>{cards.splice(Math.min(idx,cards.length),0,c);save();render()});
    };
    list.append(d);
  });
  document.querySelectorAll(".body").forEach(grow);
  renderTags();filter();
}
function sync(el,q){
  const col=!q&&!open.has(el.dataset.id);
  el.classList.toggle("collapsed",col);
  el.querySelector(".tog").setAttribute("aria-expanded",String(!col));
  if(!col)grow(el.querySelector(".body"));
}
function filter(){
  const q=$("#q").value.trim().toLowerCase();let n=0;
  document.querySelectorAll(".card").forEach(el=>{
    const c=cards.find(x=>x.id===el.dataset.id);
    const tg=c.tags||[];
    const ok=(!q||(c.title+" "+c.text+" "+tg.join(" ")).toLowerCase().includes(q))&&(!activeTag||tg.includes(activeTag));
    el.classList.toggle("hide",!ok);sync(el,q);if(ok)n++;
  });
  let e=$(".empty");if(e)e.remove();
  if(!n){const p=document.createElement("p");p.className="empty";p.innerHTML='<span class="big">'+(cards.length?"🔍":"✨")+"</span>"+(cards.length?"Nic nie znaleziono.":"Pusto. Dodaj pierwszą sekcję.");list.append(p)}
}
function setTheme(m){
  const r=document.documentElement;
  m==="auto"?r.removeAttribute("data-theme"):r.dataset.theme=m;
  try{localStorage.setItem(TKEY,m)}catch(e){}
}
let th="auto";
setTheme(th);

$("#add").onclick=()=>{
  $("#q").value="";
  const nc={id:uid(),title:"",text:""};cards.unshift(nc);order();open.add(nc.id);save();render();
  const ti=list.querySelector('[data-id="'+nc.id+'"] .title');ti.focus();ti.scrollIntoView({block:"center",behavior:"smooth"});
};
$("#q").oninput=filter;
$("#exp").onclick=exportJSON;
$("#imp").onclick=()=>$("#file").click();
$("#file").onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const d=JSON.parse(await f.text());
    if(!Array.isArray(d))throw 0;
    cards=d.map(x=>({id:uid(),title:String(x.title||""),text:String(x.text||""),pin:!!x.pin,tags:Array.isArray(x.tags)?parseTags(x.tags.join(",")):[],color:Number.isInteger(x.color)&&x.color>=0&&x.color<PAL.length?x.color:undefined}));
    order();save();render();toast("Zaimportowano "+cards.length+" sekcji");
  }catch(x){alert("To nie wygląda na plik ze ściągą (.json).")}
  e.target.value="";
};
addEventListener("keydown",e=>{
  const tag=document.activeElement.tagName;
  if(e.key==="/"&&!/INPUT|TEXTAREA/.test(tag)){e.preventDefault();$("#q").focus()}
  if(e.key==="n"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(tag)){e.preventDefault();$("#add").click()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#q").focus();$("#q").select()}
  if(e.key==="Escape"&&document.activeElement===$("#q")){$("#q").value="";filter();$("#q").blur()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();save()}
});
addEventListener("resize",()=>document.querySelectorAll(".body").forEach(grow));
const T0=document.title,iconEl=document.querySelector('link[rel="icon"]'),icon0=iconEl.href;
const FAKE_ICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🖼️%3C/text%3E%3C/svg%3E";
let cloakY=0;
function cloak(){
  const r=document.documentElement;
  if(!r.classList.contains("cloak")){
    cloakY=scrollY;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
    r.classList.add("cloak");document.title="Nowa karta";iconEl.href=FAKE_ICON;scrollTo(0,0);
  }else{
    r.classList.remove("cloak");document.title=T0;iconEl.href=icon0;scrollTo(0,cloakY);
  }
}
addEventListener("keydown",e=>{
  if(e.altKey&&e.code==="KeyG"){e.preventDefault();e.stopImmediatePropagation();save();location.href="https://www.google.com/";return}
  if(e.altKey&&e.code==="KeyX"){e.preventDefault();e.stopImmediatePropagation();cloak();return}
  if(document.documentElement.classList.contains("cloak"))e.stopImmediatePropagation();
},true);
$("#panic").onclick=cloak;
/* --- auto zapis i auto przejście na inną stronę --- */
const AUTO_REDIRECT_URL="https://www.google.com/"; // ← zmień adres tutaj; ustaw "" aby wyłączyć
let pickingFile=false;
$("#imp").addEventListener("click",()=>{pickingFile=true;setTimeout(()=>pickingFile=false,120000)});
$("#file").addEventListener("change",()=>{pickingFile=false});
setInterval(()=>save(),30000);
addEventListener("pagehide",()=>{try{localStorage.setItem(KEY,JSON.stringify(cards))}catch(e){}});
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="hidden")return;
  try{localStorage.setItem(KEY,JSON.stringify(cards))}catch(e){}
  if(AUTO_REDIRECT_URL&&!pickingFile)location.replace(AUTO_REDIRECT_URL);
});
load();render();