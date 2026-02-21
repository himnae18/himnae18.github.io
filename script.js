function addSong() {
  const title = prompt("노래 제목?");
  const youtube = prompt("유튜브 ID?");
  const mr = prompt("MR 파일 이름?");
  const score = prompt("악보 파일 이름?");

  const div = document.createElement("div");
  div.innerHTML = `
  <h3>${title}</h3>
  <iframe width="400" src="https://www.youtube.com/embed/${youtube}"></iframe>
  <audio controls src="../songs/${mr}"></audio>
  <a href="../score/${score}">악보</a>
  <hr>
  `;
  document.getElementById("songList").appendChild(div);
}
