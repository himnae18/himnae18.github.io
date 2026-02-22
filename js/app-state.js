// js/app-state.js
(() => {
  // body에 data-store가 있으면 그 값 사용, 없으면 기본 "jpBright"
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

  // 유튜브 URL에서 영상 ID 뽑기 (watch?v=, youtu.be, shorts, embed 지원)
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
      // URL 생성 실패(문자열이 애매한 경우) 대비
      if (String(url).includes("v=")) return String(url).split("v=")[1]?.split("&")[0] || "";
    }
    return "";
  }

  // oEmbed로 제목/채널명 가져오기(실패 시 기본값)
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

  // ✅ 충돌 방지 네임스페이스 (권장: 앞으로는 AppState로 접근)
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

/* =========================
   ✅ (호환용) 기존 전역 코드(app-ui/app-player)도 동작하게 브리지
   - songs/current/dragIndex는 getter/setter로 AppState와 연결
   - 유틸/저장 함수는 전역으로 바로 노출
========================= */
(() => {
  const S = window.AppState;
  if (!S) return;

  // 상태 3개는 AppState와 동기화되게 연결
  const bind = (key) => {
    Object.defineProperty(window, key, {
      get: () => S[key],
      set: (v) => (S[key] = v),
      configurable: true,
    });
  };
  bind("songs");
  bind("current");
  bind("dragIndex");

  // 함수들은 전역으로 바로 연결
  ["save", "safeText", "safeLink", "escapeHTML", "extractID", "fetchYouTubeMeta"]
    .forEach((fn) => (window[fn] = S[fn]));
})();
