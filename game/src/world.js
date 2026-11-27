// Free Range — the simulation: one turkey, a procedurally grown farm track,
// and the open gate 1,200 metres away. Pure state and stepping; all drawing
// lives in render.js, all sound triggers are queued in state.events.

import { CFG } from './config.js';
import { mulberry32, rngRange } from './random.js';

const OBSTACLE_H = { fence: 54, bale: 46, branch: 0, mud: 0 }; // px above ground

export class World {
  constructor(seed) { this.reset(seed); }

  reset(seed) {
    this.seed = seed;
    this.rng = mulberry32(seed * 7919 + 13);
    this.state = 'title';           // title | run | won | caught
    this.time = 0;
    this.dist = 0;                  // metres run
    this.elapsed = 0;
    this.speed = CFG.startSpeed;
    this.score = 0;
    this.corn = 0;
    this.feathers = CFG.feathers;
    // Turkey verticals (px above the ground line).
    this.y = 0; this.vy = 0; this.jumps = 0;
    this.ducking = false;
    this.invuln = 0; this.stumble = 0;
    this.farmerGap = -16;           // metres behind the turkey (render only)
    this.obstacles = [];            // {x, w, kind, hit}
    this.corns = [];                // {x, air, gold, taken}
    this.particles = [];            // {x(px off), y, vx, vy, life, kind}
    this.events = [];               // sound cues for main.js
    this.genX = 26;                 // next metre to generate from
    this.legPhase = 0;
    this.endStats = null;
    this.generate();
  }

  start() {
    if (this.state === 'title') { this.state = 'run'; this.events.push('start'); }
  }

