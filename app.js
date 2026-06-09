(() => {
  "use strict";

  const DATA = window.SHORTS_SHOWCASE_DATA;
  const videos = DATA.videos;
  const i18n = DATA.i18n;
  const glossary = DATA.glossary;

  const state = {
    lang: localStorage.getItem("shorts-lang") || "zh",
    theme: localStorage.getItem("shorts-theme") || "A",
    index: Number(localStorage.getItem("shorts-index") || 0),
    muted: false,
    motivationExpanded: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const langMap = { zh: "zh-Hant", en: "en", ja: "ja" };
  const themeNames = {
    zh: { A: "A 溫馨", B: "B 晨光", C: "C 人本移動", D: "D 靜謐" },
    en: { A: "A Warm", B: "B Dawn", C: "C Human Mobility", D: "D Quiet" },
    ja: { A: "A 温かい", B: "B 朝光", C: "C 人本移動", D: "D 静謐" }
  };

  const sections = [
    ["home", "heroTitle"],
    ["motivation", "sectionMotivation"],
    ["showcase", "sectionShowcase"],
    ["topics", "sectionTopics"],
    ["story", "sectionStory"],
    ["tech", "sectionTech"]
  ];

  function t(key) {
    return (i18n[state.lang] && i18n[state.lang][key]) || i18n.zh[key] || key;
  }

  function getVideoTitle(video) {
    if (state.lang === "en") return video.titleEn;
    if (state.lang === "ja") return video.titleJa;
    return video.titleZh;
  }

  function getVideoTagline(video) {
    if (state.lang === "en") return `${video.batch === "第一批影片" ? "Batch 1" : "Batch 2"}｜${video.group}`;
    if (state.lang === "ja") return `${video.batch === "第一批影片" ? "第1群" : "第2群"}｜${video.group}`;
    return `${video.batch}｜${video.group}`;
  }

  function embedUrlFor(video) {
    const muteValue = state.muted ? "1" : "0";
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
      mute: muteValue
    });
    if (window.location.protocol === "https:" || window.location.protocol === "http:") {
      params.set("origin", window.location.origin);
      params.set("widget_referrer", window.location.href);
    }
    return `https://www.youtube.com/embed/${video.youtubeId}?${params.toString()}`;
  }

  function sendYoutubeCommand(func, args = []) {
    const iframe = $("#youtubePlayer");
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func,
      args
    }), "https://www.youtube.com");
  }

  function applyDefaultAudioState() {
    if (state.muted) {
      sendYoutubeCommand("mute");
    } else {
      sendYoutubeCommand("unMute");
      sendYoutubeCommand("setVolume", [100]);
    }
  }

  function renderI18n() {
    document.documentElement.lang = langMap[state.lang] || "zh-Hant";
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    $$('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', t(key));
    });
  }

  function renderMotivation() {
    const text = DATA.motivation[state.lang] || DATA.motivation.zh;
    const limit = state.lang === "zh" ? 180 : 300;
    const isLong = text.length > limit;
    const output = !state.motivationExpanded && isLong ? `${text.slice(0, limit)}…` : text;
    $("#motivationText").textContent = output;
    const btn = $("#motivationToggle");
    btn.textContent = state.motivationExpanded ? t("showLess") : t("showMore");
    btn.setAttribute("aria-expanded", String(state.motivationExpanded));
    btn.hidden = !isLong;
  }

  function renderMenus() {
    const langMenu = $("#langMenu");
    langMenu.innerHTML = "";
    [["zh", "中文"], ["en", "English"], ["ja", "日本語"]].forEach(([code, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.setAttribute("role", "menuitem");
      if (state.lang === code) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => {
        state.lang = code;
        localStorage.setItem("shorts-lang", code);
        closeFlyouts();
        renderAll();
      });
      langMenu.appendChild(btn);
    });

    const themeMenu = $("#themeMenu");
    themeMenu.innerHTML = "";
    ["A", "B", "C", "D"].forEach(code => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = themeNames[state.lang][code];
      btn.setAttribute("role", "menuitem");
      if (state.theme === code) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => {
        state.theme = code;
        localStorage.setItem("shorts-theme", code);
        document.body.dataset.theme = code;
        closeFlyouts();
        renderMenus();
      });
      themeMenu.appendChild(btn);
    });

    const tocMenu = $("#tocMenu");
    tocMenu.innerHTML = "";
    sections.forEach(([id, key]) => {
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = t(key);
      a.setAttribute("role", "menuitem");
      a.addEventListener("click", () => closeFlyouts());
      tocMenu.appendChild(a);
    });
  }

  function renderTopicButtons() {
    const rail = $("#topicButtons");
    rail.innerHTML = "";
    videos.forEach((video, index) => {
      const btn = document.createElement("button");
      btn.className = "topic-btn";
      btn.type = "button";
      btn.setAttribute("aria-current", index === state.index ? "true" : "false");
      btn.innerHTML = `<small>${escapeHtml(video.serial)} · ${escapeHtml(video.group)}</small><span>${escapeHtml(getVideoTitle(video))}</span>`;
      btn.addEventListener("click", () => setActive(index));
      rail.appendChild(btn);
    });
  }

  function renderTopicGrid() {
    const grid = $("#topicGrid");
    grid.innerHTML = "";
    videos.forEach((video, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "topic-card";
      card.innerHTML = `
        <div>
          <span class="serial">${escapeHtml(video.serial)}</span>
          <p class="kicker">${escapeHtml(video.batch)} · ${escapeHtml(video.group)}</p>
          <strong>${escapeHtml(getVideoTitle(video))}</strong>
          <p>${escapeHtml(video.uploadTitle)}</p>
        </div>`;
      card.addEventListener("click", () => {
        setActive(index);
        $("#showcase").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.appendChild(card);
    });
  }

  function renderCarousel() {
    const stage = $("#carouselStage");
    stage.innerHTML = "";
    videos.forEach((video, index) => {
      const offsetRaw = index - state.index;
      let offset = offsetRaw;
      if (offset > videos.length / 2) offset -= videos.length;
      if (offset < -videos.length / 2) offset += videos.length;
      if (Math.abs(offset) > 3) return;
      const distance = Math.abs(offset);
      const card = document.createElement("div");
      card.className = `reel-card ${offset === 0 ? "active" : ""}`;
      card.style.transform = `translateX(calc(-50% + ${offset * 160}px)) rotateY(${offset * -16}deg) scale(${1 - distance * 0.08})`;
      card.style.opacity = String(1 - distance * 0.16);
      card.style.zIndex = String(10 - distance);
      card.innerHTML = `
        <button type="button" aria-label="${escapeHtml(getVideoTitle(video))}">
          <small>${escapeHtml(video.serial)} · ${escapeHtml(video.group)}</small>
          <strong>${escapeHtml(getVideoTitle(video))}</strong>
          <small>${escapeHtml(video.uploadTitle)}</small>
        </button>`;
      card.querySelector("button").addEventListener("click", () => setActive(index));
      stage.appendChild(card);
    });
  }

  function renderVideoDetail() {
    const video = videos[state.index];
    $("#videoSerial").textContent = video.serial;
    $("#videoGroup").textContent = `${video.batch} · ${video.group}`;
    $("#videoTitle").textContent = getVideoTitle(video);
    $("#videoTagline").textContent = getVideoTagline(video);
    $("#videoReason").textContent = video.reasonZh;
    $("#videoUploadTitle").textContent = video.uploadTitle;
    $("#videoCaption").textContent = video.caption;
    $("#videoHashtags").textContent = video.hashtags;

    $("#playerMount").innerHTML = `<iframe id="youtubePlayer" title="${escapeHtml(video.uploadTitle)}" src="${embedUrlFor(video)}" loading="lazy" referrerpolicy="origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    const youtubePlayer = $("#youtubePlayer");
    youtubePlayer.addEventListener("load", () => {
      setTimeout(applyDefaultAudioState, 600);
      setTimeout(applyDefaultAudioState, 1600);
    });
    $("#openYoutubeLink").href = video.url;
    $("#volumeBtn").innerHTML = `<span>${state.muted ? t("muted") : t("unmuted")}</span>`;
    localStorage.setItem("shorts-index", String(state.index));
  }

  function renderGlossary() {
    const wrap = $("#glossaryButtons");
    wrap.innerHTML = "";
    glossary.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.term;
      btn.addEventListener("click", () => openGlossary(index));
      wrap.appendChild(btn);
    });
  }

  function openGlossary(index) {
    const item = glossary[index];
    const title = state.lang === "en" ? item.en : state.lang === "ja" ? item.ja : item.zh;
    const definition = state.lang === "en" ? item.definitionEn : state.lang === "ja" ? item.definitionJa : item.definitionZh;
    $("#modalTitle").textContent = title;
    $("#modalDefinition").textContent = definition;
    $("#glossaryModal").showModal();
  }

  function setActive(index) {
    state.index = (index + videos.length) % videos.length;
    renderTopicButtons();
    renderTopicGrid();
    renderCarousel();
    renderVideoDetail();
  }

  function bindEvents() {
    $("#prevBtn").addEventListener("click", () => setActive(state.index - 1));
    $("#nextBtn").addEventListener("click", () => setActive(state.index + 1));
    $("#fullscreenBtn").addEventListener("click", () => {
      const theater = $("#theater");
      if (theater.requestFullscreen) theater.requestFullscreen();
    });
    $("#restoreBtn").addEventListener("click", () => {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    });
    $("#volumeBtn").addEventListener("click", () => {
      state.muted = !state.muted;
      localStorage.setItem("shorts-muted", String(state.muted));
      renderVideoDetail();
      setTimeout(applyDefaultAudioState, 900);
    });
    $("#copyTitleBtn").addEventListener("click", () => copyText(videos[state.index].uploadTitle));
    $("#copyCaptionBtn").addEventListener("click", () => copyText(videos[state.index].caption));
    $("#copyTagsBtn").addEventListener("click", () => copyText(videos[state.index].hashtags));
    $("#motivationToggle").addEventListener("click", () => {
      state.motivationExpanded = !state.motivationExpanded;
      renderMotivation();
    });
    $("#floatLangBtn").addEventListener("click", () => toggleFlyout("langMenu"));
    $("#floatThemeBtn").addEventListener("click", () => toggleFlyout("themeMenu"));
    $("#floatTocBtn").addEventListener("click", () => toggleFlyout("tocMenu"));
    $("#modalClose").addEventListener("click", () => $("#glossaryModal").close());
    $("#heroImageOpen").addEventListener("click", () => $("#heroImageDialog").showModal());
    $("#heroImageClose").addEventListener("click", () => $("#heroImageDialog").close());
    $("#heroImageDialog").addEventListener("click", (event) => {
      if (event.target.id === "heroImageDialog") $("#heroImageDialog").close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") setActive(state.index + 1);
      if (event.key === "ArrowLeft") setActive(state.index - 1);
      if (event.key === "Escape") closeFlyouts();
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".floating-controls")) closeFlyouts();
    });
  }

  function toggleFlyout(id) {
    const menu = $("#" + id);
    const isOpen = menu.classList.contains("open");
    closeFlyouts();
    if (!isOpen) menu.classList.add("open");
  }

  function closeFlyouts() {
    $$(".flyout-menu").forEach(menu => menu.classList.remove("open"));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("copied"));
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      toast(t("copied"));
    }
  }

  let toastTimer = null;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function observeReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(el => observer.observe(el));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function renderAll() {
    localStorage.setItem("shorts-muted", String(state.muted));
    document.body.dataset.theme = state.theme;
    renderI18n();
    renderMotivation();
    renderMenus();
    renderTopicButtons();
    renderTopicGrid();
    renderCarousel();
    renderVideoDetail();
    renderGlossary();
  }

  bindEvents();
  renderAll();
  observeReveal();
})();
