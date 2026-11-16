import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowUpRight, BadgeCheck, Github, Linkedin, Mail } from 'lucide-react';
import { experience, openSource, projects } from './content/portfolio';
import { posts as seedPosts } from './content/posts';
import { postMarkdown, markdownHeadings, mergePosts } from './lib/blog';
import Markdown from './components/Markdown';
import AdminEditor from './components/AdminEditor';
import { oauthCallbackHandoff } from './lib/oauth-callback';
import { observeReveals } from './lib/reveal';
import infrastructureArt from '../assets/infrastructure-sculpture.png';
import './styles.css';
import './hero.css';
import './site-theme.css';
import './editor.css';

function getRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  const [path, query = ''] = hash.split('?');
  const authStatus = new URLSearchParams(query).get('auth');

  if (path === '/blog') return { name: 'blog' };
  if (path === '/admin') return { name: 'admin', authStatus };
  if (path.startsWith('/blog/')) return { name: 'post', slug: path.replace('/blog/', '') };

  return { name: 'home', anchor: hash || 'home' };
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

    const cleanupReveals = observeReveals(document.body, { IntersectionObserver, MutationObserver });

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
      cleanupReveals();
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
  const [posts, setPosts] = useState(seedPosts);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPosts() {
      try {
        const response = await fetch('/.netlify/functions/blog-posts', { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load published articles');
        const data = await response.json();
        setPosts(mergePosts(seedPosts, data.posts, data.suppressed));
        setPostsError(false);
      } catch { if (!controller.signal.aborted) setPostsError(true); }
      finally { if (!controller.signal.aborted) setPostsLoading(false); }
    }
    loadPosts();
    window.addEventListener('blog-published', loadPosts);
    return () => { controller.abort(); window.removeEventListener('blog-published', loadPosts); };
  }, [route.name]);

  const view = useMemo(() => {
    if (route.name === 'blog') return <BlogIndex posts={posts} loading={postsLoading} error={postsError} />;
    if (route.name === 'admin') return <AdminPage authStatus={route.authStatus} />;
    if (route.name === 'post') return <ArticlePage slug={route.slug} posts={posts} loading={postsLoading} error={postsError} />;
    return <HomePage posts={posts} />;
  }, [route, posts, postsLoading, postsError]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {view}
    </>
  );
}

function SiteNav({ page = false }) {
  return (
    <nav className={page ? 'reference-nav page-nav' : 'reference-nav'} aria-label="Primary navigation">
      <a href="#home" className="reference-brand"><span className="reference-mark" aria-hidden="true"><i /><i /></span>Pereowei Daniel</a>
      <span className="reference-role">Infrastructure &amp; Platform Engineer</span>
      <div className="reference-links">
        <a href="#work">Work</a><a href="#about">Approach</a><a href="#/blog">Notes</a><a href="#contact">Contact</a>
        <a className="reference-cta" href="#work" aria-label="Read the work"><span>Read the work</span> <ArrowUpRight size={20} aria-hidden="true" /></a>
      </div>
    </nav>
  );
}

