import test from 'node:test';
import assert from 'node:assert/strict';
import { observeReveals } from '../src/lib/reveal.js';

function element({ reveal = false, children = [] } = {}) {
  const classes = new Set();
  return {
    matches: () => reveal,
    querySelectorAll: () => children,
    classList: { add: (value) => classes.add(value), contains: (value) => classes.has(value) },
  };
}

function harness(root) {
  let intersect, mutate;
  const observed = new Set();
  let intersectionsDisconnected = false;
  let mutationsDisconnected = false;
  const cleanup = observeReveals(root, {
    IntersectionObserver: class {
      constructor(callback) { intersect = callback; }
      observe(node) { observed.add(node); }
      unobserve(node) { observed.delete(node); }
      disconnect() { intersectionsDisconnected = true; observed.clear(); }
    },
    MutationObserver: class {
      constructor(callback) { mutate = callback; }
      observe(target, options) {
        assert.equal(target, root);
        assert.deepEqual(options, { childList: true, subtree: true });
      }
      disconnect() { mutationsDisconnected = true; }
    },
  });
  return {
    observed, cleanup,
    intersect: (...entries) => intersect(entries),
    mutate: (addedNodes = [], removedNodes = []) => mutate([{ addedNodes, removedNodes }]),
    disconnected: () => intersectionsDisconnected && mutationsDisconnected,
  };
}

test('reveals initial content only when it enters the viewport', () => {
  const heading = element({ reveal: true });
  const view = harness(element({ children: [heading] }));
  assert.ok(view.observed.has(heading));
  view.intersect({ target: heading, isIntersecting: false });
  assert.equal(heading.classList.contains('is-visible'), false);
  view.intersect({ target: heading, isIntersecting: true });
  assert.ok(heading.classList.contains('is-visible'));
  assert.equal(view.observed.has(heading), false);
});

test('reveals an editor subtree mounted after the async session succeeds', () => {
  const view = harness(element());
  const heading = element({ reveal: true });
  const form = element({ reveal: true });
  const preview = element({ reveal: true });
  view.mutate([element({ children: [heading, form, preview] })]);
  for (const target of [heading, form, preview]) {
    assert.ok(view.observed.has(target));
    view.intersect({ target, isIntersecting: true });
    assert.ok(target.classList.contains('is-visible'));
  }
});

test('handles added reveal roots, text nodes, and already visible content', () => {
  const view = harness(element());
  const visible = element({ reveal: true });
  visible.classList.add('is-visible');
  const added = element({ reveal: true });
  view.mutate([{}, visible, added]);
  assert.deepEqual([...view.observed], [added]);
});

test('stops observing removed elements and disconnects on route cleanup', () => {
  const form = element({ reveal: true });
  const view = harness(element({ children: [form] }));
  view.mutate([], [element({ children: [form] })]);
  assert.equal(view.observed.has(form), false);
  view.cleanup();
  assert.ok(view.disconnected());
});
