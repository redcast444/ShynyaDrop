import { ITEMS, RARITIES, CASES, rollItem, randomItemId, FALLBACK_NICKS } from './data.js';
import { connectChat } from './chat.js';
import * as fx from './fx.js';

// ---------- state ----------
const KEY = 'shunyadrop_v1';
const state = Object.assign({ balance: 1000, inv: [], lastBeg: 0 }, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => { localStorage.setItem(KEY, JSON.stringify(state)); renderWallet(); };
const uid = () => Math.random().toString(36).slice(2, 9);
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const fmt = (n) => n.toLocaleString('ru-RU') + ' ШБ';

const card = (id, extra = '') => {
  const it = ITEMS[id], r = RARITIES[it.rarity];
  return `<div class="item ${extra}" style="--r:${r.color}">
    <img src="${it.img}" alt="" loading="lazy" />
    <span class="item-name">${it.name}</span>
    <span class="item-price">${fmt(it.price)}</span>
  </div>`;
};

// ---------- wallet / header ----------
const BEG_CD = 60_000;
function renderWallet() {
  $('#balance').textContent = fmt(state.balance);
  $('#invCount').textContent = state.inv.length ? ` (${state.inv.length})` : '';
  const left = BEG_CD - (Date.now() - state.lastBeg);
  const b = $('#beg');
  b.disabled = left > 0;
  b.textContent = left > 0 ? `Шуня думает… ${Math.ceil(left / 1000)}с` : 'Выпросить у Шуни +500';
}
setInterval(renderWallet, 1000);
$('#beg').onclick = () => {
  state.balance += 500; state.lastBeg = Date.now(); fx.win(); save();
};
const renderMute = () => ($('#mute').textContent = fx.sound.muted ? '🔇' : '🔊');
$('#mute').onclick = () => {
  fx.sound.muted = !fx.sound.muted;
  localStorage.setItem('sd_muted', fx.sound.muted ? '1' : '0'); renderMute();
};
renderMute();

// ---------- views ----------
function viewCases() {
  app.innerHTML = `<h1>Кейсы Шуни</h1>
  <div class="grid cases">${CASES.map((c) => `
    <a class="case panel" href="#case/${c.id}" style="--r:${RARITIES[ITEMS[c.cover].rarity].color}">
      <img src="${ITEMS[c.cover].img}" alt="" />
      <span class="case-name">${c.name}</span>
      <span class="case-price">${fmt(c.price)}</span>
    </a>`).join('')}</div>`;
}

function viewCase(id) {
  const c = CASES.find((x) => x.id === id);
  if (!c) return (location.hash = '#cases');
  app.innerHTML = `<a class="back" href="#cases">← все кейсы</a>
  <h1>Кейс «${c.name}»</h1>
  <div class="panel roulette"><div class="pointer"></div><div class="strip" id="strip"></div></div>
  <div class="center"><button class="btn btn-big" id="open">Открыть за ${fmt(c.price)}</button></div>
  <h2>Что внутри</h2>
  <div class="grid items">${[...c.items].sort((a, b) => ITEMS[b].rarity - ITEMS[a].rarity).map((i) => card(i)).join('')}</div>`;

  const strip = $('#strip');
  const fill = (win) => {
    const ids = Array.from({ length: 50 }, (_, i) => (i === 42 && win ? win : rollItem(c)));
    strip.innerHTML = ids.map((i) => card(i)).join('');
  };
  fill();

  $('#open').onclick = async (e) => {
    const btn = e.currentTarget;
    if (state.balance < c.price) return toast('Не хватает Шуни-баксов. Выпроси у Шуни!');
    state.balance -= c.price; save();
    btn.disabled = true; btn.classList.add('loading');
    const win = rollItem(c);
    fill(win);
    strip.style.transition = 'none'; strip.style.transform = 'translateX(0)';
    strip.offsetWidth; // reflow so the reset sticks
    const cardW = strip.children[0].getBoundingClientRect().width + 8;
    const target = 42 * cardW + cardW / 2 - strip.parentElement.clientWidth / 2 + (Math.random() - 0.5) * cardW * 0.4;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.style.transition = `transform ${reduced ? 0.01 : 6}s cubic-bezier(.12,.75,.18,1)`;
    strip.style.transform = `translateX(${-target}px)`;
    // tick on each passing card
    let last = 0;
    const tickLoop = () => {
      const x = -new DOMMatrix(getComputedStyle(strip).transform).m41;
      const n = Math.floor(x / cardW);
      if (n !== last) { last = n; fx.tick(); }
      if (btn.disabled) requestAnimationFrame(tickLoop);
    };
    requestAnimationFrame(tickLoop);
    await new Promise((r) => strip.addEventListener('transitionend', r, { once: true }));
    btn.disabled = false; btn.classList.remove('loading');
    const it = { uid: uid(), id: win };
    state.inv.unshift(it); save();
    pushFeed('Ты', win, true);
    showWin(it);
  };
}

function showWin(it) {
  const item = ITEMS[it.id];
  if (item.rarity >= 3) fx.strawberryRain(item.rarity * 15);
  fx.win();
  const m = $('#modal');
  m.innerHTML = `<h2>Тебе выпало!</h2>${card(it.id, 'big')}
    <p class="rarity" style="color:${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</p>
    <div class="row"><button class="btn" data-a="keep">Забрать</button>
    <button class="btn btn-ghost" data-a="sell">Продать за ${fmt(item.price)}</button></div>`;
  m.onclick = (e) => {
    const a = e.target.dataset.a;
    if (a === 'sell') sell(it.uid);
    if (a || e.target === m) m.close();
  };
  m.showModal();
}

function sell(u) {
  const i = state.inv.findIndex((x) => x.uid === u);
  if (i < 0) return;
  state.balance += ITEMS[state.inv[i].id].price;
  state.inv.splice(i, 1); fx.click(); save();
}

function viewInventory() {
  const total = state.inv.reduce((s, x) => s + ITEMS[x.id].price, 0);
  app.innerHTML = `<h1>Инвентарь</h1>
  ${state.inv.length ? `<div class="row between"><p>Всего: <b class="num">${fmt(total)}</b></p>
    <button class="btn btn-ghost" id="sellAll">Продать всё</button></div>
    <div class="grid items">${state.inv.map((x) => `<div class="inv-cell">${card(x.id)}
      <div class="row"><button class="btn btn-small" data-sell="${x.uid}">Продать</button>
      <a class="btn btn-small btn-ghost" href="#upgrade/${x.uid}">Апгрейд</a></div></div>`).join('')}</div>`
    : `<div class="panel empty"><img src="items/cat.png" alt="" /><p>Пусто. Котик грустит.</p><a class="btn" href="#cases">Открыть кейс</a></div>`}`;
  app.onclick = (e) => {
    const u = e.target.dataset.sell;
    if (u) { sell(u); viewInventory(); }
    if (e.target.id === 'sellAll') {
      state.balance += total; state.inv = []; fx.win(); save(); viewInventory();
    }
  };
}

function viewUpgrade(selUid) {
  let mine = state.inv.find((x) => x.uid === selUid) || null;
  let target = null;
  const R = 90, C = 2 * Math.PI * R;
  app.onclick = null;

  const chance = () => (mine && target ? Math.min(0.9, (ITEMS[mine.id].price / ITEMS[target].price) * 0.95) : 0);

  const draw = () => {
    const ch = chance();
    const targets = Object.keys(ITEMS).filter((id) => !mine || ITEMS[id].price > ITEMS[mine.id].price).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    app.innerHTML = `<h1>Апгрейдер</h1>
    <div class="upgrader">
      <div class="panel slot">${mine ? card(mine.id) : '<p class="hint">Выбери свой предмет снизу</p>'}</div>
      <div class="wheel">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="${R}" class="track" />
          <circle cx="100" cy="100" r="${R}" class="arc" stroke-dasharray="${ch * C} ${C}" transform="rotate(-90 100 100)" />
        </svg>
        <div class="needle" id="needle"></div>
        <div class="chance"><b class="num">${(ch * 100).toFixed(2)}%</b><span>шанс</span></div>
      </div>
      <div class="panel slot">${target ? card(target) : '<p class="hint">Выбери цель справа снизу</p>'}</div>
    </div>
    <div class="center"><button class="btn btn-big" id="go" ${ch ? '' : 'disabled'}>Апгрейд!</button></div>
    <div class="cols">
      <section><h2>Твои предметы</h2><div class="grid items small">${state.inv.map((x) => `<button class="pick ${mine?.uid === x.uid ? 'on' : ''}" data-mine="${x.uid}">${card(x.id)}</button>`).join('') || '<p class="hint">Инвентарь пуст — <a href="#cases">открой кейс</a></p>'}</div></section>
      <section><h2>Цель</h2><div class="grid items small">${targets.map((id) => `<button class="pick ${target === id ? 'on' : ''}" data-target="${id}">${card(id)}</button>`).join('')}</div></section>
    </div>`;
  };
  draw();

  app.onclick = async (e) => {
    const p = e.target.closest('[data-mine],[data-target],#go');
    if (!p) return;
    if (p.dataset.mine) { mine = state.inv.find((x) => x.uid === p.dataset.mine); if (target && ITEMS[target].price <= ITEMS[mine.id].price) target = null; fx.click(); return draw(); }
    if (p.dataset.target) { target = p.dataset.target; fx.click(); return draw(); }
    if (p.id !== 'go' || p.disabled) return;
    const ch = chance(), r = Math.random(), won = r < ch;
    p.disabled = true; p.classList.add('loading');
    const needle = $('#needle');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    needle.style.transition = `transform ${reduced ? 0.01 : 4}s cubic-bezier(.15,.8,.2,1)`;
    needle.style.transform = `rotate(${360 * 5 + r * 360}deg)`;
    await new Promise((res) => needle.addEventListener('transitionend', res, { once: true }));
    state.inv = state.inv.filter((x) => x.uid !== mine.uid);
    if (won) {
      const it = { uid: uid(), id: target };
      state.inv.unshift(it); save(); pushFeed('Ты', target, true); fx.strawberryRain(50); fx.win();
      toast(`Апгрейд удался! ${ITEMS[target].name} 🍓`);
      mine = it; target = null;
    } else {
      save(); fx.lose(); toast('Лошадь села на твой предмет. Он пропал 🐴'); mine = null;
    }
    setTimeout(draw, 900);
  };
}

// ---------- toast ----------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast panel'; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3000);
}

