// rarity: index into RARITIES. price in Шуни-баксы.
export const RARITIES = [
  { name: 'Ширпотреб', color: '#9aa7b8' },
  { name: 'Промышленное', color: '#6aa9e9' },
  { name: 'Запрещённое', color: '#9b7bf0' },
  { name: 'Засекреченное', color: '#f062b8' },
  { name: 'Тайное', color: '#ef4f5f' },
  { name: 'Шунин клад', color: '#e8b33a' },
];

export const ITEMS = {
  strawberry: { name: 'Клубничка', img: 'items/strawberry.png', rarity: 0, price: 40 },
  bow:        { name: 'Бантик Шуни', img: 'items/bow.png', rarity: 0, price: 60 },
  heart:      { name: 'Сердечко-медальон', img: 'items/heart.png', rarity: 1, price: 120 },
  headband:   { name: 'Кружевной ободок', img: 'items/headband.png', rarity: 1, price: 160 },
  choker:     { name: 'Чокер с клубничкой', img: 'items/choker.png', rarity: 2, price: 320 },
  squid:      { name: 'Щупалько', img: 'items/squid.png', rarity: 2, price: 380 },
  tablet:     { name: 'Графический планшет (1%)', img: 'items/tablet.png', rarity: 3, price: 900 },
  horse:      { name: 'Сидячая лошадь', img: 'items/horse.png', rarity: 3, price: 1200 },
  cat:        { name: 'Котик-маскот', img: 'items/cat.png', rarity: 4, price: 2600 },
  knifePearl: { name: '★ Бабочка | Чёрный жемчуг', img: 'items/knife-pearl.avif', rarity: 4, price: 4200 },
  awp:        { name: 'AWP | Шунин Лор', img: 'items/awp.avif', rarity: 5, price: 8000 },
  knifeRuby:  { name: '★ Бабочка | Клубничный рубин', img: 'items/knife-ruby.avif', rarity: 5, price: 9000 },
  crown:      { name: 'Корона Шуни', img: 'items/crown.png', rarity: 5, price: 15000 },
};

// weights per rarity tier, shared by all cases: rarer = way less likely
const W = [55, 25, 12, 5.5, 2, 0.5];

export const CASES = [
  { id: 'berry', name: 'Клубничный', price: 100, cover: 'strawberry', items: ['strawberry', 'bow', 'heart', 'headband', 'choker', 'tablet', 'cat'] },
  { id: 'cat', name: 'Котиковый', price: 250, cover: 'cat', items: ['bow', 'heart', 'headband', 'squid', 'horse', 'cat', 'crown'] },
  { id: 'horse', name: 'Лошадиный', price: 400, cover: 'horse', items: ['strawberry', 'choker', 'squid', 'tablet', 'horse', 'knifePearl', 'awp'] },
  { id: 'lace', name: 'Чёрно-розовый', price: 600, cover: 'choker', items: ['headband', 'choker', 'squid', 'tablet', 'cat', 'knifePearl', 'knifeRuby'] },
  { id: 'cs', name: 'Легендарный CS', price: 1500, cover: 'knifeRuby', items: ['horse', 'tablet', 'cat', 'knifePearl', 'awp', 'knifeRuby'] },
  { id: 'crown', name: 'Шунин клад', price: 3000, cover: 'crown', items: ['tablet', 'horse', 'cat', 'knifePearl', 'awp', 'knifeRuby', 'crown'] },
];

export function rollItem(c) {
  const total = c.items.reduce((s, id) => s + W[ITEMS[id].rarity], 0);
  let r = Math.random() * total;
  for (const id of c.items) if ((r -= W[ITEMS[id].rarity]) < 0) return id;
  return c.items[0];
}

export const randomItemId = () => {
  const ids = Object.keys(ITEMS);
  // bias toward common so the live feed looks believable
  return rollItem({ items: ids });
};

// nicks seen on stream; used when chat is silent / offline
export const FALLBACK_NICKS = [
  'DEEADEM', 'rs_lavcraft', 'MrTeplov', 'Teplov_Team', 'KONOPLYAOWO', 'elena_pipiskin',
  'norit_xexe', 'TIMYRLOKO', 'klubni4ka_fan', 'shunya_enjoyer', 'horse_sitter', 'kot_s_klubnikoi',
];
