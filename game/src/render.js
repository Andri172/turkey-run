// Free Range — all drawing. Canvas 2D, flat shapes, dawn light. The world is
// measured in metres; the view shows 42 of them, the turkey riding at 30% of
// the width. Everything scrolls past the turkey.

import { CFG, COL } from './config.js';

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

export class Renderer {
  constructor(ctx) { this.ctx = ctx; }

  draw(world, W, H) {
    const ctx = this.ctx;
    const gy = H * CFG.groundFrac;
    const pxM = W / 42;
    const tx = W * CFG.turkeyX;
    const sx = (wx) => tx + (wx - world.dist) * pxM;

    this.sky(world, W, H, gy);
    this.hills(world, W, gy, pxM);
    this.ground(world, W, H, gy, pxM, sx);
    if (world.dist < 34) this.coop(W, gy, sx(-7));
    if (world.dist > CFG.gateDistance - 46) this.gate(W, gy, sx(CFG.gateDistance), pxM);
    for (const c of world.corns) if (!c.taken) this.corn(sx(c.x), gy, c);
    for (const o of world.obstacles) this.obstacle(o, sx(o.x), gy, pxM);
    this.farmer(world, gy, sx(world.dist + world.farmerGap));
    this.turkey(world, tx, gy);
    this.particles(world, tx, gy);
    if (world.state === 'run') this.hud(world, W, H);
    if (world.state === 'title') this.title(world, W, H, gy);
    if (world.state === 'won' || world.state === 'caught') this.end(world, W, H);
  }

