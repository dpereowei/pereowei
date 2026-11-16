import GithubSlugger from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';

export function postMarkdown(post) {
  return post.body ?? post.sections.map(({ heading, body }) => `## ${heading}\n\n${body}`).join('\n\n');
}

export function markdownHeadings(body) {
  const slugger = new GithubSlugger();
  return unified().use(remarkParse).parse(body).children
    .filter((node) => node.type === 'heading')
    .map((node) => ({ title: toString(node), id: slugger.slug(toString(node)), depth: node.depth }));
}

export function mergePosts(seeds, published, suppressed = []) {
  const merged = new Map(seeds.map((post) => [post.slug, post]));
  published.forEach((post) => merged.set(post.slug, post));
  return [...merged.values()].filter((post) => !suppressed.includes(post.slug)).sort((a, b) => b.date.localeCompare(a.date));
}

export function articleUrl(slug) {
  return `/#/blog/${slug}`;
}
