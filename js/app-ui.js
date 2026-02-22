// js/app-ui.js
(() => {
  const S = window.AppState;

  /* =========================
     0) 유틸 (안전한 텍스트/링크)
  ========================= */
  function safeText(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim();
  }
  function safeLink(url) {
    if (!url) return "";
    return String(url).trim();
  }

  // extractID가 AppState나 전역에 있으면 그대로 사용, 없으면 최소 fallback
  function extractYouTubeId(url) {
    const u = safeLink(url);
    if (!u) return "";

    // 1) AppState.extractID가 있으면 그걸 사용
    if (S && typeof S.extractID === "function") return safeText(S.extractID(u));
    // 2) 전역 extractID가 있으면 사용
    if (typeof window.extractID === "function") return safeText(window.extractID(u));

    // 3) fallback (최소)
    const m =
      u.match(/[?&]v=([^&]+)/) ||
      u.match(/youtu\.be\/([^?&]+)/) ||
      u.match(/youtube\.com\/shorts\/([^?&]+)/) ||
      u.match(/youtube\.com\/embed\/([^?&]+)/);
    return m ? safeText(m[1]) : "";
  }

  function youtubeEmbedUrl(url) {
    const id = extractYouTubeId(url);
    if (!id) return "";
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  }

  /* =========================
     1) 플레이리스트 렌더링
  ========================= */
  function showList() {
    const list = document.getElementById("list");
    if (!list) return;

    const songs = S.songs;

    if (!songs || songs.length === 0) {
      list.innerHTML = `<p class="empty-center">아직 추가된 노래가 없어!</p>`;
      return;
    }

    let html = `<div class="playlist">`;

    songs.forEach((s, i) => {
      const thumb = s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : "";
      const active = (i === S.current) ? " active" : "";

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

  /* =========================
     2) 가사 드로어: 탭 상태
     - "lyrics" | "mr"
  ========================= */
  let activeTab = "lyrics";

  function setTab(tab) {
    activeTab = tab;
    updateLyricsDrawer();
  }

  /* =========================
     3) 가사 드로어 업데이트 (가사/MR/악보)
     - HTML id:
       tabLyrics, tabMr, tabScore,
       lyricsNowTitle, lyricsNowText, lyricsNowMedia
  ========================= */
  function updateLyricsDrawer() {
    const titleEl = document.getElementById("lyricsNowTitle");
    const textEl = document.getElementById("lyricsNowText");
    const mediaEl = document.getElementById("lyricsNowMedia");

    const tabLyrics = document.getElementById("tabLyrics");
    const tabMr = document.getElementById("tabMr");
    const tabScore = document.getElementById("tabScore");

    if (!titleEl || !textEl || !tabLyrics || !tabMr || !tabScore) return;

    // mediaEl은 예전 HTML이면 없을 수 있으니 방어
    const hasMediaBox = !!mediaEl;

    const songs = S.songs || [];
    const cur = S.current ?? 0;
    const s = songs[cur];

    // 탭 클래스 초기화
    tabLyrics.className = "tab-link";
    tabMr.className = "tab-link";
    tabScore.className = "tab-link";

    // 곡 없을 때
    if (!s) {
      titleEl.textContent = "재생중인 곡이 없어";
      textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";

      tabLyrics.classList.add("tab-active");
      tabMr.classList.add("tab-disabled");
      tabScore.classList.add("tab-disabled");
      tabScore.href = "#";

      // MR 영역 숨김
      if (hasMediaBox) {
        mediaEl.style.display = "none";
        mediaEl.innerHTML = "";
      }
      textEl.style.display = "block";
      return;
    }

    // 제목
    const author = safeText(s.author);
    titleEl.textContent = author ? `${safeText(s.title || "제목 없음")} - ${author}` : `${safeText(s.title || "제목 없음")}`;

    // 링크 유무
    const mrUrl = safeLink(s.mr);
    const scoreUrl = safeLink(s.score);
    const hasMr = !!mrUrl;
    const hasScore = !!scoreUrl;

    // 악보 링크 세팅 (있으면 빨강, 없으면 회색)
    if (hasScore) {
      tabScore.classList.add("tab-ready");
      tabScore.href = scoreUrl;
    } else {
      tabScore.classList.add("tab-disabled");
      tabScore.href = "#";
    }

    // MR 탭 가능/불가
    if (hasMr) tabMr.classList.add("tab-ready");
    else tabMr.classList.add("tab-disabled");

    // 활성 탭 처리
    if (activeTab === "mr" && hasMr) {
      tabMr.classList.add("tab-active");

      // 가사 숨기고 MR 표시
      textEl.style.display = "none";

      if (hasMediaBox) {
        mediaEl.style.display = "block";

        const embed = youtubeEmbedUrl(mrUrl);
        if (embed) {
          mediaEl.innerHTML = `<iframe src="${embed}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
          // 유튜브가 아닌 링크면 새탭 링크로
          mediaEl.innerHTML = `<a class="media-link" href="${mrUrl}" target="_blank" rel="noopener">MR 링크 열기</a>`;
        }
      }
    } else {
      // 기본은 가사 탭
      activeTab = "lyrics";
      tabLyrics.classList.add("tab-active");

      // 가사 표시
      const ly = safeText(s.lyrics);
      textEl.textContent = ly ? ly : "가사가 아직 없어.";
      textEl.style.display = "block";

      // MR 영역 숨김
      if (hasMediaBox) {
        mediaEl.style.display = "none";
        mediaEl.innerHTML = "";
      }
    }
  }

  /* =========================
     4) 드래그 정렬
  ========================= */
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

    // current 보정
    if (S.current === dragIndex) S.current = dropIndex;
    else if (dragIndex < S.current && dropIndex >= S.current) S.current--;
    else if (dragIndex > S.current && dropIndex <= S.current) S.current++;

    S.dragIndex = null;
    S.save();
    showList();
    updateLyricsDrawer();
  }

  /* =========================
     5) 가사 드로어 열기/닫기/토글
     - app-player.js에서 호출
  ========================= */
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

  /* =========================
     6) 탭 클릭 이벤트 연결
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("tabLyrics")?.addEventListener("click", () => setTab("lyrics"));
    document.getElementById("tabMr")?.addEventListener("click", () => setTab("mr"));
    // tabScore는 <a>라 클릭하면 새탭 이동 (링크 없으면 tab-disabled로 막힘)

    // 첫 렌더
    updateLyricsDrawer();
  });

  /* =========================
     7) 전역 노출(HTML 인라인 / 다른 js에서 호출)
  ========================= */
  window.showList = showList;
  window.updateLyricsDrawer = updateLyricsDrawer;

  window.onDragStart = onDragStart;
  window.onDragOver = onDragOver;
  window.onDrop = onDrop;

  window.openLyricsDrawer = openLyricsDrawer;
  window.closeLyricsDrawer = closeLyricsDrawer;
  window.toggleLyricsDrawer = toggleLyricsDrawer;
})();
