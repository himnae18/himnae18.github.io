let songs = JSON.parse(localStorage.getItem("japanBright")) || [];

function saveSongs() {
  localStorage.setItem("japanBright", JSON.stringify(songs));
}

function render() {
  let html = "";
  songs.forEach((s) => {
    html += `
    <div class="song">
      <h3>${s.title}</h3>
      <iframe width="400" height="225"
      src="https://www.youtube.com/embed/${s.yt}"
      frameborder="0" allowfullscreen></iframe>
    </div>
    <hr>
    `;
  });
  document.getElementById("list").innerHTML = html;
}

function addSong() {
  let title = document.getElementById("title").value;
  let yt = document.getElementById("yt").value.split("v=")[1];

  songs.push({title, yt});
  saveSongs();
  render();
}

render();
