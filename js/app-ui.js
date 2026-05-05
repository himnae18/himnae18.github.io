// js/app-ui.js - 목록 표시 + 가사/MR/악보 패널 + 드래그 정렬 + MR/다운로드 패널
(() => {
  const S = window.AppState;
  if (!S) return;

  function youtubeEmbedUrl(url) {
    const id = S.extractID(url);
    if (!id) return "";
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  }

  function getCurrentSong() {
    const songs = S.songs || [];
    return songs[S.current] || null;
  }

  function getPrimaryVideoUrl(song) {
    if (!song) return "";
    return S.safeLink(song.mr) || S.safeLink(song.ytUrl);
  }

  async function copyText(text, successMessage = "복사했어!") {
    if (!text) {
      alert("복사할 링크가 없어.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert(successMessage);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
      alert(successMessage);
    }
  }

  function openCurrentVideoUrl(useMr = false) {
    const s = getCurrentSong();
    const url = useMr ? S.safeLink(s?.mr) : getPrimaryVideoUrl(s);
    if (!url) {
      alert(useMr ? "MR 링크가 없어." : "열 수 있는 링크가 없어.");
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function requestYouTubeDownload(format) {
    const s = getCurrentSong();
    const url = getPrimaryVideoUrl(s);

    if (!s || !url) {
      alert("먼저 노래를 하나 선택해줘.");
      return;
    }

    // 순수 HTML/JS만으로는 유튜브 영상을 1080p/4K/WAV/MP3로 변환 저장할 수 없어.
    // 나중에 합법적으로 사용할 서버/API가 생기면 아래 ENDPOINT만 연결하면 버튼이 실제 다운로드 요청으로 바뀜.
    const ENDPOINT = window.YOUTUBE_DOWNLOAD_ENDPOINT || "";

    if (!ENDPOINT) {
      alert(
        "이 버튼 자리는 만들어뒀어.\n\n" +
        "다만 지금 파일만으로는 유튜브 영상을 1080p/4K/WAV/MP3로 직접 변환 다운로드할 수 없어.\n" +
        "실제 다운로드를 하려면 별도 서버/API 연결이 필요해.\n\n" +
        `선택한 형식: ${format}`
      );
      return;
    }

    const downloadUrl = `${ENDPOINT}?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`;
    window.open(downloadUrl, "_blank", "noopener");
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
      const hasMr = !!S.safeLink(s.mr);
      const isCurrent = i === S.current;
      const statusClass = isCurrent
        ? (hasMr ? "status-current-has-mr" : "status-current-no-mr")
        : (hasMr ? "status-has-mr" : "status-no-mr");
      const statusLabel = hasMr ? "MR" : "없음";

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

          <button class="pl-mr-status ${statusClass}" type="button"
            title="${hasMr ? "MR 링크 있음" : "MR 링크 없음"}"
            onclick="event.stopPropagation(); play(${i}); openLyricsDrawer('mr');">
            ${statusLabel}
          </button>
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

  function downloadPanelHTML(song) {
    const hasUrl = !!getPrimaryVideoUrl(song);
    const disabledAttr = hasUrl ? "" : "disabled";

    return `
      <section class="download-panel" aria-label="다운로드 버튼">
        <h3>다운로드</h3>
        <p class="download-help">
          버튼 모양은 넣어뒀어. 실제 변환 다운로드는 별도 서버/API가 연결되어야 작동해.
        </p>

        <div class="download-group-title">영상</div>
        <div class="download-grid">
          <button class="download-btn download-disabled" type="button" disabled title="2K/4K 여부는 브라우저만으로 확인할 수 없어">최고화질<br><span>2K/4K</span></button>
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('video-1080p')">1080p</button>
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('video-720p')">720p</button>
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('video-360p')">360p</button>
        </div>

        <div class="download-group-title">오디오</div>
        <div class="download-grid">
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('audio-wav')">WAV</button>
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('audio-m4a')">M4P</button>
          <button class="download-btn" type="button" ${disabledAttr} onclick="requestYouTubeDownload('audio-mp3')">MP3</button>
        </div>

        <div class="download-link-row">
          <button class="download-link-btn" type="button" ${disabledAttr} onclick="openCurrentVideoUrl(false)">유튜브 열기</button>
          <button class="download-link-btn" type="button" ${disabledAttr} onclick="copyCurrentVideoUrl()">링크 복사</button>
        </div>
      </section>
    `;
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
    else tabMr.classList.add("tab-disabled-soft");

    if (activeTab === "mr") {
      tabMr.classList.add("tab-active");
      textEl.style.display = "none";
      mediaEl.style.display = "block";

      const embed = youtubeEmbedUrl(mrUrl);
      let mrContent = "";
      if (hasMr && embed) {
        mrContent = `<iframe src="${embed}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      } else if (hasMr) {
        mrContent = `<a class="media-link" href="${S.escapeHTML(mrUrl)}" target="_blank" rel="noopener">MR 링크 열기</a>`;
      } else {
        mrContent = `<div class="mr-empty">이 곡은 MR 링크가 없어. 그래도 원본 유튜브 링크 기준 다운로드 버튼 자리는 표시돼.</div>`;
      }

      mediaEl.innerHTML = `${mrContent}${downloadPanelHTML(s)}`;
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

  function openLyricsDrawer(tab = "lyrics") {
    document.body.classList.add("lyrics-open");
    activeTab = tab;
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

  function copyCurrentVideoUrl() {
    const s = getCurrentSong();
    copyText(getPrimaryVideoUrl(s), "현재 곡 링크를 복사했어!");
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
  window.openCurrentVideoUrl = openCurrentVideoUrl;
  window.copyCurrentVideoUrl = copyCurrentVideoUrl;
  window.requestYouTubeDownload = requestYouTubeDownload;
})();
