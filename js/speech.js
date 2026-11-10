/**
 * speech.js - Gestion de la reconnaissance vocale pour ajouter des tâches.
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const isSpeechRecognitionAvailable = Boolean(SpeechRecognition);
let recognition = null;
let isListening = false;

const createRecognition = () => {
    if (!isSpeechRecognitionAvailable) return null;

    const recog = new SpeechRecognition();
    recog.lang = 'fr-FR';
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    return recog;
};

const updateButtonState = (button) => {
    if (!button) return;

    if (isListening) {
        button.classList.add('listening');
        button.textContent = 'Arrêtez l\'écoute';
        button.setAttribute('aria-pressed', 'true');
    } else {
        button.classList.remove('listening');
        button.textContent = 'Parlez pour ajouter';
        button.setAttribute('aria-pressed', 'false');
    }
};

const startRecognition = (button) => {
    if (!recognition) return;

    try {
        recognition.start();
        isListening = true;
        updateButtonState(button);
    } catch (error) {
        console.error('Erreur démarrage reconnaissance vocale :', error);
        isListening = false;
        updateButtonState(button);
    }
};

const stopRecognition = (button) => {
    if (!recognition) return;

    recognition.stop();
    isListening = false;
    updateButtonState(button);
};

/**
 * Initialise la reconnaissance vocale et relie le bouton à l\'interface.
 * @param {Function} [callback] - Fonction appelée avec le texte transcrit.
 */
const initSpeechRecognition = (callback = null) => {
    const button = document.querySelector('#speech-button');
    const input = document.querySelector('#item-input');

    if (!button || !input) return;

    if (!isSpeechRecognitionAvailable) {
        button.disabled = true;
        button.textContent = 'Reconnaissance vocale non supportée';
        button.title = 'Votre navigateur ne prend pas en charge la reconnaissance vocale.';
        return;
    }

    recognition = createRecognition();
    if (!recognition) {
        button.disabled = true;
        button.textContent = 'Reconnaissance vocale indisponible';
        return;
    }

    updateButtonState(button);

    button.addEventListener('click', () => {
        if (isListening) {
            stopRecognition(button);
        } else {
            startRecognition(button);
        }
    });

    recognition.addEventListener('result', (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ')
            .trim();

        if (!transcript) return;

        if (typeof callback === 'function') {
            callback(transcript);
        } else {
            input.value = transcript;
            input.focus();
        }
    });

    recognition.addEventListener('end', () => {
        isListening = false;
        updateButtonState(button);
    });

    recognition.addEventListener('error', (event) => {
        console.error('Erreur reconnaissance vocale :', event.error);
        isListening = false;
        updateButtonState(button);

        if (event.error === 'no-speech') {
            button.textContent = 'Aucun son détecté';
            setTimeout(() => updateButtonState(button), 1500);
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            button.textContent = 'Microphone bloqué';
        } else {
            button.textContent = 'Erreur vocale';
            setTimeout(() => updateButtonState(button), 1500);
        }
    });
};

export {
    initSpeechRecognition,
    isSpeechRecognitionAvailable
};
