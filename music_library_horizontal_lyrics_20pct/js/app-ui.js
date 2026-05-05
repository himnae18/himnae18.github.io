// js/app-ui.js - 목록 표시 + 가사/MR/악보 패널 + 드래그 정렬
(() => {
  const S = window.AppState;
  if (!S) return;

  function youtubeEmbedUrl(url) {
    const id = S.extractID(url);
    if (!id) return "";
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  }

  function showList() {
    const list = document.getElementById("list");
    if (!list) return;

    const songs = S.songs || [];
    if (songs.length === 0) {
      list.innerHTML = `<p class="empty-center">아직 추가된 노래가 없어!</p>`;
      return;
    }

    let html = `<div class="playlist">`;

    songs.forEach((s, i) => {
      const thumb = s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : "";
      const active = i === S.current ? " active" : "";

      html += `
        <div class="pl-item${active}"
          draggable="true"
          ondragstart="onDragStart(event, ${i})"
          ondragover="onDragOver(event)"
          ondrop="onDrop(event, ${i})"
          onclick="play(${i})">

          <div class="pl-left">
            <div class="pl-index">${i + 1}</div>
            <div class="pl-handle" title="드래그해서 순서 변경" onclick="event.stopPropagation();">
              <span></span><span></span>
            </div>
            <div class="pl-playing">${i === S.current ? "▶" : ""}</div>
          </div>

          <div class="pl-thumb">
            ${thumb ? `<img src="${thumb}" alt="thumb">` : ""}
          </div>

          <div class="pl-meta">
            <div class="pl-title">${S.escapeHTML(s.title || "제목 없음")}</div>
            <div class="pl-sub">${S.escapeHTML(s.author || "")}</div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    list.innerHTML = html;
  }

  let activeTab = "lyrics";

  function setTab(tab) {
    activeTab = tab;
    updateLyricsDrawer();
  }

  function updateLyricsDrawer() {
    const titleEl = document.getElementById("lyricsNowTitle");
    const textEl = document.getElementById("lyricsNowText");
    const mediaEl = document.getElementById("lyricsNowMedia");
    const tabLyrics = document.getElementById("tabLyrics");
    const tabMr = document.getElementById("tabMr");
    const tabScore = document.getElementById("tabScore");

    if (!titleEl || !textEl || !mediaEl || !tabLyrics || !tabMr || !tabScore) return;

    const songs = S.songs || [];
    const s = songs[S.current];

    tabLyrics.className = "tab-link";
    tabMr.className = "tab-link";
    tabScore.className = "tab-link";

    if (!s) {
      titleEl.textContent = "재생중인 곡이 없어";
      textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";
      textEl.style.display = "block";
      mediaEl.style.display = "none";
      mediaEl.innerHTML = "";
      tabLyrics.classList.add("tab-active");
      tabMr.classList.add("tab-disabled");
      tabScore.classList.add("tab-disabled");
      tabScore.href = "#";
      return;
    }

    const author = S.safeText(s.author);
    titleEl.textContent = author ? `${S.safeText(s.title || "제목 없음")} - ${author}` : S.safeText(s.title || "제목 없음");

    const mrUrl = S.safeLink(s.mr);
    const scoreUrl = S.safeLink(s.score);
    const hasMr = !!mrUrl;
    const hasScore = !!scoreUrl;

    if (hasScore) {
      tabScore.classList.add("tab-ready");
      tabScore.href = scoreUrl;
    } else {
      tabScore.classList.add("tab-disabled");
      tabScore.href = "#";
    }

    if (hasMr) tabMr.classList.add("tab-ready");
    else tabMr.classList.add("tab-disabled");

    if (activeTab === "mr" && hasMr) {
      tabMr.classList.add("tab-active");
      textEl.style.display = "none";
      mediaEl.style.display = "block";

      const embed = youtubeEmbedUrl(mrUrl);
      if (embed) {
        mediaEl.innerHTML = `<iframe src="${embed}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      } else {
        mediaEl.innerHTML = `<a class="media-link" href="${S.escapeHTML(mrUrl)}" target="_blank" rel="noopener">MR 링크 열기</a>`;
      }
    } else {
      activeTab = "lyrics";
      tabLyrics.classList.add("tab-active");
      textEl.textContent = S.safeText(s.lyrics) || "가사가 아직 없어.";
      textEl.style.display = "block";
      mediaEl.style.display = "none";
      mediaEl.innerHTML = "";
    }
  }

  function onDragStart(e, index) {
    S.dragIndex = index;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e, dropIndex) {
    e.preventDefault();

    const dragIndex = S.dragIndex;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const songs = S.songs;
    const moved = songs.splice(dragIndex, 1)[0];
    songs.splice(dropIndex, 0, moved);

    if (S.current === dragIndex) S.current = dropIndex;
    else if (dragIndex < S.current && dropIndex >= S.current) S.current--;
    else if (dragIndex > S.current && dropIndex <= S.current) S.current++;

    S.dragIndex = null;
    S.save();
    showList();
    updateLyricsDrawer();
  }

  function openLyricsDrawer() {
    document.body.classList.add("lyrics-open");
    activeTab = "lyrics";
    updateLyricsDrawer();
  }

  function closeLyricsDrawer() {
    document.body.classList.remove("lyrics-open");
  }

  function toggleLyricsDrawer() {
    const willOpen = !document.body.classList.contains("lyrics-open");
    document.body.classList.toggle("lyrics-open");
    if (willOpen) {
      activeTab = "lyrics";
      updateLyricsDrawer();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("tabLyrics")?.addEventListener("click", () => setTab("lyrics"));
    document.getElementById("tabMr")?.addEventListener("click", () => setTab("mr"));
    updateLyricsDrawer();
  });

  window.showList = showList;
  window.updateLyricsDrawer = updateLyricsDrawer;
  window.onDragStart = onDragStart;
  window.onDragOver = onDragOver;
  window.onDrop = onDrop;
  window.openLyricsDrawer = openLyricsDrawer;
  window.closeLyricsDrawer = closeLyricsDrawer;
  window.toggleLyricsDrawer = toggleLyricsDrawer;
})();
