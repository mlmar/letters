# Letters — Features

Letters is a browser-based falling-letters word game. Random letters drop into a play area; the player types valid English words and presses Enter to clear matching letters and score points. The game ends when all 3 lives are lost.

Type words from the letters on screen, submit with Enter, and keep letters from reaching the bottom of the board.

## Gameplay

### Falling letters

Letters spawn into the play area on a regular interval (every ~80 frames) and fall downward. Each letter gets:

- A random horizontal position
- A random fall speed between 0.11 and 0.15
- A 10% chance to spin clockwise or counter-clockwise

### Letter distribution

Letters are chosen with weighted randomness. Common vowels (A, E, I, O, U, Y) appear more often; rare letters like Q, X, and Z appear less often.

### Word input

The text field below the play area is where you type. Input is sanitized as you type: only A–Z letters are kept, and they are converted to uppercase.

### Letter matching

As you type, falling letters that match the current word are highlighted. Each character in your word can match at most one letter on the board.

### Word submission

Press Enter to submit the current word. The game checks two things:

1. The word is in the bundled English dictionary
2. The word has not already been used in this session

If both checks pass, matching letters are removed from the board and you score points. Duplicate or invalid words are rejected with distinct feedback messages below the input.

## Scoring

- **Base score:** 1 point per letter in a valid word (word length)
- **Bonus score:** double points when the submitted word uses every active letter currently on the board and the word is longer than 1 letter

Visual feedback on submit:

- Green outline flash — valid word
- Blue outline flash — bonus (all letters used)
- Red outline flash — invalid or duplicate word
- Text feedback below the input shows the word, points earned, or rejection reason

## Lives and game over

The game starts with **3 lives**, shown as three hearts in the header. Lost lives appear dimmed.

You lose 1 life when an active letter reaches the bottom of the play area without being cleared. Losing a life also flashes the play area outline red.

At 0 lives:

- The game loop stops
- The input field is disabled
- A full-board overlay appears: *Nice Try Bucko! Your score: {score}*
- The overlay includes a **Restart Game** button

The header **Restart Game** button asks for confirmation during an active game to prevent accidental resets. It resets score, lives, falling letters, and the used-word history, then starts a new game.

## UI elements

| Element | Attribute | Role |
|---------|-----------|------|
| Score | `data-game-score` | Current score |
| Lives | `data-game-lives` | Remaining hearts |
| Theme toggle | `data-theme-toggle` | Switch light/dark theme |
| Restart | `data-restart-btn` | Start a new game |
| Play area | `#game-container` | Falling letters |
| Input | `data-game-input` | Word entry |
| Feedback | `data-game-feedback` | Last submission result |
| Used words | `data-used-words-list` | Words already played this session |
| Game over | `data-game-over-message` | End-of-game overlay |

## Visual polish

- Monospace font with light and dark themes, plus a manual theme toggle in the header
- Play area with a fixed aspect ratio
- Play area outline that animates green, red, or blue on valid, invalid, or bonus submissions
- Some letters spin clockwise or counter-clockwise as they fall
- Restart and theme buttons scale and invert colors on hover
- Responsive sizing via `clamp()` on small screens

## Technical notes

- Built with TypeScript, Astro (static), and Less
- 60 FPS game loop via `requestAnimationFrame`
- Theme preference stored in `localStorage` under `letters-theme`
- Run locally: `npm run dev` at `http://localhost:3000/`
- Production is served under `/letters/` on GitHub Pages; builds are automated via GitHub Actions to the `v1/build` branch (see [deployment.md](./deployment.md))
