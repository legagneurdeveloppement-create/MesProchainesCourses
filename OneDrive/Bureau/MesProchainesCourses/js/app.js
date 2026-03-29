class ShoppingListApp { 
    constructor() { 
        this.speechManager = null; 
        this.currentList = null; 
        this.lists = []; 
        this.currentScreen = 'home'; 
        this.currentView = 'list'; 
        this.currentSort = 'added'; 
        this.currentFilter = 'all'; 
        this.searchQuery = ''; 
        this.settings = { 
            showSubtotals: false, 
            showPendingByStore: false, 
            homeButtons: { newList: true, stats: true, search: true } 
        }; 
        this.categories = { 
            'fruits-legumes': { name: 'Fruits & Légumes', icon: 'fas fa-apple-alt', color: 'var(--category-fruits)', items: [] }, 
            'viande-poisson': { name: 'Viande & Poisson', icon: 'fas fa-drumstick-bite', color: 'var(--category-viande)', items: [] }, 
            'produits-laitiers': { name: 'Produits Laitiers', icon: 'fas fa-cheese', color: 'var(--category-laitiers)', items: [] }, 
            'epicerie': { name: 'Épicerie', icon: 'fas fa-box', color: 'var(--category-epicerie)', items: [] }, 
            'boulangerie': { name: 'Boulangerie', icon: 'fas fa-bread-slice', color: 'var(--category-boulangerie)', items: [] }, 
            'boissons': { name: 'Boissons', icon: 'fas fa-wine-bottle', color: 'var(--category-boissons)', items: [] }, 
            'hygiene': { name: 'Hygiène', icon: 'fas fa-soap', color: 'var(--category-hygiene)', items: [] }, 
            'menage': { name: 'Ménage', icon: 'fas fa-broom', color: 'var(--category-menage)', items: [] }, 
            'autres': { name: 'Autres', icon: 'fas fa-ellipsis-h', color: 'var(--category-autres)', items: [] } 
        }; 
        this.init(); 
    } 

    async init() { 
        this.loadData(); 
        this.loadSettings(); 
        this.loadItemHistory(); 
        this.setupEventListeners(); 
        this.setupSpeechHandlers(); 
        this.setupSettingsHandlers(); 
        this.applySettings(); 
        this.registerServiceWorker(); 
        if (this.settings.syncCode) { 
            const cloudLists = await StorageService.pullFromCloud(this.settings.syncCode); 
            if (cloudLists) { 
                this.lists = cloudLists; 
                StorageService.saveShoppingLists(this.lists); 
            } 
        } 
        this.showHomeScreen(); 
        this.renderHomeScreen(); 
        setInterval(async () => { 
            if (this.settings.syncCode) { 
                const cloudLists = await StorageService.pullFromCloud(this.settings.syncCode); 
                if (cloudLists && JSON.stringify(cloudLists) !== JSON.stringify(this.lists)) { 
                    const currentId = this.currentList ? this.currentList.id : null; 
                    this.lists = cloudLists; 
                    StorageService.saveShoppingLists(this.lists); 
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
        }, 10000); 
    } 

    loadItemHistory() { 
        this.itemHistory = StorageService.getItemHistory(); 
        if (this.itemHistory.length === 0) { 
            this.itemHistory = [{ name: 'Lait', category: 'produits-laitiers', unit: 'L' }, { name: 'Pain', category: 'boulangerie', unit: 'pièce' }, { name: 'Œufs', category: 'produits-laitiers', unit: 'boîte' }, { name: 'Beurre', category: 'produits-laitiers', unit: 'g' }]; 
        } 
    } 

    loadData() { this.lists = StorageService.getShoppingLists(); } 
    loadSettings() { const savedSettings = StorageService.getSettings(); if (savedSettings) this.settings = savedSettings; } 
    
    applySettings() { 
        const statsEl = document.querySelector('.stats-container'); 
        const searchEl = document.querySelector('.search-container'); 
        const newListBtn = document.getElementById('add-list-btn'); 
        if (statsEl) statsEl.style.display = this.settings.homeButtons.stats ? '' : 'none'; 
        if (searchEl) searchEl.style.display = this.settings.homeButtons.search ? '' : 'none'; 
        if (newListBtn) newListBtn.style.display = this.settings.homeButtons.newList ? '' : 'none'; 
        const storeReportContainer = document.getElementById('store-report-container'); 
        if (storeReportContainer) { 
            if (this.settings.showPendingByStore && this.currentScreen === 'home') { 
                storeReportContainer.classList.remove('hidden'); 
                this.renderStoreReport(); 
            } else { 
                storeReportContainer.classList.add('hidden'); 
            } 
        } 
        const subtotalsCheckbox = document.getElementById('setting-subtotals'); 
        const storeReportCheckbox = document.getElementById('setting-store-report'); 
        const showStatsCheckbox = document.getElementById('setting-show-stats'); 
        const showSearchCheckbox = document.getElementById('setting-show-search'); 
        if (subtotalsCheckbox) subtotalsCheckbox.checked = this.settings.showSubtotals; 
        if (storeReportCheckbox) storeReportCheckbox.checked = this.settings.showPendingByStore; 
        if (showStatsCheckbox) showStatsCheckbox.checked = this.settings.homeButtons.stats; 
        if (showSearchCheckbox) showSearchCheckbox.checked = this.settings.homeButtons.search; 
        const syncInput = document.getElementById('sync-code-input'); if (syncInput) syncInput.value = this.settings.syncCode || ''; 
    } 

    registerServiceWorker() { 
        if ('serviceWorker' in navigator) { 
            window.addEventListener('load', () => { 
                navigator.serviceWorker.register('sw.js').then(reg => console.log('SW ok')).catch(err => console.log('SW fail')); 
            }); 
        } 
    } 

    async saveData() { 
        StorageService.saveShoppingLists(this.lists); 
        if (this.settings.syncCode) await StorageService.pushToCloud(this.settings.syncCode, this.lists); 
    } 

    async updateListInStorage() { 
        const index = this.lists.findIndex(list => list.id === this.currentList.id); 
        if (index !== -1) { 
            this.lists[index] = this.currentList; 
            await this.saveData(); 
        } 
    } 

    setupEventListeners() { 
        try { 
            document.getElementById('add-list-btn').addEventListener('click', () => this.showNewListModal()); 
            document.getElementById('back-btn').addEventListener('click', () => this.showHomeScreen()); 
            document.getElementById('share-btn').addEventListener('click', () => this.shareCurrentList()); 
            document.getElementById('print-btn').addEventListener('click', () => this.printList()); 
            document.getElementById('open-settings-btn').addEventListener('click', () => this.showSettingsScreen()); 
            document.getElementById('settings-back-btn').addEventListener('click', () => this.showHomeScreen()); 
            document.getElementById('add-item-btn').addEventListener('click', () => this.showNewItemModal()); 
            document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceInput()); 
            document.getElementById('create-list-btn').addEventListener('click', () => this.createNewList()); 
            document.getElementById('cancel-list-btn').addEventListener('click', () => this.hideModal('new-list-modal')); 
            document.getElementById('add-item-confirm-btn').addEventListener('click', () => this.addNewItem()); 
            document.getElementById('cancel-item-btn').addEventListener('click', () => this.hideModal('new-item-modal')); 
            document.getElementById('confirm-delete-btn').addEventListener('click', () => this.confirmDeleteList()); 
            document.getElementById('cancel-delete-btn').addEventListener('click', () => this.hideModal('delete-modal')); 
            document.getElementById('new-list-name').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.createNewList(); }); 
            document.getElementById('new-item-name').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addNewItem(); }); 
            document.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) this.hideModal(e.target.id); }); 
        } catch (error) { console.error(error); } 
    } 

    setupSpeechHandlers() { 
        try { 
            this.speechManager = new SpeechManager(); 
            this.speechManager.onListeningStateChange = (isListening) => { 
                this.updateVoiceButton(isListening); 
                this.updateListeningIndicator(isListening); 
            }; 
            this.speechManager.onError = (error) => this.showToast(error, 'error'); 
        } catch (error) { console.warn(error); } 
    } 

    showHomeScreen() { 
        this.currentScreen = 'home'; 
        this.currentList = null; 
        this.showScreen('home-screen'); 
        this.applySettings(); 
        this.renderHomeScreen(); 
    } 

    showSettingsScreen() { 
        this.currentScreen = 'settings'; 
        this.showScreen('settings-screen'); 
    } 

    showListDetail(list) { 
        this.currentScreen = 'detail'; 
        this.currentList = list; 
        this.showScreen('list-detail-screen'); 
        this.renderListDetail(); 
    } 

    showScreen(screenId) { 
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active')); 
        document.getElementById(screenId).classList.add('active'); 
    } 

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

    updateStatistics() { 
        const totalLists = this.lists.length; 
        const totalItems = this.lists.reduce((sum, list) => sum + list.items.length, 0); 
        const today = new Date().toDateString(); 
        const completedToday = this.lists.reduce((sum, list) => { 
            return sum + list.items.filter(item => item.completed && item.completedAt && new Date(item.completedAt).toDateString() === today).length; 
        }, 0); 
        document.getElementById('total-lists').textContent = totalLists; 
        document.getElementById('total-items').textContent = totalItems; 
        document.getElementById('completed-today').textContent = completedToday; 
    } 

    renderListCard(list) { 
        const completedCount = list.items.filter(item => item.completed).length; 
        const totalCount = list.items.length; 
        const isCompleted = totalCount > 0 && completedCount === totalCount; 
        return `<div class="list-card" onclick="app.showListDetail(${JSON.stringify(list).replace(/"/g, '&quot;')})"><div class="list-icon ${isCompleted ? 'completed' : 'pending'}"><i class="fas ${isCompleted ? 'fa-check' : 'fa-shopping-cart'}"></i></div><div class="list-info"><div class="list-name">${this.escapeHtml(list.name)}</div><div class="list-count">${completedCount}/${totalCount} articles</div></div><div class="list-actions"><button class="action-btn delete" onclick="event.stopPropagation(); app.showDeleteModal('${list.id}')"><i class="fas fa-trash"></i></button></div></div>`; 
    } 

    renderListDetail() { 
        if (!this.currentList) return; 
        document.getElementById('list-title').textContent = this.currentList.name; 
        const date = new Date(this.currentList.updatedAt); 
        if (document.getElementById('list-date')) document.getElementById('list-date').textContent = `Modifiée le ${date.toLocaleDateString('fr-FR')}`; 
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

    renderItemCard(item) { 
        const category = item.category || 'autres'; 
        const categoryInfo = this.categories[category]; 
        const quantity = item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''; 
        const price = item.price ? `${item.price.toFixed(2)}€` : ''; 
        return `<div class="item-card ${item.completed ? 'completed' : ''}" data-category="${category}"><div class="item-checkbox ${item.completed ? 'checked' : ''}" onclick="app.toggleItem('${item.id}')">${item.completed ? '<i class="fas fa-check"></i>' : ''}</div><div class="item-info"><div class="item-name ${item.completed ? 'completed' : ''}">${this.escapeHtml(item.name)}</div><div class="item-details">${quantity ? `<span class="item-quantity">${this.escapeHtml(quantity)}</span>` : ''}${category ? `<span class="item-category">${this.escapeHtml(categoryInfo.name)}</span>` : ''}${price ? `<span class="item-price">${price}</span>` : ''}</div></div><div class="item-actions"><button class="item-edit" onclick="app.editItem('${item.id}')"><i class="fas fa-edit"></i></button><button class="item-delete" onclick="app.deleteItem('${item.id}')"><i class="fas fa-trash"></i></button></div></div>`; 
    } 

    renderCategoriesView() { 
        if (!this.currentList) return; 
        const itemsByCategory = {}; 
        Object.keys(this.categories).forEach(k => itemsByCategory[k] = []); 
        this.currentList.items.forEach(item => itemsByCategory[item.category || 'autres'].push(item)); 
        let html = ''; 
        Object.keys(this.categories).forEach(k => { 
            const items = itemsByCategory[k]; if (items.length === 0) return; 
            const cat = this.categories[k]; 
            html += `<div class="category-section"><div class="category-header"><div class="category-title"><div class="category-icon" style="background-color: ${cat.color}"><i class="${cat.icon}"></i></div><span>${cat.name}</span></div><div class="category-count">${items.filter(i => i.completed).length}/${items.length}</div></div><div class="category-items">${items.map(i => this.renderItemCard(i)).join('')}</div>${this.settings.showSubtotals ? this.renderCategorySubtotal(items) : ''}</div>`; 
        }); 
        return html; 
    } 

    renderCategorySubtotal(items) { 
        const total = items.reduce((sum, item) => item.price && !item.completed ? sum + (item.price * (item.quantity || 1)) : sum, 0); 
        if (total === 0) return ''; 
        return `<div class="category-footer" style="padding: 0.5rem 1rem; border-top: 1px solid var(--border-light); text-align: right;"><span class="category-subtotal">Sous-total en attente: ${total.toFixed(2)}€</span></div>`; 
    } 

    toggleView() { 
        this.currentView = this.currentView === 'list' ? 'categories' : 'list'; 
        this.renderListDetail(); 
        const toggleBtn = document.getElementById('toggle-view'); 
        if (toggleBtn) { 
            const icon = toggleBtn.querySelector('i'); 
            icon.className = this.currentView === 'categories' ? 'fas fa-list' : 'fas fa-th-list'; 
        } 
    } 

    sortItems(sortType) { 
        if (!this.currentList) return; 
        this.currentSort = sortType; 
        switch (sortType) { 
            case 'name': this.currentList.items.sort((a, b) => a.name.localeCompare(b.name)); break; 
            case 'category': this.currentList.items.sort((a, b) => this.categories[a.category || 'autres'].name.localeCompare(this.categories[b.category || 'autres'].name)); break; 
            case 'added': this.currentList.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break; 
            case 'completed': this.currentList.items.sort((a, b) => a.completed - b.completed); break; 
        } 
        this.updateListInStorage(); 
        this.renderListDetail(); 
    } 

    filterLists(filterType) { 
        this.currentFilter = filterType; 
        this.renderHomeScreen(); 
    } 

    searchLists(query) { 
        this.searchQuery = query.toLowerCase(); 
        this.renderHomeScreen(); 
    } 

    getFilteredLists() { 
        let lists = this.lists; 
        switch (this.currentFilter) { 
            case 'active': lists = lists.filter(l => l.items.length === 0 || l.items.some(i => !i.completed)); break; 
            case 'completed': lists = lists.filter(l => l.items.length > 0 && l.items.every(i => i.completed)); break; 
        } 
        if (this.searchQuery) lists = lists.filter(l => l.name.toLowerCase().includes(this.searchQuery) || l.items.some(i => i.name.toLowerCase().includes(this.searchQuery))); 
        return lists; 
    } 

    updateProgress() { 
        if (!this.currentList) return; 
        const done = this.currentList.items.filter(i => i.completed).length; 
        const total = this.currentList.items.length; 
        document.getElementById('progress-fill').style.width = `${total > 0 ? (done / total) * 100 : 0}%`; 
        document.getElementById('progress-text').textContent = `${done}/${total}`; 
    } 

    showNewListModal() { 
        document.getElementById('new-list-name').value = ''; 
        this.showModal('new-list-modal'); 
        document.getElementById('new-list-name').focus(); 
    } 

    createNewList() { 
        const name = document.getElementById('new-list-name').value.trim(); 
        if (!name) { this.showToast('Veuillez saisir un nom', 'error'); return; } 
        const newList = { id: Date.now().toString(), name: name, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; 
        this.lists.push(newList); 
        this.saveData(); 
        this.hideModal('new-list-modal'); 
        this.renderHomeScreen(); 
    } 

    showNewItemModal() { 
        document.getElementById('new-item-name').value = ''; 
        this.showModal('new-item-modal'); 
        document.getElementById('new-item-name').focus(); 
    } 

    addNewItem() { 
        const name = document.getElementById('new-item-name').value.trim(); 
        if (!name) return; 
        const newItem = { 
            id: Date.now().toString(), 
            name: name, 
            quantity: document.getElementById('new-item-quantity').value || null, 
            unit: document.getElementById('new-item-unit').value || null, 
            category: document.getElementById('new-item-category').value || 'autres', 
            store: document.getElementById('new-item-store').value.trim() || null, 
            price: document.getElementById('new-item-price').value || null, 
            notes: document.getElementById('new-item-notes').value.trim() || null, 
            completed: false, 
            createdAt: new Date().toISOString() 
        }; 
        this.currentList.items.push(newItem); 
        this.currentList.updatedAt = new Date().toISOString(); 
        this.updateListInStorage(); 
        this.hideModal('new-item-modal'); 
        this.renderListDetail(); 
    } 

    setupSettingsHandlers() { 
        document.getElementById('save-settings-btn').addEventListener('click', () => { 
            this.settings.showSubtotals = document.getElementById('setting-subtotals').checked; 
            this.settings.showPendingByStore = document.getElementById('setting-store-report').checked; 
            this.settings.homeButtons.stats = document.getElementById('setting-show-stats').checked; 
            this.settings.homeButtons.search = document.getElementById('setting-show-search').checked; 
            this.settings.syncCode = document.getElementById('sync-code-input').value.trim(); 
            StorageService.saveSettings(this.settings); 
            this.applySettings(); 
            this.showHomeScreen(); 
        }); 
    } 

    renderStoreReport() { 
        const pendingByStore = {}; 
        this.lists.forEach(l => l.items.forEach(i => { if (!i.completed) pendingByStore[i.store || 'Non spécifié'] = (pendingByStore[i.store || 'Non spécifié'] || 0) + 1; })); 
        const stores = Object.keys(pendingByStore); 
        document.getElementById('store-report-list').innerHTML = stores.map(s => `<div class="store-report-item"><span class="store-name">${this.escapeHtml(s)}</span><span class="store-count">${pendingByStore[s]} en attente</span></div>`).join(''); 
    } 

    printList() { window.print(); } 
    
    toggleItem(itemId) { 
        const item = this.currentList.items.find(i => i.id === itemId); 
        if (item) { 
            item.completed = !item.completed; 
            item.completedAt = item.completed ? new Date().toISOString() : null; 
            this.currentList.updatedAt = new Date().toISOString(); 
            this.updateListInStorage(); 
            this.renderListDetail(); 
        } 
    } 

    deleteItem(itemId) { 
        this.currentList.items = this.currentList.items.filter(i => i.id !== itemId); 
        this.currentList.updatedAt = new Date().toISOString(); 
        this.updateListInStorage(); 
        this.renderListDetail(); 
    } 

    showDeleteModal(listId) { 
        document.getElementById('confirm-delete-btn').dataset.listId = listId; 
        this.showModal('delete-modal'); 
    } 

    confirmDeleteList() { 
        const id = document.getElementById('confirm-delete-btn').dataset.listId; 
        this.lists = this.lists.filter(l => l.id !== id); 
        this.saveData(); 
        this.hideModal('delete-modal'); 
        this.renderHomeScreen(); 
    } 

    toggleVoiceInput() { 
        if (this.speechManager.isListening()) this.speechManager.stopListening(); 
        else this.speechManager.startListening((res, done) => { if (done) this.addItemByVoice(res); }); 
    } 

    showModal(id) { document.getElementById(id).classList.remove('hidden'); } 
    hideModal(id) { document.getElementById(id).classList.add('hidden'); } 
    showToast(msg, type) { console.log(msg); } 
    escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; } 
} 

let app; 
document.addEventListener('DOMContentLoaded', () => { app = new ShoppingListApp(); window.app = app; });
