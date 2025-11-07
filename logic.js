// --- Constantes ---
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GAME_DURATION = 30; // en secondes

// --- Variables d'état ---
let currentLetter = "-";
let timer = GAME_DURATION;
let timerId = null;
let gameInProgress = false;
let wordsEntered = new Set();
let score = 0;
let isCheckingWord = false; // Pour éviter les soumissions multiples
let selectedLang = "fr"; // NOUVEAU: Langue sélectionnée

// --- Éléments du DOM ---
const letterDisplay = document.getElementById("letterDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const messageDisplay = document.getElementById("messageDisplay");
const wordInput = document.getElementById("wordInput");
const startButton = document.getElementById("startButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const wordList = document.getElementById("wordList");
const langSelector = document.getElementById("langSelector"); // NOUVEAU
const langRadios = document.querySelectorAll('input[name="language"]'); // NOUVEAU

// --- Fonctions du jeu ---

/**
 * Initialise l'état du jeu au chargement
 */
function initGame() {
	timer = GAME_DURATION;
	timerDisplay.textContent = timer;
	timerDisplay.classList.remove("text-red-500");
	timerDisplay.classList.add("text-cyan-400");

	letterDisplay.textContent = "-";
	scoreDisplay.textContent = "0";
	wordList.innerHTML = "";

	wordInput.disabled = true;
	wordInput.value = "";

	startButton.disabled = false;
	startButton.textContent = "Commencer la partie";

	messageDisplay.textContent = 'Appuyez sur "Commencer" !';

	gameInProgress = false;
	wordsEntered.clear();
	score = 0;
	isCheckingWord = false;

	// NOUVEAU: Activer les boutons radio
	langRadios.forEach((radio) => (radio.disabled = false));

	if (timerId) {
		clearInterval(timerId);
		timerId = null;
	}
}

/**
 * Démarre une nouvelle partie
 */
function startGame() {
	initGame(); // Réinitialise tout au cas où

	gameInProgress = true;
	startButton.disabled = true;
	startButton.textContent = "En cours...";

	wordInput.disabled = false;
	wordInput.focus(); // Met le focus sur le champ de saisie

	// NOUVEAU: Désactiver les boutons radio
	langRadios.forEach((radio) => (radio.disabled = true));

	// Choisir une lettre aléatoire
	currentLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
	letterDisplay.textContent = currentLetter;

	messageDisplay.textContent = `Trouvez des mots commençant par "${currentLetter}"`;

	// Démarrer le minuteur
	timerId = setInterval(updateTimer, 1000);
}

/**
 * Met à jour le minuteur chaque seconde
 */
function updateTimer() {
	timer--;
	timerDisplay.textContent = timer;

	if (timer <= 10) {
		// Change la couleur en rouge quand le temps est bas
		timerDisplay.classList.remove("text-cyan-400");
		timerDisplay.classList.add("text-red-500");
	}

	if (timer <= 0) {
		endGame();
	}
}

/**
 * Termine la partie
 */
function endGame() {
	clearInterval(timerId);
	timerId = null;
	gameInProgress = false;
	isCheckingWord = false;

	wordInput.disabled = true;
	startButton.disabled = false;
	startButton.textContent = "Rejouer ?";

	// NOUVEAU: Activer les boutons radio
	langRadios.forEach((radio) => (radio.disabled = false));

	messageDisplay.textContent = `Temps écoulé ! Score final : ${score}`;
	letterDisplay.textContent = "🏁";
}

/**
 * Ajoute un mot validé à la liste visuelle
 * @param {string} word
 */
function addWordToList(word) {
	// Ajouter le mot à la liste
	const wordElement = document.createElement("span");
	wordElement.className =
		"bg-cyan-700 text-cyan-100 text-sm font-medium px-3 py-1 rounded-full";
	wordElement.textContent = word; // On reçoit déjà le mot en minuscule
	wordList.appendChild(wordElement);

	// Scroller en bas de la liste
	wordList.scrollTop = wordList.scrollHeight;
}

/**
 * Gère la saisie des mots
 * @param {KeyboardEvent} event
 */
async function handleWordInput(event) {
	if (event.key !== "Enter" || !gameInProgress || isCheckingWord) {
		return;
	}

	const wordRaw = wordInput.value.trim();
	const wordUpper = wordRaw.toUpperCase();
	const wordLower = wordRaw.toLowerCase();

	if (!wordRaw) {
		return; // Ne rien faire si le champ est vide
	}

	// --- Vérifications locales d'abord ---
	if (!wordUpper.startsWith(currentLetter.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
		flashInputError();
		messageDisplay.textContent = `"${wordRaw}" ne commence pas par "${currentLetter}" !`;
		wordInput.value = ""; // Vider le champ si erreur
		return;
	}

	if (wordsEntered.has(wordUpper)) {
		flashInputError();
		messageDisplay.textContent = `"${wordRaw}" a déjà été trouvé !`;
		wordInput.value = ""; // Vider le champ si erreur
		return;
	}

	// --- Vérification API ---
	isCheckingWord = true;
	wordInput.disabled = true;
	messageDisplay.textContent = `Vérification de "${wordRaw}"...`;
	wordInput.value = ""; // Vider le champ

	try {
		// NOUVEAU: Déterminer l'hôte de l'API en fonction de la langue
		const apiHost =
			selectedLang === "fr" ? "fr.wiktionary.org" : "en.wiktionary.org";

		// On utilise l'hôte dynamique dans l'URL
		const response = await fetch(
			`https://${apiHost}/w/api.php?action=query&titles=${wordLower}&format=json&origin=*`,
		);

		if (!response.ok) {
			throw new Error("Réponse réseau du Wiktionnaire non OK");
		}

		const data = await response.json();

		// On vérifie la structure de la réponse du Wiktionnaire.
		// Si la page a un ID de "-1", cela signifie qu'elle n'existe pas ("missing").
		const pages = data.query.pages;
		const pageId = Object.keys(pages)[0]; // Il n'y a qu'une seule page dans la réponse

		if (pageId !== "-1") {
			// Mot valide et trouvé !
			wordsEntered.add(wordUpper);
			score++;
			scoreDisplay.textContent = score;
			addWordToList(wordLower); // Utilise la nouvelle fonction
			messageDisplay.textContent = `Bien joué ! +1`;
		} else {
			// Mot non trouvé (pageid === "-1")
			flashInputError();
			messageDisplay.textContent = `"${wordRaw}" n'est pas un mot valide !`;
		}
	} catch (error) {
		console.error("Erreur lors de l'appel API:", error);
		messageDisplay.textContent = "Impossible de contacter le dictionnaire.";
		// On pourrait choisir d'accepter le mot si l'API est en panne
		// Mais pour l'instant, on le refuse.
	} finally {
		// Rendre la main à l'utilisateur
		isCheckingWord = false;
		if (gameInProgress) {
			wordInput.disabled = false;
			wordInput.focus();
		}
	}
}

/**
 * Fait clignoter le champ de saisie en rouge en cas d'erreur
 */
function flashInputError() {
	wordInput.classList.add("border-red-500", "ring-red-500");
	setTimeout(() => {
		wordInput.classList.remove("border-red-500", "ring-red-500");
	}, 500);
}

// --- Écouteurs d'événements ---
startButton.addEventListener("click", startGame);
wordInput.addEventListener("keydown", handleWordInput);

// NOUVEAU: Écouteur pour les changements de langue
langRadios.forEach((radio) => {
	radio.addEventListener("change", (event) => {
		if (!gameInProgress) {
			// On ne peut changer que si le jeu n'est pas en cours
			selectedLang = event.target.value;
		}
	});
});

// Initialiser le jeu au chargement
document.addEventListener("DOMContentLoaded", initGame);
