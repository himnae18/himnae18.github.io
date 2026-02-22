/* =========================
   app-modal.js
   - 수정 모달(열기/닫기/저장)
========================= */

function closeEditModal() {
  document.getElementById("editModalOverlay")?.remove();
  document.getElementById("editModal")?.remove();
}

function openEditModal(index) {
  const s = songs[index];
  if (!s) return;

  closeEditModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "editModalOverlay";
  overlay.addEventListener("click", closeEditModal);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "editModal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const ytVal = s.ytUrl || (s.id ? `https://www.youtube.com/watch?v=${s.id}` : "");
  const lyricsVal = s.lyrics || "";
  const mrVal = s.mr || "";
  const scoreVal = s.score || "";

  modal.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">노래 수정</div>
      <button class="modal-close" id="editCloseBtn">닫기</button>
    </div>

    <div class="modal-body">
      <div class="modal-label">유튜브 링크</div>
      <input id="editYt" value="${escapeHTML(ytVal)}" placeholder="유튜브 링크">

      <div class="modal-label">가사</div>
      <textarea id="editLyrics" rows="10" placeholder="가사">${escapeHTML(lyricsVal)}</textarea>

      <div class="modal-label">MR 링크</div>
      <input id="editMr" value="${escapeHTML(mrVal)}" placeholder="MR 링크">

      <div class="modal-label">악보 링크</div>
      <input id="editScore" value="${escapeHTML(scoreVal)}" placeholder="악보 링크">
    </div>

    <div class="modal-actions">
      <button class="btn-ghost" id="editCancelBtn">취소</button>
      <button id="editSaveBtn">저장</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById("editCloseBtn")?.addEventListener("click", closeEditModal);
  document.getElementById("editCancelBtn")?.addEventListener("click", closeEditModal);

  document.getElementById("editSaveBtn")?.addEventListener("click", async () => {
    const newYtUrl = safeLink(document.getElementById("editYt")?.value);
    const newLyrics = safeText(document.getElementById("editLyrics")?.value);
    const newMr = safeLink(document.getElementById("editMr")?.value);
    const newScore = safeLink(document.getElementById("editScore")?.value);

    if (newYtUrl) {
      const id = extractID(newYtUrl);
      if (!id) {
        alert("유튜브 링크가 올바르지 않아! (watch?v= 또는 youtu.be 링크로 넣어봐)");
        return;
      }
      s.ytUrl = newYtUrl;
      s.id = id;

      const meta = await fetchYouTubeMeta(newYtUrl);
      s.title = meta.title;
      s.author = meta.author;
    }

    s.lyrics = newLyrics;
    s.mr = newMr;
    s.score = newScore;

    save();
    closeEditModal();
    showList();

    if (index === current) {
      updateLyricsDrawer();
      updateControlLabels();
    }
  });
}

/* DOMContentLoaded (수정 버튼 연결 + ESC 닫기) */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnEdit")?.addEventListener("click", () => {
    if (!songs[current]) return alert("먼저 노래를 하나 재생해줘!");
    openEditModal(current);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });
});
