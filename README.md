# FastWorkBattle

## Overview
FastWorkBattle is a fast-paced word game playable in your browser. The goal is to find as many valid words as possible that start with a randomly chosen letter, within a limited time.

## How to Play
1. Click the **Start Game** button to begin a round.
2. A random letter will be displayed. You have 30 seconds to enter words that start with this letter.
3. Type a word and press Enter. The game checks if the word exists in the selected language (French or English) using Wiktionary.
4. Each valid word increases your score by 1. Duplicate words or invalid entries are rejected.
5. When time runs out, your final score is displayed. You can play again by clicking the button.

## Features
- **Language Selection:** Choose between French and English before starting the game.
- **Live Timer:** 30-second countdown with visual warning as time runs low.
- **Score Tracking:** See your score update instantly for each valid word.
- **Word Validation:** Uses Wiktionary API to check if words exist in the selected language.
- **Responsive UI:** Built with Tailwind CSS for a modern, mobile-friendly interface.

## Technologies Used
- HTML, CSS (Tailwind + custom styles)
- JavaScript (game logic and API calls)
- Wiktionary API for word validation

## Setup & Usage
Just open `index.html` in your browser. No installation required.

## File Structure
- `index.html` — Main game interface
- `logic.js` — Game logic and word validation
- `style.css` — Custom styles
- `README.md` — This documentation

## License
Apache License 2.0
