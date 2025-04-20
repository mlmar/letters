import words from './words.txt?raw';

const validWords = new Set<string>(words.split('\r\n')); 

export function validateWord(word: string) {
    return validWords.has(word.toLowerCase());
}