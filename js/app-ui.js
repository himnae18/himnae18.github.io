// js/app-ui.js
(() => {
  const S = window.AppState;

  /* =========================
     1) 플레이리스트 렌더링
  ========================= */
  function showList() {
    const list = document.getElementById("list");
    if (!list) return;

    const songs = S.songs;

    if (songs.length === 0) {
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
     2) 가사 드로어 업데이트
     - 가사 없으면 "없다"
     - MR/악보 링크 있으면 빨강(tab-on)
     - 없으면 회색(tab-disabled) + 클릭불가
  ========================= */
  function updateLyricsDrawer() {
    const titleEl = document.getElementById("lyricsNowTitle");
    const textEl  = document.getElementById("lyricsNowText");
    const mrBtn   = document.getElementById("mrBtn");
    const scBtn   = document.getElementById("scoreBtn");
    if (!titleEl || !textEl) return;

    const songs = S.songs;
    const cur = S.current;

    // 버튼 상태 helper
    const setLinkBtn = (el, url) => {
      if (!el) return;
      const has = !!(url && String(url).trim());

      if (has) {
        el.href = String(url).trim();
        el.classList.remove("tab-disabled");
        el.classList.add("tab-on");
        el.setAttribute("aria-disabled", "false");
      } else {
        el.href = "#";
        el.classList.remove("tab-on");
        el.classList.add("tab-disabled");
        el.setAttribute("aria-disabled", "true");
      }
    };

    // 곡이 없을 때
    if (!songs.length || !songs[cur]) {
      titleEl.textContent = "재생중인 곡이 없어";
      textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";
      setLinkBtn(mrBtn, "");
      setLinkBtn(scBtn, "");
      return;
    }

    // 곡이 있을 때
    const s = songs[cur];
    titleEl.textContent = s.title || "제목 없음";
    textEl.textContent = (s.lyrics && s.lyrics.trim()) ? s.lyrics : "가사가 아직 없어.";

    // ✅ MR/악보 버튼 상태 업데이트
    setLinkBtn(mrBtn, s.mr);
    setLinkBtn(scBtn, s.score);
  }

  /* =========================
     3) 드래그 정렬
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
     4) 가사 드로어 열기/닫기/토글
     - app-player.js에서 호출
  ========================= */
  function openLyricsDrawer() {
    document.body.classList.add("lyrics-open");
    updateLyricsDrawer();
  }
  function closeLyricsDrawer() {
    document.body.classList.remove("lyrics-open");
  }
  function toggleLyricsDrawer() {
    const willOpen = !document.body.classList.contains("lyrics-open");
    document.body.classList.toggle("lyrics-open");
    if (willOpen) updateLyricsDrawer();
  }

  /* =========================
     5) 전역 노출(HTML 인라인 / 다른 js에서 호출)
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
