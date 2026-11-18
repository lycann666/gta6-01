// Drawing only: the city, cars, people, HUD with minimap, and the screens.
// The camera follows the player; the world is drawn in world coordinates.
import { VIEW, PALETTE, FONT, MISSIONS, DISTRICTS, LANDMARKS, WORLD, WANTED } from './config.js';
import { ROADS_X, ROADS_Y, ROAD_W } from './city.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const MM = 168; // minimap size

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    view.x = (canvas.width - VIEW.width * view.scale) / 2;
    view.y = (canvas.height - VIEW.height * view.scale) / 2;
  }
  function text(v, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    ctx.font = fonts.get(size); ctx.fillStyle = color; ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'alphabetic'; ctx.fillText(String(v), x, y);
  }
  function cam(world) {
    const p = world.player;
    return { x: Math.max(0, Math.min(WORLD.width - VIEW.width, p.x - VIEW.width / 2)),
             y: Math.max(0, Math.min(WORLD.height - VIEW.height, p.y - VIEW.height / 2)) };
  }
  function drawCar(c, ghost) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle);
    ctx.globalAlpha = ghost ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-28, -15, 56, 30);
    ctx.fillStyle = c.color; ctx.fillRect(-27, -14, 54, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-6, -12, 16, 24); // cabin
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(14, -11, 8, 22); // windshield
    ctx.fillStyle = '#ffe66d';
    ctx.fillRect(26, -12, 2, 6); ctx.fillRect(26, 6, 2, 6); // headlights
    if (c.police) {
      ctx.fillStyle = '#fff'; ctx.fillRect(-27, -14, 54, 6);
      ctx.fillStyle = PALETTE.policeLight; ctx.fillRect(-10, -17, 8, 5);
      ctx.fillStyle = '#2f7bff'; ctx.fillRect(2, -17, 8, 5);
      text('POLISI', 0, 4, 9, '#fff', 'center', 'middle');
    }
    if (c.missionCar) { ctx.fillStyle = PALETTE.marker; ctx.fillRect(-27, 12, 54, 3); }
    ctx.restore();
  }
  function drawWorld(world, screen) {
    const state = world.state; const c = cam(world);
    ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.save();
    ctx.translate(-c.x, -c.y);
    // Harbor water strip (south edge, below the pier walkway)
    ctx.fillStyle = PALETTE.water; ctx.fillRect(0, 2260, WORLD.width, 140);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 2252, WORLD.width, 8); // pier line
    // Parks
    for (const p of world.city.parks) { ctx.fillStyle = PALETTE.park; ctx.fillRect(p.x, p.y, p.w, p.h); }
    // Roads
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, 2060);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_W / 2, WORLD.width, ROAD_W);
    ctx.fillRect(0, 2000, WORLD.width, 60); // harbor road
    // Centre dashes
    ctx.fillStyle = PALETTE.roadLine;
    for (const rx of ROADS_X) for (let y = 20; y < 2040; y += 56) ctx.fillRect(rx - 2, y, 4, 26);
    for (const ry of ROADS_Y) for (let x = 20; x < WORLD.width; x += 56) ctx.fillRect(x, ry - 2, 26, 4);
    // Sidewalks
    ctx.strokeStyle = PALETTE.sidewalk; ctx.lineWidth = 6;
    for (const rx of ROADS_X) { ctx.beginPath(); ctx.moveTo(rx - ROAD_W / 2 - 4, 0); ctx.lineTo(rx - ROAD_W / 2 - 4, 2060); ctx.moveTo(rx + ROAD_W / 2 + 4, 0); ctx.lineTo(rx + ROAD_W / 2 + 4, 2060); ctx.stroke(); }
    // Buildings
    for (const b of world.city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
      ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = b.roof; ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);
      ctx.fillStyle = 'rgba(255,235,150,0.85)';
      for (let wy = b.y + 26; wy < b.y + b.h - 14; wy += 34)
        for (let wx = b.x + 18; wx < b.x + b.w - 14; wx += 36) ctx.fillRect(wx, wy, 12, 14);
    }
    // Trees
    for (const t of world.city.trees) { ctx.fillStyle = '#2d6a2e'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#57a773'; ctx.beginPath(); ctx.arc(t.x - 2, t.y - 2, t.r * 0.6, 0, Math.PI * 2); ctx.fill(); }
    // District + landmark labels (only near the camera, to keep it readable)
    ctx.textAlign = 'center';
    for (const d of DISTRICTS) text(d.name, d.x + d.w / 2, d.y + d.h / 2, 34, 'rgba(255,255,255,0.16)', 'center', 'middle');
    for (const lm of LANDMARKS) { ctx.fillStyle = 'rgba(8,10,20,0.6)'; const w = ctx.measureText(lm.name).width + 16; ctx.fillRect(lm.x - w / 2, lm.y - 34, w, 22); text(lm.name, lm.x, lm.y - 18, 13, '#ffe66d', 'center'); }
    // Pickups
    for (const pk of world.pickups) {
      if (pk.taken) continue;
      const pulse = 1 + Math.sin(state.elapsed * 5) * 0.15;
      ctx.save(); ctx.translate(pk.x, pk.y); ctx.scale(pulse, pulse);
      if (pk.kind === 'package') { ctx.fillStyle = '#06d6a0'; ctx.fillRect(-11, -11, 22, 22); ctx.fillStyle = '#073b4c'; ctx.fillRect(-11, -3, 22, 6); }
      else if (pk.kind === 'ammo') { ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); text('A', 0, 5, 13, '#111', 'center', 'middle'); }
      else { ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); text('+', 0, 5, 15, '#fff', 'center', 'middle'); }
      ctx.restore();
    }
    // Mission target marker
    const target = world.missions.targetPos();
    if (target && screen === SCREEN_PLAY) {
      const pulse = 1 + Math.sin(state.elapsed * 4) * 0.2;
      ctx.save(); ctx.translate(target.x, target.y); ctx.scale(pulse, pulse);
      ctx.strokeStyle = PALETTE.mission; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = PALETTE.mission; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Off-screen arrow toward the target
      const p = world.player; const dx = target.x - p.x; const dy = target.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 420) {
        const a = Math.atan2(dy, dx);
        const ax = p.x + Math.cos(a) * 150; const ay = p.y + Math.sin(a) * 150;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = PALETTE.mission;
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
    // Cars, police, pedestrians, player
    for (const car of world.cars) drawCar(car, false);
    for (const pc of world.police) drawCar(pc, false);
    for (const p of world.peds) {
      ctx.save(); ctx.translate(p.x, p.y);
      const bob = Math.sin(p.walkPhase) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 8, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, bob, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(0, bob - 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Bullets
    ctx.fillStyle = '#ffe66d';
    for (const b of world.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
    // Player
    const pl = world.player;
    if (!pl.inCar) {
      ctx.save(); ctx.translate(pl.x, pl.y); ctx.rotate(pl.angle);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 9, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); // jacket
      ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(9, 0, 6, 0, Math.PI * 2); ctx.fill(); // facing cap
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Punch arc flash
      if (pl.punchTimer > 0.2) { ctx.strokeStyle = 'rgba(255,210,63,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(pl.x, pl.y, 34, pl.angle - 0.7, pl.angle + 0.7); ctx.stroke(); }
    } else {
      // Player marker above their car
      ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(pl.x, pl.y - 34, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return c;
  }
  function drawMinimap(world) {
    const sx = VIEW.width - MM - 16; const sy = 16;
    const k = MM / WORLD.width; const kh = MM / WORLD.height;
    ctx.fillStyle = PALETTE.hudPanel; ctx.fillRect(sx - 6, sy - 6, MM + 12, MM + 12);
    ctx.fillStyle = '#0e2a1a'; ctx.fillRect(sx, sy, MM, MM * WORLD.height / WORLD.width);
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(sx + rx * k - 1, sy, 2, MM * WORLD.height / WORLD.width);
    for (const ry of ROADS_Y) ctx.fillRect(sx, sy + ry * kh - 1, MM, 2);
    const t = world.missions.targetPos();
    if (t) { ctx.fillStyle = PALETTE.mission; ctx.beginPath(); ctx.arc(sx + t.x * k, sy + t.y * kh, 5, 0, Math.PI * 2); ctx.fill(); }
    for (const pc of world.police) { ctx.fillStyle = '#ff2e4d'; ctx.fillRect(sx + pc.x * k - 2, sy + pc.y * kh - 2, 4, 4); }
    const p = world.player;
    ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(sx + p.x * k, sy + p.y * kh, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx + p.x * k, sy + p.y * kh, 5, 0, Math.PI * 2); ctx.stroke();
    text('TELUK NEON', sx + MM / 2, sy + MM * WORLD.height / WORLD.width + 16, 11, PALETTE.muted, 'center');
  }
  function drawHud(world, best) {
    const s = world.state; const pl = world.player;
    ctx.fillStyle = PALETTE.hudPanel; ctx.fillRect(12, 12, 330, 108);
    text(`$${s.cash.toLocaleString('en-US')}`, 26, 44, 28, '#06d6a0');
    // Wanted stars
    for (let i = 0; i < WANTED.max; i++) {
      ctx.fillStyle = i < s.wanted ? PALETTE.star : PALETTE.starEmpty;
      const x = 26 + i * 26; const y = 62;
      ctx.beginPath();
      for (let a = 0; a < 5; a++) { const ang = -Math.PI / 2 + a * (Math.PI * 2 / 5); const r = a % 2 === 0 ? 11 : 5; const px = x + Math.cos(ang) * r; const py = y + Math.sin(ang) * r; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill();
    }
    // Health bar
    ctx.fillStyle = '#333'; ctx.fillRect(26, 84, 180, 12);
    ctx.fillStyle = pl.health > 40 ? '#06d6a0' : '#ef476f'; ctx.fillRect(26, 84, 180 * Math.max(0, pl.health) / 100, 12);
    text(`HP ${Math.max(0, Math.round(pl.health))}`, 214, 96, 14, PALETTE.text);
    text(pl.inCar ? `MOBIL  ${Math.round(Math.abs(pl.speed) * 0.18)} km/j` : 'JALAN KAKI', 26, 112, 13, PALETTE.muted);
    text(`Peluru ${pl.ammo}`, 240, 112, 13, PALETTE.text);
    // Mission objective bar (bottom)
    ctx.fillStyle = PALETTE.hudPanel; ctx.fillRect(12, VIEW.height - 64, VIEW.width - 24, 52);
    text(world.missions.objectiveText(), 26, VIEW.height - 30, 17, '#fff');
    const m = world.missions.current();
    if (m) text(`Hadiah $${m.reward}  •  ${m.giver}`, VIEW.width - 26, VIEW.height - 30, 14, PALETTE.muted, 'right');
    if (s.messageTimer > 0 && s.message) {
      ctx.fillStyle = 'rgba(6,214,160,0.9)'; ctx.fillRect(0, 150, VIEW.width, 34);
      text(s.message, VIEW.width / 2, 174, 18, '#073b4c', 'center');
    }
    if (world.missions.toast) {
      ctx.fillStyle = 'rgba(255,234,0,0.92)'; ctx.fillRect(0, 190, VIEW.width, 30);
      text(world.missions.toast, VIEW.width / 2, 211, 16, '#111', 'center');
    }
    drawMinimap(world);
    // Controls hint
    text('WASD gerak / nyetir  •  E masuk-keluar mobil  •  F pukul / tembak  •  Shift lari  •  P jeda  •  M misi', VIEW.width / 2, VIEW.height - 72, 12, 'rgba(255,255,255,0.55)', 'center');
  }
  function drawPanel(title, lines, prompt, accent) {
    ctx.fillStyle = 'rgba(5,7,16,0.78)'; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const w = 680; const h = 150 + lines.length * 32;
    const x = (VIEW.width - w) / 2; const y = (VIEW.height - h) / 2;
    ctx.fillStyle = '#141828'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent || '#06d6a0'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    text(title, VIEW.width / 2, y + 64, 46, '#fff', 'center');
    lines.forEach((ln, i) => text(ln, VIEW.width / 2, y + 112 + i * 32, 19, PALETTE.muted, 'center'));
    text(prompt, VIEW.width / 2, y + h - 30, 20, '#ffd60a', 'center');
  }
  function draw(world, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawWorld(world, screen);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(world, best);
    if (screen === SCREEN_TITLE) {
      drawPanel('NEON HARBOR', [
        'Kota terbuka Teluk Neon — curi mobil, kabur dari polisi, selesaikan 5 misi.',
        'Rex Marlowe butuh uang. Mira Solano punya pekerjaan. Polisi punya borgol.',
        `Rekor uang: $${(best || 0).toLocaleString('en-US')}   •   Tersimpan otomatis di browser ini`,
      ], 'Tekan Spasi / Enter atau klik untuk mulai', '#ffd60a');
      text('Game orisinal — semua nama, kota, karakter & musik dibuat sendiri. Bukan GTA.', VIEW.width / 2, VIEW.height - 24, 13, 'rgba(255,255,255,0.5)', 'center');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('JEDA', ['Istirahat dulu, Rex. Kota menunggu.', `Misi: ${world.missions.objectiveText()}`], 'Tekan P untuk lanjut  •  Spasi untuk simpan & lanjut');
    } else if (screen === SCREEN_OVER) {
      const reason = world.state.wanted === 0 && world.player.health <= 0 ? 'Rex tumbang.' : 'Rex tertangkap polisi.';
      drawPanel('GAME OVER', [reason, `Uang: $${world.state.cash.toLocaleString('en-US')}   •   Misi selesai: ${world.missions.index}/5`, 'Uangmu disita sebagian. Coba lagi, lebih licin.'], 'Tekan Spasi untuk main lagi', '#ef476f');
    } else if (screen === SCREEN_WIN) {
      drawPanel('KABUR DARI TELUK NEON', ['Semua 5 misi selesai. Rex naik kapal dan menghilang ke laut.', `Total uang: $${world.state.cash.toLocaleString('en-US')}`], 'Tekan Spasi untuk main lagi', '#06d6a0');
    }
  }
  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
