/* ---------- Photos Gallery Modal ---------- */
/* ADD THIS TO THE END OF src/features/host/dashboard.js */

async function showPhotosModal(gameId) {
  // Fetch photo submissions for this game
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, display_name, content, created_at')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[showPhotosModal] Error fetching photos:', error);
    alert('Failed to load photos');
    return;
  }

  const photosHtml = submissions.length > 0 ? submissions.map((sub) => {
    const content = sub.content || {};
    const photoUrl = content.photo_url;
    const photoInfo = content.photo_info || '';
    const submittedBy = sub.display_name || 'Anonymous';
    const date = new Date(sub.created_at).toLocaleDateString();

    if (!photoUrl) return ''; // Skip if no photo

    return `
      <div style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:white;">
        <div style="aspect-ratio:1; overflow:hidden; background:#f3f4f6; display:flex; align-items:center; justify-content:center;">
          <img src="${escapeHtml(photoUrl)}" 
               alt="Baby photo from ${escapeHtml(submittedBy)}" 
               style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div style="padding:12px;">
          <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(submittedBy)}</div>
          ${photoInfo ? `<div style="font-size:13px; color:#6b7280; margin-bottom:4px;">${escapeHtml(photoInfo)}</div>` : ''}
          <div style="font-size:12px; color:#9ca3af;">${date}</div>
        </div>
      </div>
    `;
  }).filter(Boolean).join('') : '<p style="text-align:center; color:#9ca3af; padding:40px; grid-column:1/-1;">No photos submitted yet.</p>';

  const modalHtml = `
    <div class="modal-overlay" id="photosViewModal" style="z-index:9999;">
      <div class="modal" style="max-width:900px; max-height:85vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:sticky; top:0; background:white; padding-bottom:12px; border-bottom:1px solid #e5e7eb; z-index:10;">
          <h3 style="margin:0;">Baby Photo Gallery (${submissions.filter(s => s.content?.photo_url).length})</h3>
          <button class="modal-close" id="closePhotosView" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6b7280;">×</button>
        </div>
        <div style="color:#6b7280; margin-bottom:20px; font-size:14px;">
          All baby photos submitted by your guests. Can you guess who's who?
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:16px;">
          ${photosHtml}
        </div>
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e5e7eb;">
          <button class="primary" id="closePhotosViewBtn">Close</button>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add event listeners
  const modal = document.getElementById('photosViewModal');
  const closeBtn = document.getElementById('closePhotosView');
  const closeBtn2 = document.getElementById('closePhotosViewBtn');

  function closeModal() {
    modal.remove();
  }

  closeBtn?.addEventListener('click', closeModal);
  closeBtn2?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
