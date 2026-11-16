import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';

function headingIds() {
  return (tree) => {
    const slugger = new GithubSlugger();
    tree.children.filter((node) => node.type === 'heading').forEach((node) => {
      node.data = { ...node.data, hProperties: { id: slugger.slug(toString(node)) } };
    });
  };
}

export default function Markdown({ children }) {
  return <div className="markdown-body"><ReactMarkdown
    remarkPlugins={[remarkGfm, headingIds]}
    skipHtml
    components={{
      h1: ({ node, ...props }) => <h2 {...props} />,
      img: ({ node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
      table: ({ node, ...props }) => <div className="markdown-table"><table {...props} /></div>,
      a: ({ node, ...props }) => <a {...props} rel="noopener noreferrer" />,
    }}
  >{children}</ReactMarkdown></div>;
}
