// The simulation: player on foot and in cars, traffic, pedestrians, police,
// pickups, wanted level, combat and the mission hooks. No drawing here.
import { CAR, MISSIONS, PALETTE, PLAYER, POLICE, STEP, WANTED, WORLD } from './config.js';
import { createCity, ROADS_X, ROADS_Y, ROAD_W } from './city.js';
import { createMissions } from './missions.js';
import { angleDiff, angleTo, clamp, dist, pick, range } from './random.js';

export const EVENT_MISSION = 1;
export const EVENT_BUSTED = 2;
export const EVENT_WASTED = 4;
export const EVENT_CRIME = 8;
export const EVENT_PICKUP = 16;
export const EVENT_SHOT = 32;
export const EVENT_PUNCH = 64;

let carSeq = 0;
function makeCar(x, y, angle, color, opts) {
  return Object.assign({ id: ++carSeq, x, y, angle, speed: 0, color, police: false,
    traffic: false, vertical: true, dir: 1, cruise: 180, parked: false, targetCar: null }, opts || {});
}

export function createWorld(random) {
  const city = createCity(random);
  const missions = createMissions();
  const player = { x: 1600, y: 2100, angle: -Math.PI / 2, health: PLAYER.health,
    ammo: PLAYER.startAmmo, punchTimer: 0, shootTimer: 0, invuln: 0, inCar: null, speed: 0 };
  const cars = []; const peds = []; const police = []; const pickups = []; const bullets = [];
  const state = { cash: 0, wanted: 0, wantedTimer: 0, elapsed: 0, bustedTimer: 0,
    message: '', messageTimer: 0, missionIndex: 0, allDone: false, shotsFired: 0, carsStolen: 0 };
  let trafficTimer = 0; let pedTimer = 0; let policeTimer = 0;

  function spawnParked() {
    // Parked stealable cars along roads, including the blue sedan mission 2 needs.
    const spots = [];
    for (let i = 0; i < 26; i++) {
      const rx = pick(random, ROADS_X); const ry = pick(random, ROADS_Y);
      const vertical = random() < 0.5;
      const x = vertical ? rx + (random() < 0.5 ? -ROAD_W / 2 + 16 : ROAD_W / 2 - 16) : rx + range(random, -120, 120);
      const y = vertical ? ry + range(random, -120, 120) : ry + (random() < 0.5 ? -ROAD_W / 2 + 16 : ROAD_W / 2 - 16);
      spots.push({ x, y, angle: vertical ? (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (random() < 0.5 ? 0 : Math.PI) });
    }
    spots.forEach((s, i) => {
      const color = i === 0 ? '#4361ee' : pick(random, PALETTE.car); // i==0 is the blue sedan
      const c = makeCar(s.x, s.y, s.angle, color, { parked: true });
      if (i === 0) { c.x = 900; c.y = 240; c.angle = 0; c.missionCar = true; }
      cars.push(c);
    });
  }
  function spawnTrafficCar() {
    const vertical = random() < 0.5;
    let x; let y; let angle; let dir = random() < 0.5 ? 1 : -1;
    if (vertical) {
      x = pick(random, ROADS_X) + dir * 22; y = range(random, 100, 2100);
      angle = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      y = pick(random, ROADS_Y) + dir * 22; x = range(random, 100, WORLD.width - 100);
      angle = dir > 0 ? 0 : Math.PI;
    }
    cars.push(makeCar(x, y, angle, pick(random, PALETTE.car),
      { traffic: true, vertical, dir, cruise: range(random, 130, 210) }));
  }
  function spawnPed() {
    const near = city.nearestRoadPoint(player.x + range(random, -500, 500), player.y + range(random, -500, 500));
    peds.push({ x: clamp(near.x + range(random, -60, 60), 30, WORLD.width - 30),
      y: clamp(near.y + range(random, -60, 60), 30, WORLD.height - 30),
      angle: range(random, 0, Math.PI * 2), speed: range(random, 30, 60),
      color: pick(random, PALETTE.ped), hp: 30, walkPhase: random() * 6, flee: 0 });
  }
  function spawnPolice() {
    const a = range(random, 0, Math.PI * 2);
    const x = clamp(player.x + Math.cos(a) * POLICE.spawnDistance, 40, WORLD.width - 40);
    const y = clamp(player.y + Math.sin(a) * POLICE.spawnDistance, 40, WORLD.height - 40);
    police.push(makeCar(x, y, angleTo(x, y, player.x, player.y), PALETTE.police, { police: true, cruise: POLICE.speed }));
  }
  function spawnPickupsForMission3() {
    const spots = [{ x: 540, y: 1620 }, { x: 2340, y: 540 }, { x: 2700, y: 1980 }];
    for (const s of spots) pickups.push({ x: s.x, y: s.y, kind: 'package', taken: false });
    pickups.push({ x: 1260, y: 900, kind: 'ammo', taken: false });
    pickups.push({ x: 1980, y: 1260, kind: 'health', taken: false });
  }
  function addWanted(n) {
    state.wanted = clamp(state.wanted + n, 0, WANTED.max);
    state.wantedTimer = 0;
    return EVENT_CRIME;
  }
  function reset() {
    carSeq = 0; cars.length = 0; peds.length = 0; police.length = 0; pickups.length = 0; bullets.length = 0;
    player.x = 1600; player.y = 2100; player.angle = -Math.PI / 2; player.health = PLAYER.health;
    player.ammo = PLAYER.startAmmo; player.inCar = null; player.speed = 0; player.punchTimer = 0; player.shootTimer = 0;
    state.cash = 0; state.wanted = 0; state.wantedTimer = 0; state.elapsed = 0; state.bustedTimer = 0;
    state.message = ''; state.messageTimer = 0; state.shotsFired = 0; state.carsStolen = 0;
    missions.setIndex(0, 0); state.missionIndex = 0; state.allDone = false;
    spawnParked();
    for (let i = 0; i < 14; i++) spawnTrafficCar();
    for (let i = 0; i < 22; i++) spawnPed();
    spawnPickupsForMission3();
  }
  function nearestCar(maxD) {
    let best = null; let bd = maxD;
    for (const c of cars) { const d = dist(player.x, player.y, c.x, c.y); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function enterCar(car) {
    if (car.police) return 0;
    const wasParked = car.parked;
    car.parked = false; car.traffic = false;
    player.inCar = car; player.x = car.x; player.y = car.y;
    if (wasParked) {
      state.carsStolen += 1;
      const m = missions.current();
      if (m && m.kind === 'steal-deliver' && car.missionCar) missions.setDeliveredCar(car.id);
      return addWanted(1);
    }
    return 0;
  }
  function exitCar() {
    const car = player.inCar; if (!car) return;
    player.inCar = null;
    player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
    player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
    city.collideCircle(player, PLAYER.radius);
    car.speed = 0;
  }
  function attack() {
    if (player.punchTimer > 0 || player.shootTimer > 0) return 0;
    if (player.inCar) return 0; // no shooting from a car in this build
    let ev = 0;
    // Prefer shooting when ammo remains and a target is roughly ahead.
    let target = null; let bd = 320;
    const fx = Math.cos(player.angle); const fy = Math.sin(player.angle);
    for (const p of peds) {
      const dx = p.x - player.x; const dy = p.y - player.y; const d = Math.hypot(dx, dy);
      if (d < bd && (dx * fx + dy * fy) / Math.max(d, 1) > 0.5) { bd = d; target = p; }
    }
    for (const pc of police) {
      const dx = pc.x - player.x; const dy = pc.y - player.y; const d = Math.hypot(dx, dy);
      if (d < bd && (dx * fx + dy * fy) / Math.max(d, 1) > 0.5) { bd = d; target = pc; }
    }
    if (target && player.ammo > 0) {
      player.ammo -= 1; player.shootTimer = PLAYER.shootCooldown; state.shotsFired += 1;
      bullets.push({ x: player.x, y: player.y, angle: angleTo(player.x, player.y, target.x, target.y), life: 0.5, target });
      ev |= EVENT_SHOT; ev |= addWanted(1);
    } else {
      player.punchTimer = PLAYER.punchCooldown; ev |= EVENT_PUNCH;
      for (const p of peds) {
        if (dist(player.x, player.y, p.x, p.y) < PLAYER.punchRange + 14) {
          p.hp -= PLAYER.punchDamage; p.flee = 3;
          if (p.hp <= 0) { p.hp = 30; p.x = player.x + range(random, -600, 600); p.y = player.y + range(random, -600, 600); }
          ev |= addWanted(1);
        }
      }
    }
    return ev;
  }
  function stepTraffic(dt) {
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (!c.traffic) continue;
      c.speed += (c.cruise - c.speed) * dt * 2;
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      if (c.x < -80 || c.x > WORLD.width + 80 || c.y < -80 || c.y > 2240) {
        cars.splice(i, 1); spawnTrafficCar();
      }
    }
    trafficTimer -= dt;
    if (trafficTimer <= 0 && cars.filter((c) => c.traffic).length < 16) { spawnTrafficCar(); trafficTimer = 1.5; }
  }
  function stepPeds(dt) {
    for (const p of peds) {
      if (p.flee > 0) {
        p.flee -= dt;
        const a = angleTo(player.x, player.y, p.x, p.y);
        p.x += Math.cos(a) * 170 * dt; p.y += Math.sin(a) * 170 * dt;
      } else {
        p.walkPhase += dt * 6;
        p.x += Math.cos(p.angle) * p.speed * dt; p.y += Math.sin(p.angle) * p.speed * dt;
        if (random() < dt * 0.08) p.angle = range(random, 0, Math.PI * 2);
        if (!city.onRoad(p.x, p.y) && random() < dt * 0.3) p.angle += Math.PI / 2;
      }
      city.collideCircle(p, 12);
      p.x = clamp(p.x, 30, WORLD.width - 30); p.y = clamp(p.y, 30, WORLD.height - 30);
    }
    pedTimer -= dt;
    if (pedTimer <= 0 && peds.length < 26) { spawnPed(); pedTimer = 2; }
  }
  function stepPolice(dt) {
    const want = state.wanted >= 1 ? Math.min(state.wanted, POLICE.maxCars) : 0;
    policeTimer -= dt;
    if (policeTimer <= 0) { if (police.length < want) spawnPolice(); policeTimer = 1.2; }
    for (let i = police.length - 1; i >= 0; i--) {
      const pc = police[i];
      if (state.wanted === 0) { police.splice(i, 1); continue; }
      const targetA = angleTo(pc.x, pc.y, player.x, player.y);
      pc.angle += clamp(angleDiff(pc.angle, targetA), -2.4 * dt, 2.4 * dt);
      pc.speed += (POLICE.speed - pc.speed) * dt;
      pc.x += Math.cos(pc.angle) * pc.speed * dt;
      pc.y += Math.sin(pc.angle) * pc.speed * dt;
      if (city.hitsBuilding(pc.x, pc.y, 20)) { pc.x -= Math.cos(pc.angle) * pc.speed * dt * 2; pc.y -= Math.sin(pc.angle) * pc.speed * dt * 2; pc.angle += 0.6; }
      const d = dist(pc.x, pc.y, player.x, player.y);
      if (d < POLICE.catchRange) {
        if (player.inCar) {
          player.health -= 14 * dt; // rammed: police damage the player
          if (player.health <= 0) return EVENT_WASTED;
        } else {
          state.bustedTimer += dt;
          if (state.bustedTimer > 1.2) return EVENT_BUSTED;
        }
      }
    }
    return 0;
  }
  function stepBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.life -= dt;
      b.x += Math.cos(b.angle) * 900 * dt; b.y += Math.sin(b.angle) * 900 * dt;
      if (b.target && dist(b.x, b.y, b.target.x, b.target.y) < 30) {
        if (b.target.hp !== undefined) { b.target.hp -= 50; b.target.flee = 3; }
        bullets.splice(i, 1); continue;
      }
      if (b.life <= 0) bullets.splice(i, 1);
    }
  }
  function step(dt, steer, actions) {
    let events = 0;
    state.elapsed += dt;
    if (player.punchTimer > 0) player.punchTimer -= dt;
    if (player.shootTimer > 0) player.shootTimer -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;
    missions.tick(dt);

    // Wanted decay when quiet.
    if (state.wanted > 0) {
      state.wantedTimer += dt;
      if (state.wantedTimer > WANTED.decayAfter) { state.wanted = 0; state.wantedTimer = 0; police.length = 0; }
    }
    if (actions.enter) {
      if (player.inCar) exitCar();
      else { const c = nearestCar(64); if (c) events |= enterCar(c); }
    }
    if (actions.attack) events |= attack();

    if (player.inCar) {
      const car = player.inCar;
      const throttle = -steer.y; // up = forward
      car.speed += (throttle > 0 ? CAR.accel : throttle < 0 ? -CAR.reverseAccel : 0) * dt;
      car.speed -= car.speed * CAR.drag * dt;
      car.speed = clamp(car.speed, -CAR.maxReverse, CAR.maxSpeed);
      const turning = steer.x * CAR.turnRate * clamp(Math.abs(car.speed) / 160, 0, 1) * (car.speed < 0 ? -1 : 1);
      car.angle += turning * dt;
      const nx = car.x + Math.cos(car.angle) * car.speed * dt;
      const ny = car.y + Math.sin(car.angle) * car.speed * dt;
      if (city.hitsBuilding(nx, ny, 22)) { car.speed *= -0.25; events |= 0; }
      else { car.x = nx; car.y = ny; }
      car.x = clamp(car.x, 30, WORLD.width - 30); car.y = clamp(car.y, 30, 2240);
      player.x = car.x; player.y = car.y; player.angle = car.angle; player.speed = car.speed;
      // Running over a pedestrian is a crime.
      for (const p of peds) if (dist(p.x, p.y, car.x, car.y) < 40 && Math.abs(car.speed) > 120) { p.flee = 3; p.hp -= 20; events |= addWanted(1); }
    } else {
      const mag = Math.hypot(steer.x, steer.y);
      if (mag > 0) {
        const sp = actions.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
        player.angle = Math.atan2(steer.y, steer.x);
        player.x += (steer.x / Math.max(mag, 1)) * sp * dt;
        player.y += (steer.y / Math.max(mag, 1)) * sp * dt;
        player.speed = sp;
      } else player.speed = 0;
      city.collideCircle(player, PLAYER.radius);
    }
    // Pickups
    for (const pk of pickups) {
      if (pk.taken) continue;
      if (dist(player.x, player.y, pk.x, pk.y) < 44) {
        pk.taken = true; events |= EVENT_PICKUP;
        if (pk.kind === 'package') missions.collectOne();
        else if (pk.kind === 'ammo') player.ammo += 12;
        else if (pk.kind === 'health') player.health = Math.min(100, player.health + 40);
      }
    }
    // Mission progress (may complete a mission).
    const m = missions.current();
    if (m && m.kind === 'escape' && state.wanted < (m.wanted || 3)) state.wanted = m.wanted || 3;
    const done = missions.update({ px: player.x, py: player.y, inCar: !!player.inCar, carId: player.inCar ? player.inCar.id : null, wanted: state.wanted });
    if (done) {
      state.cash += done.reward; state.missionIndex = missions.index; state.allDone = done.done;
      state.message = `Misi selesai: ${done.title}  +$${done.reward}`; state.messageTimer = 4;
      events |= EVENT_MISSION;
      if (done.done) { state.message = 'SEMUA MISI SELESAI! Rex bebas dari Teluk Neon.'; state.messageTimer = 6; }
    }
    stepTraffic(dt); stepPeds(dt); stepBullets(dt);
    const pev = stepPolice(dt);
    if (pev) {
      events |= pev;
      if (pev & EVENT_BUSTED) {
        // Busted is a setback, not game over: fine, release, respawn at the
        // clinic in Kota Tua, police called off.
        state.wanted = 0; state.cash = Math.max(0, state.cash - 100); state.bustedTimer = 0;
        player.health = 100; police.length = 0;
        player.x = 1260; player.y = 900; player.angle = 0;
        state.message = 'Tertangkap! Denda $100 — dibebaskan di klinik Kota Tua.'; state.messageTimer = 4;
      }
    }
    if (player.health <= 0) events |= EVENT_WASTED;
    return events;
  }
  function applySave(save) {
    if (!save) return;
    state.cash = save.cash || 0;
    missions.setIndex(save.missionIndex || 0, 0);
    state.missionIndex = missions.index;
    if (save.x) { player.x = save.x; player.y = save.y; }
  }
  function saveData() {
    return { cash: state.cash, missionIndex: missions.index, x: Math.round(player.x), y: Math.round(player.y) };
  }
  reset();
  return { state, player, cars, peds, police, pickups, bullets, city, missions,
    reset, step, enterCar, exitCar, nearestCar, addWanted, applySave, saveData,
    get mission() { return missions.current(); } };
}
