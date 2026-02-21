let songs = JSON.parse(localStorage.getItem("jpBright")) || [];
let current = 0;
let dragIndex = null;

function save() {
  localStorage.setItem("jpBright", JSON.stringify(songs));
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
    if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0] || "";
  }
  return "";
}

function safeText(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function safeLink(url) {
  if (!url) return "";
  return url.trim();
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

function toggleLyrics(index) {
  const box = document.getElementById("lyrics-" + index);
  if (!box) return;

  box.style.display =
    (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

function showList() {
  const list = document.getElementById("list");
  if (!list) return;

  if (songs.length === 0) {
    list.innerHTML = `<p class="empty-center">아직 추가된 노래가 없어!</p>`;
    return;
  }

  let html = `<div class="playlist">`;

  songs.forEach((s, i) => {
    const ytFull = s.ytUrl || (s.id ? `https://www.youtube.com/watch?v=${s.id}` : "");
    const thumb = s.id ? `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg` : "";
    const hasLyrics = !!(s.lyrics && String(s.lyrics).trim().length > 0);
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

        <div class="pl-right" onclick="event.stopPropagation();">
          ${ytFull ? `<a class="pl-link" href="${ytFull}" target="_blank">유튜브</a>` : ""}

          ${hasLyrics
            ? `<button class="pl-btn" onclick="toggleLyrics(${i})">가사</button>`
            : `<span class="pl-empty">가사 없음</span>`}

          ${s.mr ? `<a class="pl-link" href="${s.mr}" target="_blank">MR</a>` : `<span class="pl-empty">MR</span>`}
          ${s.score ? `<a class="pl-link" href="${s.score}" target="_blank">악보</a>` : `<span class="pl-empty">악보</span>`}

          <button class="edit-btn" onclick="editSong(${i})">수정</button>
          <button class="delete-btn" onclick="deleteSong(${i})">삭제</button>
        </div>
      </div>

      <div id="lyrics-${i}" class="lyrics-box" style="display:none;">
        <pre>${escapeHTML(s.lyrics || "")}</pre>
      </div>
    `;
  });

  html += `</div>`;
  list.innerHTML = html;
}

/* ✅ 클릭하면 바로 재생되게: autoplay=1 */
function play(i) {
  current = i;
  if (!songs[i] || !songs[i].id) return;

  const id = songs[i].id;
  document.getElementById("player").src =
    "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";

  showList(); // ✅ 재생중 하이라이트 갱신
}

/* ✅ 제목 입력칸 없이: 유튜브 링크로 자동 제목/채널 저장 */
async function addSong() {
  const ytUrl = document.getElementById("yt").value.trim();
  const lyrics = safeText(document.getElementById("lyrics").value);
  const mr = safeLink(document.getElementById("mr").value);
  const score = safeLink(document.getElementById("score").value);

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

  document.getElementById("yt").value = "";
  document.getElementById("lyrics").value = "";
  document.getElementById("mr").value = "";
  document.getElementById("score").value = "";

  play(songs.length - 1);
}

async function editSong(index) {
  const s = songs[index];
  if (!s) return;

  const newYtUrl = prompt("새 유튜브 링크 (빈칸=유지)", s.ytUrl || "");
  if (newYtUrl === null) return;

  const newLyrics = prompt("새 가사 텍스트 (빈칸=유지, del=삭제)", s.lyrics || "");
  if (newLyrics === null) return;

  const newMr = prompt("새 MR 링크 (빈칸=유지, del=삭제)", s.mr || "");
  if (newMr === null) return;

  const newScore = prompt("새 악보 링크 (빈칸=유지, del=삭제)", s.score || "");
  if (newScore === null) return;

  if (newYtUrl.trim() !== "") {
    const id = extractID(newYtUrl.trim());
    if (!id) {
      alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
      return;
    }
    s.ytUrl = newYtUrl.trim();
    s.id = id;

    const meta = await fetchYouTubeMeta(s.ytUrl);
    s.title = meta.title;
    s.author = meta.author;
  }

  const applyField = (key, value) => {
    const v = value.trim();
    if (v === "") return;
    if (v.toLowerCase() === "del") { s[key] = ""; return; }
    s[key] = v;
  };

  applyField("lyrics", newLyrics);
  applyField("mr", newMr);
  applyField("score", newScore);

  save();
  showList();

  if (index === current) play(current);
}

function deleteSong(index) {
  if (!confirm("이 노래를 삭제할까?")) return;

  const wasCurrent = (index === current);

  songs.splice(index, 1);
  save();
  showList();

  if (songs.length === 0) {
    document.getElementById("player").src = "";
    current = 0;
    return;
  }

  if (wasCurrent) {
    if (current >= songs.length) current = songs.length - 1;
    play(current);
  } else {
    if (index < current) current--;
  }
}

function nextSong() {
  if (songs.length === 0) return;
  current = (current + 1) % songs.length;
  play(current);
}

function randomSong() {
  if (songs.length === 0) return;
  current = Math.floor(Math.random() * songs.length);
  play(current);
}

/* ✅ 드래그 정렬 */
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
}

showList();

// ===== 오른쪽 가사 패널 =====
function openLyricsDrawer(){
  document.body.classList.add("lyrics-open");
  updateLyricsDrawer();
}
function closeLyricsDrawer(){
  document.body.classList.remove("lyrics-open");
}
function toggleLyricsDrawer(){
  document.body.classList.toggle("lyrics-open");
  if (document.body.classList.contains("lyrics-open")) updateLyricsDrawer();
}

function updateLyricsDrawer(){
  const titleEl = document.getElementById("lyricsNowTitle");
  const textEl = document.getElementById("lyricsNowText");
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

// 버튼 이벤트 연결
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lyricsBtn")?.addEventListener("click", toggleLyricsDrawer);
  document.getElementById("lyricsCloseBtn")?.addEventListener("click", closeLyricsDrawer);
  document.getElementById("lyricsOverlay")?.addEventListener("click", closeLyricsDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLyricsDrawer();
  });
});

function play(i) {
  current = i;
  if (!songs[i] || !songs[i].id) return;

  const id = songs[i].id;
  document.getElementById("player").src =
    "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";

  showList();

  // ✅ 추가
  updateLyricsDrawer();
}

/* =========================
   ✅ YouTube IFrame Player API로 "끝나면 다음 동작" 구현
========================= */

let ytPlayer = null;

// 모드: "seq" | "rand_once" | "rand_n" | "rand_auto" | "loop_n" | "loop_inf"
let playMode = "seq";
let remainingRandom = 0;   // 랜덤 N회 남은 횟수
let remainingLoops = 0;    // 반복 N회 남은 횟수 (현재곡 기준)
let loopInfinite = false;

function ensurePlayerReady(cb) {
  if (ytPlayer) { cb(); return; }

  // API 스크립트 로드
  if (!document.getElementById("yt-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  // API 준비되면 호출되는 전역 함수
  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player("player", {
      width: "560",
      height: "315",
      events: {
        onStateChange: onPlayerStateChange
      }
    });
    cb();
  };
}

// 기존 play(i)를 "API로 재생"하도록 교체
function play(i) {
  current = i;
  if (!songs[i] || !songs[i].id) return;

  const id = songs[i].id;

  ensurePlayerReady(() => {
    ytPlayer.loadVideoById(id); // ✅ 클릭하면 바로 재생
  });

  showList();
  if (typeof updateLyricsDrawer === "function") updateLyricsDrawer();
}

// 끝났을 때(자동재생 로직)
function onPlayerStateChange(e) {
  // 0 = ended
  if (e.data !== 0) return;

  // ✅ 반복 우선 처리
  if (loopInfinite) {
    ytPlayer.playVideo(); // 같은 곡 다시
    return;
  }

  if (playMode === "loop_n") {
    if (remainingLoops > 1) {
      remainingLoops--;
      ytPlayer.playVideo();
      return;
    } else {
      // 반복 끝 -> 순서대로로 돌아가거나(원하면 유지 가능)
      playMode = "seq";
    }
  }

  // ✅ 랜덤 N회 처리
  if (playMode === "rand_n") {
    if (remainingRandom > 1) {
      remainingRandom--;
      playRandomPickAndPlay();
      return;
    } else {
      // 마지막 1회 끝 -> 종료(아무것도 안 함) or 순서대로 복귀
      playMode = "seq";
      return;
    }
  }

  // ✅ 랜덤 자동재생(무한)
  if (playMode === "rand_auto") {
    playRandomPickAndPlay();
    return;
  }

  // ✅ 랜덤곡(1곡만) 모드는 "끝나면 멈춤"
  if (playMode === "rand_once") {
    playMode = "seq";
    return;
  }

  // ✅ 기본: 순서대로
  playNextSequential();
}

function playNextSequential() {
  if (songs.length === 0) return;
  const next = (current + 1) % songs.length;
  play(next);
}

function playRandomPickAndPlay() {
  if (songs.length === 0) return;
  const idx = Math.floor(Math.random() * songs.length);
  play(idx);
}

/* =========================
   버튼 동작 연결
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const qs = (id) => document.getElementById(id);

  // 순서대로 자동재생
  qs("btnSeq")?.addEventListener("click", () => {
    playMode = "seq";
    loopInfinite = false;
    remainingLoops = 0;
    remainingRandom = 0;
    setActiveControl("btnSeq");
  });

  // 랜덤곡(딱 1곡만 랜덤으로 재생)
  qs("btnRandOne")?.addEventListener("click", () => {
    playMode = "rand_once";
    loopInfinite = false;
    remainingLoops = 0;
    remainingRandom = 0;
    setActiveControl("btnRandOne");
    playRandomPickAndPlay();
  });

  // 랜덤곡 10회 자동재생 (랜덤 10곡 재생 후 종료/순서대로 복귀)
  qs("btnRand10")?.addEventListener("click", () => {
    playMode = "rand_n";
    remainingRandom = 10;
    loopInfinite = false;
    remainingLoops = 0;
    setActiveControl("btnRand10");
    playRandomPickAndPlay();
  });

  // 랜덤자동재생(무한)
  qs("btnRandAuto")?.addEventListener("click", () => {
    playMode = "rand_auto";
    remainingRandom = 0;
    loopInfinite = false;
    remainingLoops = 0;
    setActiveControl("btnRandAuto");
    // 현재곡이 없으면 랜덤으로 시작
    if (!songs[current]) playRandomPickAndPlay();
  });

  // 5회 반복(현재 재생곡 기준)
  qs("btnLoop5")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    remainingLoops = 5;
    loopInfinite = false;
    remainingRandom = 0;
    setActiveControl("btnLoop5");
  });

  // 10회 반복
  qs("btnLoop10")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_n";
    remainingLoops = 10;
    loopInfinite = false;
    remainingRandom = 0;
    setActiveControl("btnLoop10");
  });

  // 무한 반복
  qs("btnLoopInf")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    playMode = "loop_inf";
    loopInfinite = true;
    remainingLoops = 0;
    remainingRandom = 0;
    setActiveControl("btnLoopInf");
  });

  // 수정/삭제 (현재 재생중인 곡)
  qs("btnEdit")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    editSong(current);
  });

  qs("btnDelete")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    deleteSong(current);
  });
});

/* =========================
   (선택) 활성 버튼 표시(누른 모드 하이라이트)
========================= */
function setActiveControl(activeId) {
  const ids = ["btnSeq","btnRandOne","btnRand10","btnRandAuto","btnLoop5","btnLoop10","btnLoopInf"];
  ids.forEach(id => document.getElementById(id)?.classList.remove("active-control"));
  document.getElementById(activeId)?.classList.add("active-control");
}

let lastRandomIndex = -1;

let totalRandom = 0;   // 랜덤 N 전체횟수
let totalLoops = 0;    // 반복 N 전체횟수

function updateControlLabels() {
  const $ = (id) => document.getElementById(id);

  // 기본 라벨
  const base = {
    btnSeq: "순서대로",
    btnRandOne: "랜덤곡",
    btnRand10: "랜덤곡 10회",
    btnRandAuto: "랜덤자동재생",
    btnLoop5: "5회반복",
    btnLoop10: "10회반복",
    btnLoopInf: "무한반복"
  };

  // 초기화
  Object.keys(base).forEach(id => {
    const el = $(id);
    if (el) el.textContent = base[id];
  });

  // 랜덤 N 남은횟수 표시
  if (playMode === "rand_n" && totalRandom > 0) {
    const el = $("btnRand10");
    if (el) el.textContent = `랜덤곡 10회 (${remainingRandom}/${totalRandom})`;
  }

  // 반복 N 남은횟수 표시 (현재 곡 기준)
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

  // 랜덤자동재생 ON 표시(선택)
  if (playMode === "rand_auto") {
    const el = $("btnRandAuto");
    if (el) el.textContent = `랜덤자동재생 (ON)`;
  }

  // 무한반복 ON 표시(선택)
  if (playMode === "loop_inf") {
    const el = $("btnLoopInf");
    if (el) el.textContent = `무한반복 (ON)`;
  }
}
