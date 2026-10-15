// Hero background: a subtle liquid-metal WebGL effect (threejs-components),
// toned down from its flashy default intensity per request. Skipped entirely
// on touch devices and when the user prefers reduced motion — it's a
// nice-to-have visual, not essential, so there's no reason to spend GPU/
// battery on it there. A plain <img> fallback sits behind the canvas, so if
// the CDN module fails to load (offline, blocked, etc.) the hero still shows
// a normal static photo instead of a blank canvas.
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!isTouchDevice && !prefersReducedMotion) {
  const canvas = document.getElementById('heroLiquidCanvas');

  if (canvas) {
    import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js')
      .then((module) => {
        const LiquidBackground = module.default;
        const app = LiquidBackground(canvas);
        // The library's shader always "cover"-fits the texture centred, which
        // on wide windows slices through the hair. Patch the sampled UV to
        // match the CSS fallback's object-position: 85% 25% — biased toward
        // the top (head keeps its headroom) and right (he stands on the right).
        const plane = app.liquidPlane;
        const baseCompile = plane.material.onBeforeCompile;
        plane.material.onBeforeCompile = (shader, renderer) => {
          baseCompile(shader, renderer);
          // replaceAll: the library's shader has a commented-out copy of
          // this line *before* the live one, so a single replace() only
          // ever patched the comment.
          shader.fragmentShader = shader.fragmentShader.replaceAll(
            'vec2 newUV = ((vUv - 0.5) * uvMapScale + 0.5)',
            'vec2 newUV = ((vUv - 0.5) * uvMapScale + 0.5) + vec2((1.0 - uvMapScale.x) * 0.35, (1.0 - uvMapScale.y) * 0.25)'
          );
        };
        plane.material.needsUpdate = true;
        app.loadImage('assets/images/theshan/theshan-hero.jpg');

        // Toned down from the library's defaults (metalness .75 / roughness
        // .25 / displacementScale 5) — those read as a dramatic, shiny chrome
        // ripple; this keeps it a gentle, barely-there wave instead.
        app.liquidPlane.material.metalness = 0.15;
        app.liquidPlane.material.roughness = 0.75;
        app.liquidPlane.uniforms.displacementScale.value = 1.2;
        app.setRain(false);

        // Pause the render loop while the hero is scrolled out of view —
        // a WebGL animation loop costs real GPU time even when nothing is
        // visibly changing on screen, so there's no reason to keep it
        // running once the user has scrolled past it.
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (typeof app.pause === 'function' && typeof app.play === 'function') {
              if (entry.isIntersecting) app.play();
              else app.pause();
            }
          });
        }, { threshold: 0 });
        io.observe(canvas);
      })
      .catch((err) => {
        console.warn('Liquid hero background unavailable — showing the static photo instead.', err);
      });
  }
}
