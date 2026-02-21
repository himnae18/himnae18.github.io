let songs = [];
let currentIndex = 0;

// 유튜브 링크 → embed 변환
function convertYT(url) {
  let id = url.split("v=")[1];
  if (!id) return "";
  id = id.split("&")[0];
  return "https://www.youtube.com/embed/" + id;
}

// 노래 추가
function addSong() {
  let title = document.getElementById("title").value;
  let yt = document.getElementById("yt").value;
  let embed = convertYT(yt);

  songs.push({ title, embed });

  showList();
  playSong(songs.length - 1);
}

// 리스트 표시
function showList() {
  let list = document.getElementById("list");
  list.innerHTML = "";

  songs.forEach((song, i) => {
    list.innerHTML += `<div onclick="playSong(${i})">🎵 ${song.title}</div>`;
  });
}

// 재생
function playSong(index) {
  currentIndex = index;
  document.getElementById("player").src = songs[index].embed;
}

// 다음곡
function nextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  playSong(currentIndex);
}

// 랜덤
function randomSong() {
  currentIndex = Math.floor(Math.random() * songs.length);
  playSong(currentIndex);
}
