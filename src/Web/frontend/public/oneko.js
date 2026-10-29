// advanced_oneko.js - A polite, non-intrusive desktop cat companion

(function oneko() {
  const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
  const isCoarsePointer = window.matchMedia(`(pointer: coarse)`).matches === true;
  if (isReducedMotion || isCoarsePointer || window.innerWidth < 768) return;

  function isAdminRoute() {
    const p = window.location.pathname || "";
    return p.startsWith("/login") || p.startsWith("/dashboard");
  }

  const spriteSets = {
    idle: [[-3, -3]], alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]], scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]], scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]], sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]], NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]], SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]], SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]], NW: [[-1, 0], [-1, -1]],
  };

  let mousePosX = -9999;
  let mousePosY = -9999;
  let mouseHasMoved = false;

  document.addEventListener("mousemove", (e) => {
    mousePosX = e.clientX;
    mousePosY = e.clientY;
    mouseHasMoved = true;
  });

  const allNekos = [];

  class Neko {
    constructor(id, type) {
      this.id = id;
      this.type = type;
      this.el = document.createElement("div");
      this.el.id = "neko-" + id;
      this.el.style.width = "32px";
      this.el.style.height = "32px";
      this.el.style.position = "fixed";
      this.el.style.pointerEvents = "auto";
      this.el.style.cursor = "pointer";
      this.el.style.imageRendering = "pixelated";
      this.el.style.zIndex = 2147483647;
      this.el.style.backgroundImage = `url(/oneko.gif)`;
      
      const hue = Math.floor(Math.random() * 360);
      if (type === 'dog') {
        this.el.style.filter = `sepia(1) hue-rotate(${hue}deg) saturate(3)`;
      } else {
        if (Math.random() > 0.5) this.el.style.filter = `hue-rotate(${hue}deg)`;
      }

      document.body.appendChild(this.el);

      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      
      // Spawn politely near bottom-right corner instead of blocking center of screen
      this.posX = Math.max(48, w - 96);
      this.posY = Math.max(48, h - 108);
      this.targetX = this.posX;
      this.targetY = this.posY;
      
      this.speed = 5;
      this.state = 'idle';
      
      this.frameCount = 0;
      this.idleTime = 0;
      this.idleAnimation = null;
      this.idleAnimationFrame = 0;
      
      allNekos.push(this);
    }

    setSprite(name, frame) {
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      this.el.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }

    resetIdle() {
      this.idleAnimation = null;
      this.idleAnimationFrame = 0;
    }

    pickRandomTarget() {
      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      this.targetX = Math.min(Math.max(48, this.posX + (Math.random() * 160 - 80)), w - 48);
      this.targetY = Math.min(Math.max(48, this.posY + (Math.random() * 160 - 80)), h - 48);
      this.state = 'roam';
      this.resetIdle();
    }

    doIdle() {
      this.idleTime += 1;
      if (this.idleTime > 10 && Math.floor(Math.random() * 80) === 0 && !this.idleAnimation) {
        let anims = ["sleeping", "scratchSelf"];
        if (this.posX < 40) anims.push("scratchWallW");
        if (this.posY < 40) anims.push("scratchWallN");
        if (this.posX > window.innerWidth - 40) anims.push("scratchWallE");
        if (this.posY > window.innerHeight - 40) anims.push("scratchWallS");
        this.idleAnimation = anims[Math.floor(Math.random() * anims.length)];
      }

      switch (this.idleAnimation) {
        case "sleeping":
          if (this.idleAnimationFrame < 8) { this.setSprite("tired", 0); break; }
          this.setSprite("sleeping", Math.floor(this.idleAnimationFrame / 4));
          if (this.idleAnimationFrame > 192) this.resetIdle();
          break;
        case "scratchWallN": case "scratchWallS": case "scratchWallE": case "scratchWallW": case "scratchSelf":
          this.setSprite(this.idleAnimation, this.idleAnimationFrame);
          if (this.idleAnimationFrame > 9) this.resetIdle();
          break;
        default:
          this.setSprite("idle", 0);
          break;
      }
      this.idleAnimationFrame += 1;

      if (Math.random() < 0.008 && this.idleAnimation === null) {
        this.pickRandomTarget();
      }
    }

    update() {
      if (isAdminRoute() || window.innerWidth < 768) {
        this.el.style.display = "none";
        return;
      }
      this.el.style.display = "block";

      this.frameCount += 1;
      
      const MAX_CHASE_DISTANCE = 220;
      const COMFORT_OFFSET = 75;

      if (mouseHasMoved) {
        const diffMouseX = this.posX - mousePosX;
        const diffMouseY = this.posY - mousePosY;
        const distToMouse = Math.hypot(diffMouseX, diffMouseY);

        if (distToMouse > MAX_CHASE_DISTANCE) {
          if (this.state === 'chase') {
            this.state = 'idle';
            this.targetX = this.posX;
            this.targetY = this.posY;
            this.resetIdle();
          }
        } else if (distToMouse > COMFORT_OFFSET + 10) {
          this.state = 'chase';
          const angle = Math.atan2(diffMouseY, diffMouseX);
          this.targetX = mousePosX + Math.cos(angle) * COMFORT_OFFSET;
          this.targetY = mousePosY + Math.sin(angle) * COMFORT_OFFSET;
        } else {
          if (this.state === 'chase') {
            this.state = 'idle';
            this.targetX = this.posX;
            this.targetY = this.posY;
          }
        }
      }

      const diffX = this.posX - this.targetX;
      const diffY = this.posY - this.targetY;
      const distance = Math.hypot(diffX, diffY);

      if (distance < this.speed) {
        if (this.state === 'roam' || this.state === 'socialize' || this.state === 'chase') {
          this.state = 'idle';
        }
        this.doIdle();
      } else {
        this.idleTime = 0;
        this.resetIdle();

        let direction = diffY / distance > 0.5 ? "N" : "";
        direction += diffY / distance < -0.5 ? "S" : "";
        direction += diffX / distance > 0.5 ? "W" : "";
        direction += diffX / distance < -0.5 ? "E" : "";
        this.setSprite(direction || "idle", this.frameCount);

        this.posX -= (diffX / distance) * this.speed;
        this.posY -= (diffY / distance) * this.speed;
      }

      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      
      if (isNaN(this.posX)) this.posX = w - 96;
      if (isNaN(this.posY)) this.posY = h - 108;

      this.posX = Math.min(Math.max(16, this.posX), w - 16);
      this.posY = Math.min(Math.max(16, this.posY), h - 16);
      this.el.style.left = `${this.posX - 16}px`;
      this.el.style.top = `${this.posY - 16}px`;
    }
  }

  let lastFrameTimestamp;
  function init() {
    new Neko("cat1", "cat");
    window.requestAnimationFrame(onAnimationFrame);
  }

  function onAnimationFrame(timestamp) {
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      for (let n of allNekos) n.update();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  init();
})();
