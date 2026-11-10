/**
 * app.js - Logique principale de l'application Liste de Courses/Tâches.
 * Ce fichier est le cerveau qui connecte le stockage des données, la gestion du DOM et les capacités vocales.
 */

// Importation des modules nécessaires
import {
  getTasksFromStorage,
  addTask,
  updateTaskStatus,
  deleteTask,
} from "./storage.js";
import {
  initSpeechRecognition,
  isSpeechRecognitionAvailable,
} from "./speech.js";

class ShoppingListApp {
  /**
   * Constructeur de l'application : Initialise les références DOM et charge les tâches.
   */
  constructor() {
    this.tasks = []; // État interne des tâches (la source de vérité)
    this.setupDOMReferences();

    // 1. Initialisation de la reconnaissance vocale si supportée par le navigateur
    if (isSpeechRecognitionAvailable) {
      initSpeechRecognition(this.handleSpeechInput);
    } else {
      console.warn(
        "Attention : Le navigateur ne supporte pas la reconnaissance vocale.",
      );
      this.speechButton.disabled = true;
      this.speechButton.textContent = "Non supporté";
    }

    // 2. Chargement et rendu initial des tâches depuis le localStorage
    this.loadTasks();
  }

  /**
   * Sélectionne et stocke les références clés des éléments DOM pour une manipulation facile.
   */
  setupDOMReferences() {
    this.taskList = document.getElementById("task-list"); // Conteneur principal des tâches
    this.itemInput = document.querySelector("#item-input"); // Champ de texte du nouvel article
    this.dateInput = document.querySelector("#due-date"); // Champ de date limite
    this.addButton = document.querySelector("#add-button"); // Bouton d'ajout principal
    this.speechButton = document.querySelector("#speech-button"); // Bouton voix
    this.modalContainer = document.getElementById("shopping-list-modal"); // Modale (si utilisée)
  }

  /**
   * Charge les tâches depuis le localStorage, met à jour l'état interne et rafraîchit l'interface.
   */
  loadTasks() {
    this.tasks = getTasksFromStorage();
    this._updateUI(this.tasks); // Utilise la fonction privée pour le rendu

    // Afficher un message de succès lors du chargement
    this.showToast("Liste des courses chargée avec succès.", "success");
  }

  /**
   * Gère l'ajout d'une nouvelle tâche via le formulaire.
   * @param {Event} e - L'événement de soumission du formulaire (preventDefault).
   */
  handleNewTask = (e) => {
    e.preventDefault();

    const text = this.itemInput ? this.itemInput.value.trim() : "";
    let dueDate = this.dateInput ? this.dateInput.value : null;

    if (!text) {
      this.showToast("Veuillez entrer une description de tâche.", "error");
      return;
    }

    const newTaskData = { text, dueDate };

    try {
      // 1. Création dans le stockage (utilise storage.js - Retourne le tableau mis à jour)
      const updatedTasks = addTask(newTaskData);

      // 2. Mise à jour de l'état et du DOM
      this.tasks = updatedTasks;
      this._updateUI(updatedTasks); // Re-rend tout avec les nouvelles données

      // 3. Nettoyage après succès
      this.itemInput.value = "";
      this.dateInput.value = "";
      this.showToast(`Tâche ajoutée : ${text}`, "success");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
      this.showToast(
        "Impossible d'ajouter la tâche. Vérifiez le stockage.",
        "error",
      );
    }
  };

  /**
   * Gère le texte provenant de la reconnaissance vocale.
   * Ce callback est passé à `initSpeechRecognition`.
   * @param {string} transcript - Le texte transcrit par l'utilisateur.
   */
  handleSpeechInput = (transcript) => {
    // Placer simplement le texte dans le champ pour que l'utilisateur puisse valider et vérifier la date.
    this.itemInput.value = transcript;
    this.showToast(
      "Texte dicté. Veuillez confirmer ou modifier les détails.",
      "info",
    );
  };

  /**
   * Gère l'action sur une tâche (compléter, supprimer).
   * @param {Event} e - L'événement cliqué dans le conteneur des tâches.
   */
  handleTaskAction = (e) => {
    const target = e.target;

    // 1. Action de complétion/décomplétion (Checkbox)
    if (target.classList.contains("task-checkbox")) {
      const taskId = target.dataset.taskId;
      // L'état passé au module storage doit être l'inverse du nouvel état pour appeler updateTaskStatus correctement
      const isCompleted = target.checked;
      this.tasks = this._toggleCompletion(taskId, isCompleted);
    }
    // 2. Action de suppression (Delete Button)
    else if (target.classList.contains("delete-button")) {
      const taskId = target.dataset.taskId;
      if (
        confirm(
          "🚨 Êtes-vous sûr de vouloir supprimer cette tâche définitivement ?",
        )
      ) {
        this.tasks = this._deleteTaskInternal(taskId);
      }
    }
  };

