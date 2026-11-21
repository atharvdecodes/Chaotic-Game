
console.log("PLAYER JS LOADED!");

const player = document.getElementById("player");
const gameArea = document.getElementById("gameArea");
const ground = document.getElementById("ground");

const livesDisplay = document.getElementById("lives");
const statusDisplay = document.getElementById("status");
const gameOver = document.getElementById("gameOver");
const timerDisplay = document.getElementById("timer");


/* PLAYER VARIABLES */

let x = 60;
let y = 0;

let speed = 240;
let jumpPower = 620;
let gravity = 1500;

let velocityY = 0;
let horizontalVelocity = 0;

let lives = 3;
let timeLeft = 120;

let grounded = true;
let alive = false;
let sneaking = false;

let left = false;
let right = false;

let collisionBlocked = false;

let lastTime = 0;
let animationId = null;
let timerInterval = null;


/* SHARED CHAOS EFFECTS */

window.ChaosEffects = {
    slippery: false,
    controlsReversed: false
};


/* DISPLAY LIVES */

function updateLives() {

    let hearts = [];

    for (let i = 0; i < 3; i++) {
        hearts.push(i < lives ? "♥" : "♡");
    }

    livesDisplay.textContent = hearts.join(" ");

}


/* DISPLAY TIMER */

function updateTimer() {

    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

}


/* START COUNTDOWN */

function startTimer() {

    clearInterval(timerInterval);

    timeLeft = 120;

    updateTimer();

    timerInterval = setInterval(function() {

        if (!alive) {
            clearInterval(timerInterval);
            return;
        }

        timeLeft--;

        updateTimer();

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            finishByTime();

        }

    }, 1000);

}


/* TIME FINISHED */

function finishByTime() {

    if (!alive) return;

    alive = false;

    clearInterval(timerInterval);

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    left = false;
    right = false;

    gameOver.textContent = "TIME'S UP!";
    gameOver.style.display = "flex";

    statusDisplay.textContent = "You survived for 2 minutes!";

    // Notify HTML that the player has won.

    document.dispatchEvent(
        new Event("player:victory")
    );

}


/* SNEAKING */

function updateSneak() {

    if (sneaking && grounded) {
        player.classList.add("sneak");
    } else {
        player.classList.remove("sneak");
    }

}


/* KEYBOARD CONTROLS */

document.addEventListener("keydown", function(e) {

    if (
        ["ArrowLeft", "ArrowRight", "ArrowUp",
         "ArrowDown", "Space"].includes(e.code)
    ) {
        e.preventDefault();
    }

    if (!alive) return;

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        left = true;
    }

    if (e.code === "ArrowRight" || e.code === "KeyD") {
        right = true;
    }

    if (
        (e.code === "ArrowUp" ||
         e.code === "Space" ||
         e.code === "KeyW") &&
        grounded
    ) {
        velocityY = jumpPower;
        grounded = false;
    }

    if (e.code === "ArrowDown" || e.code === "KeyS") {
        sneaking = true;
        updateSneak();
    }

});


/* STOP MOVEMENT */

document.addEventListener("keyup", function(e) {

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        left = false;
    }

    if (e.code === "ArrowRight" || e.code === "KeyD") {
        right = false;
    }

    if (e.code === "ArrowDown" || e.code === "KeyS") {
        sneaking = false;
        updateSneak();
    }

});


/* STOP KEYS WHEN WINDOW LOSES FOCUS */

window.addEventListener("blur", function() {

    left = false;
    right = false;
    sneaking = false;

    updateSneak();

});


/* PLAYER MOVEMENT */

function updatePlayer(dt) {

    if (!alive) return;

    const effects = window.ChaosEffects;

    let direction = 0;

    if (left && !right) {
        direction = -1;
    }

    if (right && !left) {
        direction = 1;
    }

    // REVERSED CONTROLS

    if (effects.controlsReversed) {
        direction *= -1;
    }

    // HORIZONTAL MOVEMENT

    if (direction !== 0) {

        horizontalVelocity = direction * speed;

    } else {

        const friction = effects.slippery ? 2.2 : 18;

        horizontalVelocity *= Math.exp(-friction * dt);

        if (Math.abs(horizontalVelocity) < 2) {
            horizontalVelocity = 0;
        }

    }

    x += horizontalVelocity * dt;


    // GRAVITY

    velocityY -= gravity * dt;

    y += velocityY * dt;

    if (y <= 0) {

        y = 0;
        velocityY = 0;
        grounded = true;

    } else {

        grounded = false;

    }


    // GAME AREA BOUNDARIES

    const maxX = gameArea.clientWidth - player.offsetWidth;

    if (x < 0) {
        x = 0;
        horizontalVelocity = 0;
    }

    if (x > maxX) {
        x = maxX;
        horizontalVelocity = 0;
    }


    // UPDATE PLAYER POSITION

    updateSneak();

    player.style.left = x + "px";

    player.style.bottom =
        (ground.offsetHeight + y) + "px";

}


