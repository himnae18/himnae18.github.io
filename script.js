let songs = JSON.parse(localStorage.getItem("jpBright")) || [];
let current = 0;

function save() {
  localStorage.setItem("jpBright", JSON.stringify(songs));
}

/* ✅ 유튜브 링크에서 영상 ID 뽑기 (여러 형태 지원)
   - https://www.youtube.com/watch?v=ID
   - https://youtu.be/ID
   - https://www.youtube.com/shorts/ID
   - https://www.youtube.com/embed/ID
*/
function extractID(url) {
  if (!url) return "";

  try {
    const u = new URL(url);

    // 1) watch?v=
    const v = u.searchParams.get("v");
    if (v) return v;

    // 2) youtu.be/ID
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }

    // 3) /shorts/ID or /embed/ID
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

// ✅ 유튜브 제목 자동 가져오기(oEmbed) - API키 필요없음
async function fetchYouTubeTitle(ytUrl) {
  try {
    const api = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(ytUrl);
    const res = await fetch(api);
    if (!res.ok) throw new Error("oEmbed 실패");
    const data = await res.json();
    return data.title || "제목 없음";
  } catch (e) {
    return "제목 없음";
  }
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

function toggleLyrics(index) {
  const box = document.getElementById("lyrics-" + index);
  if (!box) return;

  box.style.display =
    (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

function showList() {
  let html = "";

  if (songs.length === 0) {
    html = "<p>아직 추가된 노래가 없어!</p>";
    document.getElementById("list").innerHTML = html;
    return;
  }

  songs.forEach((s, i) => {
    const ytFull = s.ytUrl || (s.id ? `https://www.youtube.com/watch?v=${s.id}` : "");
    const hasLyrics = !!(s.lyrics && String(s.lyrics).trim().length > 0);

    html += `
      <div class="song-row">
        <div class="song-title" onclick="play(${i})">▶ ${escapeHTML(s.title || "제목 없음")}</div>

        <div class="song-links">
          ${ytFull ? `<a href="${ytFull}" target="_blank">유튜브</a>` : ""}

          ${hasLyrics
            ? `<button onclick="toggleLyrics(${i})">가사 보기</button>`
            : `<span class="empty">가사 없음</span>`}

          ${s.mr ? `<a href="${s.mr}" target="_blank">MR</a>` : `<span class="empty">MR</span>`}
          ${s.score ? `<a href="${s.score}" target="_blank">악보</a>` : `<span class="empty">악보</span>`}

          <button class="edit-btn" onclick="editSong(${i})">수정</button>
          <button class="delete-btn" onclick="deleteSong(${i})">삭제</button>
        </div>

        <div id="lyrics-${i}" class="lyrics-box" style="display:none;">
          <pre>${escapeHTML(s.lyrics || "")}</pre>
        </div>
      </div>
    `;
  });

  document.getElementById("list").innerHTML = html;
}

function play(i) {
  current = i;
  if (!songs[i] || !songs[i].id) return;

  document.getElementById("player").src =
    "https://www.youtube.com/embed/" + songs[i].id;
}

// ✅ 제목 입력칸 제거 버전: 유튜브 제목 자동 저장
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

  // ✅ 자동 제목
  const title = await fetchYouTubeTitle(ytUrl);

  songs.push({
    title,
    ytUrl,
    id,
    lyrics,
    mr,
    score
  });

  save();
  showList();

  // 입력칸 비우기
  document.getElementById("yt").value = "";
  document.getElementById("lyrics").value = "";
  document.getElementById("mr").value = "";
  document.getElementById("score").value = "";

  play(songs.length - 1);
}

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

  const title = await fetchYouTubeTitle(ytUrl);

  songs.push({ title, ytUrl, id, lyrics, mr, score });

  save();
  showList();

  document.getElementById("yt").value = "";
  document.getElementById("lyrics").value = "";
  document.getElementById("mr").value = "";
  document.getElementById("score").value = "";

  play(songs.length - 1);
}

  const applyField = (key, value) => {
    const v = value.trim();
    if (v === "") return;           // 유지
    if (v.toLowerCase() === "del") {
      s[key] = "";                  // 삭제
      return;
    }
    s[key] = v;                     // 변경
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
  current++;
  if (current >= songs.length) current = 0;
  play(current);
}

function randomSong() {
  if (songs.length === 0) return;
  current = Math.floor(Math.random() * songs.length);
  play(current);
}

showList();
