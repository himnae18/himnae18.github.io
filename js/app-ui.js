// js/app-ui.js
(() => {
  const S = window.AppState;

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

  function updateLyricsDrawer() {
    const titleEl = document.getElementById("lyricsNowTitle");
    const textEl  = document.getElementById("lyricsNowText");
    if (!titleEl || !textEl) return;

    const songs = S.songs;
    const cur = S.current;

    if (!songs.length || !songs[cur]) {
      titleEl.textContent = "재생중인 곡이 없어";
      textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";
      return;
    }

    const s = songs[cur];
    titleEl.textContent = s.title || "제목 없음";
    textEl.textContent = (s.lyrics && s.lyrics.trim()) ? s.lyrics : "가사가 아직 없어.";
  }

  // 드래그
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

  // 전역 함수로 연결 (HTML 인라인 이벤트가 호출함)
  window.showList = showList;
  window.updateLyricsDrawer = updateLyricsDrawer;
  window.onDragStart = onDragStart;
  window.onDragOver = onDragOver;
  window.onDrop = onDrop;
})();
