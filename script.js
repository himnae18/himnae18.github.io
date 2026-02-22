/* =========================
   저장/상태
========================= */
let songs = JSON.parse(localStorage.getItem("jpBright")) || [];
let current = 0;
let dragIndex = null;

function save() {
  localStorage.setItem("jpBright", JSON.stringify(songs));
}

/* =========================
   유틸
========================= */
function safeText(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}
function safeLink(url) {
  if (!url) return "";
  return String(url).trim();
}
function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* ✅ 유튜브 링크에서 영상 ID 뽑기 */
function extractID(url) {
  if (!url) return "";
  try {
    const u = new URL(url);

    const v = u.searchParams.get("v");
    if (v) return v;

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }

    const parts = u.pathname.split("/").filter(Boolean);
    const shortsIndex = parts.indexOf("shorts");
    const embedIndex = parts.indexOf("embed");
    if (shortsIndex !== -1 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1];
  } catch (e) {
    if (String(url).includes("v=")) return String(url).split("v=")[1]?.split("&")[0] || "";
  }
  return "";
}

/* ✅ oEmbed로 제목/채널 가져오기 (API키 필요 없음) */
async function fetchYouTubeMeta(ytUrl) {
  try {
    const api = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(ytUrl);
    const res = await fetch(api);
    if (!res.ok) throw new Error("oEmbed 실패");
    const data = await res.json();
    return {
      title: data.title || "제목 없음",
      author: data.author_name || ""
    };
  } catch {
    return { title: "제목 없음", author: "" };
  }
}

/* =========================
   목록 UI (✅ 오른쪽 버튼들 제거한 버전)
========================= */
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

/* =========================
   노래 추가 (제목칸 없이 링크로 자동 저장)
========================= */
async function addSong() {
  const ytUrl = safeLink(document.getElementById("yt")?.value);
  const lyrics = safeText(document.getElementById("lyrics")?.value);
  const mr = safeLink(document.getElementById("mr")?.value);
  const score = safeLink(document.getElementById("score")?.value);

  const id = extractID(ytUrl);
  if (!ytUrl || !id) {
    alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
    return;
  }

  const meta = await fetchYouTubeMeta(ytUrl);

  songs.push({
    title: meta.title,
    author: meta.author,
    ytUrl,
    id,
    lyrics,
    mr,
    score
  });

  save();
  showList();

  // 입력칸 비우기
  const ytEl = document.getElementById("yt");
  const lyEl = document.getElementById("lyrics");
  const mrEl = document.getElementById("mr");
  const scEl = document.getElementById("score");
  if (ytEl) ytEl.value = "";
  if (lyEl) lyEl.value = "";
  if (mrEl) mrEl.value = "";
  if (scEl) scEl.value = "";

  play(songs.length - 1);
}

/* =========================
   삭제
========================= */
function deleteSong(index) {
  if (!confirm("이 노래를 삭제할까?")) return;

  const wasCurrent = (index === current);
  songs.splice(index, 1);
  save();
  showList();

  if (songs.length === 0) {
    if (ytPlayer) ytPlayer.stopVideo();
    current = 0;
    updateLyricsDrawer();
    updateControlLabels();
    return;
  }

  if (wasCurrent) {
    if (current >= songs.length) current = songs.length - 1;
    play(current);
  } else {
    if (index < current) current--;
    showList();
    updateLyricsDrawer();
  }
}

/* =========================
   드래그 정렬
========================= */
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

/* =========================
   오른쪽 가사 드로어(밀어내는 방식은 CSS가 처리)
========================= */
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
  const textEl  = document.getElementById("lyricsNowText");
  if (!titleEl || !textEl) return;

  if (!songs || songs.length === 0 || !songs[current]) {
    titleEl.textContent = "재생중인 곡이 없어";
    textEl.textContent = "노래를 재생하면 여기서 가사를 볼 수 있어.";
    return;
  }

  const s = songs[current];
  titleEl.textContent = s.title || "제목 없음";
  textEl.textContent = (s.lyrics && s.lyrics.trim()) ? s.lyrics : "가사가 아직 없어.";
}

/* =========================
   ✅ YouTube IFrame Player API
========================= */
let ytPlayer = null;
let apiLoading = false;
let apiReady = false;
let apiReadyQueue = [];

// 모드: "seq" | "rand_once" | "rand_n" | "rand_auto" | "loop_n" | "loop_inf"
let playMode = "seq";
let remainingRandom = 0;
let remainingLoops  = 0;
let totalRandom = 0;
let totalLoops  = 0;
let loopInfinite = false;

// ✅ 랜덤 연속 방지
let lastRandomIndex = -1;

