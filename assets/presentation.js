(function () {
  "use strict";

  const FACILITIES = [
    {
      id: "anchor-windsor",
      brand: "Anchor Danly",
      name: "Windsor Headquarters",
      address: "2590 Ouellette Ave., Windsor, Ontario N8X 1L7, Canada",
      coordinates: [42.283823, -83.0157648],
      logo: "assets/brand/anchor-danly-logo.png",
      contact: "https://www.anchordanly.com/facilities/",
      phone: "519-966-4431",
      capabilities: ["Custom Fabrications"],
      credentials: ["ISO 9001:2015", "CSA N299.3:19", "CSA W47.1 Division 2"],
    },
    {
      id: "anchor-cambridge",
      brand: "Anchor Danly",
      name: "Cambridge",
      address: "311 Pinebush Rd., Cambridge, Ontario N1T 1B2, Canada",
      coordinates: [43.4127206, -80.300572],
      logo: "assets/brand/anchor-danly-logo.png",
      contact: "https://www.anchordanly.com/facilities/",
      phone: "519-740-3060",
      capabilities: ["Custom Fabrications"],
      credentials: ["ISO 9001:2015"],
    },
    {
      id: "anchor-ithaca",
      brand: "Anchor Danly",
      name: "Ithaca",
      address: "255 Industrial Pkwy., Ithaca, Michigan 48847, USA",
      coordinates: [43.2966023, -84.5875995],
      logo: "assets/brand/anchor-danly-logo.png",
      contact: "https://www.anchordanly.com/facilities/",
      phone: "989-875-5400",
      capabilities: ["Custom Fabrications"],
      credentials: ["ISO 9001:2015"],
    },
    {
      id: "anchor-montreal",
      brand: "Anchor Danly",
      name: "Montreal",
      address: "1450 Alphonse D-Roy, Montreal, Quebec H1W 2K8, Canada",
      coordinates: [45.5367949, -73.5436253],
      logo: "assets/brand/anchor-danly-logo.png",
      contact: "https://www.anchordanly.com/facilities/",
      phone: "514-525-5560",
      capabilities: ["Custom Fabrications"],
      credentials: [],
    },
    {
      id: "awc-guelph",
      brand: "AWC",
      name: "Guelph",
      address: "163 Curtis Drive, Guelph, Ontario, Canada",
      coordinates: [43.5505919, -80.3056932],
      logo: "assets/brand/awc-logo.png",
      contact: "https://awcmanufacturing.com/contact-us",
      phone: "519-822-0577",
      capabilities: ["Heavy Fabrication"],
      credentials: ["ISO 9001:2015", "ASME pressure vessels", "TSSA"],
    },
    {
      id: "awc-stratford",
      brand: "AWC",
      name: "Stratford",
      address: "141 Griffith Road, Stratford, Ontario, Canada",
      coordinates: [43.3515612, -80.9819503],
      logo: "assets/brand/awc-logo.png",
      contact: "https://awcmanufacturing.com/contact-us",
      phone: "519-272-0110",
      capabilities: ["Heavy Fabrication"],
      credentials: ["ISO 9001:2015", "TSSA"],
    },
    {
      id: "awc-tilbury",
      brand: "AWC",
      name: "Tilbury",
      address: "95 Lyon North, Tilbury, Ontario, Canada",
      coordinates: [42.2675366, -82.4364715],
      logo: "assets/brand/awc-logo.png",
      contact: "https://awcmanufacturing.com/contact-us",
      phone: "519-682-0470",
      capabilities: ["Heavy Fabrication"],
      credentials: ["CSA W47.1"],
    },
    {
      id: "awc-windsor",
      brand: "AWC",
      name: "Windsor",
      address: "1885 Blackacre Drive, Windsor, Ontario N0R 1L0, Canada",
      coordinates: [42.2344123, -82.9754827],
      logo: "assets/brand/awc-logo.png",
      contact: "https://awcmanufacturing.com/contact-us",
      phone: "519-682-0470",
      capabilities: ["Heavy Fabrication"],
      credentials: ["CSA W47.1 Division 2"],
    },
  ];

  window.ANCHOR_AWC_FACILITIES = FACILITIES;

  const slides = Array.from(document.querySelectorAll(".slide"));
  const previousButton = document.getElementById("previous-slide");
  const nextButton = document.getElementById("next-slide");
  const counter = document.getElementById("slide-counter");
  const currentLabel = document.getElementById("current-label");
  const progress = document.getElementById("progress-bar");
  const guidedToggle = document.getElementById("toggle-guided");
  const minimalToggle = document.getElementById("toggle-minimal");
  const fullscreenToggle = document.getElementById("toggle-fullscreen");
  const exportButton = document.getElementById("export-deck");
  const guidedNav = document.getElementById("guided-nav");
  const liveStatus = document.getElementById("live-status");
  const preferenceKey = "anchorAwcDeckPreferences.v1";
  let activeIndex = 0;
  let lastModalTrigger = null;
  let facilityMap = null;
  let facilityLayer = null;
  let facilityMarkers = [];
  let informationPulseReady = false;
  const informationPulseTimers = new Map();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseJsonBlock(id) {
    const element = document.getElementById(id);
    if (!element) return {};
    try {
      return JSON.parse(element.textContent);
    } catch (error) {
      console.warn(`Unable to parse ${id}`, error);
      return {};
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          guided: document.body.classList.contains("guided-mode"),
          minimal: document.body.classList.contains("minimal-mode"),
        })
      );
    } catch (error) {
      // Local storage can be blocked in private or file contexts; deck use continues.
    }
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}");
      document.body.classList.toggle("guided-mode", Boolean(saved.guided));
      document.body.classList.toggle("minimal-mode", Boolean(saved.minimal));
    } catch (error) {
      // Use default presentation mode.
    }
    guidedToggle.setAttribute("aria-pressed", String(document.body.classList.contains("guided-mode")));
    minimalToggle.setAttribute("aria-pressed", String(document.body.classList.contains("minimal-mode")));
  }

  function buildGuidedNav() {
    guidedNav.innerHTML = "";
    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "guide-item";
      button.dataset.slideIndex = String(index);
      button.innerHTML = `<span class="guide-index">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(slide.dataset.label || slide.id)}</span>`;
      button.addEventListener("click", () => goToSlide(index));
      guidedNav.appendChild(button);
    });
  }

  function updateControls() {
    const slide = slides[activeIndex];
    const number = activeIndex + 1;
    counter.textContent = `${String(number).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    currentLabel.textContent = slide.dataset.label || slide.id;
    progress.style.width = `${(number / slides.length) * 100}%`;
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
    Array.from(guidedNav.querySelectorAll(".guide-item")).forEach((button, index) => {
      button.setAttribute("aria-current", String(index === activeIndex));
    });
    liveStatus.textContent = `Slide ${number} of ${slides.length}: ${slide.dataset.label || slide.id}`;
  }

  function goToSlide(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === nextIndex;
      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      if (isActive) slide.scrollTop = 0;
    });
    activeIndex = nextIndex;
    updateControls();
    const id = slides[activeIndex].id;
    if (!options.skipHistory && id) history.replaceState(null, "", `#${id}`);
    if (id === "footprint" && facilityMap) {
      window.setTimeout(() => facilityMap.invalidateSize(), 80);
    }
    if (informationPulseReady) window.requestAnimationFrame(pulseVisibleInformationButtons);
  }

  function changeSlide(delta) {
    goToSlide(activeIndex + delta);
  }

  function bindSlideLinks() {
    document.querySelectorAll("[data-go-slide]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.goSlide;
        const targetIndex = slides.findIndex((slide) => slide.id === targetId);
        if (targetIndex >= 0) goToSlide(targetIndex);
      });
    });
  }

  function installPhotoRibbons() {
    const variants = ["anchor", "awc", "mixed"];
    slides.forEach((slide, index) => {
      if (slide.querySelector(".slide-photo-ribbon")) return;
      if (["opening", "geopolitical-risk"].includes(slide.id)) return;
      const ribbon = document.createElement("div");
      ribbon.className = `slide-photo-ribbon photo-ribbon-${variants[index % variants.length]}`;
      ribbon.setAttribute("aria-hidden", "true");
      ribbon.innerHTML = "<i></i><i></i><i></i>";
      slide.appendChild(ribbon);
    });
  }

  function installSlideNumbers() {
    const total = String(slides.length).padStart(2, "0");
    slides.forEach((slide, index) => {
      if (slide.querySelector(".slide-number")) return;
      const number = document.createElement("span");
      number.className = "slide-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = `${String(index + 1).padStart(2, "0")} / ${total}`;
      slide.appendChild(number);
    });
  }

  function syncViewportSizing() {
    const viewport = window.visualViewport;
    const width = Math.max(320, viewport?.width || window.innerWidth);
    const height = Math.max(480, viewport?.height || window.innerHeight);
    const widthFactor = Math.max(0.82, Math.min(1.5, width / 1920));
    const typeFactor = Math.max(0.9, Math.min(1.7, width / 1400));
    document.documentElement.style.setProperty("--deck-vw", `${width}px`);
    document.documentElement.style.setProperty("--deck-vh", `${height}px`);
    document.documentElement.style.setProperty("--deck-width-factor", widthFactor.toFixed(4));
    document.documentElement.style.setProperty("--deck-type-factor", typeFactor.toFixed(4));
  }

  function toggleGuided() {
    document.body.classList.toggle("guided-mode");
    guidedToggle.setAttribute("aria-pressed", String(document.body.classList.contains("guided-mode")));
    savePreferences();
  }

  function toggleMinimal() {
    document.body.classList.toggle("minimal-mode");
    minimalToggle.setAttribute("aria-pressed", String(document.body.classList.contains("minimal-mode")));
    savePreferences();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      liveStatus.textContent = "Fullscreen is not available in this browser context.";
    }
  }

  function updateFullscreenState() {
    fullscreenToggle.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
    fullscreenToggle.title = document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen";
  }

  function openModal(id, trigger) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastModalTrigger = trigger || document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const focusTarget = modal.querySelector(".modal-close, button, input, a");
    if (focusTarget) focusTarget.focus();
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastModalTrigger && typeof lastModalTrigger.focus === "function") lastModalTrigger.focus();
  }

  function isVisibleInformationButton(button) {
    if (!button.getClientRects().length) return false;
    const rect = button.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function pulseVisibleInformationButtons() {
    if (!informationPulseReady) return;
    let visibleIndex = 0;
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
      const isVisible = isVisibleInformationButton(button);
      if (!isVisible) {
        const timer = informationPulseTimers.get(button);
        if (timer) window.clearTimeout(timer);
        informationPulseTimers.delete(button);
        button.classList.remove("information-attention-pulse");
        if (!button.dataset.attentionDismissed) delete button.dataset.attentionPulsed;
        return;
      }
      if (button.dataset.attentionDismissed || button.dataset.attentionPulsed || informationPulseTimers.has(button)) return;

      button.dataset.attentionPulsed = "queued";
      const timer = window.setTimeout(() => {
        informationPulseTimers.delete(button);
        if (!isVisibleInformationButton(button) || button.dataset.attentionDismissed) {
          delete button.dataset.attentionPulsed;
          return;
        }
        button.dataset.attentionPulsed = "true";
        button.classList.add("information-attention-pulse");
      }, 5000 + visibleIndex * 180);
      informationPulseTimers.set(button, timer);
      visibleIndex += 1;
    });
  }

  function dismissInformationButtonAttention(button) {
    const timer = informationPulseTimers.get(button);
    if (timer) window.clearTimeout(timer);
    informationPulseTimers.delete(button);
    button.classList.remove("information-attention-pulse");
    button.dataset.attentionDismissed = "true";
    delete button.dataset.attentionPulsed;
  }

  function initializeInformationButtonAttention() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    informationPulseReady = true;
    pulseVisibleInformationButtons();
  }

  function bindModals() {
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        dismissInformationButtonAttention(button);
        openModal(button.dataset.openModal, button);
      });
    });
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => closeModal(modal));
      });
      modal.addEventListener("mousedown", (event) => {
        if (event.target === modal) closeModal(modal);
      });
    });
  }

  function createMarkerIcon(brand) {
    const isAwc = brand === "AWC";
    return L.divIcon({
      className: "",
      html: `<div class="brand-marker ${isAwc ? "awc" : "anchor"}"><span>${isAwc ? "AWC" : "AD"}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [10, 32],
      popupAnchor: [8, -30],
    });
  }

  function renderFacilityCards(facilities) {
    const container = document.getElementById("facility-cards");
    const count = document.getElementById("facility-count");
    const label = document.getElementById("facility-count-label");
    count.textContent = String(facilities.length);
    label.textContent = facilities.length === 1 ? "facility shown" : "facilities shown";
    container.innerHTML = facilities
      .map((facility) => {
        const brandClass = facility.brand === "AWC" ? "awc" : "anchor";
        const credentialMarkup = facility.credentials.length
          ? `<div class="facility-card-credentials" aria-label="Credentials">${facility.credentials.slice(0, 2).map((credential) => `<span>${escapeHtml(credential)}</span>`).join("")}</div>`
          : "";
        return `<article class="facility-card ${brandClass}" data-facility-id="${escapeHtml(facility.id)}">
          <div class="facility-brand">${escapeHtml(facility.brand)}</div>
          <h3>${escapeHtml(facility.name)}</h3>
          <address>${escapeHtml(facility.address)}</address>
          <p class="facility-card-focus">${facility.capabilities.slice(0, 2).map(escapeHtml).join(" · ")}</p>
          ${credentialMarkup}
          <div class="facility-card-actions"><a href="tel:+1${facility.phone.replace(/\D/g, "")}">${escapeHtml(facility.phone)}</a><a href="${escapeHtml(facility.contact)}" target="_blank" rel="noopener">Official info ↗</a></div>
        </article>`;
      })
      .join("");
  }

  function buildFacilityPopup(facility) {
    const capabilities = facility.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join("");
    const credentials = facility.credentials.length
      ? `<div class="facility-popup-section"><b>Credentials</b><p>${facility.credentials.map(escapeHtml).join(" · ")}</p></div>`
      : "";
    return `<div class="facility-popup">
      <span class="facility-popup-brand">${escapeHtml(facility.brand)}</span>
      <h3>${escapeHtml(facility.name)}</h3>
      <address>${escapeHtml(facility.address)}</address>
      <div class="facility-popup-section"><b>Capability Snapshot</b><ul>${capabilities}</ul></div>
      ${credentials}
      <div class="facility-popup-actions"><a href="tel:+1${facility.phone.replace(/\D/g, "")}">${escapeHtml(facility.phone)}</a><a href="${escapeHtml(facility.contact)}" target="_blank" rel="noopener">Official facility info ↗</a></div>
    </div>`;
  }

  function setFacilityFilter(filter) {
    const visible = FACILITIES.filter((facility) => filter === "Both" || facility.brand === filter);
    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.brandFilter === filter));
    });
    renderFacilityCards(visible);
    if (!facilityMap || !facilityLayer) return;
    facilityLayer.clearLayers();
    facilityMarkers = visible.map((facility) => {
      const marker = L.marker(facility.coordinates, {
        icon: createMarkerIcon(facility.brand),
        title: `${facility.brand} — ${facility.name}`,
        alt: `${facility.brand} ${facility.name} facility`,
        keyboard: true,
      });
      marker.bindPopup(buildFacilityPopup(facility), { maxWidth: 340, minWidth: 250 });
      marker.addTo(facilityLayer);
      return marker;
    });
    const bounds = L.latLngBounds(visible.map((facility) => facility.coordinates));
    facilityMap.fitBounds(bounds.pad(0.13), { padding: [32, 32], maxZoom: 6, animate: false });
  }

  function initializeFacilityMap() {
    renderFacilityCards(FACILITIES);
    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => setFacilityFilter(button.dataset.brandFilter));
    });
    if (!window.L) {
      document.getElementById("facility-map").innerHTML = '<div class="empty-state">Map runtime unavailable. The synchronized facility list remains available.</div>';
      return;
    }
    facilityMap = L.map("facility-map", {
      minZoom: 4,
      maxZoom: 6,
      zoomSnap: 1,
      maxBounds: [[39.5, -93], [49, -68]],
      maxBoundsViscosity: 1,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer("assets/map/tiles/{z}/{x}/{y}.png", {
      minZoom: 4,
      maxZoom: 6,
      noWrap: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(facilityMap);
    facilityLayer = L.layerGroup().addTo(facilityMap);
    setFacilityFilter("Both");
  }

  function makeChartSvg(points, valueKey, labelKey) {
    const valid = points
      .map((point) => ({ value: Number(point[valueKey]), label: point[labelKey] || "" }))
      .filter((point) => Number.isFinite(point.value));
    if (!valid.length) return '<div class="empty-state">No plotted observations are available in the current snapshot.</div>';
    const width = 920;
    const height = 260;
    const padX = 52;
    const padY = 24;
    const min = Math.min(...valid.map((point) => point.value));
    const max = Math.max(...valid.map((point) => point.value));
    const range = max - min || 1;
    const coords = valid.map((point, index) => ({
      ...point,
      x: padX + (index / Math.max(valid.length - 1, 1)) * (width - padX * 2),
      y: padY + ((max - point.value) / range) * (height - padY * 2 - 22),
    }));
    const line = coords.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${height - 24} L${coords[0].x.toFixed(1)},${height - 24} Z`;
    const labelIndexes = Array.from(new Set([0, Math.floor((coords.length - 1) / 2), coords.length - 1]));
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Price curve from ${escapeHtml(coords[0].label)} to ${escapeHtml(coords[coords.length - 1].label)}">
      <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99d24" stop-opacity="0.34"/><stop offset="1" stop-color="#d99d24" stop-opacity="0.01"/></linearGradient></defs>
      <line class="chart-grid-line" x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}"/>
      <line class="chart-grid-line" x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}"/>
      <line class="chart-grid-line" x1="${padX}" y1="${height - 24}" x2="${width - padX}" y2="${height - 24}"/>
      <path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>
      ${coords.map((point) => `<circle class="chart-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"><title>${escapeHtml(point.label)}: ${point.value}</title></circle>`).join("")}
      <text class="chart-label" x="4" y="${padY + 4}">${max.toLocaleString()}</text>
      <text class="chart-label" x="4" y="${height - 20}">${min.toLocaleString()}</text>
      ${labelIndexes.map((index) => `<text class="chart-label" x="${coords[index].x.toFixed(1)}" y="${height - 5}" text-anchor="middle">${escapeHtml(coords[index].label)}</text>`).join("")}
    </svg>`;
  }

  function renderMarketInstrument(contract, context) {
    if (!contract) return;
    const curve = Array.isArray(contract.curve) ? contract.curve : [];
    const chart = makeChartSvg(curve, "price", "contract_label");
    const latest = Number(contract.latest_price);
    const latestText = Number.isFinite(latest) ? latest.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
    context.querySelector("[data-instrument-name]").textContent = contract.label || "Commodity curve";
    context.querySelector("[data-instrument-value]").textContent = latestText;
    context.querySelector("[data-instrument-unit]").textContent = contract.unit || "";
    context.querySelector("[data-instrument-date]").textContent = contract.latest_date ? `Snapshot ${contract.latest_date}` : "Current tracked snapshot";
    context.querySelector("[data-chart]").innerHTML = chart;
    const sourceLink = context.querySelector("[data-market-source]");
    if (sourceLink) {
      sourceLink.href = contract.source_url || "#";
      sourceLink.textContent = contract.source_url ? "View public source ↗" : "Public source unavailable";
    }
    const tableBody = context.querySelector("[data-market-table-body]");
    if (tableBody) {
      tableBody.innerHTML = curve
        .map((point) => `<tr><td>${escapeHtml(point.contract_label || point.contract)}</td><td>${Number(point.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td><td>${Number(point.change_pct || 0).toFixed(2)}%</td><td>${escapeHtml(point.expiration_date || "—")}</td></tr>`)
        .join("");
    }
  }

  function initializeMarketExplorer() {
    const payload = parseJsonBlock("futures-data");
    const contracts = Array.isArray(payload.contracts) ? payload.contracts : [];
    const contexts = [document.getElementById("market-tool"), document.getElementById("market-modal-tool")].filter(Boolean);
    contexts.forEach((context) => {
      const tabs = Array.from(context.querySelectorAll("[data-contract-id]"));
      const selectContract = (id) => {
        tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.contractId === id)));
        renderMarketInstrument(contracts.find((contract) => contract.id === id) || contracts[0], context);
      };
      tabs.forEach((tab) => tab.addEventListener("click", () => selectContract(tab.dataset.contractId)));
      selectContract(contracts[0]?.id || "hrc_futures");
    });
    document.querySelectorAll("[data-market-generated]").forEach((element) => {
      element.textContent = payload.generated_at ? `Data refreshed ${payload.generated_at}` : "Tracked public market snapshot";
    });
  }

  function formatMarketValue(contract) {
    const value = Number(contract?.latest_price);
    if (!Number.isFinite(value)) return "—";
    const digits = contract?.id === "copper_futures" ? 2 : 0;
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }

  function renderMarketContextSlides() {
    const futures = parseJsonBlock("futures-data");
    const contracts = Array.isArray(futures.contracts) ? futures.contracts : [];
    const metrics = document.getElementById("geopolitical-market-metrics");
    if (metrics) {
      metrics.innerHTML = contracts
        .slice(0, 3)
        .map((contract) => {
          const yearly = Number(contract.year_change_pct);
          const direction = Number.isFinite(yearly) && yearly > 0 ? "+" : "";
          const unit = contract.id === "copper_futures" ? "per lb" : "per ton";
          return `<article><strong>${escapeHtml(contract.label)}</strong><span>${formatMarketValue(contract)}</span><small>${unit} · YoY ${Number.isFinite(yearly) ? `${direction}${yearly.toFixed(1)}%` : "—"}</small></article>`;
        })
        .join("");
    }
    const marketDate = document.getElementById("geopolitical-market-date");
    if (marketDate) {
      marketDate.textContent = futures.generated_at
        ? `Embedded public snapshot refreshed ${futures.generated_at}. Directional references—not mill quotes.`
        : "Directional public references—not mill quotes.";
    }

    const geopolitics = parseJsonBlock("geopolitical-data");
    const geopoliticalSignals = Array.isArray(geopolitics.signals) ? geopolitics.signals : [];
    const signalList = document.getElementById("geopolitical-signal-list");
    if (signalList) {
      signalList.innerHTML = geopoliticalSignals.length
        ? geopoliticalSignals.slice(0, 3).map((signal) => {
          const topic = signal.topic_label || "Official Update";
          const date = signal.published_date || "Active advisory";
          const title = signal.title || "Official material-risk update";
          const source = signal.source || "Official public source";
          const content = `<span><b>${escapeHtml(topic)}</b><small>${escapeHtml(date)} · ${escapeHtml(source)}</small></span><strong>${escapeHtml(title)}</strong>`;
          return signal.source_url
            ? `<a href="${escapeHtml(signal.source_url)}" target="_blank" rel="noopener">${content}<i>↗</i></a>`
            : `<article>${content}</article>`;
        }).join("")
        : "<article><strong>No new official material-risk notices were available in the current refresh.</strong></article>";
    }
    const signalDate = document.getElementById("geopolitical-signal-date");
    if (signalDate) {
      signalDate.textContent = geopolitics.generated_at
        ? `Checked ${geopolitics.generated_at}`
        : "Daily public-source check";
    }

    const hrc = contracts.find((contract) => contract.id === "hrc_futures");
    const hrcPrice = document.getElementById("steel-hrc-price");
    const hrcDate = document.getElementById("steel-hrc-date");
    const hrcChange = document.getElementById("steel-hrc-change");
    if (hrcPrice) hrcPrice.textContent = hrc ? `${formatMarketValue(hrc)}/t` : "—";
    if (hrcDate) hrcDate.textContent = hrc?.latest_date
      ? `Public futures snapshot dated ${hrc.latest_date}.`
      : "Current embedded public futures snapshot.";
    if (hrcChange) {
      const yearly = Number(hrc?.year_change_pct);
      hrcChange.textContent = Number.isFinite(yearly) ? `${yearly > 0 ? "+" : ""}${yearly.toFixed(1)}%` : "—";
    }

    const rolling = parseJsonBlock("rolling-schedule-data");
    const schedule = rolling?.schedules?.nucor_yamato
      || Object.values(rolling?.schedules || {})[0]
      || (Array.isArray(rolling?.more_mills) ? rolling.more_mills[0] : null);
    const previewTitle = document.getElementById("rolling-preview-title");
    const previewBody = document.getElementById("rolling-preview-body");
    const previewMeta = document.getElementById("rolling-preview-meta");
    const horizon = document.getElementById("steel-schedule-horizon");
    const horizonNote = document.getElementById("steel-schedule-note");
    const rows = schedule?.sections?.[0]?.rows?.slice(0, 4) || [];
    const nextValue = (row) => {
      const values = Array.isArray(row.values) ? row.values : [];
      return [...values].reverse().find((value) => String(value || "").trim()) || "TBA";
    };
    if (previewTitle) {
      previewTitle.textContent = schedule
        ? `${schedule.label || schedule.producer} · ${schedule.published_label || "Current"}`
        : "Rolling Schedule Preview";
    }
    if (previewBody) {
      previewBody.innerHTML = rows.length
        ? rows.map((row) => `<tr><td>${escapeHtml(row.shape || row.item || "—")}</td><td>${escapeHtml(row.mill || schedule.producer || "—")}</td><td>${escapeHtml(nextValue(row))}</td></tr>`).join("")
        : '<tr><td colspan="3">No published schedule rows are available in the current embedded snapshot.</td></tr>';
    }
    if (previewMeta) {
      previewMeta.textContent = schedule
        ? `${schedule.note || "Public schedule subject to mill change."} Snapshot refreshed ${rolling.generated_at || "—"}.`
        : "Public schedules remain subject to mill change.";
    }
    if (horizon) {
      const dateRange = rows.map(nextValue).join(" ").match(/\d{1,2}\/\d{1,2}(?:-\d{1,2}\/\d{1,2})?/);
      horizon.textContent = dateRange ? dateRange[0].replace("-", "–") : "Shape-Specific";
    }
    if (horizonNote) {
      horizonNote.textContent = schedule
        ? `Sample heavy-shape rows from the schedule published ${schedule.published_label || "in the current snapshot"}.`
        : "Published windows vary by shape and mill.";
    }
  }

  function normalizeSchedules(payload) {
    const primary = Object.entries(payload.schedules || {}).map(([id, schedule]) => ({ id, ...schedule }));
    const more = Array.isArray(payload.more_mills) ? payload.more_mills : [];
    return [...primary, ...more];
  }

  const SCHEDULE_STATUS_META = [
    ["shutdown", "Shutdown"],
    ["closed", "Closed"],
    ["inquire", "Inquire"],
    ["open", "Open"],
    ["stock", "Stock"],
    ["rolled", "Rolled"],
    ["cast", "Cast"],
    ["castrolled", "Cast / Rolled"],
    ["proposed", "Proposed"],
    ["plannedstock", "Planned Stock"],
    ["notrolling", "Not Rolling"],
    ["outage", "Outage"],
    ["accumulation", "SA / Accumulation"],
  ];
  const SCHEDULE_SEVERE_STATUSES = new Set(["shutdown", "closed", "outage", "notrolling", "cancelled"]);
  const SCHEDULE_ACTIVITY_STATUSES = new Set(["open", "inquire", "stock", "rolled", "plannedstock", "cast", "castrolled", "proposed", "accumulation"]);

  function getScheduleStatusKey(value) {
    const normalized = String(value || "").trim();
    if (!normalized) return "";
    const upper = normalized.toUpperCase();
    if (upper === "SHUTDOWN") return "shutdown";
    if (upper === "STOCK" || upper === "S" || upper.startsWith("S-") || upper.startsWith("S:")) return "stock";
    if (upper.includes("OUTAGE")) return "outage";
    if (upper === "CR") return "castrolled";
    if (upper === "CC") return "cast";
    if (upper === "PS") return "plannedstock";
    if (upper === "NR") return "notrolling";
    if (upper === "R" || upper.startsWith("R ")) return "rolled";
    if (upper === "TBA" || upper.startsWith("P") || upper.includes(" WKS ") || upper.includes("PROJECTED")) {
      if (upper.includes("CLOSED") || /^C\d/.test(upper)) return "closed";
      if (upper.includes(" WKS I") || upper.includes(" I")) return "inquire";
      if (upper.includes("SA")) return "accumulation";
      return "proposed";
    }
    if (upper.includes("CANCEL")) return "cancelled";
    if (/(^|\s)C(\d|\s|$)/.test(upper) || upper.endsWith(" CLOSED") || upper === "C") return "closed";
    if (/(^|\s)I(\d|\s|$)/.test(upper) || upper.includes(" I ")) return "inquire";
    if (upper === "O") return "open";
    if (upper === "P") return "proposed";
    if (upper.includes("SA")) return "accumulation";
    if (upper === ">>>>") return "transfer";
    return "note";
  }

  function scheduleRows(schedule) {
    const columns = Array.isArray(schedule.columns) ? schedule.columns : [];
    const sections = Array.isArray(schedule.sections) ? schedule.sections : [];
    const rows = [];
    sections.forEach((section) => {
      (section.rows || []).forEach((row) => rows.push({ section: section.title || "Schedule", ...row }));
    });
    return { columns, sections, rows };
  }

  function summarizeSchedule(schedule) {
    const { sections, rows } = scheduleRows(schedule);
    let constraintRows = 0;
    let activityRows = 0;
    let leaderTitle = "";
    let leaderCount = 0;
    sections.forEach((section) => {
      let sectionConstraints = 0;
      (section.rows || []).forEach((row) => {
        const statuses = (row.values || []).map(getScheduleStatusKey);
        if (statuses.some((status) => SCHEDULE_SEVERE_STATUSES.has(status))) {
          constraintRows += 1;
          sectionConstraints += 1;
        }
        if (statuses.some((status) => SCHEDULE_ACTIVITY_STATUSES.has(status))) activityRows += 1;
      });
      if (sectionConstraints > leaderCount) {
        leaderCount = sectionConstraints;
        leaderTitle = section.title || "Schedule";
      }
    });
    return {
      rows: rows.length,
      sections: sections.length,
      constraintRows,
      activityRows,
      leaderTitle,
      leaderCount,
    };
  }

  function renderScheduleLegend(schedule) {
    const key = document.getElementById("schedule-key");
    if (!key) return;
    key.innerHTML = `
      <strong>Status Key</strong>
      <div class="schedule-key-items">
        ${SCHEDULE_STATUS_META.map(([status, label]) => `<span><i class="schedule-key-dot status-${status}"></i>${escapeHtml(label)}</span>`).join("")}
      </div>
      <small>Colors translate the published mill codes; dates and availability remain subject to mill change.</small>
    `;
  }

  function renderScheduleTable(section, columns, options = {}) {
    const rows = Array.isArray(section.rows) ? section.rows : [];
    const projectedIndex = columns.findIndex((column) => /projected|next/i.test(String(column)));
    return `
      <article class="schedule-table-card">
        <header class="schedule-table-card-head">
          <div>
            <span>Product Family</span>
            <h4>${escapeHtml(section.title || "Schedule")}</h4>
          </div>
          <p>${escapeHtml(section.description || "Current published mill schedule rows.")}</p>
        </header>
        <div class="schedule-table-wrap">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="schedule-col-shape">Shape / Item</th>
                ${columns.map((column, index) => `<th${index === projectedIndex ? ' class="is-projected-col"' : ""}>${escapeHtml(column)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => {
                const values = Array.isArray(row.values) ? row.values : [];
                const searchable = [section.title, row.shape, row.item, row.mill, ...values].join(" ").toLowerCase();
                const mill = row.mill ? `<span class="schedule-row-meta">${escapeHtml(row.mill)}</span>` : "";
                return `
                  <tr data-schedule-search="${escapeHtml(searchable)}">
                    <th class="schedule-row-head"><span class="schedule-row-shape">${escapeHtml(row.shape || row.item || "—")}</span>${mill}</th>
                    ${columns.map((column, index) => {
                      const value = values[index] || "";
                      const status = getScheduleStatusKey(value);
                      const classes = ["schedule-cell"];
                      if (status) classes.push(`status-${status}`);
                      if (index === projectedIndex) classes.push("is-projected-col");
                      return `<td class="${classes.join(" ")}">${escapeHtml(value)}</td>`;
                    }).join("")}
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderSchedule(schedule) {
    const title = document.getElementById("schedule-table-title");
    const note = document.getElementById("schedule-table-note");
    const container = document.getElementById("schedule-table-wrap");
    const search = document.getElementById("schedule-search");
    if (!schedule) {
      container.innerHTML = '<div class="empty-state">No schedule data is available.</div>';
      return;
    }
    title.textContent = schedule.label || schedule.producer || "Mill Schedule";
    note.textContent = schedule.published_label
      ? `${schedule.label || schedule.producer || "Public source"} published ${schedule.published_label}.`
      : "Tracked public mill schedule snapshot.";
    const { columns, sections, rows } = scheduleRows(schedule);
    const summary = summarizeSchedule(schedule);
    const officialLink = schedule.source_url
      ? `<a class="schedule-source-link" href="${escapeHtml(schedule.source_url)}" target="_blank" rel="noopener">Open Official Mill Source ↗</a>`
      : "";
    container.innerHTML = `
      <section class="schedule-intro-card">
        <div class="schedule-intro-copy">
          <span>${escapeHtml(schedule.producer || "Public Mill")}</span>
          <strong>${escapeHtml(schedule.label || schedule.producer || "Mill Schedule")} Custom View</strong>
          <p>${escapeHtml(schedule.note || "Current public schedule rendered in a searchable branded view.")}</p>
          ${officialLink}
        </div>
        <div class="schedule-summary-grid">
          <article><span>Rows Tracked</span><b>${summary.rows.toLocaleString()}</b><small>Shape and item rows</small></article>
          <article><span>Constraint Rows</span><b>${summary.constraintRows.toLocaleString()}</b><small>Shutdown, closed, outage, or not rolling</small></article>
          <article><span>Rows With Cues</span><b>${summary.activityRows.toLocaleString()}</b><small>Open, inquire, stock, cast, or proposed</small></article>
          <article><span>Constraint Leader</span><b>${summary.leaderCount.toLocaleString()}</b><small>${escapeHtml(summary.leaderTitle || `${summary.sections} Product Families`)}</small></article>
        </div>
      </section>
      ${sections.map((section) => renderScheduleTable(section, columns)).join("")}
    `;
    renderScheduleLegend(schedule);
    search.value = "";
    document.getElementById("schedule-result-count").textContent = `${rows.length.toLocaleString()} Rows`;
  }

  function initializeScheduleExplorer() {
    const payload = parseJsonBlock("rolling-schedule-data");
    const schedules = normalizeSchedules(payload);
    const tabs = document.getElementById("schedule-tabs");
    tabs.innerHTML = schedules.map((schedule, index) => `<button type="button" class="modal-tab" role="tab" aria-selected="${index === 0}" data-schedule-id="${escapeHtml(schedule.id)}">${escapeHtml(schedule.label || schedule.producer || schedule.id)}</button>`).join("");
    tabs.querySelectorAll("[data-schedule-id]").forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.querySelectorAll("[data-schedule-id]").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
        renderSchedule(schedules.find((schedule) => schedule.id === tab.dataset.scheduleId));
      });
    });
    renderSchedule(schedules[0]);
    const search = document.getElementById("schedule-search");
    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      const rows = Array.from(document.querySelectorAll("[data-schedule-search]"));
      let visible = 0;
      rows.forEach((row) => {
        const match = !term || row.dataset.scheduleSearch.includes(term);
        row.hidden = !match;
        if (match) visible += 1;
      });
      document.querySelectorAll(".schedule-table-card").forEach((card) => {
        card.hidden = !Array.from(card.querySelectorAll("[data-schedule-search]")).some((row) => !row.hidden);
      });
      document.getElementById("schedule-result-count").textContent = `${visible.toLocaleString()} Matching Rows`;
    });
    document.querySelectorAll("[data-schedule-generated]").forEach((element) => {
      element.textContent = payload.generated_at ? `Schedules refreshed ${payload.generated_at}` : "Tracked public schedule snapshot";
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (event) => {
      const openModalElement = document.querySelector(".modal.open");
      if (event.key === "Escape" && openModalElement) {
        event.preventDefault();
        closeModal(openModalElement);
        return;
      }
      if (openModalElement) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if (["ArrowRight", "PageDown"].includes(event.key) || (event.key === " " && tag !== "button")) {
        event.preventDefault();
        changeSlide(1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        changeSlide(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToSlide(slides.length - 1);
      } else if (event.key.toLowerCase() === "g") {
        toggleGuided();
      } else if (event.key.toLowerCase() === "m") {
        toggleMinimal();
      } else if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    });
  }

  function initialize() {
    syncViewportSizing();
    buildGuidedNav();
    loadPreferences();
    bindModals();
    bindSlideLinks();
    installPhotoRibbons();
    installSlideNumbers();
    bindKeyboard();
    initializeFacilityMap();
    initializeMarketExplorer();
    renderMarketContextSlides();
    initializeScheduleExplorer();
    previousButton.addEventListener("click", () => changeSlide(-1));
    nextButton.addEventListener("click", () => changeSlide(1));
    guidedToggle.addEventListener("click", toggleGuided);
    minimalToggle.addEventListener("click", toggleMinimal);
    fullscreenToggle.addEventListener("click", toggleFullscreen);
    exportButton.addEventListener("click", () => window.print());
    document.addEventListener("fullscreenchange", updateFullscreenState);
    window.addEventListener("resize", syncViewportSizing, { passive: true });
    window.visualViewport?.addEventListener("resize", syncViewportSizing, { passive: true });
    const hashIndex = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
    goToSlide(hashIndex >= 0 ? hashIndex : 0, { skipHistory: hashIndex < 0 });
    initializeInformationButtonAttention();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
