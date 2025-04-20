const weights = {
    A: 4,
    B: 3,
    C: 3,
    D: 3,
    E: 4,
    F: 3,
    G: 3,
    H: 3,
    I: 4,
    J: 3,
    K: 3,
    L: 3,
    M: 3,
    N: 3,
    O: 4,
    P: 3,
    Q: 3,
    R: 3,
    S: 3,
    T: 3,
    U: 4,
    V: 3,
    W: 3,
    X: 1,
    Y: 4,
    Z: 1
}

const letters: string[] = [];
Object.keys(weights).forEach((letter: string) => {
    const weight = weights[letter as keyof typeof weights];
    letters.push(...new Array(weight).fill(letter));
});

export function randomLetter(): string {
    const num = Math.floor(randomNumber(0, letters.length));
    return letters[num];
}

function randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}