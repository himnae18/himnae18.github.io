// nav.js - 사이드 메뉴(드로어) + 곡 개수 표시 (토글 버전)

function getCount(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(key)) || [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/* =========================
   드로어 상태/열기/닫기/토글
========================= */
function isDrawerOpen() {
  return document.getElementById("drawer")?.classList.contains("open");
}

function openDrawer() {
  document.getElementById("drawer")?.classList.add("open");
  document.getElementById("drawerOverlay")?.classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer")?.classList.remove("open");
  document.getElementById("drawerOverlay")?.classList.remove("open");
}

function toggleDrawer() {
  if (isDrawerOpen()) closeDrawer();
  else openDrawer();
}

/* =========================
   곡 개수 업데이트
========================= */
function updateDrawerCounts() {
  const jpBrightCount = getCount("jpBright");
  const cnBrightCount = getCount("cnBright");

  const elJp = document.getElementById("count-jp-bright");
  const elCn = document.getElementById("count-cn-bright");

  if (elJp) elJp.textContent = jpBrightCount;
  if (elCn) elCn.textContent = cnBrightCount;
}

/* =========================
   초기화
========================= */
function initDrawer() {
  // 드로어 HTML이 없는 페이지면 종료
  if (!document.getElementById("drawer")) return;

  // ✅ 같은 버튼으로 열기/닫기
  document.getElementById("hamburgerBtn")?.addEventListener("click", toggleDrawer);

  // ✅ 오버레이 클릭하면 닫기
  document.getElementById("drawerOverlay")?.addEventListener("click", closeDrawer);

  // ✅ (혹시 남아있을 수 있는 X 버튼) 있어도 동작만 하고, 없어도 에러 없음
  document.getElementById("drawerCloseBtn")?.addEventListener("click", closeDrawer);

  // ESC로 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  updateDrawerCounts();
}

// 페이지 로드되면 자동 실행
document.addEventListener("DOMContentLoaded", initDrawer);
