let songs = JSON.parse(localStorage.getItem("jpBright")) || [];
let current = 0;

let ytPlayer = null;
let playMode = "seq";

let remainingRandom = 0;
let totalRandom = 0;

let remainingLoops = 0;
let totalLoops = 0;
let loopInfinite = false;

let lastRandomIndex = -1;

/* =========================
   저장
========================= */
function save(){
  localStorage.setItem("jpBright", JSON.stringify(songs));
}

/* =========================
   플레이어 초기화
========================= */
function ensurePlayerReady(cb){
  if(ytPlayer){ cb(); return; }

  const tag=document.createElement("script");
  tag.src="https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady=()=>{
    ytPlayer=new YT.Player("player",{
      events:{ onStateChange:onPlayerStateChange }
    });
    cb();
  };
}

/* =========================
   재생
========================= */
function play(i){
  current=i;
  ensurePlayerReady(()=>{
    ytPlayer.loadVideoById(songs[i].id);
  });
  showList();
}

/* =========================
   랜덤 (연속곡 방지)
========================= */
function playRandomPickAndPlay(){
  if(songs.length===0) return;

  let idx;
  do{
    idx=Math.floor(Math.random()*songs.length);
  }while(songs.length>1 && idx===lastRandomIndex);

  lastRandomIndex=idx;
  play(idx);
}

/* =========================
   끝났을 때
========================= */
function onPlayerStateChange(e){
  if(e.data!==0) return;

  // 무한반복
  if(loopInfinite){
    ytPlayer.playVideo();
    return;
  }

  // 반복 N
  if(playMode==="loop_n"){
    remainingLoops--;
    updateControlLabels();
    if(remainingLoops>0){
      ytPlayer.playVideo();
      return;
    }
    playMode="seq";
  }

  // 랜덤 N
  if(playMode==="rand_n"){
    remainingRandom--;
    updateControlLabels();
    if(remainingRandom>0){
      playRandomPickAndPlay();
      return;
    }
    playMode="seq";
    return;
  }

  // 랜덤 무한
  if(playMode==="rand_auto"){
    playRandomPickAndPlay();
    return;
  }

  // 기본 순서
  const next=(current+1)%songs.length;
  play(next);
}

/* =========================
   버튼 연결
========================= */
document.addEventListener("DOMContentLoaded",()=>{

  const $=id=>document.getElementById(id);

  $("btnSeq").onclick=()=>{
    resetModes();
    playMode="seq";
    setActive("btnSeq");
  };

  $("btnRandOne").onclick=()=>{
    resetModes();
    playMode="rand_once";
    setActive("btnRandOne");
    playRandomPickAndPlay();
  };

  $("btnRand10").onclick=()=>{
    resetModes();
    playMode="rand_n";
    totalRandom=10;
    remainingRandom=10;
    setActive("btnRand10");
    updateControlLabels();
    playRandomPickAndPlay();
  };

  $("btnRandAuto").onclick=()=>{
    resetModes();
    playMode="rand_auto";
    setActive("btnRandAuto");
    playRandomPickAndPlay();
  };

  $("btnLoop5").onclick=()=>{
    if(!songs[current]) return alert("먼저 곡 재생해!");
    resetModes();
    playMode="loop_n";
    totalLoops=5;
    remainingLoops=5;
    setActive("btnLoop5");
    updateControlLabels();
  };

  $("btnLoop10").onclick=()=>{
    if(!songs[current]) return alert("먼저 곡 재생해!");
    resetModes();
    playMode="loop_n";
    totalLoops=10;
    remainingLoops=10;
    setActive("btnLoop10");
    updateControlLabels();
  };

  $("btnLoopInf").onclick=()=>{
    if(!songs[current]) return alert("먼저 곡 재생해!");
    resetModes();
    playMode="loop_inf";
    loopInfinite=true;
    setActive("btnLoopInf");
  };
});

/* =========================
   모드 초기화
========================= */
function resetModes(){
  playMode="seq";
  remainingRandom=0;
  totalRandom=0;
  remainingLoops=0;
  totalLoops=0;
  loopInfinite=false;
  updateControlLabels();
}

/* =========================
   버튼 표시
========================= */
function setActive(id){
  const ids=["btnSeq","btnRandOne","btnRand10","btnRandAuto","btnLoop5","btnLoop10","btnLoopInf"];
  ids.forEach(i=>document.getElementById(i)?.classList.remove("active-control"));
  document.getElementById(id)?.classList.add("active-control");
}

function updateControlLabels(){
  const $=id=>document.getElementById(id);

  if(playMode==="rand_n"){
    $("btnRand10").textContent=`랜덤곡 10회 (${remainingRandom}/${totalRandom})`;
  }else{
    $("btnRand10").textContent="랜덤곡 10회";
  }

  if(playMode==="loop_n"){
    if(totalLoops===5)
      $("btnLoop5").textContent=`5회반복 (${remainingLoops}/5)`;
    if(totalLoops===10)
      $("btnLoop10").textContent=`10회반복 (${remainingLoops}/10)`;
  }else{
    $("btnLoop5").textContent="5회반복";
    $("btnLoop10").textContent="10회반복";
  }
}
