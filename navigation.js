(() => {
  const names = ['intro', 'overview', 'projects', 'signals', 'controls', 'releases', 'connections'];
  const views = names.map(name => document.getElementById(`view-${name}`));
  const app = document.getElementById('app');
  let current = null;
  let animations = [];
  let generation = 0;
  function navigate() {
    const requested = location.hash.replace(/^#\/?/, '');
    const name = names.includes(requested) ? requested : 'intro';
    if (location.hash !== `#/${name}`) history.replaceState(null, '', `#/${name}`);
    if (current === name) return;
    const version = ++generation;
    animations.forEach(animation => animation.cancel());
    animations = [];
    const previous = current && document.getElementById(`view-${current}`);
    const next = document.getElementById(`view-${name}`);
    views.forEach(view => {
      view.hidden = view !== next;
      view.inert = view !== next;
      view.setAttribute('aria-hidden', String(view !== next));
    });
    app.classList.toggle('intro-mode', name === 'intro');
    document.getElementById('route-name').textContent = name === 'intro' ? 'INTRODUCTION' : name.toUpperCase();
    document.querySelectorAll('[data-route]').forEach(link => {
      if (link.dataset.route === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `${name === 'intro' ? 'Welcome' : name[0].toUpperCase() + name.slice(1)} — Sentinel Stack`;
    next.scrollTop = 0;
    if (previous && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      previous.hidden = false;
      previous.style.zIndex = '1';
      next.style.zIndex = '2';
      animations.push(previous.animate([
        { transform: 'scale(1)', opacity: 1, filter: 'blur(0px)' },
        { transform: 'scale(.995)', opacity: 0, filter: 'blur(0px)' }
      ], { duration: 260, easing: 'ease-out', fill: 'both' }));
      const incoming = next.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      animations.push(incoming);
      const elements = [...next.children];
      elements.forEach((element, index) => {
        animations.push(element.animate([
          { opacity: 0, transform: 'translateY(10px) scale(1)', filter: 'blur(0px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
        ], { duration: 460, delay: 30 + index * 35, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
      });
      incoming.finished.then(() => {
        if (version === generation) previous.hidden = true;
      }).catch(() => {});
    }
    if (current) next.querySelector('h1')?.focus({ preventScroll: true });
    current = name;
  }
  addEventListener('hashchange', navigate);
  navigate();
})();
