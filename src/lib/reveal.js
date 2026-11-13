export function observeReveals(root, { IntersectionObserver, MutationObserver }) {
  const visit = (node, callback) => {
    if (node.matches?.('[data-reveal]')) callback(node);
    node.querySelectorAll?.('[data-reveal]').forEach(callback);
  };

  const intersections = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        intersections.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });

  const observe = (node) => {
    if (!node.classList.contains('is-visible')) intersections.observe(node);
  };

  // Authentication and other async views mount after the initial route effect.
  const mutations = new MutationObserver((records) => {
    records.forEach((record) => {
      record.removedNodes.forEach((node) => visit(node, (target) => intersections.unobserve(target)));
      record.addedNodes.forEach((node) => visit(node, observe));
    });
  });
  mutations.observe(root, { childList: true, subtree: true });
  visit(root, observe);

  return () => {
    mutations.disconnect();
    intersections.disconnect();
  };
}