  // --- track generation -------------------------------------------------
  generate() {
    const rng = this.rng;
    while (this.genX < this.dist + 240 && this.genX < CFG.gateDistance - 30) {
      const t = this.genX / CFG.gateDistance;             // 0..1 along the run
      const gap = rngRange(rng, 15, 24) - t * 5;          // tighter late
      const roll = rng();
      if (roll < 0.30) {
        // A fence or bale, often with a corn arc over it.
        const kind = rng() < 0.55 ? 'fence' : 'bale';
        this.obstacles.push({ x: this.genX, w: 0.9, kind, hit: false });
        if (rng() < 0.75) {
          for (let i = 0; i < 5; i++)
            this.corns.push({ x: this.genX - 1.6 + i * 0.8, air: true, gold: false, taken: false });
        }
        this.genX += gap;
      } else if (roll < 0.48) {
        // A low branch to duck under (or leap clean over).
        this.obstacles.push({ x: this.genX, w: 1.0, kind: 'branch', hit: false });
        if (rng() < 0.6)
          for (let i = 0; i < 4; i++)
            this.corns.push({ x: this.genX - 0.6 + i * 0.7, air: false, gold: false, taken: false });
        this.genX += gap;
      } else if (roll < 0.60) {
        // A mud puddle: no feather lost, but it bogs the turkey down.
        this.obstacles.push({ x: this.genX, w: 2.4, kind: 'mud', hit: false });
        this.genX += gap * 0.9;
      } else if (roll < 0.78) {
        // A corn trail on the ground, sometimes with a golden cob.
        const n = 4 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++)
          this.corns.push({ x: this.genX + i * 0.85, air: false, gold: i === n - 1 && rng() < 0.3, taken: false });
        this.genX += n * 0.85 + gap * 0.7;
      } else {
        // A double: fence, short breath, branch.
        this.obstacles.push({ x: this.genX, w: 0.9, kind: 'fence', hit: false });
        this.obstacles.push({ x: this.genX + 7.5, w: 1.0, kind: 'branch', hit: false });
        this.genX += 7.5 + gap;
      }
    }
    // Prune what is far behind.
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > this.dist - 12);
    this.corns = this.corns.filter((c) => !c.taken && c.x > this.dist - 12);
  }

  // --- stepping -----------------------------------------------------------
  step(dt, input) {
    this.time += dt;
    if (this.state !== 'run') { this.updateParticles(dt); return; }
    this.elapsed += dt;

    // Speed: ramps up over the run; a stumble cuts it hard.
    const ramp = Math.min(1, this.elapsed / CFG.accelTime);
    let target = CFG.startSpeed + (CFG.maxSpeed - CFG.startSpeed) * ramp;
    if (this.stumble > 0) { target *= 0.45; this.stumble -= dt; }
    this.speed += (target - this.speed) * Math.min(1, dt * 2.2);
    if (this.invuln > 0) this.invuln -= dt;

    const dx = this.speed * dt;
    this.dist += dx;
    this.score += dx * CFG.metreScore;
    this.legPhase += this.speed * dt * 2.4;

    // The farmer closes in right after a hit, then falls back.
    const wantGap = this.stumble > 0 ? -6.5 : -16;
    this.farmerGap += (wantGap - this.farmerGap) * Math.min(1, dt * 1.6);

    // Ducking and jumping.
    this.ducking = input.down.duck && this.y === 0;
    if (input.pressed.jump) {
      if (this.y === 0) {
        this.vy = CFG.jumpVel; this.jumps = 1; this.events.push('jump');
        this.burst(0, 0, 4, 'dust');
      } else if (this.jumps < 2) {
        this.vy = CFG.flapVel; this.jumps = 2; this.events.push('flap');
        this.burst(0, this.y, 5, 'feather');
      }
    }
    if (input.down.duck && this.y > 0) this.vy = Math.min(this.vy, -1500); // dive
    if (this.y > 0 || this.vy > 0) {
      this.vy -= CFG.gravity * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.jumps = 0; this.burst(0, 0, 5, 'dust'); }
    }

    // Dust while running on the ground.
    if (this.y === 0 && Math.random() < dt * 9) this.burst(-14, 0, 1, 'dust');

    this.generate();
    this.collide();
    this.updateParticles(dt);

    if (this.dist >= CFG.gateDistance) this.finish(true);
    else if (this.feathers <= 0) this.finish(false);
  }

  collide() {
    const tx0 = this.dist - 0.55, tx1 = this.dist + 0.55;
    for (const o of this.obstacles) {
      if (o.hit || o.x + o.w < tx0 || o.x > tx1) continue;
      if (o.kind === 'mud') {
        if (this.y === 0) {
          o.hit = true; this.stumble = Math.max(this.stumble, 0.7);
          this.events.push('mud'); this.burst(0, 0, 8, 'splash');
        }
        continue;
      }
      if (this.invuln > 0) continue;
      let hit = false;
      if (o.kind === 'fence' || o.kind === 'bale') {
        hit = this.y < OBSTACLE_H[o.kind] - 8;
      } else if (o.kind === 'branch') {
        const headTop = this.y + (this.ducking ? 46 : 86);
        hit = headTop > 52 && this.y < 64;   // duck under it or clear it whole
      }
      if (hit) {
        o.hit = true;
        this.feathers -= 1;
        this.invuln = CFG.invulnTime;
        this.stumble = CFG.stumbleTime;
        this.events.push('hit');
        this.burst(0, this.y + 30, 9, 'feather');
      }
    }
    for (const c of this.corns) {
      if (c.taken || Math.abs(c.x - this.dist) > 0.8) continue;
      const cy = c.air ? 74 : 16;
      if (Math.abs(this.y + 26 - cy) < 44) {
        c.taken = true; this.corn += 1;
        this.score += c.gold ? CFG.goldScore : CFG.cornScore;
        this.events.push(c.gold ? 'gold' : 'corn');
        this.burst((c.x - this.dist) * 20, cy, 4, 'spark');
      }
    }
  }

  burst(dxPx, yPx, n, kind) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        dx: dxPx + (Math.random() - 0.5) * 16,
        y: yPx + Math.random() * 8,
        vx: -40 - Math.random() * 70,
        vy: 20 + Math.random() * 90,
        life: 0.45 + Math.random() * 0.4,
        age: 0, kind,
      });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.age += dt;
      p.dx += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'dust' || p.kind === 'splash') p.vy -= 60 * dt;
      else p.vy -= 260 * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  finish(won) {
    this.state = won ? 'won' : 'caught';
    this.events.push(won ? 'win' : 'lose');
    this.endStats = {
      won,
      score: Math.floor(this.score),
      dist: Math.floor(Math.min(this.dist, CFG.gateDistance)),
      corn: this.corn,
      time: this.elapsed,
    };
  }
}
