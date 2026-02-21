let songs = JSON.parse(localStorage.getItem("jpBright")) || [];

function addSong(){
  let title = document.getElementById("title").value;
  let yt = document.getElementById("yt").value;

  songs.push({title, yt});
  localStorage.setItem("jpBright", JSON.stringify(songs));
  location.reload();
}

window.onload = () => {
  songs.forEach(s=>{
    let id = s.yt.split("v=")[1];
    document.getElementById("list").innerHTML += `
      <h3>${s.title}</h3>
      <iframe width="300" src="https://www.youtube.com/embed/${id}"></iframe>
      <hr>
    `;
  });
}
