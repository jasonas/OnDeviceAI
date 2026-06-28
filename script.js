(function () {
  const body = document.body;
  const root = document.documentElement;
  const apiSource = body.getAttribute("data-api-source");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  function getTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeControl(theme) {
    if (!themeToggle) return;
    const isDark = theme === "dark";
    const label = isDark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  }

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    updateThemeControl(theme);

    if (!persist) return;
    try {
      localStorage.setItem("ondevice-theme", theme);
    } catch (error) {
      // Storage may be unavailable in private or embedded browser contexts.
    }
  }

  updateThemeControl(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      setTheme(getTheme() === "dark" ? "light" : "dark", true);
    });
  }

  function setMenu(open) {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.toggle("is-open", open);
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (menuToggle && navLinks) {
    body.classList.add("nav-ready");
    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function link(label, href, className) {
    if (!href) return "";
    return `<a class="${className || "text-link"}" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
  }

  function renderCard(item) {
    const model = item.model || {};
    const runtime = item.runtime || {};
    const original = item.original || {};
    const quantization = runtime.recommendedQuantization && runtime.recommendedQuantization !== "N/A"
      ? ` / ${runtime.recommendedQuantization}`
      : "";
    const runtimeFiles = Array.isArray(runtime.companionFiles) && runtime.companionFiles.length
      ? link("All runtime files", runtime.repo, "download-link quiet")
      : "";

    return `
      <article class="model-card">
        <div class="model-title">
          <span class="category">${escapeHtml(item.categoryLabel)}</span>
          <h3>${escapeHtml(model.displayName)}</h3>
        </div>
        <div class="model-summary">
          <p class="why">${escapeHtml(item.why)}</p>
          <div class="facts">
            <div>
              <span>Size</span>
              <strong>${escapeHtml(model.parameters)}</strong>
            </div>
            <div>
              <span>Runtime</span>
              <strong>${escapeHtml(runtime.format)}${escapeHtml(quantization)}</strong>
            </div>
            <div>
              <span>License</span>
              <strong>${escapeHtml(model.license)}</strong>
            </div>
          </div>
        </div>
        <div class="download-row">
          ${link("Original", original.repo || original.download, "download-link")}
          ${link("Mobile download", runtime.download || runtime.repo, "download-link")}
          ${runtimeFiles}
        </div>
      </article>
    `;
  }

  function renderHistory(history) {
    const container = document.getElementById("history-list");
    if (!container) return;

    if (!Array.isArray(history) || !history.length) {
      container.innerHTML = "<p>No archived updates yet.</p>";
      return;
    }

    container.innerHTML = history.map((entry) => `
      <article class="history-item">
        <div>
          <strong>${escapeHtml(entry.version)}</strong>
          <p>${escapeHtml(entry.notes)}</p>
        </div>
        <div class="history-links">
          ${link("HTML", entry.html, "minor-link")}
          ${link("API", entry.api, "minor-link")}
        </div>
      </article>
    `).join("");
  }

  function renderSources(sources) {
    const container = document.getElementById("source-list");
    if (!container) return;

    container.innerHTML = (sources || [])
      .map((source) => link(source.label, source.url, "source-link"))
      .join("");
  }

  function renderNotes(notes) {
    const container = document.getElementById("selection-notes");
    if (!container) return;
    container.innerHTML = (notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  }

  function render(data) {
    if (body.getAttribute("data-preserve-title") !== "true") {
      document.title = `${data.site.name} - Best mobile AI models`;
    }

    const version = document.getElementById("version");
    const updatedAt = document.getElementById("updated-at");
    const targetDevice = document.getElementById("target-device");
    const description = document.getElementById("site-description");
    const footerUpdated = document.getElementById("footer-updated");
    const grid = document.getElementById("model-grid");

    if (version) {
      const status = data.status === "complete" ? " (Complete)" : "";
      version.textContent = `${data.version}${status}`;
    }
    if (updatedAt) updatedAt.textContent = data.updatedAtDisplay;
    if (targetDevice) targetDevice.textContent = `${data.targetDevice.ram} phones`;
    if (description) description.textContent = data.site.description;
    if (footerUpdated) footerUpdated.textContent = `Last updated ${data.updatedAtDisplay}.`;
    if (grid) grid.innerHTML = data.recommendations.map(renderCard).join("");

    renderNotes(data.selectionNotes);
    renderHistory(data.history);
    renderSources(data.sources);
  }

  function renderError(error) {
    const grid = document.getElementById("model-grid");
    if (!grid) return;
    grid.innerHTML = `
      <article class="model-card error-card">
        <h3>Could not load recommendations</h3>
        <p>${escapeHtml(error.message || error)}</p>
      </article>
    `;
  }

  if (!apiSource) return;

  fetch(apiSource, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then(render)
    .catch(renderError);
})();
