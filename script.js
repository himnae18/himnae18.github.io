let total = Number(localStorage.getItem("totalTime")) || 0;
let start = Date.now();

setInterval(() => {
  let sec = Math.floor((Date.now() - start) / 1000);
  document.getElementById("time") &&
    (document.getElementById("time").innerText =
      "총 사이트 머문 시간: " + (total + sec) + "초");
}, 1000);

window.onbeforeunload = () => {
  let sec = Math.floor((Date.now() - start) / 1000);
  localStorage.setItem("totalTime", total + sec);
};

let playlist = [
  "songs/lemon.mp3",
  "songs/yoru.mp3",
  "songs/sparkle.mp3"
];

let current = 0;
let player = document.getElementById("player");

// 노래 클릭 재생
function playSong(i) {
  current = i;
  player.src = playlist[current];
  player.play();
}

// 노래 끝나면 자동 다음곡
player.addEventListener("ended", () => {
  current++;
  if (current >= playlist.length) current = 0; // 반복
  player.src = playlist[current];
  player.play();
});

let songs = JSON.parse(localStorage.getItem("songs")) || [];

function addSong() {
  let song = {
    country: country.value,
    mood: mood.value,
    title: title.value,
    youtube: youtube.value,
    mr: mr.value,
    score: score.value,
    lyrics: lyrics.value
  };

  songs.push(song);
  localStorage.setItem("songs", JSON.stringify(songs));
  showSongs();
}

function showSongs() {
  let html = "";

  for (let s of songs) {
    html += `
    <div class="song">
      <h3>${s.country} / ${s.mood} / ${s.title}</h3>

      <iframe width="300" src="${s.youtube.replace("watch?v=","embed/")}"></iframe>
      <audio controls src="${s.mr}"></audio>

      <details>
        <summary>가사</summary>
        <p>${s.lyrics}</p>
      </details>

      <a href="${s.score}">악보</a>
    </div>
    `;
  }

  document.getElementById("playlist").innerHTML = html;
}

showSongs();
