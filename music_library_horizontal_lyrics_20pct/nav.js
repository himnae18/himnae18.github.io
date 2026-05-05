// nav.js - 햄버거 메뉴 + 곡 개수 표시

function getCount(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(key)) || [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

// 예전 jpBright 키를 썼던 데이터도 같이 보이게 보정
function getMergedCount(newKey, oldKey) {
  const a = getCount(newKey);
  const b = oldKey ? getCount(oldKey) : 0;
  return Math.max(a, b);
}

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

function updateDrawerCounts() {
  const counts = {
    "count-ja-bright": getMergedCount("jaBright", "jpBright"),
    "count-ja-mid": getMergedCount("jaMid", "jpMid"),
    "count-ja-dark": getMergedCount("jaDark", "jpDark"),
    "count-cn-bright": getCount("cnBright"),
    "count-cn-mid": getCount("cnMid"),
    "count-cn-dark": getCount("cnDark")
  };

  Object.entries(counts).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function initDrawer() {
  if (!document.getElementById("drawer")) return;

  document.getElementById("hamburgerBtn")?.addEventListener("click", toggleDrawer);
  document.getElementById("drawerOverlay")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerCloseBtn")?.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  updateDrawerCounts();
}

document.addEventListener("DOMContentLoaded", initDrawer);
