// filepath: /Users/vajihkhan/Development/party/src/features/guest/home.js
export async function initGuestHome(user){
  console.log('[guest-home] Initializing', { userId: user?.id });
  
  // Wait a moment for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 0));

  // Defensive: ensure header role badge reflects Guest when guest home initializes
  try {
    const rb = document.getElementById('roleBadge');
    if (!rb) {
      console.warn('[guest-home] Role badge element not found');
      return;
    }

    rb.textContent = 'Guest';
    rb.dataset.role = 'guest';
    rb.setAttribute('data-role','guest');
    rb.setAttribute('aria-pressed','false');
    console.log('[guest-home] Role badge updated successfully');
  } catch(e) {
    console.error('[guest-home] Error updating role badge:', e);
  }
}

export default initGuestHome;
