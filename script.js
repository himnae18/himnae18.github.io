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
    // URL 형식이 이상하면 기존 방식으로 한 번 더 시도
    if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0] || "";
  }

  return "";
}

function safeLink(url) {
  if (!url) return "";
  return url.trim();
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

    html += `
      <div class="song-row">
        <div class="song-title" onclick="play(${i})">▶ ${s.title || "제목 없음"}</div>

        <div class="song-links">
          ${ytFull ? `<a href="${ytFull}" target="_blank">유튜브</a>` : ""}

          ${s.lyrics ? `<a href="${s.lyrics}" target="_blank">가사</a>` : `<span class="empty">가사</span>`}
          ${s.mr ? `<a href="${s.mr}" target="_blank">MR</a>` : `<span class="empty">MR</span>`}
          ${s.score ? `<a href="${s.score}" target="_blank">악보</a>` : `<span class="empty">악보</span>`}

          <button class="edit-btn" onclick="editSong(${i})">수정</button>
          <button class="delete-btn" onclick="deleteSong(${i})">삭제</button>
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

function addSong() {
  const title = document.getElementById("title").value.trim();
  const ytUrl = document.getElementById("yt").value.trim();

  const lyrics = safeLink(document.getElementById("lyrics").value);
  const mr = safeLink(document.getElementById("mr").value);
  const score = safeLink(document.getElementById("score").value);

  const id = extractID(ytUrl);

  if (!ytUrl || !id) {
    alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
    return;
  }

  songs.push({
    title: title || "제목 없음",
    ytUrl,
    id,
    lyrics,
    mr,
    score
  });

  save();      // ✅ 자동 저장
  showList();  // ✅ 목록 갱신

  // ✅ 입력칸 비우기
  document.getElementById("title").value = "";
  document.getElementById("yt").value = "";
  document.getElementById("lyrics").value = "";
  document.getElementById("mr").value = "";
  document.getElementById("score").value = "";

  // ✅ 추가하자마자 그 노래 재생
  play(songs.length - 1);
}

function editSong(index) {
  const s = songs[index];
  if (!s) return;

  // ✅ 빈칸이면 "유지", del 입력하면 "삭제"
  const newTitle = prompt("새 제목 (빈칸=유지)", s.title || "");
  if (newTitle === null) return;

  const newYtUrl = prompt("새 유튜브 링크 (빈칸=유지)", s.ytUrl || "");
  if (newYtUrl === null) return;

  const newLyrics = prompt("새 가사 링크 (빈칸=유지, del=삭제)", s.lyrics || "");
  if (newLyrics === null) return;

  const newMr = prompt("새 MR 링크 (빈칸=유지, del=삭제)", s.mr || "");
  if (newMr === null) return;

  const newScore = prompt("새 악보 링크 (빈칸=유지, del=삭제)", s.score || "");
  if (newScore === null) return;

  // 제목 변경
  if (newTitle.trim() !== "") s.title = newTitle.trim();

  // 유튜브 변경(바꾸면 id도 다시 뽑기)
  if (newYtUrl.trim() !== "") {
    const id = extractID(newYtUrl.trim());
    if (!id) {
      alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
      return;
    }
    s.ytUrl = newYtUrl.trim();
    s.id = id;
  }

  // 링크 변경/삭제 처리 함수
  const applyLink = (key, value) => {
    const v = value.trim();
    if (v === "") return;                 // 유지
    if (v.toLowerCase() === "del") {
      s[key] = "";                        // 삭제
      return;
    }
    s[key] = v;                           // 변경
  };

  applyLink("lyrics", newLyrics);
  applyLink("mr", newMr);
  applyLink("score", newScore);

  save();
  showList();

  // 지금 재생 중인 곡을 수정했으면 플레이어도 업데이트
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
