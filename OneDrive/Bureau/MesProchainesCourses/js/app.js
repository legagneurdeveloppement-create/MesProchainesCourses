// Application principale améliorée
class ShoppingListApp {
    constructor() {
        this.speechManager = null;
        this.currentList = null;
        this.lists = [];
        this.currentScreen = 'home';
        this.currentView = 'list'; // 'list' ou 'categories'
        this.currentSort = 'added';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.settings = {
            showSubtotals: false,
            showPendingByStore: false,
            homeButtons: {
                newList: true,
                stats: true,
                search: true
            }
        };

        // Configuration des catégories
        this.categories = {
            'fruits-legumes': {
                name: 'Fruits & Légumes',
                icon: 'fas fa-apple-alt',
                color: 'var(--category-fruits)',
                items: []
            },
            'viande-poisson': {
                name: 'Viande & Poisson',
                icon: 'fas fa-drumstick-bite',
                color: 'var(--category-viande)',
                items: []
            },
            'produits-laitiers': {
                name: 'Produits Laitiers',
                icon: 'fas fa-cheese',
                color: 'var(--category-laitiers)',
                items: []
            },
            'epicerie': {
                name: 'Épicerie',
                icon: 'fas fa-box',
                color: 'var(--category-epicerie)',
                items: []
            },
            'boulangerie': {
                name: 'Boulangerie',
                icon: 'fas fa-bread-slice',
                color: 'var(--category-boulangerie)',
                items: []
            },
            'boissons': {
                name: 'Boissons',
                icon: 'fas fa-wine-bottle',
                color: 'var(--category-boissons)',
                items: []
            },
            'hygiene': {
                name: 'Hygiène',
                icon: 'fas fa-soap',
                color: 'var(--category-hygiene)',
                items: []
            },
            'menage': {
                name: 'Ménage',
                icon: 'fas fa-broom',
                color: 'var(--category-menage)',
                items: []
            },
            'autres': {
                name: 'Autres',
                icon: 'fas fa-ellipsis-h',
                color: 'var(--category-autres)',
                items: []
            }
        };

        this.init();
    }

    // Initialisation de l'application
    async init() {
        console.log('Initialisation de l\'application...');
        this.loadData();
        this.loadSettings();
        this.loadItemHistory(); // Charger l'historique
        this.setupEventListeners();
        this.setupSpeechHandlers();
        this.setupSettingsHandlers();
        this.applySettings();
        this.registerServiceWorker();

        // Tenter une synchro au démarrage si un code existe
        if (this.settings.syncCode) {
            console.log('Tentative de synchronisation initiale...');
            const cloudLists = await StorageService.pullFromCloud(this.settings.syncCode);
            if (cloudLists) {
                this.lists = cloudLists;
                StorageService.saveShoppingLists(this.lists);
            }
        }

        this.showHomeScreen(); // Force l'affichage de l'accueil
        this.renderHomeScreen();

        // --- SYNCHRO AUTOMATIQUE ---
        // Vérifier les mises à jour toutes les 10 secondes si un code est configuré
        setInterval(async () => {
            if (this.settings.syncCode) {
                const cloudLists = await StorageService.pullFromCloud(this.settings.syncCode);
                if (cloudLists && JSON.stringify(cloudLists) !== JSON.stringify(this.lists)) {
                    console.log('Mise à jour Cloud détectée !');

                    // Garder en mémoire l'ID de la liste qu'on regarde
                    const currentId = this.currentList ? this.currentList.id : null;

                    this.lists = cloudLists;
                    StorageService.saveShoppingLists(this.lists);

                    // Si on regarde une liste, on la met à jour en direct
                    if (currentId) {
                        const updatedCurrent = this.lists.find(l => l.id === currentId);
                        if (updatedCurrent) {
                            this.currentList = updatedCurrent;
                            this.renderListDetail();
                        }
                    } else {
                        this.renderHomeScreen();
                    }
                }
            }
        }, 10000); // 10 secondes 

        console.log('Application initialisée avec succès');
    }

    // Charger l'historique des articles
    loadItemHistory() {
        this.itemHistory = StorageService.getItemHistory();
        // Si vide, initialiser avec quelques suggestions par défaut
        if (this.itemHistory.length === 0) {
            this.itemHistory = [
                { name: 'Lait', category: 'produits-laitiers', unit: 'L' },
                { name: 'Pain', category: 'boulangerie', unit: 'pièce' },
                { name: 'Œufs', category: 'produits-laitiers', unit: 'boîte' },
                { name: 'Beurre', category: 'produits-laitiers', unit: 'g' },
            ];
        }
    }

