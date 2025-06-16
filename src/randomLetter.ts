const weights = {
    A: 5,
    B: 4,
    C: 4,
    D: 4,
    E: 5,
    F: 4,
    G: 4,
    H: 4,
    I: 5,
    J: 4,
    K: 4,
    L: 4,
    M: 4,
    N: 4,
    O: 5,
    P: 4,
    Q: 2,
    R: 4,
    S: 4,
    T: 4,
    U: 5,
    V: 3,
    W: 4,
    X: 1,
    Y: 5,
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