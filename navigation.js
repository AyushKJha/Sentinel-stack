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
    const direction = names.indexOf(name) >= names.indexOf(current) ? 1 : -1;
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
      animations.push(previous.animate([
        { transform: 'translateX(0)', opacity: 1 },
        { transform: `translateX(${-direction * 70}px)`, opacity: 0 }
      ], { duration: 280, easing: 'ease-in', fill: 'both' }));
      const incoming = next.animate([
        { transform: `translateX(${direction * 100}px)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animations.push(incoming);
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
