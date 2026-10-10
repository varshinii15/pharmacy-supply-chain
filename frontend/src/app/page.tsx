"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useInView, type Variants } from "framer-motion";
import { QrCode, ShieldCheck, Globe, Zap, Lock, BarChart3, Menu, X, GitBranch } from "lucide-react";

/* ─── IOH-style Stat Block ──────────────────────────────── */
function StatBlock({
  target,
  label,
  delay = 0,
}: {
  target: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
  const suffix = target.replace(/[0-9.,]/g, "");

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 2000;
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * numericTarget));
        setBarWidth(eased * 100);
        if (progress < 1) requestAnimationFrame(step);
        else {
          setValue(numericTarget);
          setBarWidth(100);
        }
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, numericTarget, delay]);

  return (
    <div ref={ref} className="ioh-stat-block">
      <div className="ioh-stat-bar-track">
        <div className="ioh-stat-bar-fill" style={{ width: `${barWidth}%` }} />
      </div>
      <div className="ioh-stat-label">{label}</div>
      <div className="ioh-stat-number">
        {value >= 1000 ? value.toLocaleString() : value}
        {suffix}
      </div>
    </div>
  );
}

/* ─── Horizontal Scroll Gallery ──────────────────────────── */
const modules = [
  { title: "Registered on Blockchain", desc: "Every medicine batch gets a unique on-chain identity the moment it leaves the manufacturer — immutable and tamper-proof.", icon: "🔗", color: "#1a1a2e", image: "/pharma_lab.jpg", imageAlt: "Medicine vials moving along an automated pharmaceutical production line" },
  { title: "Scan & Verify", desc: "Patients scan a QR code or enter a batch ID. The result is instant and pulled directly from the blockchain.", icon: "📱", color: "#16213e", image: "/scan_verify.jpg", imageAlt: "A smartphone displaying a QR code ready to scan" },
  { title: "Full Transfer History", desc: "See exactly where a batch has been: from factory floor to pharmacy shelf, every custody change is recorded.", icon: "🌐", color: "#0f3460", image: "/cold_chain.jpg", imageAlt: "Temperature-controlled pharmaceutical shipment moving through a logistics facility" },
  { title: "Counterfeit Detection", desc: "If a batch's history looks wrong, was modified, or never existed on-chain, the system flags it immediately.", icon: "🔒", color: "#1a1a2e", image: "/counterfeit_detection.jpg", imageAlt: "Distinct blister packs of medicine being checked for authenticity" },
  { title: "Real-time Analytics", desc: "Supply chain partners get live dashboards showing batch status, transfer activity and expiry warnings.", icon: "📊", color: "#16213e", image: "/supply_analytics.jpg", imageAlt: "Live analytics dashboard with charts and supply activity metrics" },
  { title: "Instant Results", desc: "Verification completes in seconds — no logins, no apps, no friction. Just answers.", icon: "⚡", color: "#0f3460", image: "/instant_verification.jpg", imageAlt: "Healthcare professional checking information on a smartphone" },
];

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: "easeOut" as const },
  },
};

function ScrollGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (galleryRef.current?.offsetLeft ?? 0));
    setScrollLeft(galleryRef.current?.scrollLeft ?? 0);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !galleryRef.current) return;
    e.preventDefault();
    const x = e.pageX - galleryRef.current.offsetLeft;
    galleryRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const handleGalleryScroll = () => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const center = gallery.getBoundingClientRect().left + gallery.clientWidth / 2;
    const nearestIndex = Array.from(gallery.children).reduce((nearest, child, index, children) => {
      const distance = Math.abs(child.getBoundingClientRect().left + child.clientWidth / 2 - center);
      const nearestChild = children[nearest];
      const nearestDistance = Math.abs(nearestChild.getBoundingClientRect().left + nearestChild.clientWidth / 2 - center);
      return distance < nearestDistance ? index : nearest;
    }, 0);
    setActiveIndex(nearestIndex);
  };

  return (
    <motion.div
      ref={galleryRef}
      className={`ioh-scroll-gallery${isDragging ? " is-grabbing" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onScroll={handleGalleryScroll}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {modules.map((item, i) => (
        <motion.div
          key={item.title}
          className={`ioh-slide-item${i === activeIndex ? " is-active" : ""}`}
          onMouseEnter={() => setActiveIndex(i)}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: i === activeIndex ? 1 : 0.58, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={`ioh-slide-image${item.image ? " has-photo" : ""}`} style={{ background: item.color }}>
            {item.image && (
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 768px) 78vw, 30vw"
                className="ioh-module-photo"
              />
            )}
            <div className="ioh-slide-emoji">{item.icon}</div>
            <div className="ioh-slide-title-overlay">{item.title}</div>
          </div>
          <div className="ioh-module-box">
            <div className="ioh-module-label">Module Overview</div>
            <div className="ioh-module-desc">{item.desc}</div>
            <div className="ioh-explore-link">
              <Link href="/verify" className="ioh-course-link">Explore →</Link>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Features Slider ─────────────────────────────────────── */
const features = [
  {
    tab: "Clinical Mentorship",
    title: "Live high-frequency verification with unmatched security and depth",
    body: "A constantly growing blockchain record of every medicine batch. From registration to dispensing, PharmaChain offers complete traceability across the entire supply chain.",
    image: "/pharma_lab.jpg",
    imageAlt: "Pharmaceutical production line preparing medicine vials for verification",
  },
  {
    tab: "Partner Support",
    title: "Practitioner-led network for real-time answers and dedicated support",
    body: "Receive direct feedback on complex supply chain cases and compliance guidance from leading practitioners, with a dedicated team providing real-time answers 24/7.",
    image: "/cold_chain.jpg",
    imageAlt: "Cold-chain medicine shipment monitored at a logistics facility",
  },
  {
    tab: "Global Impact",
    title: "Multi-country rollout with scalable compliance infrastructure",
    body: "We help supply chain partners go global, building a fully compliant, patient-centric medicine tracking system using real-time data and automated delivery.",
    image: "/cold_chain.jpg",
    imageAlt: "Temperature-controlled pharmaceutical shipment in a distribution facility",
  },
  {
    tab: "Evidence-Based",
    title: "Fortified by thousands of verified supply chain records",
    body: "We do the verification that patients can't do themselves, so they can trust every medicine they receive. Gain the clarity, confidence, and certainty to protect lives.",
    image: "/pharma_lab.jpg",
    imageAlt: "Medicine vials being produced in a pharmaceutical laboratory",
  },
];

function FeaturesSection() {
  const [active, setActive] = useState(0);

  return (
    <motion.section
      className="ioh-white-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.14 } },
      }}
    >
      <div className="ioh-features-wrapper">
        <motion.div className="ioh-middle-headline" variants={revealVariants}>
          <h2 className="ioh-h2-sided">What makes our platform different</h2>
        </motion.div>

        <motion.div className="ioh-flex-slides" variants={revealVariants}>
          {/* Left: Slider */}
          <div className="ioh-cms-slider">
            <div className="ioh-controls">
              <button
                className="ioh-arrow"
                onClick={() => setActive((p) => (p - 1 + features.length) % features.length)}
                aria-label="Previous"
              >←</button>
              <div className="ioh-title-bar-txt">{features[active].tab}</div>
              <button
                className="ioh-arrow"
                onClick={() => setActive((p) => (p + 1) % features.length)}
                aria-label="Next"
              >→</button>
            </div>

            <div className="ioh-slide-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="ioh-mentorship-title">{features[active].title}</div>
                  <div className="ioh-b-txt">{features[active].body}</div>
                  <div className="ioh-btn-container">
                    <Link href="/verify" className="ioh-button-general">
                      <div className="ioh-g-btn-txt">Explore Platform</div>
                      <div className="ioh-arrow-btn">→</div>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Thumbnail gallery */}
          <div className="ioh-image-collections">
            <div className="ioh-thumbnails-list">
              {features.map((f, i) => (
                <div
                  key={f.tab}
                  className={`ioh-thumbnail-box${i === active ? " is-active" : ""}`}
                  onClick={() => setActive(i)}
                >
                  <div className="ioh-thumb-visual">
                    <Image src={f.image} alt="" fill sizes="70px" className="ioh-feature-thumb" />
                    <span className="ioh-thumb-label">{f.tab}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="ioh-main-slide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 1.025 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="ioh-main-visual"
                >
                  <Image
                    src={features[active].image}
                    alt={features[active].imageAlt}
                    fill
                    sizes="(max-width: 768px) 90vw, 45vw"
                    className="ioh-feature-photo"
                  />
                  <span className="ioh-main-label">{features[active].tab}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ─── IOH Navbar ─────────────────────────────────────────── */
function IOHNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <nav className={`ioh-header${scrolled ? " is-dark" : " is-light"}`}>
        <div className="ioh-header-inner">
          <div className="ioh-header-flex">
            <Link href="/" className="ioh-logo">
              <ShieldCheck size={22} className="ioh-logo-icon" />
              <span className="ioh-logo-text">PharmaChain</span>
            </Link>

            <div className="ioh-links-header">
              <Link href="/verify" className="ioh-h-link"><div>Verify</div></Link>
              <Link href="/dashboard/batches" className="ioh-h-link"><div>Batches</div></Link>
              <Link href="/dashboard/transfers/new" className="ioh-h-link"><div>Transfers</div></Link>
              <Link href="/#how-it-works" className="ioh-h-link"><div>How It Works</div></Link>
              <Link href="/login" className="ioh-h-link"><div>About</div></Link>
            </div>

            <div className="ioh-right-side">
              <div className="ioh-button-box">
                <Link href="/login" className="ioh-button-contact">
                  <div className="ioh-arrow-icon">→</div>
                  <div>Partner Login</div>
                </Link>
              </div>
              <button
                className="ioh-hamburger-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="ioh-mobile-menu">
          <div className="ioh-menu-list">
            {[
              ["Home", "/"],
              ["Verify", "/verify"],
              ["Batches", "/dashboard/batches"],
              ["Transfers", "/dashboard/transfers/new"],
              ["How It Works", "/#how-it-works"],
              ["Partner Login", "/login"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="ioh-menu-link" onClick={() => setMobileOpen(false)}>
                <div>{label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="ioh-page site-grid-surface">
      <IOHNavbar />

      {/* Hero */}
      <section className="ioh-hero">
        <div className="ioh-wrapper-hero">
          <div className="ioh-hero-list">
            <StatBlock target="12400+" label="Batches Tracked" delay={0} />
            <StatBlock target="980000+" label="Medicines Verified" delay={400} />
            <StatBlock target="340+" label="Supply Chain Partners" delay={800} />
          </div>
          <div className="ioh-hero-bottom">
            <div className="ioh-left-side-hero">
              <h1 className="ioh-h1">Global leaders in supply chain transparency</h1>
              <div className="ioh-paragraph-hero">
                The only blockchain-based medicine tracker combining immutable ledger technology, real-time analytics, and complete custody verification.
              </div>
            </div>
            <div className="ioh-right-hero">
              <Link href="/#how-it-works" className="ioh-button-hero">
                <div className="ioh-text-button"><div>Learn More</div></div>
                <div className="ioh-arrow-btn-hero">→</div>
              </Link>
            </div>
          </div>
        </div>
        <div className="ioh-background-video">
          <div className="ioh-overlay-video" />
          <video autoPlay loop muted playsInline className="ioh-video">
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* Courses / Modules */}
      <section id="how-it-works" className="ioh-courses-section">
        <div className="ioh-wrapper-slider">
          <motion.div
            className="ioh-headline-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div className="ioh-headline-box" variants={revealVariants}>
              <h2 className="ioh-h2-spec">
                Comprehensive, evidence-based tracking across the full medicine supply chain.
              </h2>
            </motion.div>
            <motion.div className="ioh-btn-container" variants={revealVariants}>
              <Link href="/verify" className="ioh-button-general">
                <div className="ioh-g-btn-txt">Start Verifying</div>
                <div className="ioh-arrow-btn">→</div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="ioh-slider-wrap">
          <div className="ioh-seminar-header">
            <div>Modules</div>
            <div className="ioh-seminar-count">6 Units</div>
          </div>
          <ScrollGallery />
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <section className="ioh-cta-section">
        <motion.div
          className="ioh-cta-box"
          initial={{ opacity: 0, y: 36, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        >
          <h2 className="ioh-cta-title">Ready to verify your medicine?</h2>
          <p className="ioh-cta-body">
            No account needed. Just scan the QR code on your medicine packaging and get an instant result.
          </p>
          <div className="ioh-cta-buttons">
            <Link href="/verify" className="ioh-button-general wh">
              <div className="ioh-g-btn-txt">Start Verifying</div>
              <div className="ioh-arrow-btn">→</div>
            </Link>
            <Link href="/login" className="ioh-button-general outlined">
              <div className="ioh-g-btn-txt">Supply Chain Partners</div>
              <div className="ioh-arrow-btn">→</div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="ioh-footer">
        <div className="ioh-footer-inner">
          <div className="ioh-footer-logo">
            <ShieldCheck size={18} className="ioh-footer-icon" />
            <span className="ioh-footer-brand">PharmaChain</span>
          </div>
          <p className="ioh-footer-copy">© 2026 PharmaChain. Built on Ethereum Sepolia.</p>
          <div className="ioh-footer-links">
            <Link href="/verify" className="ioh-footer-link">Verify</Link>
            <Link href="/login" className="ioh-footer-link">Login</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="ioh-footer-link">
              <GitBranch size={15} />
            </a>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}
