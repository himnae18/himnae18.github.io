let songs = JSON.parse(localStorage.getItem("japanBright")) || [];
let currentIndex = 0;

function saveSongs() {
  localStorage.setItem("japanBright", JSON.stringify(songs));
}

function render() {
  let html = "";
  songs.forEach((s, i) => {
    html += `
    <div class="song">
      <h3>${s.title}</h3>
      <button onclick="playSong(${i})">▶ 재생</button>
    </div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}

function addSong() {
  let title = document.getElementById("title").value;
  let yt = document.getElementById("yt").value.split("v=")[1].split("&")[0];
  songs.push({title, yt});
  saveSongs();
  render();
}

function playSong(i) {
  currentIndex = i;
  document.getElementById("player").src =
    "https://www.youtube.com/embed/" + songs[i].yt + "?autoplay=1";
}

function nextSong() {
  currentIndex++;
  if (currentIndex >= songs.length) currentIndex = 0;
  playSong(currentIndex);
}

function randomSong() {
  currentIndex = Math.floor(Math.random() * songs.length);
  playSong(currentIndex);
}

render();
