const projectDate = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const siteOrigin = "http://allcore.com.au";

function setMeta(selector, attr, value) {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attr, value);
}

function ensureJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function setupNavigation() {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (navbar) {
    window.addEventListener(
      "scroll",
      () => {
        navbar.classList.toggle("scrolled", window.scrollY > 12);
      },
      { passive: true }
    );
  }

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

async function getProjects() {
  const response = await fetch("./data/projects.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Project data could not be loaded.");
  const data = await response.json();
  const projects = Array.isArray(data) ? data : data.projects || [];
  return projects.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function projectCard(project) {
  return `
    <article class="project-card">
      <a href="./project.html?project=${encodeURIComponent(project.slug)}" aria-label="Read ${project.title}">
        <img src="${project.coverImage}" alt="${project.altText}" loading="lazy" />
      </a>
      <div class="project-card-body">
        <div class="project-meta">
          <span>${project.service}</span>
          <span>${projectDate.format(new Date(project.date))}</span>
        </div>
        <h3><a href="./project.html?project=${encodeURIComponent(project.slug)}">${project.title}</a></h3>
        <p>${project.summary}</p>
        <a class="text-link" href="./project.html?project=${encodeURIComponent(project.slug)}">View project</a>
      </div>
    </article>
  `;
}

function setProjectMeta(project) {
  const projectUrl = `${siteOrigin}/project.html?project=${encodeURIComponent(project.slug)}`;
  const imageUrl = new URL(project.coverImage, `${siteOrigin}/`).href;
  const title = `${project.title} | ALL CORE Sawing & Drilling`;
  const description = project.summary || project.description || "Completed ALL CORE Sawing & Drilling project.";

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('link[rel="canonical"]', "href", projectUrl);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:url"]', "content", projectUrl);
  setMeta('meta[property="og:image"]', "content", imageUrl);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:image"]', "content", imageUrl);

  ensureJsonLd("project-jsonld", {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": project.title,
    "description": description,
    "image": imageUrl,
    "datePublished": project.date,
    "mainEntityOfPage": projectUrl,
    "author": {
      "@type": "Organization",
      "name": "ALL CORE Sawing & Drilling",
      "url": siteOrigin
    },
    "publisher": {
      "@type": "Organization",
      "name": "ALL CORE Sawing & Drilling",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteOrigin}/public/assets/allcore-logo-black-web.png`
      }
    },
    "about": {
      "@type": "Service",
      "name": project.service,
      "areaServed": project.location
    }
  });
}

async function renderProjectLists() {
  const lists = document.querySelectorAll("[data-project-list]");
  if (!lists.length) return;

  try {
    const projects = await getProjects();
    lists.forEach((list) => {
      const limit = Number(list.dataset.limit || projects.length);
      list.innerHTML = projects.slice(0, limit).map(projectCard).join("");
    });
  } catch (error) {
    lists.forEach((list) => {
      list.innerHTML = `
        <div class="notice">
          <h2>Projects are unavailable</h2>
          <p>Please try again shortly or contact ALL CORE for recent work examples.</p>
        </div>
      `;
    });
  }
}

function renderMissingProject(container) {
  container.innerHTML = `
    <section class="page-hero">
      <div class="wrap page-hero-inner">
        <span class="kicker">Project Not Found</span>
        <h1 class="page-title">This project could not be found</h1>
        <p>The project may have moved, or the link may be incorrect.</p>
        <a class="btn btn-red" href="./projects.html">Back To Projects</a>
      </div>
    </section>
  `;
}

async function renderProjectDetail() {
  const container = document.querySelector("[data-project-detail]");
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get("project");
  if (!slug) {
    renderMissingProject(container);
    return;
  }

  try {
    const projects = await getProjects();
    const project = projects.find((item) => item.slug === slug);
    if (!project) {
      renderMissingProject(container);
      return;
    }

    setProjectMeta(project);
    const gallery = project.galleryImages
      .map((image, index) => `<img src="${image}" alt="${project.altText} photo ${index + 1}" loading="lazy" />`)
      .join("");

    container.innerHTML = `
      <section class="project-detail-hero">
        <img src="${project.coverImage}" alt="${project.altText}" />
        <div class="project-detail-overlay"></div>
        <div class="wrap project-detail-copy">
          <a class="back-link" href="./projects.html">Back to projects</a>
          <span class="kicker">${project.service}</span>
          <h1 class="page-title">${project.title}</h1>
          <p>${project.summary}</p>
        </div>
      </section>
      <section class="section">
        <div class="wrap project-detail-grid">
          <aside class="project-facts">
            <div>
              <strong>Date</strong>
              <span>${projectDate.format(new Date(project.date))}</span>
            </div>
            <div>
              <strong>Location</strong>
              <span>${project.location}</span>
            </div>
            <div>
              <strong>Service</strong>
              <span>${project.service}</span>
            </div>
          </aside>
          <article class="project-story">
            <span class="kicker">Project Description</span>
            <h2 class="section-h">Completed work</h2>
            <p>${project.description}</p>
          </article>
        </div>
      </section>
      <section class="section gallery-section">
        <div class="wrap">
          <div class="section-head">
            <span class="kicker">Photos</span>
            <h2 class="section-h">Project Gallery</h2>
          </div>
          <div class="gallery-grid">${gallery}</div>
        </div>
      </section>
    `;
  } catch (error) {
    renderMissingProject(container);
  }
}

setupNavigation();
renderProjectLists();
renderProjectDetail();
