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
