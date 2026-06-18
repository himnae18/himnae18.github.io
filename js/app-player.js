// js/app-player.js - 노래 추가/삭제 + 유튜브 플레이어 + 랜덤/반복 버튼

async function addSong() {
  const ytUrl = safeLink(document.getElementById("yt")?.value);
  const lyrics = safeText(document.getElementById("lyrics")?.value);
  const mr = safeLink(document.getElementById("mr")?.value);
  const score = safeLink(document.getElementById("score")?.value);
  const original = safeLink(document.getElementById("original")?.value);

  const id = extractID(ytUrl);
  if (!ytUrl || !id) {
    alert("유튜브 링크가 올바르지 않아! watch?v= 또는 youtu.be 링크로 넣어봐.");
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
    score,
    original,
    memo: "",
    tags: []
  });

  save();
  showList();

  ["yt", "lyrics", "mr", "score", "original"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  play(songs.length - 1);
}

function deleteSong(index) {
  if (!songs[index]) return;
  if (!confirm("이 노래를 삭제할까?")) return;

  const wasCurrent = index === current;
  songs.splice(index, 1);

  if (songs.length === 0) {
    save();
    if (ytPlayer) ytPlayer.stopVideo();
    current = 0;
    showList();
    updateLyricsDrawer();
    updateControlLabels();
    if (typeof renderTagTools === "function") renderTagTools();
    return;
  }

  if (index < current) current--;
  if (current >= songs.length) current = songs.length - 1;

  save();
  showList();
  updateLyricsDrawer();

  if (wasCurrent) play(current);
}

let ytPlayer = null;
let apiLoading = false;
let apiReady = false;
let apiReadyQueue = [];

// 모드: seq | rand_once | rand_n | rand_auto | loop_n | loop_inf
let playMode = "seq";
let remainingRandom = 0;
let remainingLoops = 0;
let totalRandom = 0;
let totalLoops = 0;
let loopInfinite = false;
let lastRandomIndex = -1;

// 재생 위치 되돌아가기/앞으로가기 기록
let playHistoryBack = [];
let playHistoryForward = [];
const MAX_PLAY_HISTORY = 100;

function trimPlayHistory() {
  if (playHistoryBack.length > MAX_PLAY_HISTORY) playHistoryBack = playHistoryBack.slice(-MAX_PLAY_HISTORY);
  if (playHistoryForward.length > MAX_PLAY_HISTORY) playHistoryForward = playHistoryForward.slice(-MAX_PLAY_HISTORY);
}

function updateHistoryButtons() {
  const backBtn = document.getElementById("btnHistoryBack");
  const forwardBtn = document.getElementById("btnHistoryForward");
  if (backBtn) {
    backBtn.disabled = playHistoryBack.length === 0;
    backBtn.title = playHistoryBack.length === 0 ? "되돌아갈 노래가 없어." : "이전에 들었던 노래로 이동 (Ctrl+Z)";
  }
  if (forwardBtn) {
    forwardBtn.disabled = playHistoryForward.length === 0;
    forwardBtn.title = playHistoryForward.length === 0 ? "앞으로 갈 노래가 없어." : "되돌아간 노래에서 다시 앞으로 이동 (Ctrl+X)";
  }
}

function prunePlayHistory() {
  playHistoryBack = playHistoryBack.filter((idx) => songs[idx]);
  playHistoryForward = playHistoryForward.filter((idx) => songs[idx]);
  updateHistoryButtons();
}

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
    q.forEach((fn) => {
      try { fn(); } catch {}
    });
  };
}

function play(i, options = {}) {
  const nextIndex = Number(i);
  if (!Number.isFinite(nextIndex) || !songs[nextIndex] || !songs[nextIndex].id) return;

  if (!options.fromHistory && songs[current] && nextIndex !== current) {
    playHistoryBack.push(current);
    playHistoryForward = [];
    trimPlayHistory();
  }

  current = nextIndex;

  ensurePlayerReady(() => {
    ytPlayer.loadVideoById(songs[nextIndex].id);
  });

  showList();
  updateLyricsDrawer();
  updateControlLabels();
  if (typeof renderTagTools === "function") renderTagTools();
}

function goBackSong() {
  prunePlayHistory();
  const prev = playHistoryBack.pop();
  if (prev === undefined || !songs[prev]) {
    updateHistoryButtons();
    return;
  }
  if (songs[current]) playHistoryForward.push(current);
  trimPlayHistory();
  play(prev, { fromHistory: true });
}

function goForwardSong() {
  prunePlayHistory();
  const next = playHistoryForward.pop();
  if (next === undefined || !songs[next]) {
    updateHistoryButtons();
    return;
  }
  if (songs[current]) playHistoryBack.push(current);
  trimPlayHistory();
  play(next, { fromHistory: true });
}

function playMr(i) {
  const song = songs[i];
  if (!song) return;

  const mrUrl = safeLink(song.mr);
  if (!mrUrl) {
    alert("이 곡은 MR 링크가 없어.");
    return;
  }

  const mrId = extractID(mrUrl);
  if (!mrId) {
    window.open(mrUrl, "_blank", "noopener");
    return;
  }

  current = i;
  ensurePlayerReady(() => {
    ytPlayer.loadVideoById(mrId);
  });

  showList();
  updateLyricsDrawer();
  updateControlLabels();
}

function onPlayerStateChange(e) {
  if (e.data !== 0) return; // 0 = ended

  if (loopInfinite) {
    ytPlayer.playVideo();
    return;
  }

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

  if (playMode === "rand_auto") {
    playRandomPickAndPlay(true);
    return;
  }

  if (playMode === "rand_once") {
    playMode = "seq";
    updateControlLabels();
    return;
  }

  playNextSequential();
}