  /* ****************** FONCTIONS PRIVÉES DE GESTION D'ÉTAT ******************/

  /**
   * Met à jour l'état des tâches après le changement de complétion d'une tâche spécifique.
   * @param {string} taskId - L'ID de la tâche modifiée.
   * @param {boolean} isCompleted - Le nouvel état (true si complété, false sinon).
   */
  _toggleCompletion(taskId, isCompleted) {
    // Utilisation du module storage pour garantir l'intégrité des données
    const updatedTasks = updateTaskStatus(taskId, isCompleted);
    this.showToast(
      `Statut de la tâche "${updatedTasks.find((t) => t.id === taskId)?.text || "..."}" mis à jour.`,
      "info",
    );
    return updatedTasks;
  }

  /**
   * Supprime une tâche en interne et met à jour l'état des tâches.
   * @param {string} taskId - L'ID de la tâche à supprimer.
   * @returns {Array} Le tableau des tâches sans l'élément supprimé.
   */
  _deleteTaskInternal(taskId) {
    // 1. Supprime dans le stockage via module storage.js (pour nettoyer et générer un nouvel array)
    const updatedTasks = deleteTask(taskId);

    // 2. Met à jour l'état interne
    this.tasks = updatedTasks;

    // 3. Réaffiche l'interface sans la tâche supprimée
    this._updateUI(updatedTasks);
    this.showToast("Tâche supprimée avec succès.", "warning");
    return updatedTasks;
  }

  /* ****************** FONCTIONS DE RENDU ET D'INTERFACE (READ) ******************/

  /**
   * Génère et injecte tout le HTML des tâches dans le conteneur DOM.
   * Cette fonction est appelée chaque fois que l'état interne `this.tasks` change.
   * @param {Array} tasksToRender - Le tableau de tâches à afficher.
   */
  _updateUI(tasksToRender) {
    // 1. Vider le conteneur actuel pour éviter les doublons
    this.taskList.innerHTML = "";

    // 2. Itérer sur chaque tâche et générer le HTML
    tasksToRender.forEach((task) => {
      const taskElement = this._createTaskElement(task);
      this.taskList.appendChild(taskElement);
    });
  }

  /**
   * Crée l'élément DOM complet pour une seule tâche.
   * @param {Object} task - L'objet tâche (id, text, completed, dueDate).
   * @returns {HTMLElement} Le conteneur de la tâche prêt à être affiché.
   */
  _createTaskElement(task) {
    // Création du conteneur principal pour l'accessibilité et le clic délégué
    const listItem = document.createElement("div");
    listItem.className = "task-item";
    listItem.dataset.taskId = task.id;

    // Détermination de la classe CSS basée sur l'état (complété/non complété)
    if (task.completed) {
      listItem.classList.add("completed");
    }

    const innerHTML = `
            <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? "checked" : ""}>
            <div class="task-details">
                <span class="task-text">${task.text}</span>
                ${task.dueDate ? `<span class="due-date">🗓️ Due: ${new Date(task.dueDate).toLocaleDateString("fr-FR")}</span>` : ""}
            </div>
            <button class="delete-button" data-task-id="${task.id}">🗑️</button>
        `;

    listItem.innerHTML = innerHTML;
    return listItem;
  }

  /**
   * Affiche une notification temporaire à l'utilisateur (Toast).
   * @param {string} message - Le contenu du message.
   * @param {'success'|'error'|'info'|'warning'} type - La couleur/catégorie du message.
   */
  showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Suppression automatique après 3 secondes
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Attacher les écouteurs d'événements au lancement de l'application.
   */
  init() {
    // Écouteur pour la soumission du formulaire principal (ajout)
    this.addButton.addEventListener("click", this.handleNewTask);
    this.itemInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleNewTask(e);
      }
    });

    // Délégation d'événements pour les actions sur la liste de tâches (complétion, suppression)
    this.taskList.addEventListener("click", this.handleTaskAction);
  }
}
