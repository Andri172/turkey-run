// Keyboard and pointer input with edge detection. The game reads `pressed`
// for one-shot actions (jump, start) and `down` for held ones (duck).

export class Input {
  constructor(canvas) {
    this.down = { jump: false, duck: false };
    this.pressed = { jump: false, duck: false, any: false };
    const key = (e, isDown) => {
      const c = e.code;
      if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') {
        if (isDown && !this.down.jump) this.pressed.jump = true;
        this.down.jump = isDown;
        if (isDown) this.pressed.any = true;
        e.preventDefault();
      } else if (c === 'ArrowDown' || c === 'KeyS') {
        if (isDown && !this.down.duck) this.pressed.duck = true;
        this.down.duck = isDown;
        if (isDown) this.pressed.any = true;
        e.preventDefault();
      } else if (isDown) {
        this.pressed.any = true;
      }
    };
    window.addEventListener('keydown', (e) => key(e, true));
    window.addEventListener('keyup', (e) => key(e, false));
    const ptr = (e, isDown) => {
      // Upper half of the screen jumps, lower half ducks.
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      if (y < 0.55) {
        if (isDown && !this.down.jump) this.pressed.jump = true;
        this.down.jump = isDown;
      } else {
        if (isDown && !this.down.duck) this.pressed.duck = true;
        this.down.duck = isDown;
      }
      if (isDown) this.pressed.any = true;
    };
    canvas.addEventListener('pointerdown', (e) => ptr(e, true));
    window.addEventListener('pointerup', (e) => ptr(e, false));
    window.addEventListener('blur', () => { this.down.jump = false; this.down.duck = false; });
  }
  // Called at the end of each frame: edges live exactly one frame.
  endFrame() {
    this.pressed.jump = false;
    this.pressed.duck = false;
    this.pressed.any = false;
  }
}
