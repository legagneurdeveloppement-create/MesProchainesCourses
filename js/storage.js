/**
 * storage.js - Gestion des données du ToDo List via LocalStorage.
 */

const STORAGE_KEY = "todoListTasks";

/**
 * Récupère la liste des tâches depuis le localStorage.
 * @returns {Array} Liste d'objets tâches. Retourne un tableau vide si aucune donnée n'est trouvée.
 */
export const getTasksFromStorage = () => {
  try {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    return tasksJSON ? JSON.parse(tasksJSON) : [];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tâches depuis le localStorage:",
      error,
    );
    return [];
  }
};

/**
 * Sauvegarde la liste complète des tâches dans le localStorage.
 * @param {Array} tasks - Le tableau de tâches à sauvegarder.
 */
export const saveTasksToStorage = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des tâches dans le localStorage:",
      error,
    );
    alert(
      "Erreur de stockage : Votre navigateur pourrait avoir atteint sa limite de mémoire locale.",
    );
  }
};

/**
 * Met à jour le statut d'une tâche.
 * @param {string} taskId - L'ID unique de la tâche.
 * @param {boolean} isCompleted - Le nouveau statut (true/false).
 */
export const updateTaskStatus = (taskId, isCompleted) => {
  const tasks = getTasksFromStorage();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex].completed = isCompleted;
    saveTasksToStorage(tasks);
  }
};

/**
 * Supprime une tâche du stockage et de la liste affichée.
 * @param {string} taskId - L'ID unique de la tâche à supprimer.
 */
export const deleteTask = (taskId) => {
  const tasks = getTasksFromStorage();
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  saveTasksToStorage(updatedTasks);
  return updatedTasks; // Retourne les tâches mises à jour pour l'affichage immédiat.
};

/**
 * Ajoute une nouvelle tâche et sauvegarde la liste mise à jour.
 * @param {Object} newTaskData - Les données de la nouvelle tâche (texte, date).
 * @returns {Array} Le tableau de tâches mis à jour.
 */
export const addTask = (newTaskData) => {
  const tasks = getTasksFromStorage();
  const newTask = {
    id: Date.now().toString(), // Utilisation du timestamp comme ID unique simple
    text: newTaskData.text,
    dueDate: newTaskData.dueDate || null,
    completed: false,
  };

  tasks.push(newTask);
  saveTasksToStorage(tasks);
  return [...tasks]; // Retourne un nouveau tableau des tâches mises à jour.
};
