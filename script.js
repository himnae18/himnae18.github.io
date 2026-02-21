<script>
let songs = [
  "songs/lemon.mp3",
  "songs/yoru.mp3",
  "songs/kpop.mp3"
];

let index = 0;
let player = document.getElementById("player");

function playSong(src){
  player.src = src;
  player.play();
  index = songs.indexOf(src);
}

// 자동 다음곡
player.addEventListener("ended", ()=>{
  index++;
  if(index >= songs.length) index = 0; // 반복
  player.src = songs[index];
  player.play();
});
</script>
