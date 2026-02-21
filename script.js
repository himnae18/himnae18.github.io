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
