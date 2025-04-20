import { Loop } from './loop';
import { randomLetter } from './randomLetter';
import { validateWord } from './word/validateWord';

interface Letter {
    char: string,
    node: HTMLElement,
    speed: number,
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

    #loop: Loop = new Loop();

    #letters: Letter[] = []
    #letterCounts: LetterCounts = {}

    #width: number = 20;
    #height: number = 60;
    #spawnRate: number = 60;

    #score: number = 0;
    #focusedLetters: Set<Letter> = new Set<Letter>();
    #usedWords: Set<string> = new Set<string>();
    #currentWord: string = '';

    constructor(query: string) {
        this.el = document.querySelector(query)!;
        this.el.classList.add('game-container')
        this.inputEl = document.querySelector(`${query} + input[data-game-input]`)!;
        this.inputEl.addEventListener('input', this.#handleInputChange);
        this.inputEl.addEventListener('keydown', this.#handleInputKeyDown);
        this.scoreEl = this.el.parentElement!.querySelector('[data-game-score]')!

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.reset = this.reset.bind(this);
    }

    start() {
        this.reset();
        this.#loop.start(this.#handleLoop);
    }

    stop() {
        this.#loop.stop();
    }

    reset() {
        this.#score = 0;
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

        this.scoreEl!.innerText = this.#score.toString(); 

        this.#removeExpiredLetters();
    }

    // Clear letters when they leave the view
    #removeExpiredLetters = () => {
        this.#letters = this.#letters.filter((letter) => {
            if(letter.position.y >= this.#height - 2) {
                this.#removeLetter(letter);
                return false;
            }
            return true;
        });
    }

    #removeLetter = (letter: Letter) => {
        letter.node.remove();
        this.#letterCounts[letter.char]--;
        this.#focusedLetters.delete(letter);
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
            for(const i in inputLetters) {
                const char = inputLetters[i];
                if(letter.char === char) {
                    inputLetters.splice(parseInt(i), 1);
                    this.#focusedLetters.add(letter);
                    break;
                }
            }
        });
    }

    #renderLetter = (letter: Letter) => {
        const bounds = this.el!.getBoundingClientRect();
        let containerWidth = bounds.width;
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
                this.#focusedLetters.forEach((letter) => {
                    this.#score++;
                    this.#removeLetter(letter);
                });
                this.#usedWords.add(word);
            }
            
            const el = this.el!;
            el.classList.remove('valid', 'invalid');
            el.offsetHeight; // Trigger DOM reflow
            el.classList.toggle('valid', valid);
            el.classList.toggle('invalid', !valid);

            inputEl.value = '';
            this.#currentWord = '';
        }
    }
}

function createLetter(char: string): Letter {
    const node = document.createElement('template');
    node.innerHTML = `<label class="game-letter"> ${char} </label>`;
    return {
        char,
        node: node.content.children[0] as HTMLElement,
        speed: .15,
        position: {
            x: 0,
            y: 0
        }
    }
}

function randomizeLetterPosition(letter: Letter, width: number) {
    letter.position.x = Math.random() * width;
}