    // Charger les données depuis le stockage
    loadData() {
        this.lists = StorageService.getShoppingLists();
    }

    // Charger les paramètres
    loadSettings() {
        const savedSettings = StorageService.getSettings();
        if (savedSettings) {
            this.settings = savedSettings;
        }
    }

    // Appliquer les paramètres à l'interface
    applySettings() {
        // Appliquer les boutons de l'écran d'accueil
        const statsEl = document.querySelector('.stats-container');
        const searchEl = document.querySelector('.search-container');
        const newListBtn = document.getElementById('add-list-btn');

        if (statsEl) statsEl.style.display = this.settings.homeButtons.stats ? '' : 'none';
        if (searchEl) searchEl.style.display = this.settings.homeButtons.search ? '' : 'none';
        if (newListBtn) newListBtn.style.display = this.settings.homeButtons.newList ? '' : 'none';

        // Appliquer le rapport par magasin
        const storeReportContainer = document.getElementById('store-report-container');
        if (storeReportContainer) {
            if (this.settings.showPendingByStore && this.currentScreen === 'home') {
                storeReportContainer.classList.remove('hidden');
                this.renderStoreReport();
            } else {
                storeReportContainer.classList.add('hidden');
            }
        }

        // Mettre à jour les formulaires de paramètres
        const subtotalsCheckbox = document.getElementById('setting-subtotals');
        const storeReportCheckbox = document.getElementById('setting-store-report');
        const showStatsCheckbox = document.getElementById('setting-show-stats');
        const showSearchCheckbox = document.getElementById('setting-show-search');

        if (subtotalsCheckbox) subtotalsCheckbox.checked = this.settings.showSubtotals;
        if (storeReportCheckbox) storeReportCheckbox.checked = this.settings.showPendingByStore;
        if (showStatsCheckbox) showStatsCheckbox.checked = this.settings.homeButtons.stats;
        if (showSearchCheckbox) showSearchCheckbox.checked = this.settings.homeButtons.search;

        // Synchronisation
        const syncInput = document.getElementById('sync-code-input');
        if (syncInput) syncInput.value = this.settings.syncCode || '';
    }

