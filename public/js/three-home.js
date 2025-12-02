  // Bookshelf scene: centered shelf, books spawn and fall one-by-one onto shelf,
  // and multiple candles along the shelf. Keeps scene lightweight and responsive.
  (function () {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !window.THREE) {
      setTimeout(() => document.dispatchEvent(new Event('threeReady')), 20);
      return;
    }

    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    // move camera back and slightly up to frame the taller cabinet
    camera.position.set(0, 2.6, 9.5);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(3, 10, 5);
    scene.add(sun);

    // Fill from below (tinted to brand blue)
    const fill = new THREE.PointLight(0x00ADF1, 0.18, 15);
    fill.position.set(0, -2, 2);
    scene.add(fill);

    const root = new THREE.Group();
    scene.add(root);

    // Cabinet (closed shelf) - three tiers: top, middle, bottom
    // reduce shelf width back to a shorter length, increase cabinet height separately
    const shelfWidth = 3.6; // restored shorter shelf width per request
    const shelfHeight = 0.25;
    const shelfDepth = 0.6;
    // lower the whole cabinet slightly so it sits lower on the page
    const shelfY = -1.0;

    // Increase cabinetHeight so taller books fit without protruding
    const cabinetHeight = 4.8; // raised overall interior height
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.65 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x151420, roughness: 0.75 });

    // bottom panel (visible lip)
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth + 0.16, shelfHeight, shelfDepth + 0.16), panelMat);
    bottom.position.set(0, shelfY - shelfHeight / 2 - 0.02, 0);
    root.add(bottom);

    // top panel
    const top = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth + 0.16, shelfHeight, shelfDepth + 0.16), panelMat);
    top.position.set(0, shelfY + cabinetHeight - shelfHeight / 2 - 0.08, 0);
    root.add(top);

    // left and right side panels (full cabinet height)
    const sideW = 0.12;
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(sideW, cabinetHeight + 0.2, shelfDepth + 0.16), panelMat);
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(sideW, cabinetHeight + 0.2, shelfDepth + 0.16), panelMat);
    leftSide.position.set(-shelfWidth / 2 - sideW / 2, shelfY + cabinetHeight / 2 - 0.1, 0);
    rightSide.position.set(shelfWidth / 2 + sideW / 2, shelfY + cabinetHeight / 2 - 0.1, 0);
    root.add(leftSide);
    root.add(rightSide);

    // backboard (full height)
    const back = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth, cabinetHeight, 0.08), innerMat);
    back.position.set(0, shelfY + cabinetHeight / 2 - 0.1, -shelfDepth / 2 - 0.04);
    root.add(back);

    // interior shelf surfaces for three tiers (top, middle, bottom).
    // Tiers are placed at 3/4, 1/2, and 1/4 of the cabinet interior height.
    const tierYs = [shelfY + (3 / 4) * cabinetHeight, shelfY + (1 / 2) * cabinetHeight, shelfY + (1 / 4) * cabinetHeight];
    const plankHeight = 0.02;
    tierYs.forEach((y) => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth - 0.1, 0.02, shelfDepth - 0.08), new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.8 }));
      plank.position.set(0, y, 0);
      root.add(plank);
    });

    // Books already placed on shelf
    const books = [];

    // Define slots inside cabinet for each tier (left-to-right)
    const slotsPerRow = 8;
    const slotPadding = 0.06;
    const usableWidth = shelfWidth - 0.4; // inside margin
    const slotWidth = usableWidth / slotsPerRow;
    const slotX = [];
    for (let i = 0; i < slotsPerRow; i++) slotX.push(-usableWidth / 2 + slotWidth * i + slotWidth / 2);

    // Function to create a colored book mesh (spine faces front)
    function createBookMesh(colorHex, w, h, d) {
      // clamp depth so books sit fully inside the cabinet
      const maxDepth = Math.max(0.12, shelfDepth - 0.18);
      const depth = Math.min(d, maxDepth);
      const geom = new THREE.BoxGeometry(w, h, depth);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
      const m = new THREE.Mesh(geom, mat);
      return m;
    }

    // Two spawn queues: top-tier (drop from above) and mid-tier (rise from below)
    // Strict two-color palette: primary blue and secondary red only
    const palette = [0x00ADF1, 0xF4000A, 0x00ADF1, 0xF4000A, 0x00ADF1, 0xF4000A, 0x00ADF1, 0xF4000A];
    const spawnQueueTop = [];
    const spawnQueueMid = [];
    const spawnQueueBottom = [];
    for (let i = 0; i < slotsPerRow; i++) {
      const w = Math.min(0.12 + Math.random() * 0.12, slotWidth - slotPadding);
      const h = 0.5 + Math.random() * 0.6;
      const d = 0.16 + Math.random() * 0.1;
      spawnQueueTop.push({ color: palette[i % palette.length], w, h, d });
    }
    for (let i = 0; i < slotsPerRow; i++) {
      const w = Math.min(0.12 + Math.random() * 0.12, slotWidth - slotPadding);
      const h = 0.5 + Math.random() * 0.6;
      const d = 0.16 + Math.random() * 0.1;
      spawnQueueMid.push({ color: palette[(i + 3) % palette.length], w, h, d });
    }
    for (let i = 0; i < slotsPerRow; i++) {
      const w = Math.min(0.12 + Math.random() * 0.12, slotWidth - slotPadding);
      const h = 0.45 + Math.random() * 0.5;
      const d = 0.16 + Math.random() * 0.08;
      spawnQueueBottom.push({ color: palette[(i + 5) % palette.length], w, h, d });
    }

    // Falling/placing books
    const falling = [];
    const rising = [];
    const gravity = -0.045;
    const spawnInterval = 60; // frames between spawns
    // runtime-adjustable values for responsiveness / reduced-motion
    let currentGravity = gravity;
    let currentSpawnInterval = spawnInterval;
    let spawnTimer = 0;
    let nextTopSlot = 0; // next slot index to fill on top tier (deprecated)
    let nextMidSlot = 0; // next slot index to fill on mid tier (deprecated)
    // occupancy tracking per tier: 0=top,1=mid,2=bottom
    const occupied = {
      0: new Array(slotsPerRow).fill(false),
      1: new Array(slotsPerRow).fill(false),
      2: new Array(slotsPerRow).fill(false)
    };
    // bottom tier will be placed immediately (static)
    let nextBottomSlot = 0;

    // Candles: more and positioned outside the cabinet (brighter for light theme)
    const candleCount = 28;
    const candles = [];
    function makeCandleModel() {
      const g = new THREE.Group();
      const candleGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.2, 12);
      // Candle body uses brand blue; emissive uses brand red for subtle glow
      const candleMat = new THREE.MeshStandardMaterial({ color: 0x00ADF1, roughness: 0.85, emissive: 0xF4000A, emissiveIntensity: 0.12 });
      const candle = new THREE.Mesh(candleGeom, candleMat);
      candle.position.y = 0.09;
      g.add(candle);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), new THREE.MeshBasicMaterial({ color: 0xF4000A }));
      flame.position.set(0, 0.2, 0);
      g.add(flame);
      // Point light uses brand red so flame/light align with palette
      const light = new THREE.PointLight(0xF4000A, 1.8, 6, 2);
      light.position.copy(flame.position);
      g.add(light);
      return { group: g, flame, light };
    }

    // Spread candles across the home page area (wider X range) and slightly in front
    const candleSpread = Math.max(12, shelfWidth * 1.8); // scale with shelf width
    for (let i = 0; i < candleCount; i++) {
      const c = makeCandleModel();
      const x = -candleSpread / 2 + (i + 0.5) * (candleSpread / candleCount) + (Math.random() - 0.5) * 0.6;
      const z = -shelfDepth / 2 - 0.4 + (Math.random() - 0.5) * 0.6; // in front of cabinet
      const y = shelfY - 0.4 + Math.random() * 2.0;
      c.group.position.set(x, y, z);
      root.add(c.group);
      candles.push(c);
    }

    // Utility: spawn a new book and target the next empty slot
    function findFirstFreeSlot(tier) {
      for (let i = 0; i < slotsPerRow; i++) if (!occupied[tier][i]) return i;
      return -1;
    }

    function spawnTopBook() {
      if (spawnQueueTop.length === 0) return;
      const slotIdx = findFirstFreeSlot(0);
      if (slotIdx === -1) return;
      const info = spawnQueueTop.shift();
      const m = createBookMesh(info.color, info.w, info.h, info.d);
      // start above the chosen slot
      m.position.set(slotX[slotIdx] + (Math.random() - 0.5) * 0.06, tierYs[0] + 2.0 + Math.random() * 0.6, -0.02);
      m.userData = { vy: -0.02, settled: false, targetSlot: slotIdx, tier: 0 };
      scene.add(m);
      falling.push(m);
    }

    function spawnMidBook() {
      if (spawnQueueMid.length === 0) return;
      // place mid (incoming from floor) books into the middle tier (tier 1)
      const slotIdx = findFirstFreeSlot(1);
      if (slotIdx === -1) return;
      const info = spawnQueueMid.shift();
      const m = createBookMesh(info.color, info.w, info.h, info.d);
      // start below the chosen slot (hand-placed from floor)
      m.position.set(slotX[slotIdx] + (Math.random() - 0.5) * 0.06, shelfY - 1.8 + Math.random() * 0.25, -0.02);
      m.userData = { vy: 0.06, rising: true, settled: false, targetSlot: slotIdx, tier: 1 };
      // reserve the slot now so another book isn't spawned to same slot
      occupied[1][slotIdx] = true;
      scene.add(m);
      rising.push(m);
    }

    // Place bottom-tier books immediately (static, do not fall)
    function placeBottomBooks() {
      for (let i = 0; i < spawnQueueBottom.length; i++) {
        const info = spawnQueueBottom[i];
        const m = createBookMesh(info.color, info.w, info.h, info.d);
        const halfHeight = m.geometry.parameters.height / 2;
        const targetY = getTargetYForTier(2, halfHeight);
        m.position.set(slotX[i], targetY, 0);
        m.rotation.y = (Math.random() - 0.5) * 0.06;
        m.userData = { settled: true, targetSlot: i, tier: 2 };
        scene.add(m);
        books.push(m);
        // mark bottom slot as occupied
        occupied[2][i] = true;
      }
    }

    // update falling books physics and snap into the correct tier slot positions
    function getTargetYForTier(tierIndex, halfHeight) {
      const tierY = tierYs[tierIndex];
      // plank sits at tierY with height plankHeight, so book bottom should rest on plank top
      return tierY + plankHeight / 2 + halfHeight;
    }

    // No cabinet pixel-shift animation — cabinet position controlled by `shelfY` and `root` directly

    function updateFalling() {
      for (let i = falling.length - 1; i >= 0; i--) {
        const b = falling[i];
        if (b.userData.settled) continue;
        b.userData.vy += currentGravity;
        b.position.y += b.userData.vy;
        const halfHeight = b.geometry.parameters.height / 2;
        const targetY = getTargetYForTier(b.userData.tier, halfHeight);
        if (b.position.y <= targetY) {
          const slotIdx = b.userData.targetSlot;
          b.position.y = targetY;
          b.position.x = slotX[slotIdx];
          b.position.z = 0;
          b.userData.vy = 0;
          b.userData.settled = true;
          b.rotation.y = (Math.random() - 0.5) * 0.08;
          books.push(b);
          occupied[b.userData.tier][slotIdx] = true;
        }
      }
    }

    // update rising (mid-tier) books that come from below and snap into middle tier
    function updateRising() {
      for (let i = rising.length - 1; i >= 0; i--) {
        const b = rising[i];
        if (b.userData.settled) continue;
        // simple upward motion with slight slowdown
        b.position.y += b.userData.vy;
        b.userData.vy -= 0.0025; // slow ascent
        const halfHeight = b.geometry.parameters.height / 2;
        const targetY = getTargetYForTier(b.userData.tier, halfHeight);
        if (b.position.y >= targetY) {
          const slotIdx = b.userData.targetSlot;
          b.position.y = targetY;
          b.position.x = slotX[slotIdx];
          b.position.z = 0;
          b.userData.settled = true;
          b.rotation.y = (Math.random() - 0.5) * 0.06;
          books.push(b);
          occupied[b.userData.tier][slotIdx] = true;
        }
      }
    }

    // Resize helper
    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
      // apply responsive tuning when resized
      applyResponsiveSettings();
    }

    // responsive tuning: camera, DPR, spawn timing, gravity, and candle visibility
    function applyResponsiveSettings() {
      const w = canvas.clientWidth || window.innerWidth;
      const isMobile = w < 700;
      const isTablet = w >= 700 && w < 1100;

      // Camera adjustments
      if (isMobile) camera.position.set(0, 1.9, 8.6);
      else if (isTablet) camera.position.set(0, 2.2, 9.0);
      else camera.position.set(0, 2.6, 9.5);

      // DPR cap for performance
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2));

      // reduced-motion and mobile-friendly timing
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        currentSpawnInterval = Math.max(140, spawnInterval * 3);
        currentGravity = gravity * 0.6;
      } else if (isMobile) {
        currentSpawnInterval = Math.max(100, Math.floor(spawnInterval * 1.8));
        currentGravity = gravity * 0.8;
      } else {
        currentSpawnInterval = spawnInterval;
        currentGravity = gravity;
      }

      // reduce candle count/visibility on small screens
      const desiredCandles = isMobile ? Math.max(4, Math.floor(candleCount / 6)) : (isTablet ? Math.max(8, Math.floor(candleCount / 3)) : candleCount);
      candles.forEach((c, i) => {
        if (i < desiredCandles) {
          c.group.visible = true;
          c.light.intensity = Math.min(1.8, c.light.intensity || 1);
        } else {
          c.group.visible = false;
        }
      });
    }

    let frame = 0;
    let threeReadyDispatched = false;

    // place bottom tier books now (static)
    placeBottomBooks();

    function animate() {
      requestAnimationFrame(animate);

      // spawn sequence: prioritize top-tier falling, then mid-tier (incoming) which now targets middle tier
      if (spawnTimer <= 0) {
        if (spawnQueueTop.length > 0) {
          spawnTopBook();
        } else if (spawnQueueMid.length > 0) {
          spawnMidBook();
        }
        spawnTimer = currentSpawnInterval;
      } else {
        spawnTimer--;
      }

      // update physics for both falling and rising books
      updateFalling();
      updateRising();

      // candle flicker
      candles.forEach((c, i) => {
        const flick = 0.85 + Math.sin(frame * 0.08 + i * 0.6) * 0.14 + (Math.random() - 0.5) * 0.04;
        c.flame.scale.setScalar(flick);
        c.light.intensity = 0.4 + Math.abs(Math.sin(frame * 0.05 + i)) * 0.9 * Math.random();
      });

      // slight camera bob for liveliness
      camera.position.y = 1.6 + Math.sin(frame * 0.003) * 0.03;
      camera.lookAt(0, shelfY + cabinetHeight / 3, 0);

      // no cabinet-shift animation active

      renderer.render(scene, camera);

      if (!threeReadyDispatched) {
        threeReadyDispatched = true;
        document.dispatchEvent(new Event('threeReady'));
      }
      frame++;
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    // no animated cabinet shift on load
    animate();
  })();