/* COLLISION DETECTION */

function checkCollision() {

    if (!alive) return;

    const playerRect = player.getBoundingClientRect();

    const obstacles =
        gameArea.querySelectorAll(".obstacle");

    let touching = false;

    obstacles.forEach(function(obstacle) {

        const obstacleRect = obstacle.getBoundingClientRect();

        const collision =
            playerRect.left < obstacleRect.right &&
            playerRect.right > obstacleRect.left &&
            playerRect.top < obstacleRect.bottom &&
            playerRect.bottom > obstacleRect.top;

        if (collision) {
            touching = true;
        }

    });


    // DAMAGE ONLY ONCE PER CONTACT

    if (touching && !collisionBlocked) {

        collisionBlocked = true;

        takeDamage();

    }


    // ALLOW DAMAGE AGAIN AFTER LEAVING

    if (!touching) {
        collisionBlocked = false;
    }

}


/* PLAYER DAMAGE */

function takeDamage() {

    if (!alive || lives <= 0) return;

    lives--;

    updateLives();

    statusDisplay.textContent = "Player hit! Life lost.";

    player.classList.remove("damage");

    void player.offsetWidth;

    player.classList.add("damage");


    document.dispatchEvent(
        new CustomEvent("player:damage", {
            detail: { lives: lives }
        })
    );


    if (lives === 0) {

        eliminatePlayer();

    } else {

        setTimeout(function() {
            player.classList.remove("damage");
        }, 500);

    }

}


/* PLAYER DEATH */

function eliminatePlayer() {

    if (!alive) return;

    alive = false;

    left = false;
    right = false;

    horizontalVelocity = 0;

    clearInterval(timerInterval);

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    player.style.display = "none";

    gameOver.textContent = "PLAYER ELIMINATED!";

    gameOver.style.display = "flex";

    statusDisplay.textContent = "Game Over! All lives lost.";


    document.dispatchEvent(
        new Event("player:death")
    );

}


/* GAME LOOP */

function gameLoop(timestamp) {

    if (!alive) return;

    if (!lastTime) {
        lastTime = timestamp;
    }

    let dt = (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    dt = Math.min(dt, 0.05);

    updatePlayer(dt);

    checkCollision();

    if (alive) {
        animationId = requestAnimationFrame(gameLoop);
    }

}


/* RESET PLAYER AND TIMER */

function resetPlayer(startImmediately = true) {

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    clearInterval(timerInterval);

    x = 60;
    y = 0;

    velocityY = 0;
    horizontalVelocity = 0;

    lives = 3;
    timeLeft = 120;

    grounded = true;
    alive = startImmediately;

    sneaking = false;

    left = false;
    right = false;

    collisionBlocked = false;

    lastTime = 0;


    // RESET CHAOS EFFECTS

    window.ChaosEffects.slippery = false;
    window.ChaosEffects.controlsReversed = false;


    // RESET PLAYER APPEARANCE

    player.style.display = "block";

    player.style.left = x + "px";

    player.style.bottom =
        ground.offsetHeight + "px";

    player.classList.remove(
        "damage",
        "sneak",
        "slippery",
        "controls-reversed"
    );

    gameArea.classList.remove("slippery-floor");


    // RESET GAME OVER

    gameOver.style.display = "none";

    gameOver.textContent = "PLAYER ELIMINATED!";

    statusDisplay.textContent = "Player is ready!";


    // UPDATE DISPLAY

    updateLives();

    updateTimer();


    // START GAME SYSTEMS ONLY WHEN REQUESTED

    if (startImmediately) {

        startTimer();

        animationId = requestAnimationFrame(gameLoop);

        document.dispatchEvent(
            new Event("player:restart")
        );

    }

}


/* PLAYER MODULE */

window.PlayerModule = {

    reset: resetPlayer,

    damage: takeDamage,

    getLives: function() {
        return lives;
    },

    isAlive: function() {
        return alive;
    }

};


/* INITIALIZE WITHOUT STARTING THE GAME */

resetPlayer(false);

console.log("PLAYER INITIALIZED!");
