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
   
        if (this.inputEl) {
            this.inputEl.disabled = false;
        }
        this.#loop.start(this.#handleLoop);
    }

    stop() {
        this.#loop.stop();
    
        if (this.inputEl) {
            this.inputEl.disabled = true;
        }
    }

    reset() {
       
        this.#loop.stop(); 
        
        this.#score = 0;
        this.#lives = 3;
        
        this.#letters.forEach(letter => letter.node.remove());
        this.#letters = []; 
        this.#letterCounts = {};
        this.#focusedLetters.clear(); 
        this.#usedWords.clear(); 
        this.#currentWord = ''; 

       
        if (this.inputEl) {
            this.inputEl.value = '';
            this.inputEl.disabled = false; 
        }
        
        // Update score and lives display to initial values
        this.scoreEl!.innerText = this.#score.toString();
        this.livesEl!.innerHTML =`${this.#lives.toString()} &#9829;`;

        // Remove any game over messages or visual cues
        const gameOverMessage = this.el?.querySelector('.game-over-message'); // Assuming a class for game over messages
        if (gameOverMessage && gameOverMessage.parentNode === this.el) {
            this.el.removeChild(gameOverMessage);
        }

        // Remove any active animation classes
        this.el?.classList.remove('valid', 'invalid', 'bonus');

        console.log("Game state reset.");
    }

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
            this.stop(); 
            this.#displayGameOver();
        }
    }

   
    #removeDeactivatedLetters = () => {
        this.#letters = this.#letters.filter((letter) => {
            if(letter.position.y >= this.#height - 2) {
                if(letter.active) {
                    this.#removeLife()
                }
                this.#deactiveLetter(letter); // Deactivate and remove from DOM
                return false; 
            }
            return true;
        });
    }

    #deactiveLetter = (letter: Letter) => {
        letter.node.remove(); // Remove node from DOM
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
    
   
    #handleInputChange = () => {
        const inputEl = this.inputEl!;
        inputEl.value = inputEl.value.trim().replace(/[^A-Za-z]/g, '').toUpperCase();
        this.#currentWord = inputEl.value;
    }

   
    #handleInputKeyDown = (event: KeyboardEvent) => {
        if(event.key === 'Enter') {
            const inputEl = this.inputEl!;
            const word = inputEl.value;
            const valid = !this.#usedWords.has(word) && validateWord(word);
            if(valid) {
               
                const allLettersUsed = this.#focusedLetters.size === this.#letters.reduce((total, letter) => {
                    if(letter.active) {
                        return total + 1;
                    }
                    return total;
                }, 0);

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
        el.offsetHeight; // Triggers DOM reflow
        el.classList.toggle(className, add);
    }

    // NONNY ADDITION: Display game over message
    #displayGameOver = () => {
        const gameOverMessage = document.createElement('div');
        gameOverMessage.classList.add('game-over-message'); 
        gameOverMessage.textContent = `Nice Try Bucko! Your score: ${this.#score}`;
        
        gameOverMessage.style.position = 'absolute';
        gameOverMessage.style.top = '50%';
        gameOverMessage.style.left = '50%';
        gameOverMessage.style.transform = 'translate(-50%, -50%)';
        gameOverMessage.style.fontSize = '2.5em';
        gameOverMessage.style.color = '#fff';
        gameOverMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
        gameOverMessage.style.padding = '20px 40px';
        gameOverMessage.style.borderRadius = '10px';
        gameOverMessage.style.zIndex = '1000'; 

        this.el?.appendChild(gameOverMessage);
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
