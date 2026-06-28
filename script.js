/* =========================================================
   BIRTHDAY WEBSITE – script.js
   Features:
   1. Cinematic Canvas Background (fireworks + bokeh)
   2. Countdown to July 29th
   3. Polaroid Lightbox
   4. Wishes Wall (localStorage)
   5. Gift Box open → Typewriter letter
   6. Canvas Confetti engine
   7. Web Audio API synthesizer (birthday melody)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initBgCanvas();

  if (document.getElementById("countdown")) initCountdown();
  if (document.querySelector(".polaroid-card"))  initLightbox();
  if (document.getElementById("wishes-grid"))    initWishesWall();
  if (document.getElementById("gift-box"))       initSurprisePage();
});


/* =========================================================
   1. CINEMATIC BACKGROUND CANVAS
   ─────────────────────────────────────────────────────────
   Creates a living, animated backdrop with:
   • Drifting bokeh orbs (soft glowing circles)
   • Shooting stars
   • Periodic firework bursts
   ========================================================= */
function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // ── Bokeh Orbs ──────────────────────────────────────────
  const ORBS = [];
  const ORB_COUNT = 55;

  const ORB_COLORS = [
    "rgba(255,110,180,",
    "rgba(168,85,247,",
    "rgba(251,191,36,",
    "rgba(139,92,246,",
    "rgba(255,255,255,",
    "rgba(236,72,153,"
  ];

  class Orb {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x    = Math.random() * canvas.width;
      this.y    = initial ? Math.random() * canvas.height : canvas.height + 60;
      this.r    = Math.random() * 80 + 20;
      this.vx   = (Math.random() - 0.5) * 0.25;
      this.vy   = -(Math.random() * 0.4 + 0.1);
      this.a    = 0;
      this.maxA = Math.random() * 0.09 + 0.02;
      this.col  = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
      this.phase = Math.random() * Math.PI * 2;
      this.wobble = Math.random() * 0.005 + 0.002;
    }
    update(t) {
      this.x += this.vx + Math.sin(t * this.wobble + this.phase) * 0.3;
      this.y += this.vy;
      // Fade in/out
      if (this.y > canvas.height * 0.7) this.a = Math.min(this.maxA, this.a + 0.001);
      if (this.y < canvas.height * 0.15) this.a = Math.max(0, this.a - 0.002);
      if (this.y < -this.r * 2 || this.a <= 0) this.reset();
    }
    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, this.col + this.a + ")");
      g.addColorStop(1, this.col + "0)");
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  for (let i = 0; i < ORB_COUNT; i++) ORBS.push(new Orb());

  // ── Shooting Stars ──────────────────────────────────────
  const STARS = [];
  class ShootingStar {
    constructor() { this.spawn(); }
    spawn() {
      this.x  = Math.random() * canvas.width;
      this.y  = Math.random() * canvas.height * 0.5;
      this.len = Math.random() * 120 + 60;
      this.spd = Math.random() * 8 + 5;
      this.ang = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      this.a  = 0;
      this.maxA = 0.8;
      this.fading = false;
      this.done = false;
    }
    update() {
      if (!this.fading) {
        this.a = Math.min(this.maxA, this.a + 0.08);
        if (this.a >= this.maxA) this.fading = true;
      } else {
        this.a -= 0.04;
        if (this.a <= 0) this.done = true;
      }
      this.x += Math.cos(this.ang) * this.spd;
      this.y += Math.sin(this.ang) * this.spd;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.a;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#fff";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - Math.cos(this.ang) * this.len,
                 this.y - Math.sin(this.ang) * this.len);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Firework Particles ───────────────────────────────────
  const FW_PARTICLES = [];
  const FW_COLORS = ["#ff6eb4","#a855f7","#fbbf24","#60a5fa","#34d399","#f472b6","#ffffff"];

  class FireworkParticle {
    constructor(x, y, color) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 5 + 1.5;
      this.x  = x;
      this.y  = y;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
      this.a  = 1;
      this.r  = Math.random() * 2.5 + 0.8;
      this.color = color;
      this.trail = [];
      this.gravity = 0.07;
      this.friction = 0.97;
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x  += this.vx;
      this.y  += this.vy;
      this.a  -= 0.018;
    }
    draw() {
      // Draw trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        const ta = (i / this.trail.length) * this.a * 0.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = ta;
        ctx.fill();
      }
      // Draw head
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.a;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function spawnFirework() {
    const x   = Math.random() * canvas.width;
    const y   = Math.random() * canvas.height * 0.55 + canvas.height * 0.05;
    const col = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
    const n   = Math.floor(Math.random() * 50 + 60);
    for (let i = 0; i < n; i++) FW_PARTICLES.push(new FireworkParticle(x, y, col));
  }

  // Spawn a firework every 2-4 seconds
  let lastFW = 0;
  let nextFW = 2000;

  // Spawn shooting star every 4-9 seconds
  let lastStar = 0;
  let nextStar = 4000;

  let t = 0;

  function animate(ts) {
    requestAnimationFrame(animate);
    t += 0.01;

    // Deep dark background with subtle motion gradient
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(7, 4, 15, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bokeh orbs
    ORBS.forEach(o => { o.update(t); o.draw(); });

    // Shooting stars
    ctx.globalAlpha = 1;
    if (ts - lastStar > nextStar) {
      STARS.push(new ShootingStar());
      lastStar = ts;
      nextStar = Math.random() * 5000 + 4000;
    }
    for (let i = STARS.length - 1; i >= 0; i--) {
      STARS[i].update();
      STARS[i].draw();
      if (STARS[i].done) STARS.splice(i, 1);
    }

    // Fireworks
    ctx.globalAlpha = 1;
    if (ts - lastFW > nextFW) {
      spawnFirework();
      lastFW = ts;
      nextFW = Math.random() * 2000 + 2000;
    }
    for (let i = FW_PARTICLES.length - 1; i >= 0; i--) {
      FW_PARTICLES[i].update();
      FW_PARTICLES[i].draw();
      if (FW_PARTICLES[i].a <= 0) FW_PARTICLES.splice(i, 1);
    }

    ctx.globalAlpha = 1;
  }

  animate(0);
}


/* =========================================================
   2. COUNTDOWN TO JULY 29
   ========================================================= */
function initCountdown() {
  // Always targets July 29 of the current or next year
  function getTargetDate() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 6, 29, 0, 0, 0); // July = month 6 (0-indexed)
    if (now >= target) target = new Date(now.getFullYear() + 1, 6, 29, 0, 0, 0);
    return target;
  }

  const daysEl    = document.getElementById("days");
  const hoursEl   = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function pad(n) { return String(n).padStart(2, "0"); }

  function animateFlip(el, newVal) {
    if (el.innerText !== newVal) {
      el.style.transform = "translateY(-8px)";
      el.style.opacity = "0";
      setTimeout(() => {
        el.innerText = newVal;
        el.style.transition = "none";
        el.style.transform = "translateY(8px)";
        el.style.opacity = "0";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = "all 0.35s cubic-bezier(0.4,0,0.2,1)";
            el.style.transform = "translateY(0)";
            el.style.opacity = "1";
          });
        });
      }, 200);
    }
  }

  function update() {
    const now      = new Date();
    const target   = getTargetDate();
    const diff     = target - now;

    if (diff <= 0) {
      // Birthday is today!
      [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => { if (el) el.innerText = "00"; });
      const h2 = document.querySelector(".hero h1");
      if (h2) {
        h2.innerHTML = '<span style="font-style:normal;font-size:0.9em">🎂</span> It\'s <em style="font-style:italic">Your Day!</em>';
      }
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    if (daysEl)    animateFlip(daysEl,    pad(d));
    if (hoursEl)   animateFlip(hoursEl,   pad(h));
    if (minutesEl) animateFlip(minutesEl, pad(m));
    if (secondsEl) animateFlip(secondsEl, pad(s));
  }

  update();
  setInterval(update, 1000);
}


