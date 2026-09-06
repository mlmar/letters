import { Loop } from './loop';
import { randomLetter } from './randomLetter';
import { validateWord } from '#/word/validateWord';

interface Letter {
    char: string,
    node: HTMLElement,
    speed: number,
    active: boolean,
    width: number,
    height: number,
    position: {
        x: number,
        y: number
    }
}

interface LetterCounts {
    [prop: string]: number
}

interface ContainerBounds {
    width: number,
    height: number,
}

export class Game {
    el: HTMLElement | null = null;
    inputEl: HTMLInputElement | null = null;
    scoreEl: HTMLOutputElement | null = null;
    livesEl: HTMLElement | null = null;
    gameOverMessageEl: HTMLElement | null = null;

    #loop: Loop;

    #letters: Letter[] = []
    #letterCounts: LetterCounts = {}

    #width: number = 20;
    #height: number = 70;
    #spawnRate: number = 80;

    #score: number = 0;
    #lives: number = 3;
    #maxLives: number = 3;
    #minLetterSpeed: number = .11;
    #maxLetterSpeed: number = .15;
    #spinProbability: number = .1;

    #focusedLetters: Set<Letter> = new Set<Letter>();
    #usedWords: Set<string> = new Set<string>();
    #currentWord: string = '';

    #heartEls: HTMLElement[] = [];
    #lastRenderedScore: number = -1;
    #lastRenderedLives: number = -1;

    #containerBounds: ContainerBounds | null = null;
    #boundsDirty: boolean = true;
    #resizeObserver: ResizeObserver | null = null;
    #focusDirty: boolean = true;

    #feedbackEl: HTMLElement | null = null;
    #usedWordsListEl: HTMLUListElement | null = null;
    #gameOverTextEl: HTMLElement | null = null;

    constructor(query: string) {
        this.el = document.querySelector(query)!;
        this.el.classList.add('game-container')
        const main = this.el.parentElement!;
        this.inputEl = main.querySelector('[data-game-input]')!;
        this.inputEl.addEventListener('input', this.#handleInputChange);
        this.inputEl.addEventListener('keydown', this.#handleInputKeyDown);
        this.scoreEl = main.querySelector('[data-game-score]')!;
        this.livesEl = main.querySelector('[data-game-lives]')!;
        this.gameOverMessageEl = this.el.querySelector('[data-game-over-message]')!;
        this.#gameOverTextEl = this.gameOverMessageEl?.querySelector('.game-over-text') ?? null;
        this.#feedbackEl = main.querySelector('[data-game-feedback]')!;
        this.#usedWordsListEl = main.querySelector('[data-used-words-list]')!;

        this.#initHearts();

        this.#resizeObserver = new ResizeObserver(() => {
            this.#boundsDirty = true;
        });
        this.#resizeObserver.observe(this.el);

        this.#loop = new Loop(this.#tick);
    }

    isPlaying(): boolean {
        return this.#loop.isActive() && this.#lives > 0;
    }

    // Stop any running session, then reset state and start the loop
    start() {
        this.#loop.stop();
        this.#resetState();
        this.inputEl?.focus();

        if (this.inputEl) {
            this.inputEl.disabled = false;
        }
        this.#loop.start();
    }

    stop() {
        this.#loop.stop();

        if (this.inputEl) {
            this.inputEl.disabled = true;
        }
    }

    // Clear board, score, lives, and input without touching the loop
    #resetState() {
        this.#score = 0;
        this.#lives = this.#maxLives;

        this.#letters.forEach(letter => letter.node.remove());
        this.#letters = [];
        this.#letterCounts = {};
        this.#focusedLetters.clear();
        this.#usedWords.clear();
        this.#currentWord = '';
        this.#focusDirty = true;

        if (this.inputEl) {
            this.inputEl.value = '';
        }

        // Update score and lives display to initial values
        this.#lastRenderedScore = -1;
        this.#lastRenderedLives = -1;
        this.#renderHud();
        this.#clearFeedback();
        this.#renderUsedWords();

