/* =========================
   app-state.js
   - songs 저장/로드 + 유틸 + 유튜브 메타
========================= */

// ✅ 저장 키 (body data-store가 있으면 그걸 사용)
const STORE_KEY = document.body?.dataset?.store || "jpBright";

/* 저장/상태 */
let songs = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
let current = 0;
let dragIndex = null;

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(songs));
}

/* 유틸 */
function safeText(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}
function safeLink(url) {
  if (!url) return "";
  return String(url).trim();
}
function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* ✅ 유튜브 링크에서 영상 ID 뽑기 */
function extractID(url) {
  if (!url) return "";
  try {
    const u = new URL(url);

    const v = u.searchParams.get("v");
    if (v) return v;

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }

    const parts = u.pathname.split("/").filter(Boolean);
    const shortsIndex = parts.indexOf("shorts");
    const embedIndex = parts.indexOf("embed");
    if (shortsIndex !== -1 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1];
  } catch (e) {
    if (String(url).includes("v=")) return String(url).split("v=")[1]?.split("&")[0] || "";
  }
  return "";
}

/* ✅ oEmbed로 제목/채널 가져오기 (API키 필요 없음) */
async function fetchYouTubeMeta(ytUrl) {
  try {
    const api = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(ytUrl);
    const res = await fetch(api);
    if (!res.ok) throw new Error("oEmbed 실패");
    const data = await res.json();
    return {
      title: data.title || "제목 없음",
      author: data.author_name || ""
    };
  } catch {
    return { title: "제목 없음", author: "" };
  }
}

// js/app-state.js
(() => {
  const storeKey = document.body?.dataset?.store || "jpBright";

  let songs = JSON.parse(localStorage.getItem(storeKey)) || [];
  let current = 0;
  let dragIndex = null;

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(songs));
  }

  function safeText(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim();
  }
  function safeLink(url) {
    if (!url) return "";
    return String(url).trim();
  }
  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function extractID(url) {
    if (!url) return "";
    try {
      const u = new URL(url);

      const v = u.searchParams.get("v");
      if (v) return v;

      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "");
      }

      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      const embedIndex = parts.indexOf("embed");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
      if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    } catch (e) {
      if (String(url).includes("v=")) return String(url).split("v=")[1]?.split("&")[0] || "";
    }
    return "";
  }

  async function fetchYouTubeMeta(ytUrl) {
    try {
      const api = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(ytUrl);
      const res = await fetch(api);
      if (!res.ok) throw new Error("oEmbed 실패");
      const data = await res.json();
      return {
        title: data.title || "제목 없음",
        author: data.author_name || ""
      };
    } catch {
      return { title: "제목 없음", author: "" };
    }
  }

  // 전역으로 노출 (충돌 방지용 네임스페이스)
  window.AppState = {
    get storeKey() { return storeKey; },

    get songs() { return songs; },
    set songs(v) { songs = v; },

    get current() { return current; },
    set current(v) { current = v; },

    get dragIndex() { return dragIndex; },
    set dragIndex(v) { dragIndex = v; },

    save,
    safeText,
    safeLink,
    escapeHTML,
    extractID,
    fetchYouTubeMeta,
  };
})();
