// advanced_oneko.js - A multi-cat interactive playground

(function oneko() {

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

  let mousePosX = 0;
  let mousePosY = 0;
  document.addEventListener("mousemove", (e) => {
    mousePosX = e.clientX;
    mousePosY = e.clientY;
  });

  const allNekos = [];

  class Neko {
    constructor(id, type) {
      this.id = id;
      this.type = type; // 'cat' or 'dog' (we simulate dog with color filter for now)
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
      
      // Give them unique colors
      const hue = Math.floor(Math.random() * 360);
      if (type === 'dog') {
        this.el.style.filter = `sepia(1) hue-rotate(${hue}deg) saturate(3)`;
      } else {
        if (Math.random() > 0.5) this.el.style.filter = `hue-rotate(${hue}deg)`;
      }

      document.body.appendChild(this.el);

      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      
      // Always spawn exactly in the center of the screen
      this.posX = w / 2;
      this.posY = h / 2;
      this.targetX = this.posX;
      this.targetY = this.posY;
      
      this.speed = 8 + Math.random() * 4;
      this.state = 'idle'; // idle, roam, chase, socialize
      
      this.frameCount = 0;
      this.idleTime = 0;
      this.idleAnimation = null;
      this.idleAnimationFrame = 0;
      
      this.chaseTimeout = 0;
      
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
      // 30% chance to go find the other cat to play
      if (Math.random() < 0.3 && allNekos.length > 1) {
        const other = allNekos.find(n => n !== this);
        if (other) {
           this.targetX = other.posX + (Math.random() * 40 - 20);
           this.targetY = other.posY + (Math.random() * 40 - 20);
           this.state = 'roam';
           this.resetIdle();
           return;
        }
      }
      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      this.targetX = Math.random() * (w - 64) + 32;
      this.targetY = Math.random() * (h - 64) + 32;
      this.state = 'roam';
      this.resetIdle();
    }

    doIdle() {
      this.idleTime += 1;
      if (this.idleTime > 10 && Math.floor(Math.random() * 100) === 0 && !this.idleAnimation) {
        let anims = ["sleeping", "scratchSelf"];
        if (this.posX < 32) anims.push("scratchWallW");
        if (this.posY < 32) anims.push("scratchWallN");
        if (this.posX > window.innerWidth - 32) anims.push("scratchWallE");
        if (this.posY > window.innerHeight - 32) anims.push("scratchWallS");
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

      // Randomly decide to roam again
      if (Math.random() < 0.01 && this.idleAnimation === null) {
        this.pickRandomTarget();
      }
    }

    update() {
      this.frameCount += 1;
      
      // Check distance to mouse
      const distToMouse = Math.sqrt((this.posX - mousePosX)**2 + (this.posY - mousePosY)**2);
      
      // Wake up and chase if mouse is close!
      if (distToMouse < 100) {
        this.state = 'chase';
        this.chaseTimeout = 100; // frames to keep chasing even if mouse moves away slightly
      }

      if (this.state === 'chase') {
        this.targetX = mousePosX;
        this.targetY = mousePosY;
        this.chaseTimeout -= 1;
        if (this.chaseTimeout <= 0) {
          this.state = 'idle';
        }
      }

      // Check socializing (interacting with other nekos)
      if (this.state === 'roam' || this.state === 'idle') {
        for (let other of allNekos) {
          if (other !== this && (other.state === 'idle' || other.state === 'socialize' || other.state === 'roam')) {
            const distToOther = Math.sqrt((this.posX - other.posX)**2 + (this.posY - other.posY)**2);
            if (distToOther < 60 && Math.random() < 0.05) {
              this.state = 'socialize';
              this.targetX = other.posX + (Math.random() * 20 - 10);
              this.targetY = other.posY + (Math.random() * 20 - 10);
              other.state = 'socialize'; // Make them play together
            }
          }
        }
      }

      // Movement logic
      const diffX = this.posX - this.targetX;
      const diffY = this.posY - this.targetY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

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

      // Constrain to screen
      const w = window.innerWidth || document.documentElement.clientWidth || 800;
      const h = window.innerHeight || document.documentElement.clientHeight || 600;
      
      // Ensure NaN doesn't break everything
      if (isNaN(this.posX)) this.posX = w / 2;
      if (isNaN(this.posY)) this.posY = h / 2;

      this.posX = Math.min(Math.max(16, this.posX), w - 16);
      this.posY = Math.min(Math.max(16, this.posY), h - 16);
      this.el.style.left = `${this.posX - 16}px`;
      this.el.style.top = `${this.posY - 16}px`;
    }
  }

  // Spawn exactly 1 cat for testing
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
