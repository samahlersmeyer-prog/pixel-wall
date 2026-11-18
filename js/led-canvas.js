// Draws a 128x64 frame onto a canvas so it looks like a real LED panel:
// round dots, dark "off" LEDs, and a seam down the middle where the two panels meet.
import { W, H } from './renderer.js?v=25';

export class LedCanvas {
  constructor(canvas, { seam = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.small = document.createElement('canvas');
    this.small.width = W; this.small.height = H;
    this.sctx = this.small.getContext('2d');
    this.img = this.sctx.createImageData(W, H);
    this.seam = seam;
    this.dots = 'round';
    this.brightness = 1;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cell = Math.max(1, Math.floor(Math.min(rect.width * dpr / W, rect.height * dpr / H)));
    this.cell = cell;
    this.canvas.width = cell * W;
    this.canvas.height = cell * H;
    // Mask: black everywhere except a round "LED" in each cell.
    const mask = document.createElement('canvas');
    mask.width = this.canvas.width; mask.height = this.canvas.height;
    const m = mask.getContext('2d');
    m.fillStyle = '#000';
    m.fillRect(0, 0, mask.width, mask.height);
    m.globalCompositeOperation = 'destination-out';
    const r = cell * 0.4;
    if (cell >= 3 && this.dots === 'round') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        m.beginPath();
        m.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
        m.fill();
      }
    } else if (cell >= 3 && this.dots === 'square') {
      const g = Math.max(1, Math.round(cell * 0.12));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m.fillRect(x * cell + g, y * cell + g, cell - g * 2, cell - g * 2);
    } else {
      m.fillRect(0, 0, mask.width, mask.height);
    }
    m.globalCompositeOperation = 'source-over';
    if (this.seam && cell >= 3) {
      m.fillStyle = '#000';
      m.fillRect(W / 2 * cell - 1, 0, 2, mask.height);
    }
    this.mask = mask;
  }

  setStyle({ dots = 'round', seam = true } = {}) {
    if (dots === this.dots && seam === this.seam) return;
    this.dots = dots; this.seam = seam;
    this.resize();
  }

  draw(frame) {
    const d = this.img.data, b = frame.buf, k = this.brightness;
    for (let i = 0, j = 0; i < W * H; i++, j += 3) {
      // Off LEDs look dark gray, like a real panel.
      d[i * 4] = Math.max(16, b[j] * k);
      d[i * 4 + 1] = Math.max(16, b[j + 1] * k);
      d[i * 4 + 2] = Math.max(18, b[j + 2] * k);
      d[i * 4 + 3] = 255;
    }
    this.sctx.putImageData(this.img, 0, 0);
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.small, 0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.mask, 0, 0);
  }
}
