type Tick = (frame: number, multiplier: number) => void;

export class Loop {
    #active: boolean = false;
    #callback: Tick;
    #fps: number;
    #frame: number = 0;
    #interval: number = 0;
    #rafId: number = 0;

    #startTime: number = 0;
    #previousTime: number = 0;
    #currentTime: number = 0;
    #deltaTime: number = 0;

    constructor(callback: Tick, fps: number = 60) {
        this.#callback = callback;
        this.#fps = fps;
        this.#interval = Math.floor(1000 / this.#fps);
        this.animate = this.animate.bind(this);
    }

    start() {
        if (this.isActive()) {
            return;
        }

        this.#active = true;
        this.#frame = 0;

        this.#startTime = performance.now();
        this.#previousTime = this.#startTime;

        this.#rafId = requestAnimationFrame(this.animate);
    }

    stop() {
        this.#active = false;
        if (this.#rafId) {
            cancelAnimationFrame(this.#rafId); // Cancel the queued frame so restart cannot double-schedule
            this.#rafId = 0;
        }
    }

    animate(timestamp: number) {
        this.#currentTime = timestamp;
        this.#deltaTime = this.#currentTime - this.#previousTime;

        if (this.#deltaTime > this.#interval) {
            this.#previousTime = this.#currentTime - (this.#deltaTime % this.#interval);

            const multiplier = this.#deltaTime / this.#interval;
            this.#frame++;

            this.#callback(this.#frame, multiplier);
        }

        if (this.isActive()) {
            this.#rafId = requestAnimationFrame(this.animate);
        }
    }

    isActive() {
        return this.#active;
    }

}