  sky(world, W, H, gy) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, COL.skyTop); g.addColorStop(0.55, COL.skyMid); g.addColorStop(1, COL.skyLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 2);
    // Sun, low in the east (right side, where freedom is).
    const sunX = W * 0.82, sunY = gy - H * 0.34;
    ctx.fillStyle = COL.sun;
    ctx.beginPath(); ctx.arc(sunX, sunY, H * 0.055, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,217,119,0.25)';
    ctx.beginPath(); ctx.arc(sunX, sunY, H * 0.09, 0, 7); ctx.fill();
    // Clouds drift slowest of all.
    ctx.fillStyle = 'rgba(255,246,224,0.85)';
    for (let i = 0; i < 6; i++) {
      const cx = ((hash(i * 7) * 1600 - world.dist * 0.6) % (W + 260) + W + 260) % (W + 260) - 130;
      const cy = 26 + hash(i * 13) * H * 0.2;
      const s = 0.6 + hash(i * 3) * 0.9;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 44 * s, 13 * s, 0, 0, 7);
      ctx.ellipse(cx + 26 * s, cy + 3 * s, 30 * s, 10 * s, 0, 0, 7);
      ctx.ellipse(cx - 28 * s, cy + 4 * s, 26 * s, 9 * s, 0, 0, 7);
      ctx.fill();
    }
  }

  hills(world, W, gy, pxM) {
    const ctx = this.ctx;
    // Far ridge.
    ctx.fillStyle = COL.hillFar;
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 16) {
      const wx = (x + world.dist * pxM * 0.12);
      ctx.lineTo(x, gy - 52 - Math.sin(wx * 0.011) * 22 - Math.sin(wx * 0.0037) * 16);
    }
    ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
    // Near field with crop rows sweeping past.
    ctx.fillStyle = COL.hillNear;
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 16) {
      const wx = (x + world.dist * pxM * 0.3);
      ctx.lineTo(x, gy - 20 - Math.sin(wx * 0.017 + 2) * 10);
    }
    ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const off = ((i * 190 - world.dist * pxM * 0.3) % (W + 190) + W + 190) % (W + 190) - 95;
      ctx.beginPath(); ctx.moveTo(off, gy - 4); ctx.lineTo(off + 44, gy - 26); ctx.stroke();
    }
  }

  ground(world, W, H, gy, pxM, sx) {
    const ctx = this.ctx;
    ctx.fillStyle = COL.ground; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = COL.dirt; ctx.fillRect(0, gy + (H - gy) * 0.34, W, (H - gy) * 0.66);
    ctx.fillStyle = COL.groundDark; ctx.fillRect(0, gy, W, 5);
    // Grass tufts and pebbles, hashed by metre so they ride with the world.
    const m0 = Math.floor(world.dist - 16), m1 = Math.ceil(world.dist + 30);
    for (let m = m0; m < m1; m++) {
      for (let k = 0; k < 3; k++) {
        const wx = m + hash(m * 3 + k) * 0.9;
        const x = sx(wx); if (x < -10 || x > W + 10) continue;
        const top = hash(m * 7 + k) < 0.5;
        const y = top ? gy + 4 + hash(m + k) * 8 : gy + (H - gy) * 0.45 + hash(m * 5 + k) * (H - gy) * 0.4;
        if (top) {
          ctx.strokeStyle = COL.groundDark; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7);
          ctx.moveTo(x + 3, y); ctx.lineTo(x + 4, y - 8);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.13)';
          ctx.beginPath(); ctx.ellipse(x, y, 4, 2, 0, 0, 7); ctx.fill();
        }
      }
    }
  }

  coop(W, gy, x) {
    const ctx = this.ctx;
    // The coop the turkey escaped from, shrinking behind at the start.
    ctx.fillStyle = '#9c4a2f';
    ctx.fillRect(x - 90, gy - 92, 130, 92);
    ctx.fillStyle = '#7c3822';
    ctx.beginPath(); ctx.moveTo(x - 102, gy - 92); ctx.lineTo(x - 25, gy - 138); ctx.lineTo(x + 52, gy - 92); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d2a16'; ctx.fillRect(x - 52, gy - 58, 46, 58);
    ctx.fillStyle = COL.paper; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('COOP No. 9', x - 25, gy - 104);
  }

  gate(W, gy, x, pxM) {
    const ctx = this.ctx;
    // The fence line ends; the gate stands open; free range beyond.
    ctx.strokeStyle = COL.fenceDark; ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      const fx = x - (i + 1) * pxM * 2.2;
      ctx.beginPath(); ctx.moveTo(fx, gy); ctx.lineTo(fx, gy - 64); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x - pxM * 8.8, gy - 52); ctx.lineTo(x, gy - 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - pxM * 8.8, gy - 26); ctx.lineTo(x, gy - 26); ctx.stroke();
    // Gate posts and the swung-open gate.
    ctx.fillStyle = COL.fenceDark; ctx.fillRect(x - 5, gy - 96, 10, 96); ctx.fillRect(x + 64, gy - 96, 10, 96);
    ctx.save(); ctx.translate(x + 4, gy - 88); ctx.rotate(-0.5);
    ctx.strokeStyle = COL.fence; ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 62, 80);
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(62, 40); ctx.stroke();
    ctx.restore();
    // Sign.
    ctx.fillStyle = COL.paper; ctx.fillRect(x - 34, gy - 128, 142, 26);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.strokeRect(x - 34, gy - 128, 142, 26);
    ctx.fillStyle = COL.ink; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('★ FREE RANGE ★', x + 37, gy - 110);
  }

  corn(x, gy, c) {
    const ctx = this.ctx;
    const y = gy - (c.air ? 74 : 16) - 8 + Math.sin(x * 0.05) * 1.5;
    if (c.gold) { ctx.fillStyle = 'rgba(255,180,0,0.30)'; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.5);
    ctx.fillStyle = c.gold ? COL.gold : COL.corn;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (const [kx, ky] of [[-2.5, -5], [2.5, -1], [-2.5, 3], [2.5, 6]]) { ctx.fillRect(kx, ky, 2, 2); }
    ctx.fillStyle = '#5c8a3e';
    ctx.beginPath(); ctx.moveTo(-4, 8); ctx.quadraticCurveTo(-10, 16, -3, 15); ctx.quadraticCurveTo(0, 10, 4, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  obstacle(o, x, gy, pxM) {
    const ctx = this.ctx;
    const w = o.w * pxM;
    if (o.kind === 'fence') {
      ctx.fillStyle = COL.fenceDark; ctx.fillRect(x, gy - 54, 7, 54); ctx.fillRect(x + w - 7, gy - 54, 7, 54);
      ctx.fillStyle = COL.fence;
      ctx.fillRect(x - 3, gy - 48, w + 6, 9); ctx.fillRect(x - 3, gy - 26, w + 6, 9);
    } else if (o.kind === 'bale') {
      ctx.fillStyle = COL.hay;
      ctx.beginPath(); ctx.arc(x + w / 2, gy - 23, 24, 0, 7); ctx.fill();
      ctx.strokeStyle = COL.hayDark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + w / 2, gy - 23, 16, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w / 2, gy - 23, 8, 0, 7); ctx.stroke();
      ctx.fillStyle = COL.hayDark; ctx.fillRect(x + w / 2 - 26, gy - 4, 52, 4);
    } else if (o.kind === 'mud') {
      ctx.fillStyle = COL.mud;
      ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 7, w / 2, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(x + w * 0.35, gy + 5, w * 0.16, 3, 0, 0, 7); ctx.fill();
    } else if (o.kind === 'branch') {
      // Two posts and a leafy branch across the path at head height.
      ctx.fillStyle = COL.fenceDark; ctx.fillRect(x, gy - 96, 6, 96); ctx.fillRect(x + w - 6, gy - 96, 6, 96);
      ctx.strokeStyle = COL.branch; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 20, gy - 60); ctx.quadraticCurveTo(x + w / 2, gy - 50, x + w + 20, gy - 60); ctx.stroke();
      ctx.fillStyle = COL.leaf;
      for (let i = 0; i < 9; i++) {
        const lx = x - 14 + (i / 8) * (w + 28), ly = gy - 64 - hash(o.x * 10 + i) * 12;
        ctx.beginPath(); ctx.ellipse(lx, ly, 11, 6.5, hash(i) * 2, 0, 7); ctx.fill();
      }
    }
    if (o.hit && o.kind !== 'mud') { // a knocked look after a hit
      ctx.fillStyle = 'rgba(216,64,64,0.18)';
      ctx.fillRect(x - 4, gy - 100, w + 8, 100);
    }
  }

  farmer(world, gy, x) {
    const ctx = this.ctx;
    if (x < -70) return;
    const run = Math.sin(world.legPhase * 1.7) * 9;
    ctx.save(); ctx.translate(x, gy);
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(-6 - run * 0.4, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -34); ctx.lineTo(6 + run * 0.4, 0); ctx.stroke();
    ctx.fillStyle = '#54606e'; ctx.fillRect(-11, -66, 22, 36);            // overalls
    ctx.fillStyle = '#b8b0a2'; ctx.fillRect(-11, -84, 22, 20);            // shirt
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(10, -78); ctx.lineTo(30, -58); ctx.stroke(); // arm with net
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(38, -52, 13, 0, 7); ctx.stroke();
    ctx.fillStyle = '#e8c39a'; ctx.beginPath(); ctx.arc(0, -93, 9, 0, 7); ctx.fill(); // head
    ctx.fillStyle = '#c9452c'; ctx.fillRect(-11, -103, 22, 6); ctx.fillRect(-7, -110, 14, 8); // cap
    ctx.restore();
  }

  turkey(world, tx, gy) {
    const ctx = this.ctx;
    const y = world.y;
    const airborne = y > 0;
    const blink = world.invuln > 0 && Math.floor(world.time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(tx, gy - y);
    if (world.stumble > 0) ctx.rotate(-0.06);
    ctx.globalAlpha = blink ? 0.35 : 1;
    const duck = world.ducking;
    const bodyY = duck ? -34 : -44;
    const legSwing = airborne ? 0 : Math.sin(world.legPhase) * 10;
    // Legs.
    ctx.strokeStyle = COL.leg; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    if (airborne) {
      ctx.beginPath(); ctx.moveTo(-4, -22); ctx.lineTo(-10, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -22); ctx.lineTo(16, -6); ctx.stroke();
    } else if (duck) {
      ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-8, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -20); ctx.lineTo(14, 0); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-4 + legSwing, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(8 - legSwing, 0); ctx.stroke();
    }
    // Tail fan.
    ctx.save(); ctx.translate(-26, bodyY + 4); ctx.rotate(duck ? -0.25 : 0.08);
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.42;
      ctx.save(); ctx.rotate(a);
      ctx.fillStyle = COL.tail;
      ctx.beginPath(); ctx.ellipse(-17, 0, 19, 6.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = COL.tailTip;
      ctx.beginPath(); ctx.ellipse(-30, 0, 6, 5, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // Body.
    ctx.fillStyle = COL.body;
    ctx.beginPath(); ctx.ellipse(0, bodyY, 30, 21, duck ? 0.12 : -0.05, 0, 7); ctx.fill();
    ctx.fillStyle = COL.bodyDark;
    ctx.beginPath(); ctx.ellipse(-6, bodyY + 8, 22, 12, 0, 0, 7); ctx.fill();
    // Wing — flaps hard on the second jump.
    const flap = world.jumps === 2 && airborne ? Math.sin(world.time * 40) * 0.7 : 0;
    ctx.save(); ctx.translate(-2, bodyY - 2); ctx.rotate(0.25 + flap);
    ctx.fillStyle = COL.wing;
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 10, 0.3, 0, 7); ctx.fill();
    ctx.restore();
    // Neck and head.
    const hx = duck ? 34 : 27, hy = duck ? bodyY - 2 : bodyY - 20;
    ctx.strokeStyle = COL.neck; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(18, bodyY - 6); ctx.quadraticCurveTo(hx - 4, hy + 10, hx, hy); ctx.stroke();
    ctx.fillStyle = COL.head;
    ctx.beginPath(); ctx.arc(hx, hy, 10.5, 0, 7); ctx.fill();
    ctx.fillStyle = COL.wattle;
    ctx.beginPath(); ctx.ellipse(hx + 6, hy + 8, 4, 7, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = COL.beak;
    ctx.beginPath(); ctx.moveTo(hx + 8, hy - 3); ctx.lineTo(hx + 21, hy + 1); ctx.lineTo(hx + 8, hy + 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = COL.eye;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 3, 2.2, 0, 7); ctx.fill();
    ctx.restore();
  }

  particles(world, tx, gy) {
    const ctx = this.ctx;
    for (const p of world.particles) {
      const a = 1 - p.age / p.life;
      const x = tx + p.dx, y = gy - p.y;
      if (p.kind === 'dust') { ctx.fillStyle = `rgba(214,188,150,${0.5 * a})`; ctx.beginPath(); ctx.arc(x, y, 3.5 * a + 1, 0, 7); ctx.fill(); }
      else if (p.kind === 'splash') { ctx.fillStyle = `rgba(109,81,54,${0.8 * a})`; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
      else if (p.kind === 'spark') { ctx.fillStyle = `rgba(255,216,61,${a})`; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = `rgba(232,217,176,${a})`; ctx.beginPath(); ctx.ellipse(x, y, 5, 2.6, p.age * 6, 0, 7); ctx.fill(); }
    }
  }

  hud(world, W, H) {
    const ctx = this.ctx;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(43,28,16,0.55)';
    ctx.beginPath(); ctx.roundRect(14, 12, 218, 58, 10); ctx.fill();
    ctx.fillStyle = COL.paper; ctx.font = 'bold 21px system-ui';
    ctx.fillText(`SCORE ${Math.floor(world.score)}`, 26, 38);
    ctx.font = 'bold 15px system-ui'; ctx.fillStyle = COL.corn;
    ctx.fillText(`🌽 ${world.corn}`, 26, 61);
    ctx.fillStyle = COL.paper;
    ctx.fillText(`${Math.floor(world.dist)} m`, 76, 61);
    // Feathers, top right.
    for (let i = 0; i < CFG.feathers; i++) {
      const x = W - 34 - i * 30, y = 30;
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.6);
      ctx.fillStyle = i < world.feathers ? COL.tailTip : 'rgba(255,246,224,0.25)';
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.5, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    // Progress to the gate.
    const bw = Math.min(430, W * 0.44), bx = (W - bw) / 2, by = 16;
    ctx.fillStyle = 'rgba(43,28,16,0.55)';
    ctx.beginPath(); ctx.roundRect(bx - 8, by - 6, bw + 16, 30, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,246,224,0.35)';
    ctx.beginPath(); ctx.roundRect(bx, by + 4, bw, 7, 4); ctx.fill();
    ctx.fillStyle = COL.corn;
    ctx.beginPath(); ctx.roundRect(bx, by + 4, bw * Math.min(1, world.dist / CFG.gateDistance), 7, 4); ctx.fill();
    ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = COL.paper;
    ctx.fillText('COOP', bx + 8, by + 24 + 12);
    ctx.fillText('GATE →', bx + bw - 16, by + 36);
    ctx.fillText('🦃', bx + bw * Math.min(1, world.dist / CFG.gateDistance), by + 13);
  }

  panel(W, H, w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(26,18,11,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,246,224,0.96)';
    ctx.beginPath(); ctx.roundRect((W - w) / 2, (H - h) / 2, w, h, 18); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect((W - w) / 2, (H - h) / 2, w, h, 18); ctx.stroke();
  }

  title(world, W, H, gy) {
    const ctx = this.ctx;
    this.panel(W, H, Math.min(600, W * 0.86), 356);
    const cx = W / 2, top = (H - 356) / 2;
    ctx.textAlign = 'center'; ctx.fillStyle = COL.ink;
    ctx.font = 'bold 54px system-ui';
    ctx.fillText('FREE RANGE', cx, top + 70);
    ctx.font = 'bold 19px system-ui'; ctx.fillStyle = '#b3541e';
    ctx.fillText('— THE GREAT TURKEY ESCAPE —', cx, top + 102);
    ctx.font = '17px system-ui'; ctx.fillStyle = COL.ink;
    ctx.fillText('Dawn. The coop door is open. The gate is 1,200 m away.', cx, top + 148);
    ctx.fillText('SPACE / ↑  jump — press again mid-air to flap', cx, top + 182);
    ctx.fillText('↓  duck under branches (or dive while airborne)', cx, top + 208);
    ctx.fillText('Jump fences and hay bales. Mud only slows you down.', cx, top + 234);
    ctx.fillText('Three hits and the farmer catches you. Corn is points.', cx, top + 260);
    ctx.font = 'bold 20px system-ui'; ctx.fillStyle = '#476b3d';
    if (Math.floor(world.time * 1.6) % 2 === 0) ctx.fillText('PRESS SPACE OR TAP TO RUN', cx, top + 312);
  }

  end(world, W, H) {
    const ctx = this.ctx;
    const s = world.endStats;
    this.panel(W, H, Math.min(540, W * 0.86), 300);
    const cx = W / 2, top = (H - 300) / 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px system-ui';
    if (s.won) { ctx.fillStyle = '#476b3d'; ctx.fillText('FREE RANGE!', cx, top + 66); }
    else { ctx.fillStyle = '#b3352c'; ctx.fillText('CAUGHT!', cx, top + 66); }
    ctx.font = '17px system-ui'; ctx.fillStyle = COL.ink;
    ctx.fillText(s.won
      ? 'Through the gate and into the wild. No table for this turkey.'
      : `The farmer's net closes at ${s.dist} m. So close to the gate.`, cx, top + 104);
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(`SCORE  ${s.score}`, cx, top + 152);
    ctx.font = '17px system-ui';
    ctx.fillText(`Distance ${s.dist} m   ·   Corn ${s.corn}   ·   Time ${s.time.toFixed(1)} s`, cx, top + 186);
    ctx.font = 'bold 18px system-ui'; ctx.fillStyle = '#476b3d';
    if (Math.floor(world.time * 1.6) % 2 === 0) ctx.fillText('PRESS SPACE TO RUN AGAIN', cx, top + 244);
  }
}
