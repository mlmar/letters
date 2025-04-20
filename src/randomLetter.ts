const weights = {
    A: 2,
    B: 1,
    C: 1,
    D: 1,
    E: 2,
    F: 1,
    G: 1,
    H: 1,
    I: 2,
    J: 1,
    K: 1,
    L: 1,
    M: 1,
    N: 1,
    O: 2,
    P: 1,
    Q: 1,
    R: 1,
    S: 1,
    T: 1,
    U: 2,
    V: 1,
    W: 1,
    X: 1,
    Y: 2,
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