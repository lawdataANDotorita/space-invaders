// Space Invaders Game
console.log("Hello World - Space Invaders Loading...");

// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let gameRunning = false;

// Initialize the game
function init() {
    console.log("Game Initialized!");
    // Draw initial message on canvas
    ctx.fillStyle = '#0f0';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hello World!', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2 + 40);
}

// Game loop (to be implemented)
function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Game logic will go here

    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        gameRunning = true;
        console.log("Game Started!");
        gameLoop();
    }
});

// Start the game
init();