        // Remove any game over messages or visual cues
        if (this.el) {
            this.#displayGameOver(false);

            // Remove any active animation classes
            this.el.classList.remove('valid', 'invalid', 'bonus');
        }
    }

    // Add a new letter every frame
    // Update score
    // Render selected letters
    // Remove out of view letters
    #tick = (frame: number, multiplier: number) => {
        const bounds = this.#getContainerBounds();
        const tick = frame % this.#spawnRate;
        if(tick === 0) {
            this.#addLetter(bounds);
        }

        if (this.#focusDirty) {
            this.#focusInputLetters();
            this.#focusDirty = false;
        }

        this.#letters.forEach((letter) => {
            letter.position.y += letter.speed * multiplier;
            this.#renderLetter(letter, bounds);
        });

        this.#removeDeactivatedLetters();

        this.#renderHud();

        if(this.#lives === 0) {
            this.stop();
            this.#displayGameOver(true);
        }
    }

    // Clear letters when they leave the view
    #removeDeactivatedLetters = () => {
        let removed = false;
        this.#letters = this.#letters.filter((letter) => {
            // Remove once the letter's top edge passes the bottom border
            if(letter.position.y >= this.#height) {
                if(letter.active) {
                    this.#removeLife()
                }
                this.#deactiveLetter(letter); // Deactivate and remove from DOM
                removed = true;
                return false;
            }
            return true;
        });
        if (removed) {
            this.#focusDirty = true;
        }
    }

    #deactiveLetter = (letter: Letter) => {
        letter.node.remove(); // Remove node from DOM
        letter.active = false;
        this.#letterCounts[letter.char]--;
        this.#focusedLetters.delete(letter);
    }

    #removeLife = () => {
        this.#lives = Math.max(--this.#lives, 0);
        this.#toggleAnimationClass('invalid');
    }

    #addLetter = (bounds: ContainerBounds) => {
        const letter = createLetter(randomLetter());
        randomizeLetterPosition(letter, this.#width)
        randomizeLetterSpeed(letter, this.#minLetterSpeed, this.#maxLetterSpeed);
        randomizeSpin(letter, this.#spinProbability);
        this.#letters.push(letter);
        this.#letterCounts[letter.char] = (this.#letterCounts[letter.char] || 0) + 1;

        if(this.el) {
            this.el.appendChild(letter.node);
            letter.width = letter.node.clientWidth;
            letter.height = letter.node.clientHeight;
        }

        // Start with the letter's bottom edge flush against the top border
        const unitsPerPixel = bounds.height > 0 ? this.#height / bounds.height : 0;
        letter.position.y = -letter.height * unitsPerPixel;
        this.#focusDirty = true;
    }

    // Highlights letters based on user input
    #focusInputLetters = () => {
        const inputLetters = this.#currentWord.split('');
        this.#focusedLetters.clear();
        this.#letters.forEach((letter) => {
            if(letter.active) {
                for(const i in inputLetters) {
                    const char = inputLetters[i];
                    if(letter.char === char) {
                        inputLetters.splice(parseInt(i), 1);
                        this.#focusedLetters.add(letter);
                        break;
                    }
                }
            }
        });
    }

    #getContainerBounds = (): ContainerBounds => {
        if (this.#boundsDirty || !this.#containerBounds) {
            const rect = this.el!.getBoundingClientRect();
            this.#containerBounds = {
                width: rect.width,
                height: rect.height,
            };
            this.#boundsDirty = false;
        }
        return this.#containerBounds;
    }

    #renderLetter = (letter: Letter, bounds: ContainerBounds) => {
        let containerWidth = bounds.width - letter.width;
        containerWidth = containerWidth - (containerWidth / this.#width);
        const node = letter.node;
        const x = letter.position.x * containerWidth / this.#width;
        const y = letter.position.y * bounds.height / this.#height;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        node.classList.toggle('game-letter-focus', this.#focusedLetters.has(letter));
    }

    // Validate input
    #handleInputChange = () => {
        const inputEl = this.inputEl!;
        inputEl.value = inputEl.value.trim().replace(/[^A-Za-z]/g, '').toUpperCase();
        this.#currentWord = inputEl.value;
        this.#focusDirty = true;
    }

    // Validate word
    #handleInputKeyDown = (event: KeyboardEvent) => {
        if(event.key === 'Enter') {
            const inputEl = this.inputEl!;
            const word = inputEl.value;
            if (!word) {
                return;
            }

            const isDuplicate = this.#usedWords.has(word);
            const isValidWord = validateWord(word);

            if(isValidWord && !isDuplicate) {
                // Determine if all active letters on the board were used
                const allLettersUsed = this.#focusedLetters.size === this.#letters.reduce((total, letter) => {
                    if(letter.active) {
                        return total + 1;
                    }
                    return total;
                }, 0);

                let points = word.length;
                // If all letters are used and more than 1 letter was used then double the score
                if(allLettersUsed && this.#focusedLetters.size > 1) {
                    points = word.length * 2;
                    this.#score += points;
                    this.#toggleAnimationClass('bonus');
                    this.#showFeedback(`${word}: +${points} (bonus)`, 'valid');
                } else {
                    this.#score += points;
                    this.#toggleAnimationClass('valid');
                    this.#showFeedback(`${word}: +${points}`, 'valid');
                }

                this.#focusedLetters.forEach(this.#deactiveLetter);
                this.#usedWords.add(word);
                this.#renderUsedWords();
                this.#focusDirty = true;

            } else if (isDuplicate) {
                this.#toggleAnimationClass('invalid');
                this.#showFeedback(`${word}: already used`, 'invalid');
            } else {
                this.#toggleAnimationClass('invalid');
                this.#showFeedback(`${word}: not a word`, 'invalid');
            }

            inputEl.value = '';
            this.#currentWord = '';
        }
    }

    // Toggles class name animation by triggering DOM reflow
    #toggleAnimationClass = (className: string, add: boolean = true) => {
        const el = this.el!;
        el.classList.remove('valid', 'invalid', 'bonus');
        el.offsetHeight; // Triggers DOM reflow
        el.classList.toggle(className, add);
    }

    // Display game over message
    #displayGameOver = (visible: boolean) => {
        if(this.gameOverMessageEl) {
            const message = `Nice Try Bucko! Your score: ${this.#score}`;
            if (this.#gameOverTextEl) {
                this.#gameOverTextEl.textContent = message;
            } else {
                this.gameOverMessageEl.textContent = message;
            }
            this.gameOverMessageEl.hidden = !visible;
        }
    }

    #renderHud = () => {
        if (this.#score === this.#lastRenderedScore && this.#lives === this.#lastRenderedLives) {
            return;
        }
        this.#lastRenderedScore = this.#score;
        this.#lastRenderedLives = this.#lives;

        if (this.scoreEl) {
            this.scoreEl.textContent = this.#score.toString();
        }

        this.#heartEls.forEach((heart, index) => {
            heart.classList.toggle('depleted', index >= this.#lives);
        });
    }

    #initHearts = () => {
        if (!this.livesEl || this.#heartEls.length > 0) {
            return;
        }

        const existingHearts = this.livesEl.querySelectorAll('.game-heart');
        if (existingHearts.length > 0) {
            this.#heartEls = Array.from(existingHearts) as HTMLElement[];
            return;
        }

        for (let i = 0; i < this.#maxLives; i++) {
            const heart = document.createElement('span');
            heart.className = 'game-heart';
            heart.textContent = '\u2665';
            this.livesEl.appendChild(heart);
            this.#heartEls.push(heart);
        }
    }

    #showFeedback = (message: string, kind: 'valid' | 'invalid') => {
        if (!this.#feedbackEl) {
            return;
        }
        this.#feedbackEl.textContent = message;
        this.#feedbackEl.classList.remove('valid', 'invalid');
        this.#feedbackEl.classList.add(kind);
    }

    #clearFeedback = () => {
        if (!this.#feedbackEl) {
            return;
        }
        this.#feedbackEl.textContent = '';
        this.#feedbackEl.classList.remove('valid', 'invalid');
    }

    #renderUsedWords = () => {
        if (!this.#usedWordsListEl) {
            return;
        }
        this.#usedWordsListEl.innerHTML = '';
        for (const word of this.#usedWords) {
            const item = document.createElement('li');
            item.textContent = word;
            this.#usedWordsListEl.appendChild(item);
        }
    }
}
function createLetter(char: string): Letter {
    const node = document.createElement('span');
    node.className = 'game-letter';
    const charEl = document.createElement('span');
    charEl.className = 'game-letter-char';
    charEl.textContent = char;
    node.appendChild(charEl);
    return {
        char,
        node,
        speed: .12,
        active: true,
        width: 0,
        height: 0,
        position: {
            x: 0,
            y: 0
        }
    }
}

function randomizeLetterPosition(letter: Letter, width: number) {
    letter.position.x = Math.random() * width;
}

function randomizeLetterSpeed(letter: Letter, min: number, max: number) {
    const speed = Math.random() * (max - min) + min;
    letter.speed = speed;
}

function randomizeSpin(letter: Letter, probability: number) {
    const charEl = letter.node.querySelector('.game-letter-char');
    if (!charEl) {
        return;
    }
    if(Math.random() <= probability) { // If within probability
        if(Math.random() <= .5) { // 50-50 chance to spin either direction
            charEl.classList.add('game-letter-spin');
        } else {
            charEl.classList.add('game-letter-spin-reverse');
        }
    }
}