function ensurePlayerReady(cb) {
  if (ytPlayer && apiReady) { cb(); return; }

  apiReadyQueue.push(cb);

  if (apiLoading) return;
  apiLoading = true;

  if (!document.getElementById("yt-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    try { if (typeof prev === "function") prev(); } catch {}

    ytPlayer = new YT.Player("player", {
      events: { onStateChange: onPlayerStateChange }
    });

    apiReady = true;
    apiLoading = false;

    const q = [...apiReadyQueue];
    apiReadyQueue = [];
    q.forEach(fn => { try { fn(); } catch {} });
  };
}

/* ✅ 재생 */
function play(i) {
  current = i;
  if (!songs[i] || !songs[i].id) return;

  const id = songs[i].id;

  ensurePlayerReady(() => {
    ytPlayer.loadVideoById(id);
  });

  showList();
  updateLyricsDrawer();
  updateControlLabels();
}

/* 끝났을 때 자동재생 로직 */
function onPlayerStateChange(e) {
  if (e.data !== 0) return; // 0 = ended

  // 무한반복
  if (loopInfinite) {
    ytPlayer.playVideo();
    return;
  }

  // 반복 N
  if (playMode === "loop_n") {
    if (remainingLoops > 1) {
      remainingLoops--;
      updateControlLabels();
      ytPlayer.playVideo();
      return;
    }
    playMode = "seq";
    remainingLoops = 0;
    totalLoops = 0;
    updateControlLabels();
  }

  // 랜덤 N회
  if (playMode === "rand_n") {
    if (remainingRandom > 1) {
      remainingRandom--;
      updateControlLabels();
      playRandomPickAndPlay(true);
      return;
    }
    playMode = "seq";
    remainingRandom = 0;
    totalRandom = 0;
    updateControlLabels();
    return;
  }

  // 랜덤자동재생(무한)
  if (playMode === "rand_auto") {
    playRandomPickAndPlay(true);
    return;
  }

  // 랜덤곡(1곡만) 끝나면 멈춤
  if (playMode === "rand_once") {
    playMode = "seq";
    updateControlLabels();
    return;
  }

  // 기본: 순서대로 다음
  playNextSequential();
}

function playNextSequential() {
  if (songs.length === 0) return;
  const next = (current + 1) % songs.length;
  play(next);
}

/* ✅ 랜덤 픽 (연속 방지 옵션) */
function pickRandomIndex(excludeConsecutive = true) {
  const n = songs.length;
  if (n === 0) return -1;
  if (n === 1) return 0;

  let tries = 0;
  let idx = Math.floor(Math.random() * n);

  if (!excludeConsecutive) return idx;

  while (tries < 30 && (idx === current || idx === lastRandomIndex)) {
    idx = Math.floor(Math.random() * n);
    tries++;
  }
  return idx;
}

function playRandomPickAndPlay(excludeConsecutive = true) {
  const idx = pickRandomIndex(excludeConsecutive);
  if (idx === -1) return;
  lastRandomIndex = idx;
  play(idx);
}

/* =========================
   컨트롤 버튼(상단) 동작
========================= */
function setActiveControl(activeId) {
  const ids = ["btnSeq","btnRandOne","btnRand10","btnRandAuto","btnLoop5","btnLoop10","btnLoopInf"];
  ids.forEach(id => document.getElementById(id)?.classList.remove("active-control"));
  document.getElementById(activeId)?.classList.add("active-control");
  updateControlLabels();
}

function updateControlLabels() {
  const $ = (id) => document.getElementById(id);

  const base = {
    btnSeq: "순서대로",
    btnRandOne: "랜덤곡",
    btnRand10: "랜덤곡 10회",
    btnRandAuto: "랜덤자동재생",
    btnLoop5: "5회반복",
    btnLoop10: "10회반복",
    btnLoopInf: "무한반복"
  };

  Object.keys(base).forEach(id => {
    const el = $(id);
    if (el) el.textContent = base[id];
  });

  // 랜덤 10회 남은횟수 표시
  if (playMode === "rand_n" && totalRandom > 0) {
    const el = $("btnRand10");
    if (el) el.textContent = `랜덤곡 10회 (${remainingRandom}/${totalRandom})`;
  }

  // 반복 남은횟수 표시
  if (playMode === "loop_n" && totalLoops > 0) {
    if (totalLoops === 5) {
      const el = $("btnLoop5");
      if (el) el.textContent = `5회반복 (${remainingLoops}/${totalLoops})`;
    }
    if (totalLoops === 10) {
      const el = $("btnLoop10");
      if (el) el.textContent = `10회반복 (${remainingLoops}/${totalLoops})`;
    }
  }

  // ON 표시
  if (playMode === "rand_auto") {
    const el = $("btnRandAuto");
    if (el) el.textContent = `랜덤자동재생 (ON)`;
  }
  if (playMode === "loop_inf") {
    const el = $("btnLoopInf");
    if (el) el.textContent = `무한반복 (ON)`;
  }
}

/* =========================
   ✅ 수정 모달(prompt 대신)
========================= */
function closeEditModal() {
  document.getElementById("editModalOverlay")?.remove();
  document.getElementById("editModal")?.remove();
}

function openEditModal(index) {
  const s = songs[index];
  if (!s) return;

  closeEditModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "editModalOverlay";
  overlay.addEventListener("click", closeEditModal);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "editModal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const ytVal = s.ytUrl || (s.id ? `https://www.youtube.com/watch?v=${s.id}` : "");
  const lyricsVal = s.lyrics || "";
  const mrVal = s.mr || "";
  const scoreVal = s.score || "";

  modal.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">노래 수정</div>
      <button class="modal-close" id="editCloseBtn">닫기</button>
    </div>

    <div class="modal-body">
      <div class="modal-label">유튜브 링크</div>
      <input id="editYt" value="${escapeHTML(ytVal)}" placeholder="유튜브 링크">

      <div class="modal-label">가사</div>
      <textarea id="editLyrics" rows="10" placeholder="가사">${escapeHTML(lyricsVal)}</textarea>

      <div class="modal-label">MR 링크</div>
      <input id="editMr" value="${escapeHTML(mrVal)}" placeholder="MR 링크">

      <div class="modal-label">악보 링크</div>
      <input id="editScore" value="${escapeHTML(scoreVal)}" placeholder="악보 링크">
    </div>

    <div class="modal-actions">
      <button class="btn-ghost" id="editCancelBtn">취소</button>
      <button id="editSaveBtn">저장</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById("editCloseBtn")?.addEventListener("click", closeEditModal);
  document.getElementById("editCancelBtn")?.addEventListener("click", closeEditModal);

  document.getElementById("editSaveBtn")?.addEventListener("click", async () => {
    const newYtUrl = safeLink(document.getElementById("editYt")?.value);
    const newLyrics = safeText(document.getElementById("editLyrics")?.value);
    const newMr = safeLink(document.getElementById("editMr")?.value);
    const newScore = safeLink(document.getElementById("editScore")?.value);

    if (newYtUrl) {
      const id = extractID(newYtUrl);
      if (!id) {
        alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
        return;
      }
      s.ytUrl = newYtUrl;
      s.id = id;

      const meta = await fetchYouTubeMeta(newYtUrl);
      s.title = meta.title;
      s.author = meta.author;
    }

    s.lyrics = newLyrics;
    s.mr = newMr;
    s.score = newScore;

    save();
    closeEditModal();
    showList();

    if (index === current) {
      updateLyricsDrawer();
      updateControlLabels();
    }
  });
}

/* =========================
   DOMContentLoaded: 이벤트 연결
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // 가사 드로어
  document.getElementById("lyricsBtn")?.addEventListener("click", toggleLyricsDrawer);
  document.getElementById("lyricsCloseBtn")?.addEventListener("click", closeLyricsDrawer);
  document.getElementById("lyricsOverlay")?.addEventListener("click", closeLyricsDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLyricsDrawer();
      closeEditModal();
    }
  });

  const qs = (id) => document.getElementById(id);

  // 순서대로
  qs("btnSeq")?.addEventListener("click", () => {
    playMode = "seq";
    loopInfinite = false;
    remainingLoops = 0; totalLoops = 0;
    remainingRandom = 0; totalRandom = 0;
    setActiveControl("btnSeq");
  });

  // 랜덤곡(1곡)
  qs("btnRandOne")?.addEventListener("click", () => {
    playMode = "rand_once";
    loopInfinite = false;
    remainingLoops = 0; totalLoops = 0;
    remainingRandom = 0; totalRandom = 0;
    setActiveControl("btnRandOne");
    playRandomPickAndPlay(true);
  });

  // 랜덤 10회
  qs("btnRand10")?.addEventListener("click", () => {
    playMode = "rand_n";
    totalRandom = 10;
    remainingRandom = 10;
    loopInfinite = false;
    remainingLoops = 0; totalLoops = 0;
    setActiveControl("btnRand10");
    playRandomPickAndPlay(true);
  });

  // 랜덤자동재생(무한)
  qs("btnRandAuto")?.addEventListener("click", () => {
    playMode = "rand_auto";
    totalRandom = 0;
    remainingRandom = 0;
    loopInfinite = false;
    remainingLoops = 0; totalLoops = 0;
    setActiveControl("btnRandAuto");
    if (!songs[current]) playRandomPickAndPlay(true);
  });

  // 5회 반복
  qs("btnLoop5")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    totalLoops = 5;
    remainingLoops = 5;
    loopInfinite = false;
    remainingRandom = 0; totalRandom = 0;
    setActiveControl("btnLoop5");
  });

  // 10회 반복
  qs("btnLoop10")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    totalLoops = 10;
    remainingLoops = 10;
    loopInfinite = false;
    remainingRandom = 0; totalRandom = 0;
    setActiveControl("btnLoop10");
  });

  // 무한 반복
  qs("btnLoopInf")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_inf";
    loopInfinite = true;
    remainingLoops = 0; totalLoops = 0;
    remainingRandom = 0; totalRandom = 0;
    setActiveControl("btnLoopInf");
  });

  // 수정/삭제(현재 재생중 곡)
  qs("btnEdit")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    openEditModal(current);
  });

  qs("btnDelete")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    deleteSong(current);
  });

  // 첫 렌더
  showList();
  updateLyricsDrawer();
  updateControlLabels();
});

/* =========================
   (선택) 예전 버튼 호환
========================= */
function nextSong() {
  if (songs.length === 0) return;
  playNextSequential();
}
function randomSong() {
  if (songs.length === 0) return;
  playRandomPickAndPlay(true);
}
