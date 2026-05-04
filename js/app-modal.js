/* =========================
   app-player.js
   - 유튜브 플레이어 + 랜덤/반복 로직 + 버튼 이벤트 + add/delete/edit
========================= */

/* 노래 추가 */
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

/* 삭제 */
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
   수정 모달 기능
========================= */

function editEscapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function openEditModal() {
  if (!songs[current]) {
    alert("먼저 수정할 노래를 하나 선택해줘!");
    return;
  }

  const modal = document.getElementById("editModal");
  const content = document.getElementById("editModalContent");

  if (!modal || !content) {
    alert("수정 모달 HTML을 찾을 수 없어!");
    return;
  }

  const s = songs[current];

  content.innerHTML = `
    <h2>노래 수정</h2>

    <input id="editTitle" placeholder="제목" value="${editEscapeHTML(s.title)}" />
    <input id="editAuthor" placeholder="채널/가수" value="${editEscapeHTML(s.author)}" />

    <input id="editYt" placeholder="유튜브 링크" value="${editEscapeHTML(s.ytUrl)}" />
    <textarea id="editLyrics" placeholder="가사" rows="8">${editEscapeHTML(s.lyrics)}</textarea>

    <input id="editMr" placeholder="MR 링크" value="${editEscapeHTML(s.mr)}" />
    <input id="editScore" placeholder="악보 링크" value="${editEscapeHTML(s.score)}" />

    <div style="margin-top:12px;">
      <button id="saveEditBtn" type="button">저장</button>
      <button id="cancelEditBtn" type="button">취소</button>
    </div>
  `;

  modal.classList.add("open");

  document.getElementById("saveEditBtn")?.addEventListener("click", saveEditModal);
  document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);
}

function closeEditModal() {
  document.getElementById("editModal")?.classList.remove("open");
}

function saveEditModal() {
  if (!songs[current]) return;

  const ytUrl = safeLink(document.getElementById("editYt")?.value);
  const id = extractID(ytUrl);

  if (!ytUrl || !id) {
    alert("유튜브 링크가 올바르지 않아!");
    return;
  }

  songs[current] = {
    ...songs[current],
    title: safeText(document.getElementById("editTitle")?.value) || "제목 없음",
    author: safeText(document.getElementById("editAuthor")?.value),
    ytUrl,
    id,
    lyrics: safeText(document.getElementById("editLyrics")?.value),
    mr: safeLink(document.getElementById("editMr")?.value),
    score: safeLink(document.getElementById("editScore")?.value)
  };

  save();
  showList();
  updateLyricsDrawer();

  closeEditModal();
}

/* ✅ YouTube IFrame Player API */
let ytPlayer = null;
let apiLoading = false;
let apiReady = false;
let apiReadyQueue = [];

// 모드: "seq" | "rand_once" | "rand_n" | "rand_auto" | "loop_n" | "loop_inf"
let playMode = "seq";
let remainingRandom = 0;
let remainingLoops = 0;
let totalRandom = 0;
let totalLoops = 0;
let loopInfinite = false;

// ✅ 랜덤 연속 방지
let lastRandomIndex = -1;

function ensurePlayerReady(cb) {
  if (ytPlayer && apiReady) {
    cb();
    return;
  }

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
    try {
      if (typeof prev === "function") prev();
    } catch {}

    ytPlayer = new YT.Player("player", {
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        rel: 0,
        playsinline: 1
      },
      events: {
        onStateChange: onPlayerStateChange
      }
    });

    apiReady = true;
    apiLoading = false;

    const q = [...apiReadyQueue];
    apiReadyQueue = [];
    q.forEach(fn => {
      try {
        fn();
      } catch {}
    });
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

/* ✅ 랜덤 픽(연속 방지) */
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

/* 컨트롤 버튼(상단) */
function setActiveControl(activeId) {
  const ids = [
    "btnSeq",
    "btnRandOne",
    "btnRand10",
    "btnRandAuto",
    "btnLoop5",
    "btnLoop10",
    "btnLoopInf"
  ];

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

  if (playMode === "rand_n" && totalRandom > 0) {
    const el = $("btnRand10");
    if (el) el.textContent = `랜덤곡 10회 (${remainingRandom}/${totalRandom})`;
  }

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

  if (playMode === "rand_auto") {
    const el = $("btnRandAuto");
    if (el) el.textContent = `랜덤자동재생 (ON)`;
  }

  if (playMode === "loop_inf") {
    const el = $("btnLoopInf");
    if (el) el.textContent = `무한반복 (ON)`;
  }
}

/* DOMContentLoaded */
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
    remainingLoops = 0;
    totalLoops = 0;
    remainingRandom = 0;
    totalRandom = 0;
    setActiveControl("btnSeq");
  });

  // 랜덤곡(1곡)
  qs("btnRandOne")?.addEventListener("click", () => {
    playMode = "rand_once";
    loopInfinite = false;
    remainingLoops = 0;
    totalLoops = 0;
    remainingRandom = 0;
    totalRandom = 0;
    setActiveControl("btnRandOne");
    playRandomPickAndPlay(true);
  });

  // 랜덤 10회
  qs("btnRand10")?.addEventListener("click", () => {
    playMode = "rand_n";
    totalRandom = 10;
    remainingRandom = 10;
    loopInfinite = false;
    remainingLoops = 0;
    totalLoops = 0;
    setActiveControl("btnRand10");
    playRandomPickAndPlay(true);
  });

  // 랜덤자동재생(무한)
  qs("btnRandAuto")?.addEventListener("click", () => {
    playMode = "rand_auto";
    totalRandom = 0;
    remainingRandom = 0;
    loopInfinite = false;
    remainingLoops = 0;
    totalLoops = 0;
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
    remainingRandom = 0;
    totalRandom = 0;
    setActiveControl("btnLoop5");
  });

  // 10회 반복
  qs("btnLoop10")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");

    playMode = "loop_n";
    totalLoops = 10;
    remainingLoops = 10;
    loopInfinite = false;
    remainingRandom = 0;
    totalRandom = 0;
    setActiveControl("btnLoop10");
  });

  // 무한 반복
  qs("btnLoopInf")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");

    playMode = "loop_inf";
    loopInfinite = true;
    remainingLoops = 0;
    totalLoops = 0;
    remainingRandom = 0;
    totalRandom = 0;
    setActiveControl("btnLoopInf");
  });

  // 수정
  qs("btnEdit")?.addEventListener("click", () => {
    openEditModal();
  });

  // 삭제
  qs("btnDelete")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    deleteSong(current);
  });

  // 모달 바깥 클릭하면 닫기
  qs("editModal")?.addEventListener("click", closeEditModal);

  // 첫 렌더
  showList();
  updateLyricsDrawer();
  updateControlLabels();
});

/* 예전 버튼 호환 */
function nextSong() {
  if (songs.length === 0) return;
  playNextSequential();
}

function randomSong() {
  if (songs.length === 0) return;
  playRandomPickAndPlay(true);
}
