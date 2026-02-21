let songs = JSON.parse(localStorage.getItem("jpBright")) || [];
let current = 0;

function save() {
  localStorage.setItem("jpBright", JSON.stringify(songs));
}

function extractID(url) {
  return url.split("v=")[1]?.split("&")[0];
}

function showList() {
  let html = "";
  songs.forEach((s, i) => {
    html += `<p onclick="play(${i})">▶ ${s.title}</p>`;
  });
  document.getElementById("list").innerHTML = html;
}

function play(i) {
  current = i;
  document.getElementById("player").src =
    "https://www.youtube.com/embed/" + songs[i].id;
}

function addSong() {
  let title = document.getElementById("title").value;
  let url = document.getElementById("yt").value;
  let id = extractID(url);

  songs.push({ title, id });
  save();
  showList();
}

function nextSong() {
  current++;
  if (current >= songs.length) current = 0;
  play(current);
}

function randomSong() {
  current = Math.floor(Math.random() * songs.length);
  play(current);
}

showList();
