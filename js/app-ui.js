/* =========================
   app-ui.js
   - showList + 드래그 + 가사 드로어 업데이트
========================= */

/* 목록 UI (오른쪽 버튼 영역 제거 버전) */
function showList() {
  const list = document.getElementById("list");
  if (!list) return;

  if (songs.length === 0) {
    list.innerHTML = `<p class="empty-center">아직 추가된 노래가 없어!</p>`;
    return;
  }

  let html = `<div class="playlist">`;

  songs.forEach((s, i) => {
    const thumb = s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : "";
    const active = (i === current) ? " active" : "";

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

          <div class="pl-playing">${i === current ? "▶" : ""}</div>
        </div>

        <div class="pl-thumb">
          ${thumb ? `<img src="${thumb}" alt="thumb">` : ""}
        </div>

        <div class="pl-meta">
          <div class="pl-title">${escapeHTML(s.title || "제목 없음")}</div>
          <div class="pl-sub">${escapeHTML(s.author || "")}</div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  list.innerHTML = html;
}

/* 드래그 정렬 */
function onDragStart(e, index) {
  dragIndex = index;
  e.dataTransfer.effectAllowed = "move";
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}
function onDrop(e, dropIndex) {
  e.preventDefault();
  if (dragIndex === null || dragIndex === dropIndex) return;

  const moved = songs.splice(dragIndex, 1)[0];
  songs.splice(dropIndex, 0, moved);

  // current 인덱스 보정
  if (current === dragIndex) current = dropIndex;
  else if (dragIndex < current && dropIndex >= current) current--;
  else if (dragIndex > current && dropIndex <= current) current++;

  dragIndex = null;

  save();
  showList();
  updateLyricsDrawer();
}

/* 오른쪽 가사 드로어 */
function openLyricsDrawer() {
  document.body.classList.add("lyrics-open");
  updateLyricsDrawer();
}
function closeLyricsDrawer() {
  document.body.classList.remove("lyrics-open");
}
function toggleLyricsDrawer() {
  document.body.classList.toggle("lyrics-open");
  if (document.body.classList.contains("lyrics-open")) updateLyricsDrawer();
}

function updateLyricsDrawer() {
  const titleEl = document.getElementById("lyricsNowTitle");
  const textEl = document.getElementById("lyricsNowText");
  if (!titleEl || !textEl) return;

  if (!songs.length || !songs[current]) {
    titleEl.textContent = "재생중인 곡이 없어";
    textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";
    return;
  }

  const s = songs[current];
  titleEl.textContent = s.title || "제목 없음";
  textEl.textContent = (s.lyrics && s.lyrics.trim()) ? s.lyrics : "가사가 아직 없어.";
}
