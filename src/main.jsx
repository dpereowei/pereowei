import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import portrait from '../assets/pereowei-headshot-bw-cutout.png';
import './styles.css';

const work = [
  {
    name: 'FabricOps',
    tag: 'LFDT Maintainer',
    description:
      'A Kubernetes operator for Hyperledger Fabric networks, with reconciliation, CRDs, status updates, safe rollouts, and drift repair.',
  },
  {
    name: 'DLM Capital Group',
    tag: 'Fintech Infrastructure',
    description:
      'Production AWS, Kubernetes, CI/CD, observability, and secure infrastructure for transaction-critical financial services.',
  },
  {
    name: 'Reporting Data Plane',
    tag: 'CDC + ClickHouse',
    description:
      'Continuous replication from operational RDS databases into ClickHouse for admin reporting without loading the live database.',
  },
];

const posts = [
  {
    title: 'Production readiness is a design problem',
    excerpt:
      'SLOs, runbooks, alert quality, and the small operational habits that keep teams calm when systems get loud.',
  },
  {
    title: 'Building FabricOps under LFDT',
    excerpt:
      'What a Kubernetes operator teaches you about reconciliation, platform abstractions, and real-world infrastructure.',
  },
  {
    title: 'Reporting without hurting live databases',
    excerpt:
      'A CDC pattern for streaming operational data into ClickHouse so reporting reads stay away from production paths.',
  },
];

function App() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    let cleanupSpotlights = () => {};

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
  }, []);

  return (
    <main>
      <section className="hero" id="home" aria-labelledby="hero-title">
        <nav className="nav" aria-label="Primary navigation" data-reveal>
          <a href="#home" className="brand">Pereowei Daniel</a>
          <div className="nav-links">
            <a href="#work">Work</a>
            <a href="#blog">Blog</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>

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
          <h2 id="work-title">Infrastructure projects with production weight.</h2>
        </div>
        <div className="card-grid">
          {work.map((item, index) => (
            <article className="card" key={item.name} data-reveal data-spotlight style={{ '--delay': `${index * 90}ms` }}>
              <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
              <p>{item.tag}</p>
              <h3>{item.name}</h3>
              <span>{item.description}</span>
            </article>
          ))}
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
        </div>
        <div className="post-grid">
          {posts.map((post, index) => (
            <article className="post" key={post.title} data-reveal data-spotlight style={{ '--delay': `${index * 90}ms` }}>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href="#contact" aria-label={`Discuss ${post.title}`}>Discuss this <ArrowUpRight size={14} /></a>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer" id="contact" data-reveal>
        <p>Open to infrastructure, platform, SRE, and cloud engineering work.</p>
        <div className="socials">
          <a href="mailto:iwenyadaniel12@gmail.com"><Mail size={18} /> Email</a>
          <a href="https://github.com/dpereowei"><Github size={18} /> GitHub</a>
          <a href="https://linkedin.com/in/pereowei"><Linkedin size={18} /> LinkedIn</a>
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
