// Space Invaders - Retro Edition
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Audio Context for retro sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound effect functions
function playInvaderHitSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // High-pitched retro beep for hitting invader
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playPlayerHitSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Explosion-like sound - lower frequency with rapid decay
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.type = 'sawtooth';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Game state
let gameRunning = false;
let gameOver = false;
let score = 0;
let lives = 3;
let level = 1;

// Player
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 20,
    speed: 5,
    moveLeft: false,
    moveRight: false
};

// Bullets
let bullets = [];
const bulletSpeed = 7;
const bulletCooldown = 500; // ms
let lastBulletTime = 0;

// Enemy bullets
let enemyBullets = [];
const enemyBulletSpeed = 3;
let lastEnemyShootTime = 0;
const enemyShootInterval = 1000; // ms

// Invaders
let invaders = [];
const invaderRows = 5;
const invaderCols = 11;
const invaderWidth = 30;
const invaderHeight = 20;
const invaderPadding = 10;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderSpeed = 1;
let invaderMoveDown = false;

// Initialize invaders
function createInvaders() {
    invaders = [];
    const startX = 50;
    const startY = 60;

    for (let row = 0; row < invaderRows; row++) {
        for (let col = 0; col < invaderCols; col++) {
            invaders.push({
                x: startX + col * (invaderWidth + invaderPadding),
                y: startY + row * (invaderHeight + invaderPadding),
                width: invaderWidth,
                height: invaderHeight,
                alive: true,
                type: row < 1 ? 3 : row < 3 ? 2 : 1 // Different types for different rows
            });
        }
    }
}

// Draw player ship (retro style)
function drawPlayer() {
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;

    // Simple tank-like shape
    ctx.fillRect(player.x + 15, player.y, 10, 10);
    ctx.fillRect(player.x, player.y + 10, 40, 10);
}

// Draw invader (retro sprite style)
function drawInvader(invader) {
    if (!invader.alive) return;

    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#0f0';

    // Different sprites for different types
    const x = invader.x;
    const y = invader.y;
    const w = invader.width;
    const h = invader.height;

    if (invader.type === 3) {
        // Top row - squid
        ctx.fillRect(x + 8, y, 14, 4);
        ctx.fillRect(x + 4, y + 4, 22, 8);
        ctx.fillRect(x, y + 12, 6, 4);
        ctx.fillRect(x + 10, y + 12, 10, 4);
        ctx.fillRect(x + 24, y + 12, 6, 4);
    } else if (invader.type === 2) {
        // Middle rows - crab
        ctx.fillRect(x + 4, y, 4, 4);
        ctx.fillRect(x + 22, y, 4, 4);
        ctx.fillRect(x + 8, y + 4, 14, 8);
        ctx.fillRect(x, y + 12, 8, 4);
        ctx.fillRect(x + 22, y + 12, 8, 4);
    } else {
        // Bottom rows - octopus
        ctx.fillRect(x + 8, y, 14, 8);
        ctx.fillRect(x + 4, y + 8, 22, 4);
        ctx.fillRect(x, y + 12, 6, 4);
        ctx.fillRect(x + 12, y + 12, 6, 4);
        ctx.fillRect(x + 24, y + 12, 6, 4);
    }
}

// Draw bullet
function drawBullet(bullet) {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(bullet.x, bullet.y, 3, 10);
}

// Draw enemy bullet
function drawEnemyBullet(bullet) {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(bullet.x, bullet.y, 3, 10);
}

// Update player position
function updatePlayer() {
    if (player.moveLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.moveRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Update bullets
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bulletSpeed;
        return bullet.y > 0;
    });
}

// Update enemy bullets
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += enemyBulletSpeed;
        return bullet.y < canvas.height;
    });
}

// Update invaders
function updateInvaders() {
    let moveDown = false;
    let maxSpeed = 1 + (level - 1) * 0.5;

    // Check if any invader hit the edge
    for (let invader of invaders) {
        if (!invader.alive) continue;

        if ((invader.x + invader.width >= canvas.width && invaderDirection === 1) ||
            (invader.x <= 0 && invaderDirection === -1)) {
            moveDown = true;
            break;
        }
    }

    // Move invaders
    if (moveDown) {
        invaderDirection *= -1;
        for (let invader of invaders) {
            if (invader.alive) {
                invader.y += 20;
                // Check if invaders reached the player
                if (invader.y + invader.height >= player.y) {
                    lives = 0;
                    gameOver = true;
                }
            }
        }
    } else {
        for (let invader of invaders) {
            if (invader.alive) {
                invader.x += invaderDirection * maxSpeed;
            }
        }
    }
}

