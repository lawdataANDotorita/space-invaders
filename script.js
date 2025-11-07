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

function playSpecialWeaponSound() {
    // Launch sound - ascending pitch with vibrato
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    oscillator1.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);

    gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator1.type = 'square';
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.2);
}

function playSpecialExplosionSound() {
    // Multi-layered explosion sound
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(600 - i * 200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.type = 'sawtooth';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 50);
    }
}

// Game state
let gameRunning = false;
let gameOver = false;
let gamePaused = false;
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

// Special weapon - double-tap space to activate
let specialBullets = [];
const specialBulletSpeed = 10;
let lastSpacePress = 0;
const doubleTapThreshold = 300; // ms for double-tap detection

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

// Draw special bullet with enhanced effects
function drawSpecialBullet(bullet) {
    // Glowing aura
    const gradient = ctx.createRadialGradient(
        bullet.x + 4, bullet.y + 10, 0,
        bullet.x + 4, bullet.y + 10, 15
    );
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(bullet.x - 8, bullet.y - 5, 24, 30);

    // Main missile body
    ctx.fillStyle = '#ff0';
    ctx.fillRect(bullet.x, bullet.y, 8, 20);

    // Flashing core
    const flash = Math.sin(Date.now() / 50) > 0;
    if (flash) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(bullet.x + 2, bullet.y + 5, 4, 10);
    }

    // Trail effect
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    ctx.fillRect(bullet.x + 1, bullet.y + 20, 6, 8);
    ctx.fillStyle = 'rgba(255, 50, 0, 0.3)';
    ctx.fillRect(bullet.x + 2, bullet.y + 28, 4, 6);
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

// Update special bullets
function updateSpecialBullets() {
    specialBullets = specialBullets.filter(bullet => {
        bullet.y -= specialBulletSpeed;
        return bullet.y > 0;
    });
}

// Draw explosion effect
function drawExplosion(x, y, radius) {
    // Multiple expanding rings
    for (let i = 0; i < 5; i++) {
        const ringRadius = radius * (i + 1) / 5;
        const alpha = 1 - (i / 5);

        ctx.strokeStyle = `rgba(255, ${200 - i * 40}, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Flash center
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius / 2, 0, Math.PI * 2);
    ctx.fill();
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

// Helper function to find adjacent invaders
function findAdjacentInvaders(hitInvader) {
    const adjacent = [];
    const hitRow = Math.floor(invaders.indexOf(hitInvader) / invaderCols);
    const hitCol = invaders.indexOf(hitInvader) % invaderCols;

    // Check all 8 directions (including diagonals)
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // Skip the hit invader itself

            const newRow = hitRow + dr;
            const newCol = hitCol + dc;

            if (newRow >= 0 && newRow < invaderRows &&
                newCol >= 0 && newCol < invaderCols) {
                const index = newRow * invaderCols + newCol;
                if (invaders[index] && invaders[index].alive) {
                    adjacent.push(invaders[index]);
                }
            }
        }
    }

    return adjacent;
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

    // Special bullets hitting invaders
    specialBullets.forEach((bullet, bulletIndex) => {
        invaders.forEach((invader, invaderIndex) => {
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {

                // Mark the hit invader for destruction
                invader.alive = false;

                // Find and destroy all adjacent invaders
                const adjacentInvaders = findAdjacentInvaders(invader);
                let destroyedCount = 1; // Count the initial hit

                adjacentInvaders.forEach(adj => {
                    adj.alive = false;
                    destroyedCount++;
                    // Draw explosion for each adjacent invader
                    drawExplosion(adj.x + adj.width / 2, adj.y + adj.height / 2, 30);
                });

                // Draw main explosion at hit point
                drawExplosion(invader.x + invader.width / 2, invader.y + invader.height / 2, 50);

                // Play special explosion sound
                playSpecialExplosionSound();

                // Remove the special bullet
                specialBullets.splice(bulletIndex, 1);

                // Bonus score for special weapon
                score += destroyedCount * 50;
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

    // Draw special bullets
    specialBullets.forEach(bullet => drawSpecialBullet(bullet));

    // Draw enemy bullets
    enemyBullets.forEach(bullet => drawEnemyBullet(bullet));

    // Draw level indicator
    ctx.fillStyle = '#0f0';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${level}`, canvas.width - 10, 20);
    ctx.textAlign = 'left';

    // Draw pause message
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Courier New';
        ctx.fillText('PRESS P TO RESUME', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
    }
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

    // Only update game state if not paused
    if (!gamePaused) {
        updatePlayer();
        updateBullets();
        updateSpecialBullets();
        updateEnemyBullets();
        updateInvaders();
        enemyShoot();
        checkCollisions();
    }

    // Always draw, even when paused
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

// Shoot special weapon
function shootSpecialWeapon() {
    specialBullets.push({
        x: player.x + player.width / 2 - 4,
        y: player.y,
        width: 8,
        height: 20
    });
    playSpecialWeaponSound();
}

// Reset game
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    gamePaused = false;
    bullets = [];
    specialBullets = [];
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
        } else if (!gameOver && !gamePaused) {
            // Check for double-tap
            const now = Date.now();
            const timeSinceLastPress = now - lastSpacePress;

            if (timeSinceLastPress < doubleTapThreshold) {
                // Double-tap detected - fire special weapon
                shootSpecialWeapon();
                lastSpacePress = 0; // Reset to prevent triple-tap
            } else {
                // Single tap - regular shoot
                shoot();
                lastSpacePress = now;
            }
        } else if (gameOver) {
            // Restart game
            resetGame();
            gameRunning = true;
            document.getElementById('gameStatus').textContent = 'GAME IN PROGRESS';
            gameLoop();
        }
    }

    // Pause functionality
    if (e.code === 'KeyP') {
        if (gameRunning && !gameOver) {
            gamePaused = !gamePaused;
            document.getElementById('gameStatus').textContent = gamePaused ? 'PAUSED' : 'GAME IN PROGRESS';
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
