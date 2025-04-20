import { Loop } from './loop';
import { randomLetter } from './randomLetter';
import { validateWord } from './word/validateWord';

interface Letter {
    char: string,
    node: HTMLElement,
    speed: number,
    active: boolean,
    position: {
        x: number,
        y: number
    }
}

interface LetterCounts {
    [prop: string]: number
}

export class Game {
    el: HTMLElement | null = null;
    inputEl: HTMLInputElement | null = null;
    scoreEl: HTMLLabelElement | null = null;
    livesEl: HTMLLabelElement | null = null;

    #loop: Loop = new Loop();

    #letters: Letter[] = []
    #letterCounts: LetterCounts = {}

    #width: number = 20;
    #height: number = 60;
    #spawnRate: number = 80;

    #score: number = 0;
    #lives: number = 3;
    #focusedLetters: Set<Letter> = new Set<Letter>();
    #usedWords: Set<string> = new Set<string>();
    #currentWord: string = '';

    constructor(query: string) {
        this.el = document.querySelector(query)!;
        this.el.classList.add('game-container')
        this.inputEl = document.querySelector(`${query} + input[data-game-input]`)!;
        this.inputEl.addEventListener('input', this.#handleInputChange);
        this.inputEl.addEventListener('keydown', this.#handleInputKeyDown);
        this.scoreEl = this.el.parentElement!.querySelector('[data-game-score]')!;
        this.livesEl = this.el.parentElement!.querySelector('[data-game-lives]')!;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.reset = this.reset.bind(this);
    }

    start() {
        this.reset();
        this.inputEl?.focus();
        this.#loop.start(this.#handleLoop);
    }

    stop() {
        this.#loop.stop();
    }

    reset() {
        this.#score = 0;
        this.#lives = 3;
        this.#letters = [];
        this.#letterCounts = {};
        this.#usedWords.clear();
    }

    // Add a new letter every frame
    // Update score
    // Render selected letters
    // Remove out of view letters
    #handleLoop = (frame: number, multiplier: number) => {
        const tick = frame % this.#spawnRate;
        if(tick === 0) {
            this.#addLetter();
        }

        this.#focusInputLetters();
        this.#letters.map((letter) => {
            letter.position.y += letter.speed * multiplier;
            this.#renderLetter(letter);
        });

        this.#removeDeactivatedLetters();

        this.scoreEl!.innerText = this.#score.toString();
        this.livesEl!.innerHTML =`${this.#lives.toString()} &#9829;`;

        if(this.#lives === 0) {
            this.#loop.stop();
        }
    }

    // Clear letters when they leave the view
    #removeDeactivatedLetters = () => {
        this.#letters = this.#letters.filter((letter) => {
            if(letter.position.y >= this.#height - 2) {
                if(letter.active) {
                    this.#removeLife()
                }
                this.#deactiveLetter(letter);
                return false;
            }
            return true;
        });
    }

    #deactiveLetter = (letter: Letter) => {
        letter.node.remove();
        letter.active = false;
        this.#letterCounts[letter.char]--;
        this.#focusedLetters.delete(letter);
    }

    #removeLife = () => {
        this.#lives = Math.max(--this.#lives, 0);
        const el = this.el!;
        el.classList.remove('valid', 'invalid');
        el.offsetHeight; // Trigger DOM reflow
        el.classList.add('invalid');
    }

    #addLetter = () => {
        const letter = createLetter(randomLetter());
        randomizeLetterPosition(letter, this.#width)
        this.#letters.push(letter);
        this.#letterCounts[letter.char] = (this.#letterCounts[letter.char] || 0) + 1;

        if(this.el) {
            this.el.appendChild(letter.node);
        }
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

    #renderLetter = (letter: Letter) => {
        const bounds = this.el!.getBoundingClientRect();
        let containerWidth = bounds.width - letter.node.clientWidth;
        containerWidth = containerWidth - (containerWidth / this.#width);
        const containerHeight = bounds.height;
        const node = letter.node;
        node.style.top = (letter.position.y * containerHeight / this.#height) + 'px';
        node.style.left = (letter.position.x * containerWidth / this.#width) + 'px';
        node.classList.toggle('game-letter-focus', this.#focusedLetters.has(letter));
    }
    
    // Validate input
    #handleInputChange = () => {
        const inputEl = this.inputEl!;
        inputEl.value = inputEl.value.trim().replace(/[^A-Za-z]/g, '').toUpperCase();
        this.#currentWord = inputEl.value;
    }

    // Validate word
    #handleInputKeyDown = (event: KeyboardEvent) => {
        if(event.key === 'Enter') {
            const inputEl = this.inputEl!;
            const word = inputEl.value;
            const valid = !this.#usedWords.has(word) && validateWord(word);
            if(valid) {
                // Determine if all active letters on the board were used
                const allLettersUsed = this.#focusedLetters.size === this.#letters.reduce((total, letter) => {
                    if(letter.active) {
                        return total + 1;
                    }
                    return total;
                }, 0);

                // If all letters are used and more than 1 letter was used then dobule the score
                if(allLettersUsed && this.#focusedLetters.size > 1) {
                    this.#score += word.length * 2;
                    this.#toggleAnimationClass('bonus');
                } else {
                    this.#score += word.length;
                    this.#toggleAnimationClass('valid');
                }

                this.#focusedLetters.forEach(this.#deactiveLetter);
                this.#usedWords.add(word);
                
            } else {
                this.#toggleAnimationClass('invalid', !valid);
            }

            inputEl.value = '';
            this.#currentWord = '';
        }
    }

    // Toggles class name animation by triggering DOM reflow
    #toggleAnimationClass = (className: string, add: boolean = true) => {
        const el = this.el!;
        el.classList.remove('valid', 'invalid', 'bonus');
        el.offsetHeight; // Trigger DOM reflow
        el.classList.toggle(className, add);
    }
}

function createLetter(char: string): Letter {
    const node = document.createElement('template');
    node.innerHTML = `<label class="game-letter"> ${char} </label>`;
    return {
        char,
        node: node.content.children[0] as HTMLElement,
        speed: .12,
        active: true,
        position: {
            x: 0,
            y: 0
        }
    }
}

function randomizeLetterPosition(letter: Letter, width: number) {
    letter.position.x = Math.random() * width;
}