/* =========================================================
   3. LIGHTBOX GALLERY
   ========================================================= */
function initLightbox() {
  const cards      = document.querySelectorAll(".polaroid-card");
  const lightbox   = document.getElementById("lightbox");
  const lbImg      = document.getElementById("lightbox-img");
  const lbCaption  = document.getElementById("lightbox-caption");
  const closeBtn   = document.getElementById("lightbox-close");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const img     = card.querySelector("img");
      const caption = card.querySelector(".polaroid-caption");
      if (!img || !lightbox) return;
      lbImg.src           = img.src;
      lbImg.alt           = img.alt;
      lbCaption.innerText = caption ? caption.innerText : "";
      lightbox.classList.add("active");
    });
  });

  const closeLB = () => lightbox && lightbox.classList.remove("active");
  closeBtn && closeBtn.addEventListener("click", closeLB);
  lightbox && lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLB(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLB(); });
}


/* =========================================================
   4. WISHES WALL (localStorage persistence)
   ========================================================= */
function initWishesWall() {
  const wishesGrid = document.getElementById("wishes-grid");
  const wishForm   = document.getElementById("wish-form");
  if (!wishesGrid) return;

  const DEFAULT_WISHES = [
    { name: "Aman",  message: "Dhruv, you're an absolute legend! Hope this year brings all the success, happiness and growth you deserve. Happy Birthday! 🎉" },
    { name: "Priya", message: "Happy Birthday to the most amazing friend! Thanks for always being there with the best energy and warmest heart. 💖" }
  ];

  const STORAGE_KEY = "dhruv_birthday_wishes_v3";
  let wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (!wishes || wishes.length === 0) {
    wishes = DEFAULT_WISHES;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  }

  function render() {
    wishesGrid.innerHTML = "";
    wishes.forEach((w, i) => {
      const card = document.createElement("div");
      card.className = `wish-note note-color-${(i % 5) + 1}`;

      const text   = document.createElement("p");
      text.className = "wish-text";
      text.innerText = w.message;

      const author = document.createElement("div");
      author.className = "wish-author";
      author.innerText = `— ${w.name}`;

      card.appendChild(text);
      card.appendChild(author);

      // Fade in animation
      card.style.opacity = "0";
      card.style.transform = "scale(0.9)";
      wishesGrid.appendChild(card);
      setTimeout(() => {
        card.style.transition = "all 0.4s ease";
        card.style.opacity = "1";
        card.style.transform = "";
      }, i * 80);
    });
  }

  render();

  if (wishForm) {
    wishForm.addEventListener("submit", e => {
      e.preventDefault();
      const nameEl = document.getElementById("author-name");
      const msgEl  = document.getElementById("wish-message");
      if (!nameEl || !msgEl) return;
      const newWish = {
        name:    nameEl.value.trim(),
        message: msgEl.value.trim()
      };
      wishes.unshift(newWish);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
      render();
      wishForm.reset();
    });
  }
}


