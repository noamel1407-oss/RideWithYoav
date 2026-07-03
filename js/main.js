/* ============================================================
   RideWithYoav — יום הקהילה · Interactions v3 — Award-Level
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isHoverDevice  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ============================================================
     Utility: linear interpolation
     ============================================================ */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ============================================================
     Hero Title — Word-by-word staggered entrance (RTL-aware)
     Splits h1[data-word-split] into individual animated spans
     ============================================================ */
  (function initWordSplit() {
    const h1 = document.querySelector(".hero__title[data-word-split]");
    if (!h1) return;

    // Remove the whole-element animation so we control it word-by-word
    h1.classList.remove("hero-anim");
    h1.style.cssText += "opacity:1;transform:none;animation:none;filter:none;";

    const nodes = Array.from(h1.childNodes);
    let delay   = 0.28;
    const step  = 0.11;
    let html    = "";

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (!text) return;
        text.split(/\s+/).filter(Boolean).forEach((word) => {
          html += `<span class="hw" style="--wd:${delay.toFixed(2)}s">${word}</span> `;
          delay += step;
        });
      } else if (node.nodeName === "BR") {
        html += "<br>";
      } else if (node.nodeName === "SPAN") {
        // The inner span gets gold treatment
        node.textContent.trim().split(/\s+/).filter(Boolean).forEach((word) => {
          html += `<span class="hw hw--gold" style="--wd:${delay.toFixed(2)}s">${word}</span> `;
          delay += step;
        });
      }
    });

    h1.innerHTML = html.trim();
  })();

  /* ============================================================
     Countdown — with 3D flip animation
     ============================================================ */
  const TARGET_DATE = new Date("2026-06-15T08:00:00+03:00").getTime();
  const cdEls = {
    days:  document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    min:   document.getElementById("cd-min"),
    sec:   document.getElementById("cd-sec"),
  };
  const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

  function setDigit(el, newVal) {
    if (!el || el.textContent === newVal) return;
    el.textContent = newVal;
    if (!prefersReduced) {
      el.classList.remove("digit-anim");
      void el.offsetWidth;   /* force reflow to restart animation */
      el.classList.add("digit-anim");
    }
  }

  function tickCountdown() {
    const diff = TARGET_DATE - Date.now();
    if (diff <= 0) {
      Object.values(cdEls).forEach((el) => el && (el.textContent = "00"));
      return;
    }
    const s = diff / 1000;
    setDigit(cdEls.days,  pad(s / 86400));
    setDigit(cdEls.hours, pad((s % 86400) / 3600));
    setDigit(cdEls.min,   pad((s % 3600)  / 60));
    setDigit(cdEls.sec,   pad(s % 60));
  }

  if (cdEls.days) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ============================================================
     Sticky Nav + Mobile CTA float
     ============================================================ */
  const nav      = document.getElementById("nav");
  const ctaFloat = document.querySelector(".cta-float");

  function onScroll() {
    const y = window.scrollY;
    if (nav)      nav.classList.toggle("nav--solid", y > 40);
    if (ctaFloat) ctaFloat.classList.toggle("is-visible", y > window.innerHeight * 0.55);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     Scroll Reveal — IntersectionObserver (threshold 0.15)
     ============================================================ */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el      = entry.target;
          const stagger = el.dataset.stagger ? Number(el.dataset.stagger) * 80 : 0;
          const delay   = el.dataset.delay   ? Number(el.dataset.delay)         : 0;
          setTimeout(() => el.classList.add("is-in"), stagger + delay);
          obs.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealIO.observe(el));
  }

  /* ============================================================
     Road Timeline — 3D stop reveals + biker animation
     ============================================================ */
  const dayStops = document.querySelectorAll(".road-wrap .stop");
  const fillLine = document.getElementById("fillLine");
  const biker    = document.getElementById("biker");

  if (dayStops.length) {
    const total = dayStops.length;

    function advanceTo(index) {
      if (!fillLine || !biker) return;
      const y = ((index + 1) / total) * 600;
      fillLine.setAttribute("y2", String(y));
      biker.setAttribute("cy",      String(y));
      biker.setAttribute("opacity", "1");
    }

    if (prefersReduced || !("IntersectionObserver" in window)) {
      dayStops.forEach((s) => s.classList.add("on"));
      advanceTo(total - 1);
    } else {
      const stopIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("on");
            const idx = Array.prototype.indexOf.call(dayStops, entry.target);
            if (idx >= 0) advanceTo(idx);
            stopIO.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
      dayStops.forEach((s) => stopIO.observe(s));
    }
  }

  /* ============================================================
     3D Tilt — Road-timeline card-3d elements
     ============================================================ */
  if (isHoverDevice && !prefersReduced) {
    document.querySelectorAll(".card-3d").forEach((card) => {
      const MAX = 10;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * MAX}deg) rotateX(${-y * MAX}deg) scale(1.03)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ============================================================
     3D Tilt — Gallery items
     ============================================================ */
  if (isHoverDevice && !prefersReduced) {
    document.querySelectorAll(".gallery__item").forEach((item) => {
      const MAX = 9;
      item.addEventListener("mousemove", (e) => {
        const r  = item.getBoundingClientRect();
        const x  = (e.clientX - r.left) / r.width  - 0.5;
        const y  = (e.clientY - r.top)  / r.height - 0.5;
        const rx = -y * MAX;
        const ry =  x * MAX;
        item.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
        item.style.boxShadow = `${-x * 18}px ${y * 18}px 40px rgba(0,0,0,.22)`;
      });
      item.addEventListener("mouseleave", () => {
        item.style.transform = "";
        item.style.boxShadow = "";
      });
    });
  }

  /* ============================================================
     3D Tilt — About image
     ============================================================ */
  const aboutImg = document.getElementById("aboutImg");
  if (aboutImg && isHoverDevice && !prefersReduced) {
    const wrap = aboutImg.closest(".about__media");
    if (wrap) {
      const MAX = 7;
      wrap.addEventListener("mousemove", (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        aboutImg.style.transform = `perspective(900px) rotateX(${-y * MAX}deg) rotateY(${x * MAX}deg) scale(1.02)`;
        aboutImg.style.boxShadow = `${-x * 22}px ${y * 22}px 55px rgba(0,0,0,.28)`;
      });
      wrap.addEventListener("mouseleave", () => {
        aboutImg.style.transform = "";
        aboutImg.style.boxShadow = "";
      });
    }
  }

  /* ============================================================
     Count-up Animation — for .count-up[data-count-target]
     ============================================================ */
  document.querySelectorAll(".count-up[data-count-target]").forEach((el) => {
    const countTarget = Number(el.dataset.countTarget);
    if (!countTarget) return;

    let started = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        io.unobserve(el);

        function formatCount(n) {
          if (n >= 1000) {
            const k = n / 1000;
            return (Number.isInteger(k) ? k : k.toFixed(1)) + "K";
          }
          return String(n);
        }

        if (prefersReduced) {
          el.textContent = formatCount(countTarget);
          return;
        }

        const duration  = 1600;
        const startTime = performance.now();

        function tick(now) {
          const elapsed  = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease     = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const current  = Math.round(ease * countTarget);
          el.textContent = formatCount(current);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ============================================================
     Hero Mouse Parallax (desktop / hover device)
     ============================================================ */
  const heroSection = document.querySelector(".hero");
  const heroImgEl   = document.getElementById("heroImg");
  const heroContent = document.getElementById("heroContent");

  if (heroSection && heroImgEl && isHoverDevice && !prefersReduced) {
    let rafPending = false;
    let mX = 0, mY = 0;

    heroSection.addEventListener("mousemove", (e) => {
      const r = heroSection.getBoundingClientRect();
      mX = (e.clientX - r.left) / r.width  - 0.5;
      mY = (e.clientY - r.top)  / r.height - 0.5;

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          heroImgEl.style.transform =
            `scale(1.1) translate(${mX * 24}px, ${mY * 14}px)`;
          if (heroContent) {
            heroContent.style.transform =
              `translate(${mX * -6}px, ${mY * -4}px)`;
          }
          rafPending = false;
        });
      }
    });

    heroSection.addEventListener("mouseleave", () => {
      requestAnimationFrame(() => {
        heroImgEl.style.transform  = "";
        if (heroContent) heroContent.style.transform = "";
      });
    });
  }

  /* Scroll parallax on hero for touch devices */
  if (heroImgEl && !isHoverDevice && !prefersReduced) {
    let rafScrolling = false;
    window.addEventListener("scroll", () => {
      if (rafScrolling) return;
      rafScrolling = true;
      requestAnimationFrame(() => {
        const offset = window.scrollY * 0.28;
        heroImgEl.style.transform = `scale(1.05) translateY(${offset}px)`;
        rafScrolling = false;
      });
    }, { passive: true });
  }

  /* ============================================================
     Testimonials Carousel
     ============================================================ */
  const carouselEl    = document.getElementById("testiCarousel");
  const track         = document.getElementById("testiTrack");
  const prevBtn       = document.getElementById("testiPrev");
  const nextBtn       = document.getElementById("testiNext");
  const dotsContainer = document.getElementById("testiDots");

  if (track && prevBtn && nextBtn && dotsContainer) {
    const cards  = Array.from(track.querySelectorAll(".testi__card"));
    const count  = cards.length;
    let current  = 0;
    let pointerStart = 0;
    let pointerDelta = 0;
    let isDragging   = false;

    const dots = cards.map((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel__dot";
      dot.setAttribute("aria-label", `כרטיס ${i + 1}`);
      dot.setAttribute("role", "tab");
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
      return dot;
    });

    function cardWidth() {
      return cards[0] ? cards[0].offsetWidth + 20 : 0;
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, count - 1));
      track.style.transform = `translateX(${-(current * cardWidth())}px)`;
      cards.forEach((card, i) => card.classList.toggle("is-active", i === current));
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }

    prevBtn.addEventListener("click", () => goTo(current + 1));
    nextBtn.addEventListener("click", () => goTo(current - 1));

    track.addEventListener("pointerdown", (e) => {
      isDragging   = true;
      pointerStart = e.clientX;
      pointerDelta = 0;
      track.setPointerCapture(e.pointerId);
      track.style.transition = "none";
    });
    track.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      pointerDelta = e.clientX - pointerStart;
      track.style.transform = `translateX(${-(current * cardWidth()) + pointerDelta}px)`;
    });
    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = "";
      if (Math.abs(pointerDelta) > 55) {
        goTo(pointerDelta < 0 ? current + 1 : current - 1);
      } else {
        goTo(current);
      }
    };
    track.addEventListener("pointerup",     endDrag);
    track.addEventListener("pointercancel", endDrag);

    let autoTimer;
    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => {
        if (!document.hidden) goTo((current + 1) % count);
      }, 5500);
    }
    function stopAuto() { clearInterval(autoTimer); }

    if (carouselEl) {
      carouselEl.addEventListener("pointerenter", stopAuto);
      carouselEl.addEventListener("pointerleave", startAuto);
      carouselEl.addEventListener("focusin",      stopAuto);
      carouselEl.addEventListener("focusout",     startAuto);
    }

    window.addEventListener("resize", () => goTo(current), { passive: true });

    goTo(0);
    if (!prefersReduced) startAuto();
  }

  /* ============================================================
     Custom Cursor — lerp-following circle (hover devices only)
     ============================================================ */
  const cursorEl = document.getElementById("cursor");

  if (cursorEl && isHoverDevice && !prefersReduced) {
    let cx = -200, cy = -200;
    let tx = -200, ty = -200;

    document.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursorEl.classList.add("is-visible");
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      cursorEl.classList.remove("is-visible");
    });

    const interactives = document.querySelectorAll(
      "a, button, [role=button], input, select, textarea, summary, .gallery__item, label"
    );
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", () => cursorEl.classList.add("is-active"));
      el.addEventListener("mouseleave", () => cursorEl.classList.remove("is-active"));
    });

    (function animateCursor() {
      cx = lerp(cx, tx, 0.14);
      cy = lerp(cy, ty, 0.14);
      cursorEl.style.left = cx + "px";
      cursorEl.style.top  = cy + "px";
      requestAnimationFrame(animateCursor);
    })();
  }

  /* ============================================================
     FAQ accordion — close others when one opens
     ============================================================ */
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ============================================================
     Form — loading → success state
     ============================================================ */
  const form      = document.getElementById("regForm");
  const submitBtn = document.getElementById("submitBtn");
  if (form && submitBtn) {
    const label        = submitBtn.querySelector(".btn__label");
    const originalText = label ? label.textContent : "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>שולח...</span>';

      const formData = new FormData(form);
      formData.set("_subject", "הרשמה חדשה · RideWithYoav");
      if (!formData.has("friend")) formData.set("friend", "לא");

      try {
        const res = await fetch("https://formspree.io/f/xeebpwky", {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Formspree error");

        submitBtn.classList.remove("is-loading");
        submitBtn.classList.add("is-done");
        submitBtn.innerHTML = "<span>✓ נרשמת! ניצור קשר בקרוב</span>";
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-done");
          submitBtn.innerHTML = `<span class="btn__label">${originalText}</span>`;
          form.reset();
        }, 3500);
      } catch {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.innerHTML = "<span>שגיאה בשליחה — נסו שוב</span>";
        setTimeout(() => {
          submitBtn.innerHTML = `<span class="btn__label">${originalText}</span>`;
        }, 3500);
      }
    });
  }

  /* ============================================================
     Rising Light Particles — Canvas (fireflies / embers)
     Emotional layer: slow upward drift, subtle glow
     ============================================================ */
  (function initParticles() {
    const canvas = document.getElementById("ptx");
    if (!canvas || prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Colour palette: emerald greens + warm gold specks */
    const COLORS = [
      "#34d399", "#10b981", "#6ee7b7",
      "#a7f3d0", "#f59e0b", "#fbbf24",
    ];
    const MAX = 60;
    let particles = [];
    let animId;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawn(randomY) {
      const size = Math.random() * 2.4 + 0.4;
      return {
        x:          Math.random() * (canvas.width  || window.innerWidth),
        y:          randomY
                      ? Math.random() * (canvas.height || window.innerHeight)
                      : (canvas.height || window.innerHeight) + 12,
        size,
        speedY:     Math.random() * 0.32 + 0.1,
        speedX:     (Math.random() - 0.5) * 0.22,
        opacity:    Math.random() * 0.48 + 0.06,
        opDir:      Math.random() > 0.5 ? 1 : -1,
        color:      COLORS[Math.floor(Math.random() * COLORS.length)],
        blur:       Math.random() * 2.5,
        maxAge:     Math.random() * 260 + 80,
        age:        0,
      };
    }

    function init() {
      particles = [];
      for (let i = 0; i < MAX; i++) particles.push(spawn(true));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        /* Move */
        p.y   -= p.speedY;
        p.x   += p.speedX;
        p.age++;

        /* Breathe opacity */
        p.opacity += p.opDir * 0.007;
        if (p.opacity > 0.58) { p.opacity = 0.58; p.opDir = -1; }
        if (p.opacity < 0.04) { p.opacity = 0.04; p.opDir =  1; }

        /* Recycle */
        if (p.y < -10 || p.age > p.maxAge) {
          particles[i] = spawn(false);
          return;
        }

        /* Paint */
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = p.blur * 7;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    }

    /* Pause when tab is hidden (battery / CPU) */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        draw();
      }
    });

    resize();
    init();
    draw();

    window.addEventListener("resize", () => { resize(); init(); }, { passive: true });
  })();

  /* ============================================================
     Scroll Ambient — update CSS custom property for subtle
     scroll-driven atmosphere shifts
     ============================================================ */
  if (!prefersReduced) {
    let ambRaf = false;
    const root = document.documentElement;

    function updateAmbient() {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress  = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      root.style.setProperty("--scroll-progress", progress.toFixed(3));
      ambRaf = false;
    }

    window.addEventListener("scroll", () => {
      if (!ambRaf) {
        ambRaf = true;
        requestAnimationFrame(updateAmbient);
      }
    }, { passive: true });

    updateAmbient();
  }

})();
