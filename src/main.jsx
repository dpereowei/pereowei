import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import portrait from '../assets/pereowei-headshot-bw-cutout.png';
import { experience, openSource, projects } from './content/portfolio';
import { getPost, posts } from './content/posts';
import './styles.css';

function getRoute() {
  const hash = window.location.hash.replace(/^#/, '');

  if (hash === '/blog') return { name: 'blog' };
  if (hash === '/admin') return { name: 'admin' };
  if (hash.startsWith('/blog/')) return { name: 'post', slug: hash.replace('/blog/', '') };

  return { name: 'home', anchor: hash || 'home' };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function useRoute() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

function useMotion(route) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    let cleanupSpotlights = () => {};

    window.requestAnimationFrame(() => {
      if (route.name === 'home') {
        document.getElementById(route.anchor)?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        return;
      }

      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    if (reduceMotion) {
      document.querySelectorAll('[data-reveal]').forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 }
    );

    document.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
      root.style.setProperty('--scroll-progress', progress.toFixed(4));
      document.body.dataset.scrolled = window.scrollY > 18 ? 'true' : 'false';
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };

    const onPointerMove = (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      root.style.setProperty('--pointer-x', x.toFixed(4));
      root.style.setProperty('--pointer-y', y.toFixed(4));
    };

    const spotlightCleanups = [...document.querySelectorAll('[data-spotlight]')].map((node) => {
      const onMove = (event) => {
        const bounds = node.getBoundingClientRect();
        node.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
        node.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
      };
      node.addEventListener('pointermove', onMove);
      return () => node.removeEventListener('pointermove', onMove);
    });
    cleanupSpotlights = () => spotlightCleanups.forEach((cleanup) => cleanup());

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      observer.disconnect();
      cleanupSpotlights();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [route.name, route.slug]);
}

function App() {
  const route = useRoute();
  useMotion(route);

  const view = useMemo(() => {
    if (route.name === 'blog') return <BlogIndex />;
    if (route.name === 'admin') return <AdminPage />;
    if (route.name === 'post') return <ArticlePage slug={route.slug} />;
    return <HomePage />;
  }, [route]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {view}
    </>
  );
}