function HomePage({ posts }) {
  return (
    <main id="main-content">
      <section className="hero reference-hero" id="home" aria-labelledby="hero-title">
        <SiteNav />

        <div className="operator-hero">
          <div className="operator-copy">
            <h1 id="hero-title"><span className="headline-line">I make the</span><span className="headline-line">invisible</span><span className="headline-line">dependable<span className="headline-period">.</span></span></h1>
          </div>

          <img className="reference-art" src={infrastructureArt} alt="Architectural server towers connected by bridges and red cable routes" width="1184" height="1317" fetchPriority="high" />

          <div className="operator-proof" aria-label="Selected impact">
            <div><strong>1M+</strong><span>Active users</span></div>
            <div><strong>30%</strong><span>Cloud spend reduced</span></div>
            <div><strong>4</strong><span>AWS accounts separated</span></div>
            <div><strong>LFDT</strong><span>FabricOps maintainer</span></div>
          </div>

          <div className="operator-footer" aria-label="Professional focus">
            <p>Operator's logbook / Pereowei Daniel</p>
            <p>Infra <span>/</span> Platform <span>/</span> Automation</p>
          </div>
        </div>
      </section>

      <section className="credential-strip" aria-label="Professional credential">
        <a
          className="toptal-credential"
          href="https://www.toptal.com/developers/resume/daniel-iwenya#BmdmAM"
          target="_blank"
          rel="noreferrer"
          data-reveal
        >
          <span className="toptal-emblem"><BadgeCheck size={31} strokeWidth={2.4} aria-hidden="true" /></span>
          <span className="toptal-copy">
            <strong>Top 3% talent</strong>
            <span>Vetted by Toptal</span>
          </span>
          <span className="toptal-action">View profile <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
      </section>

      <section className="work-section" id="work" aria-labelledby="work-title">
        <header className="chapter-header" data-reveal>
          <div className="chapter-heading"><p className="section-kicker">01 / Selected work</p><h2 id="work-title">Systems in<br />production<span className="red-period">.</span></h2></div>
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
          <div className="chapter-heading"><p className="section-kicker">02 / Writing</p><h2 id="blog-title">Field notes<span className="red-period">.</span></h2></div>
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
        <p className="section-kicker">03 / Approach</p>
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

function BlogIndex({ posts, loading, error }) {
  return (
    <main id="main-content">
      <section className="page-shell" aria-labelledby="blog-page-title">
        <SiteNav page />
        <div className="page-hero" data-reveal>
          <p className="eyebrow">Operator&apos;s logbook / Notes</p>
          <h1 id="blog-page-title">Field notes on infrastructure and reliability.</h1>
          <p>
            Short, practical notes on cloud systems, production operations, open source work, and the engineering
            habits that keep teams steady.
          </p>
        </div>

        <div className="article-list">
          {loading && <p role="status" className="editor-notice">Loading articles...</p>}
          {error && <p role="status" className="editor-notice">Latest articles are temporarily unavailable.</p>}
          {!loading && !error && posts.length === 0 && <p className="editor-notice">No articles published yet.</p>}
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

function ArticlePage({ slug, posts, loading, error }) {
  const post = posts.find((entry) => entry.slug === slug);

  if (!post) {
    return (
      <main id="main-content">
        <section className="page-shell">
          <SiteNav page />
          <div className="page-hero narrow" data-reveal>
            <p className="eyebrow">/ Not found</p>
            <h1>{loading ? 'Loading this field note.' : error ? 'This note is temporarily unavailable.' : 'That note is not published yet.'}</h1>
            <p>{error ? 'Please try again shortly.' : 'Return to the notes index to browse published articles.'}</p>
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
            {markdownHeadings(postMarkdown(post)).map((section) => (
              <a
                key={section.id}
                href={`#/blog/${post.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.querySelector('.article-body')?.querySelector(`[id="${CSS.escape(section.id)}"]`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                }}
              >
                {section.title}
              </a>
            ))}
          </aside>

          <div className="article-body">
            <Markdown>{postMarkdown(post)}</Markdown>
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}

function AdminPage({ authStatus }) {
  const sessionEndpoint = '/.netlify/functions/auth-session';
  const [sessionState, setSessionState] = useState({
    loading: true,
    authenticated: false,
    configured: true,
  });

  useEffect(() => {
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
          configured: response.ok,
        });
      } catch {
        if (!controller.signal.aborted) {
          setSessionState({ loading: false, authenticated: false, configured: false });
        }
      }
    }

    loadSession();
    return () => controller.abort();
  }, []);

  if (sessionState.loading) {
    return <AdminGate loading />;
  }

  if (!sessionState.authenticated) {
    return <AdminGate authStatus={authStatus} configured={sessionState.configured} />;
  }

  return <AdminEditor navigation={<SiteNav page />} footer={<SiteFooter />} />;
}

function AdminGate({ loading = false, authStatus, configured = true }) {

  return (
    <main id="main-content">
      <section className="page-shell admin-page" aria-labelledby="admin-title">
        <SiteNav page />
        <div className="admin-hero" data-reveal>
          <p className="eyebrow">/ Admin</p>
          <h1 id="admin-title">The writing room.</h1>
          <p>Private access for Pereowei Daniel.</p>
        </div>

        <div className="auth-panel" data-reveal data-spotlight>
          <Github size={28} aria-hidden="true" />
          <div>
            <h2>Private publishing access</h2>
            <p>
              {loading
                ? 'Checking for an active GitHub session.'
                : !configured
                  ? 'Sign-in is unavailable. Please try again later.'
                : authStatus === 'denied'
                  ? 'That GitHub account is not authorised to access the writing room.'
                  : 'Sign in with the private GitHub account authorised for this site.'}
            </p>
          </div>
          <div className="auth-actions">
            {loading ? (
              <span className="button disabled-button" aria-disabled="true">Checking session</span>
            ) : configured ? (
              <a className="button" href="/.netlify/functions/auth-login">Sign in with GitHub <ArrowUpRight size={16} aria-hidden="true" /></a>
            ) : (
              <span className="button disabled-button" aria-disabled="true">GitHub auth is being connected</span>
            )}
            <a className="text-link" href="#/blog"><ArrowLeft size={16} aria-hidden="true" /> Back to blog</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}


function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <p className="section-kicker">Contact / Start a conversation</p>
      <h2>Let&apos;s build systems that hold.</h2>
      <div className="contact-grid">
        <a href="mailto:iwenyadaniel12@gmail.com"><Mail size={22} aria-hidden="true" /><span><b>Email</b>iwenyadaniel12@gmail.com</span></a>
        <a href="https://github.com/dpereowei"><Github size={22} aria-hidden="true" /><span><b>GitHub</b>github.com/dpereowei</span></a>
        <a href="https://linkedin.com/in/pereowei"><Linkedin size={22} aria-hidden="true" /><span><b>LinkedIn</b>linkedin.com/in/pereowei</span></a>
        <p><span className="status-dot" /><span><b>Available for select opportunities</b>Infrastructure, platform, SRE, and cloud engineering.</span></p>
      </div>
      <div className="site-colophon"><a href="#home">Pereowei Daniel</a><p>Infra / Platform / Automation</p><a href="#home">Back to top &uarr;</a></div>
    </footer>
  );
}

const oauthCallbackUrl = oauthCallbackHandoff(window.location);

if (oauthCallbackUrl) {
  window.location.replace(oauthCallbackUrl);
} else {
  createRoot(document.getElementById('root')).render(<App />);
}