/* =========================================================
   5. SURPRISE PAGE – Gift, Typewriter, Audio
   ========================================================= */
let audioCtx      = null;
let isSynthPlaying = false;
let synthInterval  = null;

function initSurprisePage() {
  const musicBtn   = document.getElementById("audio-btn");
  const bgMusic    = document.getElementById("bg-music");
  const audioWidget = document.getElementById("audio-widget");
  if (!musicBtn || !bgMusic) return;

  musicBtn.addEventListener("click", toggleAudio);

  function toggleAudio() {
    const playing = audioWidget.classList.contains("playing");
    if (playing) {
      audioWidget.classList.remove("playing");
      musicBtn.innerText = "▶";
      bgMusic.pause();
      stopSynth();
    } else {
      audioWidget.classList.add("playing");
      musicBtn.innerText = "⏸";
      bgMusic.play().catch(() => playSynth());
    }
  }

  // Expose openGift to inline onclick
  window.openGift = function () {
    const giftBox    = document.getElementById("gift-box");
    const giftScene  = document.getElementById("gift-scene");
    const titleEl    = document.getElementById("surprise-title");
    const hintEl     = document.getElementById("gift-click-hint");
    const msgCard    = document.getElementById("message");
    if (!giftBox) return;

    giftBox.classList.add("opened");

    setTimeout(() => {
      if (giftScene)  giftScene.style.display  = "none";
      if (titleEl)    titleEl.style.display     = "none";
      if (hintEl)     hintEl.style.display      = "none";

      if (msgCard) {
        msgCard.classList.remove("hidden");
        void msgCard.offsetHeight;
        msgCard.classList.add("revealed");
        typewriterEffect();
      }

      startConfetti();

      if (!audioWidget.classList.contains("playing")) toggleAudio();
    }, 800);
  };
}

