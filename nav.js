// nav.js - 사이드 메뉴(드로어) + 곡 개수 표시

function getCount(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(key)) || [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function openDrawer() {
  document.getElementById("drawer")?.classList.add("open");
  document.getElementById("drawerOverlay")?.classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer")?.classList.remove("open");
  document.getElementById("drawerOverlay")?.classList.remove("open");
}

function updateDrawerCounts() {
  // ✅ 네가 쓰는 로컬스토리지 키에 맞춰서 개수 표시
  // 일본 밝은노래는 지금 jpBright 쓰고 있으니까 여기서 읽음
  const jpBrightCount = getCount("jpBright");
  const cnBrightCount = getCount("cnBright"); // 아직 없으면 0으로 나옴

  const elJp = document.getElementById("count-jp-bright");
  const elCn = document.getElementById("count-cn-bright");

  if (elJp) elJp.textContent = jpBrightCount;
  if (elCn) elCn.textContent = cnBrightCount;
}

function initDrawer() {
  // 드로어 HTML이 없는 페이지면 그냥 종료
  if (!document.getElementById("drawer")) return;

  // 버튼 이벤트
  document.getElementById("hamburgerBtn")?.addEventListener("click", openDrawer);
  document.getElementById("drawerOverlay")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerCloseBtn")?.addEventListener("click", closeDrawer);

  // ESC로 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  updateDrawerCounts();
}

// 페이지 로드되면 자동 실행
document.addEventListener("DOMContentLoaded", initDrawer);