// Enemy shooting
function enemyShoot() {
    const now = Date.now();
    if (now - lastEnemyShootTime > enemyShootInterval) {
        // Find all alive invaders in the bottom row for each column
        const shooters = [];
        for (let col = 0; col < invaderCols; col++) {
            for (let row = invaderRows - 1; row >= 0; row--) {
                const invader = invaders[row * invaderCols + col];
                if (invader && invader.alive) {
                    shooters.push(invader);
                    break;
                }
            }
        }

        // Random invader shoots
        if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: 3,
                height: 10
            });
            lastEnemyShootTime = now;
        }
    }
}

// Check collisions
function checkCollisions() {
    // Player bullets hitting invaders
    bullets.forEach((bullet, bulletIndex) => {
        invaders.forEach((invader, invaderIndex) => {
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {

                invader.alive = false;
                bullets.splice(bulletIndex, 1);

                // Play hit sound
                playInvaderHitSound();

                // Update score based on invader type
                score += invader.type * 10;
                document.getElementById('score').textContent = score;

                // Check if all invaders are dead
                if (invaders.every(inv => !inv.alive)) {
                    level++;
                    createInvaders();
                }
            }
        });
    });

    // Enemy bullets hitting player
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {

            enemyBullets.splice(bulletIndex, 1);

            // Play player hit sound
            playPlayerHitSound();

            lives--;
            document.getElementById('lives').textContent = lives;

            if (lives <= 0) {
                gameOver = true;
            }
        }
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawPlayer();

    // Draw invaders
    invaders.forEach(invader => drawInvader(invader));

    // Draw bullets
    bullets.forEach(bullet => drawBullet(bullet));

    // Draw enemy bullets
    enemyBullets.forEach(bullet => drawEnemyBullet(bullet));

    // Draw level indicator
    ctx.fillStyle = '#0f0';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${level}`, canvas.width - 10, 20);
    ctx.textAlign = 'left';
}

// Game loop
function gameLoop() {
    if (!gameRunning || gameOver) {
        if (gameOver) {
            ctx.fillStyle = '#0f0';
            ctx.font = '48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Courier New';
            ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
            ctx.font = '16px Courier New';
            ctx.fillText('PRESS SPACE TO RESTART', canvas.width / 2, canvas.height / 2 + 80);
            document.getElementById('gameStatus').textContent = 'GAME OVER - PRESS SPACE TO RESTART';
        }
        return;
    }

    updatePlayer();
    updateBullets();
    updateEnemyBullets();
    updateInvaders();
    enemyShoot();
    checkCollisions();
    draw();

    requestAnimationFrame(gameLoop);
}

// Shoot bullet
function shoot() {
    const now = Date.now();
    if (now - lastBulletTime > bulletCooldown) {
        bullets.push({
            x: player.x + player.width / 2 - 1.5,
            y: player.y,
            width: 3,
            height: 10
        });
        lastBulletTime = now;
    }
}

// Reset game
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    bullets = [];
    enemyBullets = [];
    player.x = canvas.width / 2 - 20;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    createInvaders();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning) {
            gameRunning = true;
            resetGame();
            document.getElementById('gameStatus').textContent = 'GAME IN PROGRESS';
            gameLoop();
        } else if (!gameOver) {
            shoot();
        } else {
            // Restart game
            resetGame();
            gameRunning = true;
            document.getElementById('gameStatus').textContent = 'GAME IN PROGRESS';
            gameLoop();
        }
    }

    if (e.code === 'ArrowLeft') {
        player.moveLeft = true;
    }
    if (e.code === 'ArrowRight') {
        player.moveRight = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        player.moveLeft = false;
    }
    if (e.code === 'ArrowRight') {
        player.moveRight = false;
    }
});

// Initialize game
createInvaders();
draw();
