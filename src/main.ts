import './style.less';
import './game.less';
import { Game } from './game';


document.addEventListener('DOMContentLoaded', function() {
    const game = new Game('#game-container');
    game.start();
});