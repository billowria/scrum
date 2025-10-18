import { supabase } from '../supabaseClient';

export const notesService = {
  // Get all notes for a user
  async getAllNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  // Get a single note by ID
  async getNoteById(noteId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  },

  // Create a new note
  async createNote(noteData) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  },

  // Update an existing note
  async updateNote(noteId, updates) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  },

  // Delete a note
  async deleteNote(noteId) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },

  // Search notes
  async searchNotes(userId, query) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  },

  // Toggle pin status
  async togglePin(noteId, isPinned) {
    return this.updateNote(noteId, { is_pinned: isPinned });
  },

  // Get notes by category
  async getNotesByCategory(userId, category) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes by category:', error);
      return [];
    }
  },

  // Get unique categories for a user
  async getCategories(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('category')
        .eq('user_id', userId);

      if (error) throw error;
      
      const categories = [...new Set(data?.map(note => note.category) || [])];
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['General'];
    }
  },

  // Toggle favorite status
  async toggleFavorite(noteId, isFavorite) {
    try {
      const { data, error } = await supabase.rpc('toggle_note_favorite', {
        p_note_id: noteId,
        p_is_favorite: isFavorite
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  // Get favorite notes for a user
  async getFavoriteNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching favorite notes:', error);
      return [];
    }
  },

  // Share a note with users
  async shareNote(noteId, sharedWith, permission = 'read') {
    try {
      const results = [];
      
      for (const userId of sharedWith) {
        const { data, error } = await supabase.rpc('share_note_with_user', {
          p_note_id: noteId,
          p_shared_with: userId,
          p_permission: permission
        });

        if (error) {
          console.error(`Error sharing note with ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        } else {
          results.push({ userId, success: true, data });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sharing note:', error);
      return [];
    }
  },

  // Get notes shared with a user
  async getSharedNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          users:shared_by (id, name, email, avatar_url)
        `)
        .eq('is_shared', true)
        .contains('shared_with', [userId])
        .order('shared_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared notes:', error);
      return [];
    }
  },

  // Get personal notes (not shared) for a user
  async getPersonalNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_shared', false)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching personal notes:', error);
      return [];
    }
  },

  // Unshare a note with a specific user
  async unshareNote(noteId, userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          shared_with: supabase.sql`array_remove(shared_with, ${userId})`,
          is_shared: supabase.sql`(CASE WHEN array_length(shared_with, 1) = 1 THEN false ELSE is_shared END)`
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      // Remove from detailed tracking
      await supabase
        .from('note_shares')
        .delete()
        .eq('note_id', noteId)
        .eq('shared_with', userId);

      return data;
    } catch (error) {
      console.error('Error unsharing note:', error);
      return null;
    }
  },

  // Get team members for sharing
  async getTeamMembers(userId) {
    try {
      // First get user's team
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userData?.team_id) {
        return [];
      }

      // Get team members excluding the current user
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role')
        .eq('team_id', userData.team_id)
        .neq('id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  },

  // Get share history for a note
  async getShareHistory(noteId) {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .select(`
          *,
          sharer:shared_by (id, name, email),
          recipient:shared_with (id, name, email)
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching share history:', error);
      return [];
    }
  },

  // Update share permission
  async updateSharePermission(noteId, userId, permission) {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .update({ permission, updated_at: new Date().toISOString() })
        .eq('note_id', noteId)
        .eq('shared_with', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating share permission:', error);
      return null;
    }
  },

  // Get notes count by type
  async getNotesCounts(userId) {
    try {
      const [personal, shared, favorites] = await Promise.all([
        this.getPersonalNotes(userId),
        this.getSharedNotes(userId),
        this.getFavoriteNotes(userId)
      ]);

      return {
        personal: personal.length,
        shared: shared.length,
        favorites: favorites.length,
        total: personal.length + shared.length
      };
    } catch (error) {
      console.error('Error fetching notes counts:', error);
      return {
        personal: 0,
        shared: 0,
        favorites: 0,
        total: 0
      };
    }
  }
};
