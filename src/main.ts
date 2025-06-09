import './style.less';
import './game.less';
import { Game } from './game';


document.addEventListener('DOMContentLoaded', function() {
    const game = new Game('#game-container');
    game.start(); 

    // Get the restart button element
    const restartButton = document.getElementById('restart-button');

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            game.start(); 
        });
    }
});
