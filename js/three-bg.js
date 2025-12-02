// Lightweight site-wide Three.js background
(function(){
  if(window.__THREE_BG_INITIALIZED) return;
  window.__THREE_BG_INITIALIZED = true;

  const RED = 0xF4000A;
  const BLUE = 0x00ADF1;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;

  // Ensure THREE exists or try to load it dynamically
  function ensureThree(cb){
    if(window.THREE) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  ensureThree(init);

  function init(){
    if(!window.THREE) return; // give up if three failed to load

    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 30);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const pLight = new THREE.PointLight(0xffffff, 0.6, 200);
    pLight.position.set(0,20,50);
    scene.add(pLight);

    // simple geometry palette
    const geomSphere = new THREE.IcosahedronGeometry(0.6, 1);
    const geomBox = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    const mats = [
      new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.6, metalness: 0.2, emissive: BLUE, emissiveIntensity: 0.02 }),
      new THREE.MeshStandardMaterial({ color: RED, roughness: 0.6, metalness: 0.2, emissive: RED, emissiveIntensity: 0.02 })
    ];

    const particles = [];
    const COUNT = prefersReduced ? 10 : 36;
    for(let i=0;i<COUNT;i++){
      const use = (i%2===0) ? geomSphere : geomBox;
      const mat = mats[i%2];
      const m = new THREE.Mesh(use, mat);
      const a = (Math.random()-0.5) * Math.PI * 2;
      const r = 10 + Math.random() * 30;
      m.position.set(Math.cos(a)*r, (Math.random()-0.4)*8, Math.sin(a)*r * 0.6);
      m.scale.setScalar(0.4 + Math.random()*1.3);
      m.userData = { ang: a, rad: r, speed: 0.001 + Math.random()*0.004 };
      group.add(m);
      particles.push(m);
    }

    let running = true;
    let last = performance.now();

    function onResize(){
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w,h);
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }

    window.addEventListener('resize', onResize, { passive: true });

    // Pause when page hidden
    document.addEventListener('visibilitychange', ()=>{
      running = !document.hidden;
    }, false);

    // Allow disabling via body attribute
    const observer = new MutationObserver(()=>{
      const disabled = document.body && document.body.dataset.bgDisabled === 'true';
      running = !disabled && !document.hidden;
      canvas.style.display = disabled ? 'none' : 'block';
    });
    observer.observe(document.documentElement || document.body, { attributes: true, subtree: false, attributeFilter: ['data-bg-disabled'] });

    function animate(now){
      const dt = Math.min(40, now - last) / 1000; last = now;
      if(running){
        // rotate group slowly
        group.rotation.y += dt * 0.08;
        group.rotation.x += dt * 0.02;

        // orbit each particle
        for(const p of particles){
          p.userData.ang += p.userData.speed * (prefersReduced ? 0.2 : 1);
          const a = p.userData.ang;
          const rr = p.userData.rad;
          p.position.x = Math.cos(a) * rr;
          p.position.z = Math.sin(a) * rr * 0.6;
          p.position.y += Math.sin(a * 0.5) * 0.01;
          p.rotation.x += dt * 0.2 * (p.scale.x);
          p.rotation.y += dt * 0.15 * (p.scale.x);
        }

        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // expose a toggle utility
    window.__toggleBg = function(enabled){
      document.body.dataset.bgDisabled = enabled ? 'false' : 'true';
      running = enabled;
    };
  }
})();
