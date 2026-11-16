import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Heading2, Link, Image, Upload, List, ListOrdered, Quote, Code, Save, Send, Plus, RefreshCw } from 'lucide-react';
import Markdown from './Markdown';
import { posts as seeds } from '../content/posts';
import { postMarkdown, articleUrl } from '../lib/blog';

const empty = { title: '', slug: '', tag: 'Reliability', excerpt: '', body: '', etag: null };
const storageKey = 'pereowei-blog-draft';
const toSlug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/, '');

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request failed. Your local draft is unchanged.');
  return data;
}

export default function AdminEditor({ navigation, footer }) {
  const [draft, setDraft] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { ...empty, ...Object.fromEntries(Object.keys(empty).map((key) => [key, typeof data[key] === 'string' ? data[key] : empty[key]])) };
    } catch { return empty; }
  });
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [dirty, setDirty] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}').unsaved ?? Boolean(draft.title || draft.body); }
    catch { return Boolean(draft.title || draft.body); }
  });
  const [insertion, setInsertion] = useState(null);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const locked = Boolean(draft.etag) || seeds.some((post) => post.slug === draft.slug);

  async function refresh() {
    try {
      const result = await api('/.netlify/functions/blog-admin');
      setRecords(result.documents);
      setError('');
    } catch (reason) { setError(reason.message); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ ...draft, unsaved: dirty })); setDeviceError(''); }
    catch { setDeviceError('Device storage is unavailable. Save this draft to keep your changes.'); }
  }, [draft, dirty]);

  const documents = new Map(seeds.map((post) => [post.slug, {
    draft: { ...post, body: postMarkdown(post) }, published: post, status: 'published', etag: 'seed',
  }]));
  records.forEach((record) => documents.set(record.draft.slug, record));

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setDirty(true); setNotice('');
  }
  function open(record) {
    if (dirty && !window.confirm('Replace the current local draft? Save it first to keep your changes.')) return;
    setDraft(record ? { ...empty, ...record.draft, etag: record.etag } : { ...empty });
    selectionRef.current = { start: 0, end: 0 };
    setDirty(false); setNotice(''); setError(''); setInsertion(null);
  }
  function rememberSelection() {
    const node = bodyRef.current;
    if (node) selectionRef.current = { start: node.selectionStart, end: node.selectionEnd };
  }
  function insert(prefix, suffix = '', placeholder = 'text') {
    const { start, end } = selectionRef.current;
    const selected = draft.body.slice(start, end) || placeholder;
    update('body', draft.body.slice(0, start) + prefix + selected + suffix + draft.body.slice(end));
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }
  function showInsertion(mode) {
    setInsertion(mode); setAddress('');
    const { start, end } = selectionRef.current;
    setLabel(draft.body.slice(start, end));
  }
  function insertAddress() {
    let url;
    try {
      url = new URL(address);
      if (!(insertion === 'image' ? ['https:'] : ['https:', 'http:', 'mailto:']).includes(url.protocol)) throw new Error();
    } catch { setError('Enter a valid web address.'); return; }
    const text = (label || (insertion === 'image' ? 'Image description' : 'Link')).replace(/[\[\]\\]/g, '\\$&');
    const { start, end } = selectionRef.current;
    const markdown = `${insertion === 'image' ? '!' : ''}[${text}](${url.href.replace(/\(/g, '%28').replace(/\)/g, '%29')})`;
    update('body', draft.body.slice(0, start) + markdown + draft.body.slice(end));
    setInsertion(null); setError('');
  }
  async function save(action) {
    const candidate = { ...draft, slug: draft.slug || toSlug(draft.title) };
    if (!candidate.title.trim() || !candidate.slug) { setError('Add a title and URL slug.'); return null; }
    setBusy(true); setError(''); setNotice('');
    try {
      const { document } = await api('/.netlify/functions/blog-admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, draft: candidate, etag: draft.etag }),
      });
      setDraft({ ...document.draft, etag: document.etag });
      setRecords((current) => [...current.filter((entry) => entry.draft.slug !== document.draft.slug), document]);
      setDirty(false);
      setNotice(action === 'publish' ? 'Published. Your article is live.' : action === 'unpublish' ? 'Unpublished. Your draft is saved.' : 'Draft saved to your account.');
      if (action !== 'draft') window.dispatchEvent(new Event('blog-published'));
      return document;
    } catch (reason) { setError(reason.message); return null; }
    finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Images must be 3 MB or smaller.'); return; }
    const record = await save('draft');
    if (!record) return;
    setBusy(true); setNotice('Uploading image...');
    try {
      const { url } = await api(`/.netlify/functions/blog-media?slug=${encodeURIComponent(record.draft.slug)}`, {
        method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file,
      });
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]\\]/g, '\\$&');
      const { start, end } = selectionRef.current;
      setDraft((current) => ({ ...current, body: current.body.slice(0, start) + `\n![${alt}](${url})\n` + current.body.slice(end) }));
      setDirty(true); setNotice('Image added. Save or publish to keep the article change.');
    } catch (reason) { setError(reason.message); setNotice(''); }
    finally { setBusy(false); }
  }
  const tools = [
    ['Heading', Heading2, () => insert('\n## ', '\n', 'Heading')],
    ['Bold', Bold, () => insert('**', '**')], ['Italic', Italic, () => insert('*', '*')],
    ['Link', Link, () => showInsertion('link')], ['Image URL', Image, () => showInsertion('image')],
    ['Upload image', Upload, () => fileRef.current?.click()],
    ['Bullet list', List, () => insert('\n- ', '\n', 'List item')],
    ['Numbered list', ListOrdered, () => insert('\n1. ', '\n', 'List item')],
    ['Quote', Quote, () => insert('\n> ', '\n', 'Quote')],
    ['Code block', Code, () => insert('\n```\n', '\n```\n', 'code')],
  ];
  const current = documents.get(draft.slug);

  return <main id="main-content"><section className="page-shell admin-page" aria-labelledby="admin-title">
    {navigation}
    <div className="admin-hero"><p className="eyebrow">/ Writing room</p><h1 id="admin-title">A new field note.</h1>
      <p>{dirty ? 'Unsaved changes' : current?.status === 'published' ? 'Published' : 'Draft'}{draft.title ? ` / ${draft.title}` : ''}</p>
    </div>
    <div className="document-controls">
      <label>Saved articles<select disabled={busy} value="" onChange={(event) => open(documents.get(event.target.value))}>
        <option value="" disabled>Open an article...</option>
        {[...documents.values()].map((entry) => <option key={entry.draft.slug} value={entry.draft.slug}>{entry.draft.title} / {entry.status}</option>)}
      </select></label>
      <button className="button secondary-button" type="button" disabled={busy} onClick={() => open(null)}><Plus size={16} />New article</button>
      <button className="icon-button" type="button" title="Reload saved articles" aria-label="Reload saved articles" disabled={busy} onClick={refresh}><RefreshCw size={18} /></button>
    </div>
    {error && <p className="editor-notice error" role="alert">{error}</p>}
    {error.startsWith('Please sign in') && <a className="text-link" href="/.netlify/functions/auth-login">Sign in again</a>}
    {deviceError && <p className="editor-notice error" role="alert">{deviceError}</p>}
    <p className="editor-notice" role="status" aria-live="polite">{notice || (busy ? 'Saving...' : '')}</p>
    <div className="admin-layout">
      <form className="editor-panel" onSubmit={(event) => { event.preventDefault(); save('draft'); }}>
        <fieldset disabled={busy}>
          <label>Title<input name="title" autoComplete="off" maxLength={180} value={draft.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label>URL slug<input name="slug" autoComplete="off" maxLength={100} readOnly={locked} value={draft.slug} placeholder={toSlug(draft.title) || 'article-url'} onChange={(event) => update('slug', event.target.value)} /></label>
          <label>Tag<input name="tag" maxLength={60} value={draft.tag} onChange={(event) => update('tag', event.target.value)} /></label>
          <label>Excerpt<textarea name="excerpt" maxLength={500} rows={3} value={draft.excerpt} onChange={(event) => update('excerpt', event.target.value)} /></label>
          <div className="markdown-toolbar" role="toolbar" aria-label="Article formatting">{tools.map(([name, Icon, action]) => <button key={name} type="button" className="icon-button" title={name} aria-label={name} onClick={action}><Icon size={18} /></button>)}</div>
          <input className="image-upload" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Choose article image" onChange={upload} />
          {insertion && <div className="link-insertion"><label>{insertion === 'image' ? 'Image description' : 'Link text'}<input value={label} onChange={(event) => setLabel(event.target.value)} /></label><label>Address<input type="url" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="https://" /></label><div><button type="button" className="button" onClick={insertAddress}>Insert</button><button type="button" className="button secondary-button" onClick={() => setInsertion(null)}>Cancel</button></div></div>}
          <label>Body<textarea name="body" ref={bodyRef} rows={20} maxLength={100000} value={draft.body} onSelect={rememberSelection} onBlur={rememberSelection} onChange={(event) => update('body', event.target.value)} /></label>
          <div className="editor-actions"><button type="submit" className="button secondary-button"><Save size={16} />Save draft</button><button type="button" className="button" onClick={() => save('publish')}><Send size={16} />{current?.published ? 'Update article' : 'Publish'}</button>{current?.published && <button type="button" className="button secondary-button" onClick={() => { if (window.confirm('Remove this article from the public blog? The draft will remain saved.')) save('unpublish'); }}>Unpublish</button>}</div>
        </fieldset>
        {current?.published && <a className="text-link" href={articleUrl(draft.slug)}>View published article</a>}
      </form>
      <aside className="preview-panel"><p className="post-meta">{draft.tag || 'Tag'} / Preview</p><h2>{draft.title || 'Untitled draft'}</h2><p>{draft.excerpt}</p><div className="preview-body"><Markdown>{draft.body || '*Your article preview will appear here.*'}</Markdown></div></aside>
    </div>
  </section>{footer}</main>;
}
