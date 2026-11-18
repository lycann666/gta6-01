// Neon Harbor — tuning, palette and story data for an original open-world
// crime game. Every name, place and character here is invented for this game;
// nothing is taken from any existing game, film or map.
export const VIEW = { width: 1280, height: 720 };
export const WORLD = { width: 3200, height: 2400 };
export const STEP = 1 / 60;
export const SAVE_KEY = 'neon-harbor.save.v1';
export const BEST_KEY = 'neon-harbor.best.v1';

export const PLAYER = {
  radius: 14, walkSpeed: 230, runSpeed: 330, health: 100,
  punchRange: 46, punchDamage: 34, punchCooldown: 0.35,
  shootCooldown: 0.28, startAmmo: 24,
};
export const CAR = {
  length: 54, width: 28, accel: 420, reverseAccel: 260,
  maxSpeed: 560, maxReverse: 180, turnRate: 2.6, drag: 0.6,
};
export const POLICE = { speed: 500, catchRange: 46, spawnDistance: 420, maxCars: 4 };
export const WANTED = { decayAfter: 18, max: 5 };

export const PALETTE = {
  backdrop: '#0b0e1a', grass: '#14301f', park: '#1d4a2c', water: '#0e3a5c',
  road: '#23262e', roadLine: '#c9a227', sidewalk: '#3a3d47', curb: '#4a4d58',
  building: ['#5b4a68', '#6b4a3a', '#3a5a6b', '#6b5a2e', '#4a3a5a', '#2e4a3a'],
  roof: ['#7a6a8a', '#8a6a4a', '#4a7a8a', '#8a7a3a'],
  player: '#ffd23f', ped: ['#e8e8e8', '#7ec8e3', '#f4a261', '#90be6d', '#f28482'],
  car: ['#e63946', '#2a9d8f', '#f4d35e', '#4361ee', '#f3722c', '#9d4edd', '#e0e0e0', '#222831'],
  police: '#1d3557', policeLight: '#ff2e4d', taxi: '#ffd60a',
  hud: '#f1faee', hudPanel: 'rgba(8,10,20,0.72)', star: '#ffd60a', starEmpty: '#5a5a6a',
  marker: '#ffea00', mission: '#06d6a0', danger: '#ef476f', text: '#f1faee', muted: '#a8b0c0',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// The story: Rian "Rex" Marlowe, a courier in the invented port city of
// Teluk Neon, takes jobs from fixer Mira Solano to pay off a debt to the
// Harbor Kings crew. Five jobs, in order.
export const MISSIONS = [
  { id: 1, title: 'Kenalan di Dermaga', giver: 'Mira Solano',
    brief: 'Temui Mira di dermaga selatan. Jalan kaki atau curi mobil — terserah kamu.',
    objective: 'Pergi ke penanda hijau di dermaga', reward: 150, target: { x: 1600, y: 2220 }, kind: 'goto' },
  { id: 2, title: 'Mobil Pesanan', giver: 'Mira Solano',
    brief: 'Curi sedan biru di parkiran utara dan antar ke garasi Om Bowo.',
    objective: 'Curi mobil lalu antar ke garasi (penanda hijau)', reward: 400, target: { x: 480, y: 480 }, kind: 'steal-deliver', carColor: '#4361ee' },
  { id: 3, title: 'Tiga Paket', giver: 'Om Bowo',
    brief: 'Ambil 3 paket di sudut kota. Polisi sedang patroli — jangan ribut.',
    objective: 'Ambil 3 paket (0/3)', reward: 650, kind: 'collect', count: 3 },
  { id: 4, title: 'Lolos dari Razia', giver: 'Mira Solano',
    brief: 'Razia besar-besaran! Capai tempat persembunyian di timur tanpa tertangkap.',
    objective: 'Capai hideout timur selagi bintang 3 menyala', reward: 900, target: { x: 2960, y: 1200 }, kind: 'escape', wanted: 3 },
  { id: 5, title: 'Pelarian Terakhir', giver: 'Rex Marlowe',
    brief: 'Bawa mobil tercepatmu ke kapal di pelabuhan. Ini jalan keluar dari Teluk Neon.',
    objective: 'Antar mobil ke kapal pelabuhan barat', reward: 2000, target: { x: 240, y: 2220 }, kind: 'goto', needCar: true },
];
export const DISTRICTS = [
  { name: 'Dermaga Selatan', x: 0, y: 2000, w: 3200, h: 400 },
  { name: 'Kota Tua', x: 0, y: 0, w: 1600, h: 800 },
  { name: 'Distrik Neon', x: 1600, y: 0, w: 1600, h: 1200 },
  { name: 'Kawasan Industri', x: 0, y: 1200, w: 1600, h: 800 },
  { name: 'Bukit Timur', x: 1600, y: 1200, w: 1600, h: 800 },
];
export const LANDMARKS = [
  { name: 'Menara Pelita', x: 1600, y: 1200 },
  { name: 'Pasar Ikan', x: 800, y: 2100 },
  { name: 'Garasi Om Bowo', x: 480, y: 480 },
  { name: 'Klub Lampu', x: 2200, y: 600 },
  { name: 'Stasiun Timur', x: 2960, y: 1200 },
];
