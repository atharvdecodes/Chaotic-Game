
// =====================================
// CHAOS MANAGER
// =====================================

console.log("CHAOS JS LOADED!");

class ChaosManager {

    constructor(player, gameArea) {

        this.player = player;
        this.gameArea = gameArea;

        this.isActive = false;
        this.currentEvent = null;

        this.mutants = [];
        this.pianos = [];

        this.eventStartTime = 0;
        this.eventDuration = 0;

        this.lastSpawnTime = 0;
        this.lastUpdateTime = 0;

        // RANDOM EVENT SCHEDULING

        this.autoSchedule = false;
        this.scheduleTimer = null;

        this.previousEvent = null;
        this.cooldown = 3000;

        // EVENT DURATIONS

        this.eventDurations = {
            mutantAttack: 10,
            pianoRain: 10,
            slipperyFloor: 8,
            confusedControls: 8
        };

        // AVAILABLE EVENTS

        this.events = [
            "mutantAttack",
            "pianoRain",
            "slipperyFloor",
            "confusedControls"
        ];


        // =================================
        // PLAYER DEATH
        // =================================

        document.addEventListener("player:death", () => {

            this.autoSchedule = false;

            clearTimeout(this.scheduleTimer);

            this.stopChaosEvent();

        });


        // =================================
        // PLAYER VICTORY
        // =================================

        document.addEventListener("player:victory", () => {

            this.autoSchedule = false;

            clearTimeout(this.scheduleTimer);

            this.stopChaosEvent();

        });


        // =================================
        // PLAYER RESTART
        // =================================

        document.addEventListener("player:restart", () => {

            this.autoSchedule = false;

            clearTimeout(this.scheduleTimer);

            this.stopChaosEvent();

            this.previousEvent = null;

            this.startRandomChaos();

        });

    }


    // =====================================
    // RANDOM EVENT SELECTION
    // =====================================

    selectRandomEvent() {

        const availableEvents = this.events.filter(
            event => event !== this.previousEvent
        );

        const randomIndex = Math.floor(
            Math.random() * availableEvents.length
        );

        return availableEvents[randomIndex];

    }


    // =====================================
    // START RANDOM CHAOS
    // =====================================

    startRandomChaos() {

        if (this.autoSchedule) return;

        this.autoSchedule = true;

        console.log("RANDOM CHAOS SYSTEM STARTED!");

        this.scheduleNextEvent(1500);

    }


    // =====================================
    // SCHEDULE NEXT EVENT
    // =====================================

    scheduleNextEvent(delay = this.cooldown) {

        if (!this.autoSchedule) return;

        clearTimeout(this.scheduleTimer);

        this.scheduleTimer = setTimeout(() => {

            if (!this.autoSchedule) return;

            if (
                window.PlayerModule &&
                !window.PlayerModule.isAlive()
            ) {

                this.autoSchedule = false;
                return;

            }

            const eventName = this.selectRandomEvent();

            const duration = this.eventDurations[eventName];

            this.previousEvent = eventName;

            this.startChaosEvent(eventName, duration);

        }, delay);

    }


    // =====================================
    // START CHAOS EVENT
    // =====================================

    startChaosEvent(eventName, duration = 10) {

        if (this.isActive) return;

        if (!this.events.includes(eventName)) {

            console.warn("Unknown chaos event:", eventName);

            return;

        }

        if (
            window.PlayerModule &&
            !window.PlayerModule.isAlive()
        ) {
            return;
        }

        this.currentEvent = eventName;

        this.eventDuration = duration;

        this.eventStartTime = Date.now();

        this.lastSpawnTime = Date.now();

        this.lastUpdateTime = 0;

        this.isActive = true;

        console.log("CHAOS STARTED:", eventName);


        switch (eventName) {

            case "mutantAttack":
                this.mutantAttack();
                break;

            case "pianoRain":
                this.pianoRain();
                break;

            case "slipperyFloor":
                this.slipperyFloor();
                break;

            case "confusedControls":
                this.confusedControls();
                break;

        }


        requestAnimationFrame(
            (time) => this.gameLoop(time)
        );

    }


    // =====================================
    // MUTANT ATTACK
    // =====================================

    mutantAttack() {

        console.log("MUTANT ATTACK ACTIVATED!");

        this.spawnMutant();

    }


    // =====================================
    // SPAWN MUTANT
    // =====================================

    spawnMutant() {

        const mutant = document.createElement("img");

        mutant.src = "./assets/mutant.png";

        mutant.className = "chaos-mutant obstacle";

        mutant.alt = "Mutant";

        mutant.style.width = "58px";
        mutant.style.height = "58px";

        mutant.style.position = "absolute";
        mutant.style.bottom = "9%";

        mutant.style.objectFit = "contain";
        mutant.style.zIndex = "4";

        mutant.style.pointerEvents = "none";


        const width = 58;

        const fromLeft = Math.random() < 0.5;

        const x = fromLeft
            ? 0
            : this.gameArea.clientWidth - width;


        mutant.style.left = x + "px";

        this.gameArea.appendChild(mutant);


        this.mutants.push({

            element: mutant,

            x: x,

            speed: 45

        });


        console.log("MUTANT SPAWNED!");

    }


    // =====================================
    // PIANO RAIN
    // =====================================

    pianoRain() {

        console.log("PIANO RAIN ACTIVATED!");

        this.spawnPiano();

    }


    // =====================================
    // SPAWN FALLING PIANO
    // =====================================

