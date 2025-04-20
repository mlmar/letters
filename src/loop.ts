type callback = (tick: number, multiplier: number) => void;

export class Loop {
    #active: boolean = false;
    #callback: callback | null = null;

    #fps: number = 60;
    #frame: number = 0;
    #interval: number = 0;

    #startTime: number = 0;
    #previousTime: number = 0;
    #currentTime: number = 0;
    #deltaTime: number = 0;

    constructor() {
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.animate = this.animate.bind(this);
        this.isActive = this.isActive.bind(this);
    }

    start(callback: callback, fps: number = 60) {
        if(!callback || this.isActive()) {
            return;
        }

        this.#active = true;
        this.#callback = callback;

        this.#frame = 0;
        this.#fps = fps;
        this.#interval = Math.floor(1000 / this.#fps);

        this.#startTime = performance.now();
        this.#previousTime = this.#startTime;
        
        requestAnimationFrame(this.animate);
    }

    stop() {
        this.#active = false;
    }

    animate(timestamp: number) {
        this.#currentTime = timestamp;
        this.#deltaTime = this.#currentTime - this.#previousTime;
        
        if(this.#deltaTime > this.#interval) {
            this.#previousTime = this.#currentTime - (this.#deltaTime % this.#interval);

            const multiplier = this.#deltaTime / this.#interval;
            this.#frame++;

            if(this.#callback) {
                this.#callback(this.#frame, multiplier);
            }
        }

        if(this.isActive()) {
            requestAnimationFrame(this.animate);
        }
    }

    isActive() {
        return this.#active;
    }

}