    // Enregistrer le Service Worker pour la PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('Service Worker enregistré avec succès:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Échec de l\'enregistrement du Service Worker:', error);
                    });
            });
        }
    }

    // Sauvegarder les données
    async saveData() {
        StorageService.saveShoppingLists(this.lists);

        // Synchro auto si un code est configuré
        if (this.settings.syncCode) {
            console.log('Synchronisation automatique avec le cloud...');
            const success = await StorageService.pushToCloud(this.settings.syncCode, this.lists);
            if (!success) {
                this.showToast('❌ Échec de la synchro Cloud', 'error');
            }
        }
    }

    // Mettre à jour une liste dans le stockage
    async updateListInStorage() {
        const index = this.lists.findIndex(list => list.id === this.currentList.id);
        if (index !== -1) {
            this.lists[index] = this.currentList;
            await this.saveData();
        }
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        console.log('Configuration des événements...');

        try {
            // Boutons de navigation
            const addListBtn = document.getElementById('add-list-btn');
            if (addListBtn) addListBtn.addEventListener('click', () => this.showNewListModal());

            const backBtn = document.getElementById('back-btn');
            if (backBtn) backBtn.addEventListener('click', () => this.showHomeScreen());

            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) shareBtn.addEventListener('click', () => this.shareCurrentList());

            const printBtn = document.getElementById('print-btn');
            if (printBtn) printBtn.addEventListener('click', () => this.printList());

            // settings-btn (engrenage) ET open-settings-btn (sliders) => même action
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettingsScreen());

            const openSettingsBtn = document.getElementById('open-settings-btn');
            if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => this.showSettingsScreen());

            const settingsBackBtn = document.getElementById('settings-back-btn');
            if (settingsBackBtn) settingsBackBtn.addEventListener('click', () => this.showHomeScreen());

            // Boutons d'action (détail liste)
            const addItemBtn = document.getElementById('add-item-btn');
            if (addItemBtn) addItemBtn.addEventListener('click', () => this.showNewItemModal());

            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) voiceBtn.addEventListener('click', () => this.toggleVoiceInput());

            const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
            if (scanBarcodeBtn) scanBarcodeBtn.addEventListener('click', () => this.toggleScanner());

            const stopListeningBtn = document.getElementById('stop-listening');
            if (stopListeningBtn) stopListeningBtn.addEventListener('click', () => {
                if (this.speechManager) this.speechManager.stopListening();
            });

            const listSettingsBtn = document.getElementById('list-settings-btn');
            if (listSettingsBtn) listSettingsBtn.addEventListener('click', () => {
                this.showToast('Options de liste à venir...', 'info');
            });

            // Recherche
            const searchInput = document.getElementById('search-input');
            const clearSearch = document.getElementById('clear-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchLists(e.target.value);
                    if (clearSearch) clearSearch.classList.toggle('hidden', !e.target.value);
                });
            }
            if (clearSearch) {
                clearSearch.addEventListener('click', () => {
                    if (searchInput) searchInput.value = '';
                    this.searchLists('');
                    clearSearch.classList.add('hidden');
                });
            }

            // Filtres
            const filterAll = document.getElementById('filter-all');
            const filterActive = document.getElementById('filter-active');
            const filterCompleted = document.getElementById('filter-completed');
            [filterAll, filterActive, filterCompleted].forEach(btn => {
                if (!btn) return;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.filterLists(btn.id.replace('filter-', ''));
                });
            });

            // Sélection couleur
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            // Modales
            const createListBtn = document.getElementById('create-list-btn');
            if (createListBtn) createListBtn.addEventListener('click', () => this.createNewList());

            const cancelListBtn = document.getElementById('cancel-list-btn');
            if (cancelListBtn) cancelListBtn.addEventListener('click', () => this.hideModal('new-list-modal'));

            const addItemConfirmBtn = document.getElementById('add-item-confirm-btn');
            if (addItemConfirmBtn) addItemConfirmBtn.onclick = () => this.addNewItem();

            const cancelItemBtn = document.getElementById('cancel-item-btn');
            if (cancelItemBtn) cancelItemBtn.addEventListener('click', () => this.hideModal('new-item-modal'));

            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.confirmDeleteList());

            const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
            if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => this.hideModal('delete-modal'));

            // Entrée clavier
            const newListName = document.getElementById('new-list-name');
            if (newListName) newListName.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.createNewList(); });

            const newItemName = document.getElementById('new-item-name');
            if (newItemName) newItemName.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addNewItem(); });

            // Fermer les modales en cliquant à l'extérieur
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) this.hideModal(e.target.id);
            });

        } catch (error) {
            console.error('Erreur lors de la configuration des événements:', error);
        }
    }

    // Configuration des gestionnaires de reconnaissance vocale
    setupSpeechHandlers() {
        try {
            this.speechManager = new SpeechManager();
            this.speechManager.onListeningStateChange = (isListening) => {
                this.updateVoiceButton(isListening);
                this.updateListeningIndicator(isListening);
            };

            this.speechManager.onError = (error) => {
                this.showToast(`Erreur de reconnaissance vocale: ${error}`, 'error');
            };
        } catch (error) {
            console.warn('Reconnaissance vocale non disponible:', error);
        }
    }

    // Afficher l'écran d'accueil
    showHomeScreen() {
        this.currentScreen = 'home';
        this.currentList = null;
        this.showScreen('home-screen');
        this.applySettings();
        this.renderHomeScreen();
    }

    // Afficher l'écran des paramètres
    showSettingsScreen() {
        this.currentScreen = 'settings';
        this.showScreen('settings-screen');
    }

    // Afficher l'écran de détail d'une liste
    showListDetail(list) {
        this.currentScreen = 'detail';
        this.currentList = list;
        this.showScreen('list-detail-screen');
        this.renderListDetail();
    }

    // Afficher un écran spécifique
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Rendu de l'écran d'accueil
    renderHomeScreen() {
        const container = document.getElementById('lists-container');
        const emptyState = document.getElementById('empty-state');
        const filteredLists = this.getFilteredLists();

        if (filteredLists.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.innerHTML = filteredLists.map(list => this.renderListCard(list)).join('');
        }

        this.updateStatistics();
    }

    // Mettre à jour les statistiques
    updateStatistics() {
        const totalLists = this.lists.length;
        const totalItems = this.lists.reduce((sum, list) => sum + list.items.length, 0);

        const today = new Date().toDateString();
        const completedToday = this.lists.reduce((sum, list) => {
            return sum + list.items.filter(item => {
                if (item.completed && item.completedAt) {
                    return new Date(item.completedAt).toDateString() === today;
                }
                return false;
            }).length;
        }, 0);

        const totalListsEl = document.getElementById('total-lists');
        const totalItemsEl = document.getElementById('total-items');
        const completedTodayEl = document.getElementById('completed-today');

        if (totalListsEl) totalListsEl.textContent = totalLists;
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (completedTodayEl) completedTodayEl.textContent = completedToday;
    }

    // Rendu d'une carte de liste
    renderListCard(list) {
        const completedCount = list.items.filter(item => item.completed).length;
        const totalCount = list.items.length;
        const isCompleted = totalCount > 0 && completedCount === totalCount;
        const customColorStyle = !isCompleted && list.color ? `style="background: ${list.color}"` : '';

        return `
            <div class="list-card" onclick="app.showListDetail(${JSON.stringify(list).replace(/"/g, '&quot;')})">
                <div class="list-icon ${isCompleted ? 'completed' : 'pending'}" ${customColorStyle}>
                    <i class="fas ${isCompleted ? 'fa-check' : 'fa-shopping-cart'}"></i>
                </div>
                <div class="list-info">
                    <div class="list-name">${this.escapeHtml(list.name)}</div>
                    ${list.description ? `<div class="list-desc" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem;">${this.escapeHtml(list.description)}</div>` : ''}
                    <div class="list-count">${completedCount}/${totalCount} articles</div>
                </div>
                <div class="list-actions">
                    <button class="action-btn delete" onclick="event.stopPropagation(); app.showDeleteModal('${list.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Rendu de l'écran de détail
    renderListDetail() {
        if (!this.currentList) return;

        document.getElementById('list-title').textContent = this.currentList.name;
        const dateElement = document.getElementById('list-date');
        if (dateElement) {
            const date = new Date(this.currentList.updatedAt);
            dateElement.textContent = `Modifiée le ${date.toLocaleDateString('fr-FR')}`;
        }

        this.updateProgress();

        const container = document.getElementById('items-container');
        const categoriesContainer = document.getElementById('categories-view');
        const emptyState = document.getElementById('empty-list-state');

        if (this.currentList.items.length === 0) {
            container.innerHTML = '';
            categoriesContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');

            if (this.currentView === 'categories') {
                container.classList.add('hidden');
                categoriesContainer.classList.remove('hidden');
                categoriesContainer.innerHTML = this.renderCategoriesView();
            } else {
                categoriesContainer.classList.add('hidden');
                container.classList.remove('hidden');
                container.innerHTML = this.currentList.items.map(item => this.renderItemCard(item)).join('');
            }
        }
    }

    // Rendu d'une carte d'article
    renderItemCard(item) {
        const category = item.category || 'autres';
        const categoryInfo = this.categories[category];
        const quantity = item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : '';
        const price = item.price ? `${item.price.toFixed(2)}€` : '';

        return `
            <div class="item-card ${item.completed ? 'completed' : ''}" data-category="${category}">
                <div class="item-checkbox ${item.completed ? 'checked' : ''}" onclick="app.toggleItem('${item.id}')">
                    ${item.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="item-info">
                    <div class="item-name ${item.completed ? 'completed' : ''}">${this.escapeHtml(item.name)}</div>
                    <div class="item-details">
                        ${quantity ? `<span class="item-quantity">${this.escapeHtml(quantity)}</span>` : ''}
                        ${category ? `<span class="item-category">${this.escapeHtml(categoryInfo.name)}</span>` : ''}
                        ${price ? `<span class="item-price">${price}</span>` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-edit" onclick="app.editItem('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="item-delete" onclick="app.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Rendu par catégories
    renderCategoriesView() {
        if (!this.currentList) return;

        const itemsByCategory = {};
        Object.keys(this.categories).forEach(categoryKey => {
            itemsByCategory[categoryKey] = [];
        });

        this.currentList.items.forEach(item => {
            const category = item.category || 'autres';
            itemsByCategory[category].push(item);
        });

        let categoriesHtml = '';
        Object.keys(this.categories).forEach(categoryKey => {
            const items = itemsByCategory[categoryKey];
            if (items.length === 0) return;

            const category = this.categories[categoryKey];
            const completedCount = items.filter(item => item.completed).length;
            const totalCount = items.length;

            categoriesHtml += `
                <div class="category-section">
                    <div class="category-header">
                        <div class="category-title">
                            <div class="category-icon" style="background-color: ${category.color}">
                                <i class="${category.icon}"></i>
                            </div>
                            <span>${category.name}</span>
                        </div>
                        <div class="category-count">${completedCount}/${totalCount}</div>
                    </div>
                    <div class="category-items">
                        ${items.map(item => this.renderItemCard(item)).join('')}
                    </div>
                    ${this.settings.showSubtotals ? this.renderCategorySubtotal(items) : ''}
                </div>
            `;
        });

        return categoriesHtml;
    }

    // Rendu du sous-total d'une catégorie
    renderCategorySubtotal(items) {
        const total = items.reduce((sum, item) => {
            if (item.price && !item.completed) {
                return sum + (item.price * (item.quantity || 1));
            }
            return sum;
        }, 0);

        if (total === 0) return '';

        return `
            <div class="category-footer" style="padding: 0.5rem 1rem; border-top: 1px solid var(--border-light); text-align: right;">
                <span class="category-subtotal">Sous-total en attente: ${total.toFixed(2)}€</span>
            </div>
        `;
    }

    // Toggle entre vue liste et vue catégories
    toggleView() {
        this.currentView = this.currentView === 'list' ? 'categories' : 'list';
        this.renderListDetail();
    }

    // Trier les articles
    sortItems(sortType) {
        if (!this.currentList) return;

        this.currentSort = sortType;

        switch (sortType) {
            case 'name':
                this.currentList.items.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'category':
                this.currentList.items.sort((a, b) => {
                    const catA = this.categories[a.category || 'autres'].name;
                    const catB = this.categories[b.category || 'autres'].name;
                    return catA.localeCompare(catB);
                });
                break;
            case 'added':
                this.currentList.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'completed':
                this.currentList.items.sort((a, b) => a.completed - b.completed);
                break;
        }

        this.updateListInStorage();
        this.renderListDetail();
    }

    // Filtrer les listes
    filterLists(filterType) {
        this.currentFilter = filterType;
        this.renderHomeScreen();
    }

    // Rechercher dans les listes
    searchLists(query) {
        this.searchQuery = query.toLowerCase();
        this.renderHomeScreen();
    }

    // Obtenir les listes filtrées
    getFilteredLists() {
        let filteredLists = this.lists;

        switch (this.currentFilter) {
            case 'active':
                filteredLists = filteredLists.filter(list => {
                    const totalItems = list.items.length;
                    if (totalItems === 0) return true;
                    const completedItems = list.items.filter(item => item.completed).length;
                    return completedItems < totalItems;
                });
                break;
            case 'completed':
                filteredLists = filteredLists.filter(list => {
                    const totalItems = list.items.length;
                    if (totalItems === 0) return false;
                    const completedItems = list.items.filter(item => item.completed).length;
                    return completedItems === totalItems;
                });
                break;
        }

        if (this.searchQuery) {
            filteredLists = filteredLists.filter(list =>
                list.name.toLowerCase().includes(this.searchQuery) ||
                list.items.some(item => item.name.toLowerCase().includes(this.searchQuery))
            );
        }

        return filteredLists;
    }

    // Mettre à jour la barre de progression
    updateProgress() {
        if (!this.currentList) return;

        const completedCount = this.currentList.items.filter(item => item.completed).length;
        const totalCount = this.currentList.items.length;
        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${completedCount}/${totalCount}`;
    }

    // Modale de nouvelle liste
    showNewListModal() {
        document.getElementById('new-list-name').value = '';
        const descEl = document.getElementById('new-list-description');
        if (descEl) descEl.value = '';
        
        document.querySelectorAll('.color-option').forEach((opt, index) => {
            if (index === 0) opt.classList.add('active');
            else opt.classList.remove('active');
        });

        this.showModal('new-list-modal');
        setTimeout(() => {
            const input = document.getElementById('new-list-name');
            if(input) input.focus();
        }, 100);
    }

    // Créer une nouvelle liste
    createNewList() {
        const name = document.getElementById('new-list-name').value.trim();
        const descEl = document.getElementById('new-list-description');
        const description = descEl ? descEl.value.trim() : '';
        const activeColorOpt = document.querySelector('.color-option.active');
        const color = activeColorOpt ? activeColorOpt.dataset.color : '#4CAF50';

        if (!name) {
            this.showToast('Veuillez saisir un nom', 'error');
            return;
        }

        const newList = {
            id: Date.now().toString(),
            name: name,
            description: description,
            color: color,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.lists.push(newList);
        this.saveData();
        this.hideModal('new-list-modal');
        this.renderHomeScreen();
    }

    // Modale pour ajouter un article
    showNewItemModal() {
        if (!this.currentList) return;
        
        document.getElementById('new-item-name').value = '';
        const qtyEl = document.getElementById('new-item-quantity');
        if (qtyEl) qtyEl.value = '';
        const unitEl = document.getElementById('new-item-unit');
        if (unitEl) unitEl.value = '';
        const catEl = document.getElementById('new-item-category');
        if (catEl) catEl.value = '';
        const priceEl = document.getElementById('new-item-price');
        if (priceEl) priceEl.value = '';
        
        const storeEl = document.getElementById('new-item-store');
        if (storeEl) storeEl.value = '';

        const addBtn = document.getElementById('add-item-confirm-btn');
        if (addBtn) {
            addBtn.textContent = 'Ajouter';
            addBtn.onclick = () => this.addNewItem();
        }

        this.showModal('new-item-modal');
        setTimeout(() => {
            const input = document.getElementById('new-item-name');
            if (input) input.focus();
        }, 100);
    }

    // Ajouter un nouvel article
    addNewItem() {
        const name = document.getElementById('new-item-name').value.trim();
        const quantity = document.getElementById('new-item-quantity').value;
        const unit = document.getElementById('new-item-unit').value;
        const category = document.getElementById('new-item-category').value;
        const storeEl = document.getElementById('new-item-store');
        const store = storeEl ? storeEl.value.trim() : null;
        const price = document.getElementById('new-item-price').value;

        if (!name) {
            this.showToast('Veuillez saisir un nom', 'error');
            return;
        }

        if (!this.currentList) return;

        const newItem = {
            id: Date.now().toString(),
            name: name,
            quantity: quantity ? parseInt(quantity) : null,
            unit: unit || null,
            category: category || 'autres',
            store: store || null,
            price: price ? parseFloat(price) : null,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.currentList.items.push(newItem);
        this.currentList.updatedAt = new Date().toISOString();
        this.updateListInStorage();
        this.hideModal('new-item-modal');
        this.renderListDetail();
        this.showToast('Article ajouté !', 'success');
    }

    // Paramètres
    setupSettingsHandlers() {
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.settings.showSubtotals = document.getElementById('setting-subtotals').checked;
                this.settings.showPendingByStore = document.getElementById('setting-store-report').checked;
                const showStatsEl = document.getElementById('setting-show-stats');
                const showSearchEl = document.getElementById('setting-show-search');
                if (showStatsEl) this.settings.homeButtons.stats = showStatsEl.checked;
                if (showSearchEl) this.settings.homeButtons.search = showSearchEl.checked;
                this.settings.syncCode = document.getElementById('sync-code-input').value.trim();

                StorageService.saveSettings(this.settings);
                this.applySettings();
                this.showHomeScreen();
                this.showToast('Paramètres enregistrés !', 'success');
            });
        }
    }

    // Rapport par magasin
    renderStoreReport() {
        const storeReportList = document.getElementById('store-report-list');
        if (!storeReportList) return;

        const pendingByStore = {};
        this.lists.forEach(list => {
            list.items.forEach(item => {
                if (!item.completed) {
                    const store = item.store || 'Non spécifié';
                    pendingByStore[store] = (pendingByStore[store] || 0) + 1;
                }
            });
        });

        const stores = Object.keys(pendingByStore);
        if (stores.length === 0) {
            storeReportList.innerHTML = '<p>Aucun article en attente</p>';
            return;
        }

        storeReportList.innerHTML = stores.map(store => `
            <div class="store-report-item">
                <span class="store-name">${this.escapeHtml(store)}</span>
                <span class="store-count">${pendingByStore[store]} article(s)</span>
            </div>
        `).join('');
    }

    // Imprimer
    printList() {
        window.print();
    }

    // Toggle état
    toggleItem(itemId) {
        if (!this.currentList) return;

        const item = this.currentList.items.find(item => item.id === itemId);
        if (item) {
            item.completed = !item.completed;
            item.completedAt = item.completed ? new Date().toISOString() : null;
            this.currentList.updatedAt = new Date().toISOString();
            this.updateListInStorage();
            this.renderListDetail();
        }
    }

    // Supprimer
    deleteItem(itemId) {
        if (!this.currentList) return;

        this.currentList.items = this.currentList.items.filter(item => item.id !== itemId);
        this.currentList.updatedAt = new Date().toISOString();
        this.updateListInStorage();
        this.renderListDetail();
    }

    // Supprimer liste
    showDeleteModal(listId) {
        document.getElementById('confirm-delete-btn').dataset.listId = listId;
        this.showModal('delete-modal');
    }

    confirmDeleteList() {
        const listId = document.getElementById('confirm-delete-btn').dataset.listId;
        this.lists = this.lists.filter(list => list.id !== listId);
        this.saveData();
        this.hideModal('delete-modal');
        this.renderHomeScreen();
    }

    // Partage
    shareCurrentList() {
        if (!this.currentList) return;

        // Construire le texte de partage
        const date = new Date().toLocaleDateString('fr-FR');
        let text = `# ${this.escapeHtml(this.currentList.name)}\nDate: ${date}\n\n`;
        const pending = this.currentList.items.filter(i => !i.completed);
        const done = this.currentList.items.filter(i => i.completed);

        if (pending.length > 0) {
            text += `--- À acheter (${pending.length}) ---\n`;
            pending.forEach(item => {
                const qty = item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''} ` : '';
                text += `▢ ${qty}${item.name}\n`;
            });
        }
        if (done.length > 0) {
            text += `\n--- Déjà acheté (${done.length}) ---\n`;
            done.forEach(item => { text += `✓ ${item.name}\n`; });
        }

        const textarea = document.getElementById('share-text');
        if (textarea) textarea.value = text;
        this.showModal('share-modal');
    }

    // Copier le texte de partage
    copyShareText() {
        const textarea = document.getElementById('share-text');
        if (!textarea) return;
        textarea.select();
        try {
            navigator.clipboard.writeText(textarea.value)
                .then(() => this.showToast('Copié dans le presse-papier !', 'success'))
                .catch(() => { document.execCommand('copy'); this.showToast('Copié !', 'success'); });
        } catch (e) {
            document.execCommand('copy');
            this.showToast('Copié !', 'success');
        }
    }

    // Vocale
    toggleVoiceInput() {
        if (!this.speechManager || (this.speechManager.isSupported && !this.speechManager.isSupported())) {
            this.showToast('Reconnaissance vocale non supportée sur ce navigateur', 'error');
            return;
        }
        if (this.speechManager.isListening()) {
            this.speechManager.stopListening();
        } else {
            this.speechManager.startListening((result, isFinal) => {
                if (isFinal && result.trim()) {
                    this.addItemByVoice(result);
                }
            });
        }
    }

    addItemByVoice(text) {
        if (!text.trim()) return;
        if (!this.currentList) return;

        const newItem = {
            id: Date.now().toString(),
            name: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.currentList.items.push(newItem);
        this.currentList.updatedAt = new Date().toISOString();
        this.updateListInStorage();
        this.renderListDetail();
    }

    // Éditer un article
    editItem(itemId) {
        if (!this.currentList) return;
        const item = this.currentList.items.find(i => i.id === itemId);
        if (!item) return;

        // Pré-remplir la modale d'ajout
        document.getElementById('new-item-name').value = item.name;
        document.getElementById('new-item-quantity').value = item.quantity || '';
        document.getElementById('new-item-unit').value = item.unit || '';
        document.getElementById('new-item-category').value = item.category || '';
        document.getElementById('new-item-price').value = item.price || '';

        // Changer le bouton pour sauvegarder la modification
        const addBtn = document.getElementById('add-item-confirm-btn');
        addBtn.textContent = 'Modifier';
        addBtn.onclick = () => {
            item.name = document.getElementById('new-item-name').value.trim() || item.name;
            item.quantity = document.getElementById('new-item-quantity').value ? parseInt(document.getElementById('new-item-quantity').value) : null;
            item.unit = document.getElementById('new-item-unit').value || null;
            item.category = document.getElementById('new-item-category').value || 'autres';
            item.price = document.getElementById('new-item-price').value ? parseFloat(document.getElementById('new-item-price').value) : null;
            this.currentList.updatedAt = new Date().toISOString();
            this.updateListInStorage();
            this.hideModal('new-item-modal');
            addBtn.textContent = 'Ajouter';
            addBtn.onclick = () => this.addNewItem();
            this.renderListDetail();
            this.showToast('Article modifié !', 'success');
        };

        this.showModal('new-item-modal');
        document.getElementById('new-item-name').focus();
    }

    // Mettre à jour le bouton microphone
    updateVoiceButton(isListening) {
        const voiceBtn = document.getElementById('voice-btn');
        if (!voiceBtn) return;
        if (isListening) {
            voiceBtn.style.background = 'var(--danger-color)';
            voiceBtn.title = 'Arrêter l\'écoute';
        } else {
            voiceBtn.style.background = '';
            voiceBtn.title = 'Ajouter par la voix';
        }
    }

    // Afficher/masquer l'indicateur d'écoute
    updateListeningIndicator(isListening) {
        const indicator = document.getElementById('listening-indicator');
        if (!indicator) return;
        if (isListening) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    // Scanner Code-barres
    toggleScanner() {
        if (!window.Html5Qrcode) {
            this.showToast('Scanner de code-barres non chargé.', 'error');
            return;
        }
        const readerDiv = document.getElementById('reader');
        if (this.html5QrcodeScanner) {
            this.stopScanner();
        } else {
            readerDiv.style.display = 'block';
            this.html5QrcodeScanner = new Html5Qrcode("reader");
            this.html5QrcodeScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    this.onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Ignorer les erreurs frame par frame pour éviter le spam de console
                }
            ).catch(err => {
                this.showToast("Erreur d'accès à la caméra.", "error");
                readerDiv.style.display = 'none';
            });
        }
    }

    stopScanner() {
        if (this.html5QrcodeScanner) {
            this.html5QrcodeScanner.stop().then(() => {
                this.html5QrcodeScanner.clear();
                this.html5QrcodeScanner = null;
                document.getElementById('reader').style.display = 'none';
            }).catch(err => {
                console.error("Failed to stop scanner", err);
            });
        }
    }

    async onScanSuccess(decodedText, decodedResult) {
        this.stopScanner();
        this.showToast("Code scanné: " + decodedText, "info");
        document.getElementById('new-item-name').value = 'Recherche en cours...';
        
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
            const data = await response.json();
            
            if (data.status === 1) {
                const product = data.product;
                document.getElementById('new-item-name').value = product.product_name_fr || product.product_name || 'Produit inconnu';
                
                // Pré-sélection de catégorie si possible
                document.getElementById('new-item-category').value = 'epicerie'; // par défaut
                
                // Focaliser le champ de prix pour le remplir
                const priceInput = document.getElementById('new-item-price');
                if (priceInput) priceInput.focus();
                
                this.showToast("Produit trouvé !", "success");
            } else {
                document.getElementById('new-item-name').value = '';
                this.showToast("Produit introuvable dans la base OpenFoodFacts", "error");
            }
        } catch (error) {
            document.getElementById('new-item-name').value = '';
            this.showToast("Erreur lors de la recherche", "error");
        }
    }

    // Utilitaires
    showModal(modalId) {
        const el = document.getElementById(modalId);
        if (el) el.classList.remove('hidden');
    }
    hideModal(modalId) {
        if (modalId === 'new-item-modal' && this.html5QrcodeScanner) {
            this.stopScanner();
        }
        const el = document.getElementById(modalId);
        if (el) el.classList.add('hidden');
    }
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');
        if (!toast || !toastMsg) { console.log(message); return; }
        const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', info: 'fas fa-info-circle' };
        if (toastIcon) toastIcon.className = 'toast-icon ' + (icons[type] || icons.info);
        toastMsg.textContent = message;
        toast.className = 'toast toast-' + type;
        setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
    }
    escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ShoppingListApp();
    window.app = app;
});