// ── Typewriter Effect ──────────────────────────────────────
function typewriterEffect() {
  const container = document.getElementById("message");
  if (!container) return;

  const letter = [
    "✨ HAPPY BIRTHDAY, DHRUV! ✨",
    "",
    "Dear Dhruv,",
    "",
    "Today is all about you — the incredible person who brings so much joy,",
    "warmth and positive energy into the lives of everyone around you.",
    "",
    "Your dedication, your kindness, your brilliant heart...",
    "they are things we truly admire and are grateful for.",
    "",
    "On this wonderful day, I wish you infinite happiness,",
    "great health, and unstoppable success in everything you do.",
    "",
    "May every dream you hold become your reality,",
    "and may you always keep shining bright — just as you do.",
    "",
    "Enjoy every single second of your special day.",
    "You deserve the absolute best. 🌟",
    "",
    "With love and best wishes always — ❤️"
  ].join("\n");

  container.innerHTML = "";
  let i = 0;

  function type() {
    if (i >= letter.length) return;
    const ch = letter[i];
    container.innerHTML += ch === "\n" ? "<br>" : ch;
    container.scrollTop = container.scrollHeight;
    i++;
    setTimeout(type, ch === "\n" ? 60 : 28);
  }
  type();
}


/* =========================================================
   6. WEB AUDIO SYNTH – Happy Birthday melody
   ========================================================= */
function playSynth() {
  if (isSynthPlaying) return;
  isSynthPlaying = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Happy Birthday melody: [freq Hz, beats]
  const notes = [
    [261.63, 0.75], [261.63, 0.25], [293.66, 1], [261.63, 1], [349.23, 1], [329.63, 2],
    [261.63, 0.75], [261.63, 0.25], [293.66, 1], [261.63, 1], [392.00, 1], [349.23, 2],
    [261.63, 0.75], [261.63, 0.25], [523.25, 1], [440.00, 1], [349.23, 1], [329.63, 1], [293.66, 2],
    [466.16, 0.75], [466.16, 0.25], [440.00, 1], [349.23, 1], [392.00, 1], [349.23, 2]
  ];

  const TEMPO = 380;
  let idx = 0;

  function playNote() {
    if (!isSynthPlaying) return;
    const [freq, beats] = notes[idx % notes.length];
    const dur = beats * TEMPO;

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.13, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000 - 0.04);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);

    idx++;
    synthInterval = setTimeout(playNote, dur);
  }
  playNote();
}

function stopSynth() {
  isSynthPlaying = false;
  if (synthInterval) { clearTimeout(synthInterval); synthInterval = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}


/* =========================================================
   7. CANVAS CONFETTI ENGINE (high-performance)
   ========================================================= */
function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const COLORS = ["#ff6eb4","#a855f7","#fbbf24","#60a5fa","#34d399","#f472b6","#fff9","#e879f9"];

  class Piece {
    constructor(fromX, fromY) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 6;
      this.x   = fromX;
      this.y   = fromY;
      this.vx  = Math.cos(angle) * speed;
      this.vy  = Math.sin(angle) * speed - 8;
      this.r   = Math.random() * 6 + 4;
      this.rot = Math.random() * 360;
      this.rotV = (Math.random() - 0.5) * 6;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.shape = ["rect","circle","heart"][Math.floor(Math.random() * 3)];
      this.alpha = 1;
      this.gravity = 0.22;
      this.drag    = 0.97;
    }
    update() {
      this.vx *= this.drag;
      this.vy  = this.vy * this.drag + this.gravity;
      this.x  += this.vx;
      this.y  += this.vy;
      this.rot += this.rotV;
      this.alpha -= 0.007;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      if (this.shape === "rect") {
        ctx.fillRect(-this.r, -this.r * 0.5, this.r * 2, this.r);
      } else if (this.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Heart
        const s = this.r * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.quadraticCurveTo(-s, -s * 0.3, -s, s * 0.15);
        ctx.quadraticCurveTo(-s, -s * 1.2, 0, -s * 0.5);
        ctx.quadraticCurveTo(s, -s * 1.2, s, s * 0.15);
        ctx.quadraticCurveTo(s, -s * 0.3, 0, s * 0.4);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const pieces = [];
  const CX = canvas.width / 2;
  const CY = canvas.height * 0.5;

  // Initial burst
  for (let i = 0; i < 280; i++) pieces.push(new Piece(CX, CY));

  let spawning = true;
  setTimeout(() => spawning = false, 3500);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (spawning) {
      pieces.push(new Piece(Math.random() * canvas.width, -10));
      if (Math.random() > 0.5) pieces.push(new Piece(CX + (Math.random() - 0.5) * 200, CY));
    }

    for (let i = pieces.length - 1; i >= 0; i--) {
      pieces[i].update();
      pieces[i].draw();
      if (pieces[i].alpha <= 0 || pieces[i].y > canvas.height + 50) pieces.splice(i, 1);
    }

    if (pieces.length > 0 || spawning) requestAnimationFrame(animate);
  }
  animate();
}