function playNextSequential() {
  if (songs.length === 0) return;
  const next = (current + 1) % songs.length;
  play(next);
}

function pickRandomIndex(excludeConsecutive = true) {
  const n = songs.length;
  if (n === 0) return -1;
  if (n === 1) return 0;

  let tries = 0;
  let idx = Math.floor(Math.random() * n);

  while (excludeConsecutive && tries < 30 && (idx === current || idx === lastRandomIndex)) {
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

function setActiveControl(activeId) {
  const ids = ["btnSeq", "btnRandOne", "btnRand10", "btnRandAuto", "btnLoop5", "btnLoop10", "btnLoopInf"];
  ids.forEach((id) => document.getElementById(id)?.classList.remove("active-control"));
  document.getElementById(activeId)?.classList.add("active-control");
  updateControlLabels();
}

function resetPlayCounters() {
  loopInfinite = false;
  remainingLoops = 0;
  totalLoops = 0;
  remainingRandom = 0;
  totalRandom = 0;
}

function updateControlLabels() {
  const base = {
    btnSeq: "순서대로",
    btnRandOne: "랜덤곡",
    btnRand10: "랜덤곡 10회",
    btnRandAuto: "랜덤자동재생",
    btnLoop5: "5회반복",
    btnLoop10: "10회반복",
    btnLoopInf: "무한반복"
  };

  Object.entries(base).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  updateHistoryButtons();

  if (playMode === "rand_n" && totalRandom > 0) {
    const el = document.getElementById("btnRand10");
    if (el) el.textContent = `랜덤곡 10회 (${remainingRandom}/${totalRandom})`;
  }

  if (playMode === "loop_n" && totalLoops > 0) {
    const id = totalLoops === 5 ? "btnLoop5" : "btnLoop10";
    const el = document.getElementById(id);
    if (el) el.textContent = `${totalLoops}회반복 (${remainingLoops}/${totalLoops})`;
  }

  if (playMode === "rand_auto") {
    const el = document.getElementById("btnRandAuto");
    if (el) el.textContent = "랜덤자동재생 (ON)";
  }

  if (playMode === "loop_inf") {
    const el = document.getElementById("btnLoopInf");
    if (el) el.textContent = "무한반복 (ON)";
  }
}

function isShortcutTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
}

document.addEventListener("DOMContentLoaded", () => {
  const ytInput = document.getElementById("yt");

  ytInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing) return;
    e.preventDefault();
    addSong();
  });

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    if (document.querySelector(".modal-overlay.open")) return;

    if (!isShortcutTypingTarget(e.target)) {
      const key = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.altKey && key === "z") {
        e.preventDefault();
        goBackSong();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && key === "x") {
        e.preventDefault();
        goForwardSong();
        return;
      }
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isShortcutTypingTarget(e.target)) return;
    if (String(e.key || "").toLowerCase() !== "q") return;

    const input = document.getElementById("yt");
    if (!input) return;
    e.preventDefault();
    input.focus();
    input.select?.();
  });

  document.getElementById("lyricsBtn")?.addEventListener("click", toggleLyricsDrawer);
  document.getElementById("lyricsCloseBtn")?.addEventListener("click", closeLyricsDrawer);
  document.getElementById("lyricsOverlay")?.addEventListener("click", closeLyricsDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLyricsDrawer();
  });

  const qs = (id) => document.getElementById(id);

  qs("btnSeq")?.addEventListener("click", () => {
    playMode = "seq";
    resetPlayCounters();
    setActiveControl("btnSeq");
  });

  qs("btnRandOne")?.addEventListener("click", () => {
    playMode = "rand_once";
    resetPlayCounters();
    setActiveControl("btnRandOne");
    playRandomPickAndPlay(true);
  });

  qs("btnRand10")?.addEventListener("click", () => {
    playMode = "rand_n";
    resetPlayCounters();
    totalRandom = 10;
    remainingRandom = 10;
    setActiveControl("btnRand10");
    playRandomPickAndPlay(true);
  });

  qs("btnRandAuto")?.addEventListener("click", () => {
    playMode = "rand_auto";
    resetPlayCounters();
    setActiveControl("btnRandAuto");
    if (!songs[current]) playRandomPickAndPlay(true);
  });

  qs("btnLoop5")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    resetPlayCounters();
    totalLoops = 5;
    remainingLoops = 5;
    setActiveControl("btnLoop5");
  });

  qs("btnLoop10")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    resetPlayCounters();
    totalLoops = 10;
    remainingLoops = 10;
    setActiveControl("btnLoop10");
  });

  qs("btnLoopInf")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_inf";
    resetPlayCounters();
    loopInfinite = true;
    setActiveControl("btnLoopInf");
  });

  qs("btnHistoryBack")?.addEventListener("click", goBackSong);
  qs("btnHistoryForward")?.addEventListener("click", goForwardSong);

  qs("btnEdit")?.addEventListener("click", () => openEditModal());

  qs("btnDelete")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    deleteSong(current);
    prunePlayHistory();
  });

  showList();
  updateLyricsDrawer();
  updateControlLabels();
  if (typeof renderTagTools === "function") renderTagTools();
  updateHistoryButtons();

  const params = new URLSearchParams(location.search);
  const playId = params.get("play");
  if (playId) {
    const foundIndex = songs.findIndex((song) => song.id === playId || song.ytUrl === playId);
    if (foundIndex >= 0) play(foundIndex);
  }
});

function nextSong() {
  playNextSequential();
}

function randomSong() {
  playRandomPickAndPlay(true);
}

window.goBackSong = goBackSong;
window.goForwardSong = goForwardSong;
