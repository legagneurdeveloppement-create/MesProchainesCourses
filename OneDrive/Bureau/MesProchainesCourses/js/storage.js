// Service de stockage avec localStorage
class StorageService {
    static STORAGE_KEY = 'shopping_lists';
    static SETTINGS_KEY = 'shopping_app_settings';

    // Config Supabase
    static SUPABASE_URL = 'https://kblokgpfwhbrnjhfdgfz.supabase.co';
    static SUPABASE_KEY = 'sb_publishable_vzT1mbWN4w_df6PUyx6dhA_1-WufLEW';
    static supabase = null;

    static initSupabase() {
        if (typeof supabase !== 'undefined' && !this.supabase) {
            this.supabase = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
        }
        return this.supabase;
    }

    // Récupérer les paramètres
    static getSettings() {
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            return data ? JSON.parse(data) : {
                showSubtotals: false,
                showPendingByStore: false,
                syncCode: '', // Code pour la synchro
                homeButtons: {
                    newList: true,
                    stats: true,
                    search: true
                }
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            return null;
        }
    }

    // Sauvegarder les paramètres
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return false;
        }
    }

    // Récupérer toutes les listes
    static getShoppingLists() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des listes:', error);
            return [];
        }
    }

    // Sauvegarder toutes les listes
    static saveShoppingLists(lists) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des listes:', error);
            return false;
        }
    }

    // Ajouter une nouvelle liste
    static addShoppingList(list) {
        const lists = this.getShoppingLists();
        lists.push(list);
        return this.saveShoppingLists(lists);
    }

    // Mettre à jour une liste existante
    static updateShoppingList(updatedList) {
        const lists = this.getShoppingLists();
        const index = lists.findIndex(list => list.id === updatedList.id);

        if (index !== -1) {
            lists[index] = updatedList;
            return this.saveShoppingLists(lists);
        }
        return false;
    }

    // Supprimer une liste
    static deleteShoppingList(listId) {
        const lists = this.getShoppingLists();
        const filteredLists = lists.filter(list => list.id !== listId);
        return this.saveShoppingLists(filteredLists);
    }

    // Obtenir une liste par ID
    static getShoppingListById(listId) {
        const lists = this.getShoppingLists();
        return lists.find(list => list.id === listId) || null;
    }

    // Vider toutes les données (pour les tests)
    static clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            return false;
        }
    }

    // Exporter les données
    static exportData() {
        const data = this.getShoppingLists();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `listes-courses-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Importer des données
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        this.saveShoppingLists(data);
                        resolve(true);
                    } else {
                        reject(new Error('Format de fichier invalide'));
                    }
                } catch (error) {
                    reject(new Error('Erreur lors de la lecture du fichier'));
                }
            };
            reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
            reader.readAsText(file);
        });
    }

    // Gestion de l'historique des articles
    static getItemHistory() {
        try {
            const data = localStorage.getItem('shopping_item_history');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return [];
        }
    }

    static saveItemHistory(history) {
        try {
            localStorage.setItem('shopping_item_history', JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
            return false;
        }
    }

    // --- SYNCHRONISATION SUPABASE ---

    // Envoyer les données vers le cloud
    static async pushToCloud(syncCode, lists) {
        try {
            this.initSupabase();
            if (!this.supabase || !syncCode) return false;

            const { data, error } = await this.supabase
                .from('shopping_lists_sync')
                .upsert({
                    sync_id: syncCode,
                    lists_data: lists,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'sync_id' });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur Push Supabase:', error);
            return false;
        }
    }

    // Récupérer les données depuis le cloud
    static async pullFromCloud(syncCode) {
        try {
            this.initSupabase();
            if (!this.supabase || !syncCode) return null;

            const { data, error } = await this.supabase
                .from('shopping_lists_sync')
                .select('lists_data')
                .eq('sync_id', syncCode)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = Pas de données trouvées
            return data ? data.lists_data : null;
        } catch (error) {
            console.error('Erreur Pull Supabase:', error);
            return null;
        }
    }
}