function SiteNav({ page = false }) {
  return (
    <nav className={page ? 'nav page-nav' : 'nav'} aria-label="Primary navigation" data-reveal>
      <a href="#home" className="brand">Pereowei Daniel</a>
      <div className="nav-links">
        <a href="#work">Work</a>
        <a href="#/blog">Blog</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <SiteNav />

        <div className="hero-stage">
          <p className="hero-word" aria-hidden="true">PEREOWEI</p>
          <figure className="portrait-field">
            <img
              src={portrait}
              alt="Black and white portrait of Pereowei Daniel"
              className="portrait"
              width="1254"
              height="1254"
              fetchPriority="high"
            />
          </figure>

          <h1 className="hero-statement" id="hero-title" data-reveal>
            Infrastructure for systems that cannot afford quiet failure.
          </h1>

          <div className="hero-proof" data-reveal style={{ '--delay': '100ms' }}>
            <p>Lead Infrastructure Engineer</p>
            <p>FabricOps Maintainer under LFDT</p>
            <a className="text-link" href="#work">Selected work <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>

          <div className="hero-rail" aria-label="Professional availability">
            <p><span className="status-dot" /> Available for select opportunities</p>
            <p>Build <span>/</span> Operate <span>/</span> Improve</p>
          </div>
        </div>
      </section>

      <section className="work-section" id="work" aria-labelledby="work-title">
        <header className="chapter-header" data-reveal>
          <h2 id="work-title">Work /<br />Systems in production</h2>
          <div>
            <p>Real-world infrastructure.<br />Open systems. Lasting impact.</p>
            <span className="accent-rule" />
          </div>
        </header>

        <WorkChapter number="01" title="Experience" description="Building and operating infrastructure in high-trust environments.">
          {experience.map((item) => (
            <article className="experience-row" key={`${item.company}-${item.role}`}>
              <p className="row-meta">{item.dates}</p>
              <div>
                <h3>{item.company}</h3>
                <p>{item.role}</p>
              </div>
              <p className="row-summary">{item.summary}</p>
            </article>
          ))}
        </WorkChapter>

        <WorkChapter number="02" title="Selected Projects" description="Practical systems that solve real problems.">
          {projects.map((item, index) => (
            <article className="project-row" key={item.name}>
              <p className="row-number">{String(index + 1).padStart(2, '0')}</p>
              <h3>{item.name}</h3>
              <p className="row-meta">{item.tag}</p>
              <p className="row-summary">{item.description}</p>
            </article>
          ))}
        </WorkChapter>

        <WorkChapter number="03" title="Open Source" description="Contributing to healthier engineering ecosystems.">
          {openSource.map((item, index) => (
            <article className={index === 0 ? 'project-row featured-row' : 'project-row'} key={item.name}>
              <p className="row-number">{String(index + 1).padStart(2, '0')}</p>
              <h3>{item.name}</h3>
              <p className="row-meta">{item.tag}</p>
              <p className="row-summary">{item.description}</p>
            </article>
          ))}
        </WorkChapter>
      </section>

      <section className="writing-section" id="blog" aria-labelledby="blog-title">
        <header className="chapter-header" data-reveal>
          <h2 id="blog-title">Writing /<br />Field notes</h2>
          <div>
            <p>Ideas from the field.<br />Systems, lessons, and what is next.</p>
            <span className="accent-rule" />
          </div>
        </header>
        <div className="writing-list">
          {posts.map((post, index) => (
            <a className="writing-row" href={`#/blog/${post.slug}`} key={post.slug} data-reveal style={{ '--delay': `${index * 70}ms` }}>
              <p className="writing-number">{String(index + 1).padStart(2, '0')}</p>
              <p className="writing-meta">{post.date}<br />{post.tag}</p>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <ArrowUpRight size={26} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <p className="section-kicker">About</p>
        <div className="about-grid">
          <h2 id="about-title" data-reveal>I make complex infrastructure understandable under pressure.</h2>
          <p data-reveal>
            I design, build, and improve reliable platforms across cloud infrastructure, delivery systems, data,
            and observability. The goal is always the same: clear systems that teams can trust when the stakes rise.
          </p>
        </div>
        <div className="capabilities" aria-label="Core capabilities">
          <span>Capabilities</span>
          <p>AWS</p><i>/</i><p>Kubernetes</p><i>/</i><p>Terraform</p><i>/</i><p>CI/CD</p><i>/</i><p>Observability</p><i>/</i><p>Distributed Systems</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function WorkChapter({ number, title, description, children }) {
  return (
    <div className="work-chapter" data-reveal>
      <div className="chapter-index">
        <p>{number}</p>
        <h3>{title}</h3>
        <span>{description}</span>
      </div>
      <div className="chapter-content">{children}</div>
    </div>
  );
}

function BlogIndex() {
  return (
    <main id="main-content">
      <section className="page-shell" aria-labelledby="blog-page-title">
        <SiteNav page />
        <div className="page-hero" data-reveal>
          <p className="eyebrow">/ Blog</p>
          <h1 id="blog-page-title">Field notes on infrastructure and reliability.</h1>
          <p>
            Short, practical notes on cloud systems, production operations, open source work, and the engineering
            habits that keep teams steady.
          </p>
        </div>

        <div className="article-list">
          {posts.map((post, index) => (
            <article className="article-card" key={post.slug} data-reveal data-spotlight style={{ '--delay': `${index * 90}ms` }}>
              <p className="post-meta">{post.tag} · {post.readTime} · {post.date}</p>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <a href={`#/blog/${post.slug}`}>Read article <ArrowUpRight size={16} aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ArticlePage({ slug }) {
  const post = getPost(slug);

  if (!post) {
    return (
      <main id="main-content">
        <section className="page-shell">
          <SiteNav page />
          <div className="page-hero narrow" data-reveal>
            <p className="eyebrow">/ Not found</p>
            <h1>That note is not published yet.</h1>
            <p>The blog route exists, but this slug does not match a current post.</p>
            <a className="text-link" href="#/blog"><ArrowLeft size={16} aria-hidden="true" /> Back to blog</a>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main id="main-content">
      <article className="page-shell article-page">
        <SiteNav page />
        <header className="article-header" data-reveal>
          <a className="text-link" href="#/blog"><ArrowLeft size={16} aria-hidden="true" /> Back to blog</a>
          <p className="eyebrow">/ {post.tag}</p>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <span>{post.date} · {post.readTime}</span>
        </header>

        <div className="article-layout">
          <aside className="article-toc" data-reveal>
            <p>On This Page</p>
            {post.sections.map((section) => (
              <a
                key={section.heading}
                href={`#/blog/${post.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(slugify(section.heading))?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {section.heading}
              </a>
            ))}
          </aside>

          <div className="article-body">
            {post.sections.map((section, index) => (
              <section
                id={slugify(section.heading)}
                key={section.heading}
                data-reveal
                style={{ '--delay': `${index * 80}ms` }}
              >
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}

const emptyDraft = {
  title: '',
  tag: 'Reliability',
  excerpt: '',
  body: '',
};

function AdminPage() {
  const sessionEndpoint = import.meta.env.VITE_ADMIN_SESSION_ENDPOINT;
  const [sessionState, setSessionState] = useState({
    loading: Boolean(sessionEndpoint),
    authenticated: false,
  });

  useEffect(() => {
    if (!sessionEndpoint) return undefined;

    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(sessionEndpoint, {
          credentials: 'include',
          signal: controller.signal,
        });
        const session = response.ok ? await response.json() : null;

        setSessionState({
          loading: false,
          authenticated: Boolean(session?.authenticated && session?.provider === 'github'),
        });
      } catch {
        if (!controller.signal.aborted) {
          setSessionState({ loading: false, authenticated: false });
        }
      }
    }

    loadSession();
    return () => controller.abort();
  }, [sessionEndpoint]);

  if (sessionState.loading) {
    return <AdminGate loading />;
  }

  if (!sessionState.authenticated) {
    return <AdminGate />;
  }

  return <AdminEditor />;
}

function AdminGate({ loading = false }) {
  const githubAuthUrl = import.meta.env.VITE_GITHUB_AUTH_URL;

  return (
    <main id="main-content">
      <section className="page-shell admin-page" aria-labelledby="admin-title">
        <SiteNav page />
        <div className="admin-hero" data-reveal>
          <p className="eyebrow">/ Admin</p>
          <h1 id="admin-title">GitHub sign-in required.</h1>
          <p>
            The writing room is intentionally hidden from public navigation. The direct admin route stays available,
            but the editor only opens after a GitHub-backed admin session exists.
          </p>
        </div>

        <div className="auth-panel" data-reveal data-spotlight>
          <Github size={28} aria-hidden="true" />
          <div>
            <h2>Private publishing access</h2>
            <p>
              {loading
                ? 'Checking for an active GitHub session.'
                : 'GitHub Pages is static, so the secure sign-in step needs a small OAuth token exchange before drafts can publish back to the repository.'}
            </p>
          </div>
          <div className="auth-actions">
            {loading ? (
              <span className="button disabled-button" aria-disabled="true">Checking session</span>
            ) : githubAuthUrl ? (
              <a className="button" href={githubAuthUrl}>Sign in with GitHub <ArrowUpRight size={16} aria-hidden="true" /></a>
            ) : (
              <span className="button disabled-button" aria-disabled="true">GitHub auth not connected</span>
            )}
            <a className="text-link" href="#/blog"><ArrowLeft size={16} aria-hidden="true" /> Back to blog</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function AdminEditor() {
  const [draft, setDraft] = useState(() => {
    try {
      const stored = window.localStorage.getItem('pereowei-blog-draft');
      return stored ? { ...emptyDraft, ...JSON.parse(stored) } : emptyDraft;
    } catch {
      return emptyDraft;
    }
  });

  const slug = draft.title ? slugify(draft.title) : 'new-post-slug';
  const paragraphs = draft.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  function updateDraft(field, value) {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      window.localStorage.setItem('pereowei-blog-draft', JSON.stringify(next));
      return next;
    });
  }

  function clearDraft() {
    window.localStorage.removeItem('pereowei-blog-draft');
    setDraft(emptyDraft);
  }

  return (
    <main id="main-content">
      <section className="page-shell admin-page" aria-labelledby="admin-title">
        <SiteNav page />
        <div className="admin-hero" data-reveal>
          <p className="eyebrow">/ Admin</p>
          <h1 id="admin-title">Draft and preview blog posts.</h1>
          <p>
            This is the first writing slice: browser-saved drafts with a live preview. The next publishing slice can
            connect this shape to Git-backed content.
          </p>
        </div>

        <div className="admin-layout">
          <form className="editor-panel" data-reveal>
            <label>
              Title
              <input
                name="title"
                autoComplete="off"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                placeholder="A practical note on reliability…"
              />
            </label>

            <label>
              Tag
              <input
                name="tag"
                autoComplete="off"
                value={draft.tag}
                onChange={(event) => updateDraft('tag', event.target.value)}
                placeholder="Reliability…"
              />
            </label>

            <label>
              Excerpt
              <textarea
                name="excerpt"
                autoComplete="off"
                value={draft.excerpt}
                onChange={(event) => updateDraft('excerpt', event.target.value)}
                placeholder="One crisp sentence that explains why this note matters…"
                rows={4}
              />
            </label>

            <label>
              Body
              <textarea
                name="body"
                autoComplete="off"
                value={draft.body}
                onChange={(event) => updateDraft('body', event.target.value)}
                placeholder="Write in plain paragraphs for now. Separate sections with a blank line…"
                rows={12}
              />
            </label>

            <div className="editor-actions">
              <button type="button" className="button secondary-button" onClick={clearDraft}>Clear draft</button>
              <a className="button" href="#/blog">View blog <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </form>

          <aside className="preview-panel" data-reveal style={{ '--delay': '90ms' }}>
            <p className="post-meta">{draft.tag || 'Tag'} · Draft · /{slug}</p>
            <h2>{draft.title || 'Untitled draft'}</h2>
            <p>{draft.excerpt || 'Your excerpt preview will appear here.'}</p>
            <div className="preview-body">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>Start writing to preview the article body.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <p className="section-kicker">Contact</p>
      <h2>Let&apos;s build systems that hold.</h2>
      <div className="contact-grid">
        <a href="mailto:iwenyadaniel12@gmail.com"><Mail size={22} aria-hidden="true" /><span><b>Email</b>iwenyadaniel12@gmail.com</span></a>
        <a href="https://github.com/dpereowei"><Github size={22} aria-hidden="true" /><span><b>GitHub</b>github.com/dpereowei</span></a>
        <a href="https://linkedin.com/in/pereowei"><Linkedin size={22} aria-hidden="true" /><span><b>LinkedIn</b>linkedin.com/in/pereowei</span></a>
        <p><span className="status-dot" /><span><b>Available for select opportunities</b>Infrastructure, platform, SRE, and cloud engineering.</span></p>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