// ---------- live feed ----------
const feed = $('#feed');
function pushFeed(nick, id = randomItemId(), me = false) {
  const it = ITEMS[id];
  const li = document.createElement('li');
  li.className = 'drop' + (me ? ' me' : '');
  li.style.setProperty('--r', RARITIES[it.rarity].color);
  li.innerHTML = `<img src="${it.img}" alt="" /><div><b></b><span>${it.name}</span></div>`;
  li.querySelector('b').textContent = nick; // nicks come from chat — never innerHTML them
  feed.prepend(li);
  while (feed.children.length > 14) feed.lastChild.remove();
}

let lastChat = 0;
const seen = new Map(); // throttle each chatter to one drop / 20s
connectChat('suniko__', (nick) => {
  const now = Date.now();
  lastChat = now;
  $('#liveDot').classList.add('on');
  if (now - (seen.get(nick) || 0) < 20_000) return;
  seen.set(nick, now);
  pushFeed(nick);
});
(function fallback() {
  if (Date.now() - lastChat > 30_000) {
    $('#liveDot').classList.remove('on');
    pushFeed(FALLBACK_NICKS[Math.floor(Math.random() * FALLBACK_NICKS.length)]);
  }
  setTimeout(fallback, 2500 + Math.random() * 3500);
})();
for (let i = 0; i < 6; i++) pushFeed(FALLBACK_NICKS[i]);

// ---------- router ----------
function route() {
  const [view, arg] = location.hash.slice(1).split('/');
  app.onclick = null;
  document.querySelectorAll('nav a').forEach((a) => a.classList.toggle('active', a.hash === '#' + (view === 'case' ? 'cases' : view || 'cases')));
  if (view === 'case') viewCase(arg);
  else if (view === 'upgrade') viewUpgrade(arg);
  else if (view === 'inventory') viewInventory();
  else viewCases();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
route();
renderWallet();
