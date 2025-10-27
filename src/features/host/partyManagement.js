// Party Management functionality
import { supabase } from '../../services/supabaseClient.js';
import { toast } from '../../ui/toast.js';

export async function editParty(partyId, updates) {
    if (!partyId || !updates) return { error: { message: 'Missing party ID or updates' } };

    // Validate required fields
    if (updates.title && updates.title.trim().length === 0) {
        return { error: { message: 'Title cannot be empty' } };
    }

    const { data, error } = await supabase
        .from('parties')
        .update(updates)
        .eq('id', partyId)
        .select()
        .single();

    if (error) {
        console.error('Edit party error:', error);
        return { error };
    }

    toast.success('Party updated successfully');
    return { data };
}

export async function cancelParty(partyId) {
    if (!partyId) return { error: { message: 'Missing party ID' } };

    const { data, error } = await supabase
        .from('parties')
        .update({ status: 'cancelled' })
        .eq('id', partyId)
        .select()
        .single();

    if (error) {
        console.error('Cancel party error:', error);
        return { error };
    }

    // Close all active games for this party
    await supabase
        .from('games')
        .update({ status: 'closed' })
        .eq('party_id', partyId);

    toast.success('Party cancelled successfully');
    return { data };
}

export async function editGame(gameId, updates) {
    if (!gameId || !updates) return { error: { message: 'Missing game ID or updates' } };

    const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

    if (error) {
        console.error('Edit game error:', error);
        return { error };
    }

    toast.success('Game updated successfully');
    return { data };
}

export function setupPartyEditHandlers() {
    // Edit party form handlers
    const editForm = document.getElementById('editPartyForm');
    const editFormWrapper = document.getElementById('partyEditForm');
    const cancelEditBtn = document.getElementById('cancelEditParty');

    if (!editForm || !editFormWrapper || !cancelEditBtn) return;

    // Handle cancel edit
    cancelEditBtn.addEventListener('click', () => {
        editFormWrapper.hidden = true;
        editForm.reset();
    });

    // Handle form submit
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const partyId = editForm.dataset.partyId;
        if (!partyId) return;

        const formData = new FormData(editForm);
        const updates = {
            title: formData.get('title'),
            date: formData.get('date') ? new Date(formData.get('date')).toISOString() : null,
            venue: formData.get('venue') || null,
            description: formData.get('description') || null,
            expected_guests: formData.get('expected_guests') ? Number(formData.get('expected_guests')) : null
        };

        const { error } = await editParty(partyId, updates);
        if (error) {
            toast.error(`Failed to update party: ${error.message}`);
            return;
        }

        editFormWrapper.hidden = true;
        editForm.reset();
        // Trigger refresh of parties list
        window.dispatchEvent(new CustomEvent('party-updated'));
    });
}

export function loadPartyIntoEditForm(party) {
    const editForm = document.getElementById('editPartyForm');
    const editFormWrapper = document.getElementById('partyEditForm');
    
    if (!editForm || !editFormWrapper || !party) return;

    editForm.dataset.partyId = party.id;
    const fields = {
        title: document.getElementById('editPartyTitle'),
        date: document.getElementById('editPartyDate'),
        venue: document.getElementById('editPartyVenue'),
        description: document.getElementById('editPartyDesc'),
        expected_guests: document.getElementById('editPartyExpected')
    };

    // Populate form fields
    if (fields.title) fields.title.value = party.title || '';
    if (fields.date) fields.date.value = party.date ? new Date(party.date).toISOString().slice(0,16) : '';
    if (fields.venue) fields.venue.value = party.venue || '';
    if (fields.description) fields.description.value = party.description || '';
    if (fields.expected_guests) fields.expected_guests.value = party.expected_guests || '';

    editFormWrapper.hidden = false;
}