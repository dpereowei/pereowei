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
    if (route.name === 'post') return <ArticlePage slug={route.slug} />;
    return <HomePage />;
  }, [route]);

  return view;
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
    <main>
      <section className="hero" id="home" aria-labelledby="hero-title">
        <SiteNav />

        <div className="hero-stage">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">Lead Infrastructure Engineer</p>
            <h1 id="hero-title">I build reliable cloud systems for teams that cannot afford quiet failures.</h1>
          </div>

          <p className="hero-word" aria-hidden="true">PEREOWEI</p>
          <img
            src={portrait}
            alt="Black and white portrait of Pereowei Daniel"
            className="portrait"
          />
          <div className="portrait-ground" aria-hidden="true" />

          <div className="hero-proof" data-reveal>
            <p>
              Lead Infrastructure Engineer at DLM Capital Group. Maintainer of FabricOps under LFDT. AWS,
              Kubernetes, Terraform, CI/CD, observability.
            </p>
            <a className="button" href="#work">View work <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>

      <section className="section work-section" id="work" aria-labelledby="work-title">
        <div className="section-copy" data-reveal>
          <p className="eyebrow">/ Work</p>
          <h2 id="work-title">Roles, projects, and open source work.</h2>
        </div>
        <div className="work-lanes">
          <WorkLane title="Experience" items={experience} role />
          <WorkLane title="Projects" items={projects} delay="90ms" />
          <WorkLane title="Open Source" items={openSource} delay="180ms" />
        </div>
      </section>

      <section className="section about-section" id="about" aria-labelledby="about-title">
        <div data-reveal>
          <p className="eyebrow">/ About</p>
          <h2 id="about-title">I work where cloud platforms, backend systems, and reliability meet.</h2>
        </div>
        <p data-reveal>
          My day-to-day work spans AWS, Kubernetes, Terraform, CI/CD, Linux, incident response, observability,
          secure networking, and data infrastructure. I like systems that are understandable under pressure:
          good defaults, crisp runbooks, clean deployment paths, and alerts that mean something.
        </p>
      </section>

      <section className="section blog-section" id="blog" aria-labelledby="blog-title">
        <div className="section-copy" data-reveal>
          <p className="eyebrow">/ Writing</p>
          <h2 id="blog-title">Notes on infrastructure, reliability, and the messy middle of production systems.</h2>
          <p className="section-note">
            Admin publishing will come after first deployment: MDX posts first, then an authenticated writing flow
            for drafts, previews, and Git-backed publishing.
          </p>
        </div>
        <div className="post-grid">
          {posts.map((post, index) => (
            <article className="post" key={post.slug} data-reveal data-spotlight style={{ '--delay': `${index * 90}ms` }}>
              <p className="post-meta">{post.tag} · {post.readTime}</p>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href={`#/blog/${post.slug}`} aria-label={`Read ${post.title}`}>Read note <ArrowUpRight size={14} /></a>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function WorkLane({ title, items, delay, role = false }) {
  return (
    <div className="lane" data-reveal style={{ '--delay': delay }}>
      <p className="lane-label">{title}</p>
      {items.map((item, index) => (
        <article
          className={role ? 'card role-card' : 'card'}
          key={role ? `${item.company}-${item.role}` : item.name}
          data-spotlight
        >
          <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
          <p>{role ? item.company : item.tag}</p>
          <h3>{role ? item.role : item.name}</h3>
          <span>{role ? item.summary : item.description}</span>
        </article>
      ))}
    </div>
  );
}

function BlogIndex() {
  return (
    <main>
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
              <a href={`#/blog/${post.slug}`}>Read article <ArrowUpRight size={16} /></a>
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
      <main>
        <section className="page-shell">
          <SiteNav page />
          <div className="page-hero narrow" data-reveal>
            <p className="eyebrow">/ Not found</p>
            <h1>That note is not published yet.</h1>
            <p>The blog route exists, but this slug does not match a current post.</p>
            <a className="text-link" href="#/blog"><ArrowLeft size={16} /> Back to blog</a>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main>
      <article className="page-shell article-page">
        <SiteNav page />
        <header className="article-header" data-reveal>
          <a className="text-link" href="#/blog"><ArrowLeft size={16} /> Back to blog</a>
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

function SiteFooter() {
  return (
    <footer className="footer" id="contact" data-reveal>
      <p>Open to infrastructure, platform, SRE, and cloud engineering work.</p>
      <div className="socials">
        <a href="mailto:iwenyadaniel12@gmail.com"><Mail size={18} /> Email</a>
        <a href="https://github.com/dpereowei"><Github size={18} /> GitHub</a>
        <a href="https://linkedin.com/in/pereowei"><Linkedin size={18} /> LinkedIn</a>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
