// js/app-state.js - 저장소/공통 유틸
(() => {
  const storeKey = document.body?.dataset?.store || "jaBright";

  // 예전 jp 이름으로 저장된 데이터가 있으면 새 ja 이름으로 자동 이사
  const legacyMap = {
    jaBright: "jpBright",
    jaMid: "jpMid",
    jaDark: "jpDark"
  };

  function readStorage(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key)) || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  const legacyKey = legacyMap[storeKey];
  if (legacyKey && !localStorage.getItem(storeKey) && localStorage.getItem(legacyKey)) {
    localStorage.setItem(storeKey, localStorage.getItem(legacyKey));
  }

  let songs = readStorage(storeKey);
  let current = 0;
  let dragIndex = null;

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(songs));
    if (typeof updateDrawerCounts === "function") updateDrawerCounts();
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
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function extractID(url) {
    if (!url) return "";

    try {
      const u = new URL(url);
      const v = u.searchParams.get("v");
      if (v) return v;

      if (u.hostname.includes("youtu.be")) {
        return u.pathname.split("/").filter(Boolean)[0] || "";
      }

      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      const embedIndex = parts.indexOf("embed");

      if (shortsIndex !== -1 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
      if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    } catch {
      const text = String(url);
      const match =
        text.match(/[?&]v=([^&]+)/) ||
        text.match(/youtu\.be\/([^?&]+)/) ||
        text.match(/youtube\.com\/shorts\/([^?&]+)/) ||
        text.match(/youtube\.com\/embed\/([^?&]+)/);
      return match ? match[1] : "";
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

  window.AppState = {
    get storeKey() { return storeKey; },
    get songs() { return songs; },
    set songs(v) { songs = Array.isArray(v) ? v : []; },
    get current() { return current; },
    set current(v) { current = Number.isFinite(Number(v)) ? Number(v) : 0; },
    get dragIndex() { return dragIndex; },
    set dragIndex(v) { dragIndex = v; },
    save,
    safeText,
    safeLink,
    escapeHTML,
    extractID,
    fetchYouTubeMeta
  };
})();

// 기존 전역 함수 방식도 계속 동작하게 연결
(() => {
  const S = window.AppState;
  if (!S) return;

  ["songs", "current", "dragIndex"].forEach((key) => {
    Object.defineProperty(window, key, {
      get: () => S[key],
      set: (v) => (S[key] = v),
      configurable: true
    });
  });

  ["save", "safeText", "safeLink", "escapeHTML", "extractID", "fetchYouTubeMeta"]
    .forEach((fn) => (window[fn] = S[fn]));
})();


// =========================
// 전체 저장 / 불러오기 기능
// =========================
(() => {
  const BACKUP_KEYS = [
    { key: "jaBright", label: "일본 밝은 노래" },
    { key: "jaMid", label: "일본 중간 분위기" },
    { key: "jaDark", label: "일본 어두운 노래" },
    { key: "cnBright", label: "중국 밝은 노래" },
    { key: "cnMid", label: "중국 중간 분위기" },
    { key: "cnDark", label: "중국 어두운 노래" }
  ];

  const LEGACY_IMPORT_KEYS = {
    jpBright: "jaBright",
    jpMid: "jaMid",
    jpDark: "jaDark"
  };

  function readArrayFromStorage(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key)) || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function cleanSong(song) {
    if (!song || typeof song !== "object") return null;
    const ytUrl = String(song.ytUrl || song.url || "").trim();
    const id = String(song.id || (typeof extractID === "function" ? extractID(ytUrl) : "")).trim();
    const title = String(song.title || "제목 없음").trim() || "제목 없음";
    return {
      title,
      author: String(song.author || "").trim(),
      ytUrl,
      id,
      lyrics: String(song.lyrics || "").trim(),
      mr: String(song.mr || "").trim(),
      score: String(song.score || "").trim()
    };
  }

  function cleanSongArray(value) {
    if (!Array.isArray(value)) return [];
    return value.map(cleanSong).filter(Boolean);
  }

  function makeBackupData() {
    const stores = {};
    BACKUP_KEYS.forEach(({ key }) => {
      stores[key] = cleanSongArray(readArrayFromStorage(key));
    });

    return {
      app: "my-music-library",
      version: 2,
      exportedAt: new Date().toISOString(),
      stores
    };
  }

  function downloadBackup() {
    const data = makeBackupData();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const filename = `music-library-backup-${yyyy}${mm}${dd}-${hh}${mi}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function normalizeImportData(data) {
    const result = {};

    // 최신 백업 형식: { stores: { jaBright: [...], ... } }
    if (data && typeof data === "object" && data.stores && typeof data.stores === "object") {
      Object.entries(data.stores).forEach(([key, value]) => {
        const finalKey = LEGACY_IMPORT_KEYS[key] || key;
        if (BACKUP_KEYS.some((item) => item.key === finalKey)) {
          result[finalKey] = cleanSongArray(value);
        }
      });
      return result;
    }

    // 예전 형식: { jaBright: [...], cnBright: [...] }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      Object.entries(data).forEach(([key, value]) => {
        const finalKey = LEGACY_IMPORT_KEYS[key] || key;
        if (BACKUP_KEYS.some((item) => item.key === finalKey)) {
          result[finalKey] = cleanSongArray(value);
        }
      });
      if (Object.keys(result).length > 0) return result;
    }

    // 아주 예전 형식: 배열 하나만 들어있는 경우 → 현재 페이지 목록으로만 불러오기
    if (Array.isArray(data)) {
      const pageKey = document.body?.dataset?.store;
      if (pageKey && BACKUP_KEYS.some((item) => item.key === pageKey)) {
        result[pageKey] = cleanSongArray(data);
      }
    }

    return result;
  }

  function countImportSongs(stores) {
    return Object.values(stores).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  }

  function applyImportedStores(stores) {
    Object.entries(stores).forEach(([key, arr]) => {
      localStorage.setItem(key, JSON.stringify(cleanSongArray(arr)));
    });

    const pageKey = document.body?.dataset?.store;
    if (window.AppState && pageKey && stores[pageKey]) {
      window.AppState.songs = cleanSongArray(stores[pageKey]);
      window.AppState.current = 0;
      if (typeof showList === "function") showList();
      if (typeof updateLyricsDrawer === "function") updateLyricsDrawer();
      if (typeof updateControlLabels === "function") updateControlLabels();
    }

    if (typeof updateDrawerCounts === "function") updateDrawerCounts();
  }

  function openImportFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ""));
          const stores = normalizeImportData(data);
          const total = countImportSongs(stores);

          if (Object.keys(stores).length === 0) {
            alert("불러올 수 있는 노래 백업 파일이 아니야.");
            return;
          }

          const names = Object.keys(stores).map((key) => {
            const found = BACKUP_KEYS.find((item) => item.key === key);
            return `${found ? found.label : key} ${stores[key].length}곡`;
          }).join("\n");

          const ok = confirm(`이 백업 파일을 불러올까?\n\n총 ${total}곡\n${names}\n\n현재 저장된 목록은 백업 내용으로 바뀌어.`);
          if (!ok) return;

          applyImportedStores(stores);
          alert("불러오기 완료! 목록이 복원됐어.");
        } catch {
          alert("파일을 읽을 수 없어. 저장 버튼으로 받은 JSON 파일인지 확인해줘.");
        }
      };
      reader.readAsText(file, "utf-8");
    });

    input.click();
  }

  function createBackupButtons() {
    if (document.getElementById("backupTools")) return;

    const box = document.createElement("div");
    box.id = "backupTools";
    box.className = "backup-tools";
    box.innerHTML = `
      <button id="exportBackupBtn" class="backup-btn" type="button">💾 저장</button>
      <button id="importBackupBtn" class="backup-btn" type="button">📂 불러오기</button>
      <p class="backup-help">저장은 JSON 파일로 다운로드되고, 불러오기는 그 파일을 다시 넣는 방식이야.</p>
    `;

    const mainContent = document.getElementById("mainContent");
    const h1 = mainContent?.querySelector("h1") || document.querySelector("h1");
    if (h1) h1.insertAdjacentElement("afterend", box);
    else document.body.insertAdjacentElement("afterbegin", box);

    document.getElementById("exportBackupBtn")?.addEventListener("click", downloadBackup);
    document.getElementById("importBackupBtn")?.addEventListener("click", openImportFilePicker);
  }

  document.addEventListener("DOMContentLoaded", createBackupButtons);

  window.downloadMusicLibraryBackup = downloadBackup;
  window.openMusicLibraryBackup = openImportFilePicker;
})();