    spawnPiano() {

        const piano = document.createElement("img");

        piano.src = "./assets/piano.png";

        piano.className = "chaos-piano obstacle";

        piano.alt = "Falling piano";

        const width = 65;

        const x = Math.random() *
            (this.gameArea.clientWidth - width);


        piano.style.position = "absolute";

        piano.style.width = width + "px";
        piano.style.height = "65px";

        piano.style.objectFit = "contain";

        piano.style.zIndex = "4";
        piano.style.pointerEvents = "none";

        piano.style.left = x + "px";
        piano.style.top = "-70px";


        this.gameArea.appendChild(piano);


        this.pianos.push({

            element: piano,

            x: x,

            y: -70,

            speed: 220 + Math.random() * 100

        });


        console.log("PIANO SPAWNED!");

    }


    // =====================================
    // SLIPPERY FLOOR
    // =====================================

    slipperyFloor() {

        console.log("SLIPPERY FLOOR ACTIVATED!");

        window.ChaosEffects.slippery = true;

        this.gameArea.classList.add("slippery-floor");

        this.player.classList.add("slippery");

    }


    // =====================================
    // CONFUSED CONTROLS
    // =====================================

    confusedControls() {

        console.log("CONFUSED CONTROLS ACTIVATED!");

        window.ChaosEffects.controlsReversed = true;

        this.player.classList.add("controls-reversed");

    }


    // =====================================
    // MAIN CHAOS GAME LOOP
    // =====================================

    gameLoop(timestamp) {

        if (!this.isActive) return;

        if (!this.lastUpdateTime) {
            this.lastUpdateTime = timestamp;
        }

        const deltaTime = Math.min(
            (timestamp - this.lastUpdateTime) / 1000,
            0.05
        );

        this.lastUpdateTime = timestamp;

        this.update(deltaTime);

        if (this.isActive) {

            requestAnimationFrame(
                (time) => this.gameLoop(time)
            );

        }

    }


    // =====================================
    // UPDATE OBSTACLES
    // =====================================

    update(deltaTime) {

        if (!this.isActive) return;


        // CHECK EVENT DURATION

        const elapsed =
            (Date.now() - this.eventStartTime) / 1000;

        if (elapsed >= this.eventDuration) {

            this.stopChaosEvent();

            return;

        }


        // =================================
        // MUTANT SPAWNING
        // =================================

        if (
            this.currentEvent === "mutantAttack" &&
            Date.now() - this.lastSpawnTime >= 2500
        ) {

            this.spawnMutant();

            this.lastSpawnTime = Date.now();

        }


        // =================================
        // MOVE MUTANTS TOWARDS PLAYER
        // =================================

        this.mutants.forEach(mutant => {

            const playerCenter =
                this.player.offsetLeft +
                this.player.offsetWidth / 2;

            const mutantCenter =
                mutant.x +
                mutant.element.offsetWidth / 2;

            const direction =
                playerCenter > mutantCenter ? 1 : -1;

            mutant.x +=
                direction * mutant.speed * deltaTime;

            mutant.element.style.left =
                mutant.x + "px";

        });


        // =================================
        // PIANO SPAWNING
        // =================================

        if (
            this.currentEvent === "pianoRain" &&
            Date.now() - this.lastSpawnTime >= 900
        ) {

            this.spawnPiano();

            this.lastSpawnTime = Date.now();

        }


        // =================================
        // MOVE FALLING PIANOS
        // =================================

        this.pianos.forEach(piano => {

            piano.y += piano.speed * deltaTime;

            piano.element.style.top =
                piano.y + "px";

        });


        // =================================
        // REMOVE OFF-SCREEN MUTANTS
        // =================================

        this.mutants = this.mutants.filter(mutant => {

            if (
                mutant.x < -100 ||
                mutant.x > this.gameArea.clientWidth + 100
            ) {

                mutant.element.remove();

                return false;

            }

            return true;

        });


        // =================================
        // REMOVE OFF-SCREEN PIANOS
        // =================================

        this.pianos = this.pianos.filter(piano => {

            if (piano.y > this.gameArea.clientHeight) {

                piano.element.remove();

                return false;

            }

            return true;

        });

    }


    // =====================================
    // STOP CHAOS EVENT
    // =====================================

    stopChaosEvent() {

        const wasActive = this.isActive;

        this.isActive = false;

        this.currentEvent = null;

        this.lastUpdateTime = 0;

        window.ChaosEffects.slippery = false;

        window.ChaosEffects.controlsReversed = false;

        this.player.classList.remove(
            "slippery",
            "controls-reversed"
        );

        this.gameArea.classList.remove("slippery-floor");

        this.clearAllObstacles();

        console.log("CHAOS EVENT STOPPED!");


        // Schedule another event only after a normal event ends

        if (wasActive && this.autoSchedule) {

            console.log("NEXT CHAOS EVENT IN 3 SECONDS!");

            this.scheduleNextEvent(this.cooldown);

        }

    }


    // =====================================
    // CLEAR ALL OBSTACLES
    // =====================================

    clearAllObstacles() {

        this.mutants.forEach(mutant => {
            mutant.element.remove();
        });

        this.pianos.forEach(piano => {
            piano.element.remove();
        });

        this.mutants = [];

        this.pianos = [];

    }

}


// =====================================
// MAKE CLASS AVAILABLE TO HTML
// =====================================

window.ChaosManager = ChaosManager;

console.log("CHAOS MANAGER READY!");
