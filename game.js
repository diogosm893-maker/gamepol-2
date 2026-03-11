/**
 * City Chase - Arcade Maze Runner
 * Lógica do Jogo
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesContainer = document.getElementById('lives-container');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const restartBtn = document.getElementById('restart-btn');

// Configurações do Grid
const TILE_SIZE = 32;
const ROWS = 21;
const COLS = 19;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Mapa Original
const INITIAL_MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,4,4,4,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,5,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let maze = JSON.parse(JSON.stringify(INITIAL_MAZE));

// Estado do Jogo
let score = 0;
let lives = 3;
let gameState = 'START';
let powerUpTimer = 0;
const POWERUP_DURATION = 600;

// Som
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    switch(type) {
        case 'coin':
            osc.className = 'collection';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
            break;
        case 'powerup':
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
            break;
        case 'death':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(20, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
            break;
        case 'bribed':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
            break;
    }
}

// Assets
const sprites = {
    player: new Image(),
    police: new Image(),
    money: new Image(),
    diamond: new Image()
};
sprites.player.src = 'assets/player.png';
sprites.police.src = 'assets/police.png';
sprites.money.src = 'assets/money_bag.png';
sprites.diamond.src = 'assets/diamond.png';

// Classes
class Entity {
    constructor(x, y, speed) {
        this.startX = x;
        this.startY = y;
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.speed = speed;
        this.dirX = 0;
        this.dirY = 0;
        this.targetDirX = 0;
        this.targetDirY = 0;
    }

    getGridPos() {
        return {
            col: Math.floor((this.x + TILE_SIZE / 2) / TILE_SIZE),
            row: Math.floor((this.y + TILE_SIZE / 2) / TILE_SIZE)
        };
    }

    isAtIntersection() {
        // Use tolerance to allow for non-integer step speeds
        const tolerance = this.speed;
        return (this.x % TILE_SIZE < tolerance || this.x % TILE_SIZE > TILE_SIZE - tolerance) &&
               (this.y % TILE_SIZE < tolerance || this.y % TILE_SIZE > TILE_SIZE - tolerance);
    }

    snapToGrid() {
        this.x = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
        this.y = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
    }

    canMove(dx, dy) {
        if (dx === 0 && dy === 0) return true;
        
        // Calculate next tile position based on current grid center
        const gridPos = this.getGridPos();
        const nextCol = gridPos.col + dx;
        const nextRow = gridPos.row + dy;
        
        if (nextCol < 0 || nextCol >= COLS) return true; // Horizontal wrap paths
        if (nextRow < 0 || nextRow >= ROWS) return false;

        const tile = maze[nextRow][nextCol];
        return tile !== 1;
    }

    move() {
        if (this.isAtIntersection()) {
            if (this.canMove(this.targetDirX, this.targetDirY)) {
                // Change direction and snap to grid to stay aligned
                if (this.dirX !== this.targetDirX || this.dirY !== this.targetDirY) {
                    this.snapToGrid();
                }
                this.dirX = this.targetDirX;
                this.dirY = this.targetDirY;
            } else if (!this.canMove(this.dirX, this.dirY)) {
                // Stop at wall and snap
                this.snapToGrid();
                this.dirX = 0;
                this.dirY = 0;
            }
        }

        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;

        // Horizontal wrap around
        if (this.x < -TILE_SIZE) this.x = (COLS - 1) * TILE_SIZE;
        if (this.x > COLS * TILE_SIZE) this.x = 0;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 2); // Integer speed to avoid precision issues
    }

    update() {
        this.move();
        this.checkCollisions();
    }

    checkCollisions() {
        const pos = this.getGridPos();
        if (pos.row < 0 || pos.row >= ROWS) return;
        const tile = maze[pos.row][pos.col];

        if (tile === 2) {
            maze[pos.row][pos.col] = 0;
            score += 100;
            playSound('coin');
            updateHUD();
            checkWin();
        } else if (tile === 3) {
            maze[pos.row][pos.col] = 0;
            score += 500;
            powerUpTimer = POWERUP_DURATION;
            playSound('powerup');
            updateHUD();
        }
    }

    draw() {
        if (powerUpTimer > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'gold';
        }
        ctx.drawImage(sprites.player, this.x, this.y, TILE_SIZE, TILE_SIZE);
        ctx.shadowBlur = 0;
    }
}

class Police extends Entity {
    constructor(x, y, type) {
        super(x, y, 2); // Integer speed
        this.type = type;
        this.frightened = false;
    }

    update() {
        this.frightened = powerUpTimer > 0;
        
        if (this.isAtIntersection()) {
            this.chooseDirection();
        }

        this.move();
        this.checkPlayerCollision();
    }

    chooseDirection() {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];

        const validMoves = directions.filter(d => {
            if (d.dx === -this.dirX && d.dy === -this.dirY) return false;
            return this.canMove(d.dx, d.dy);
        });

        if (validMoves.length === 0) {
            this.targetDirX = -this.dirX;
            this.targetDirY = -this.dirY;
            return;
        }

        // Behavior logic
        let targetX = player.x;
        let targetY = player.y;

        if (this.frightened) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.targetDirX = randomMove.dx;
            this.targetDirY = randomMove.dy;
            return;
        }

        switch(this.type) {
            case 'CHASE':
                targetX = player.x;
                targetY = player.y;
                break;
            case 'AMBUSH':
                targetX = player.x + (player.dirX || 0) * TILE_SIZE * 4;
                targetY = player.y + (player.dirY || 0) * TILE_SIZE * 4;
                break;
            case 'FLANK':
                const chaseGhost = enemies[0];
                const vecX = (player.x + (player.dirX || 0) * TILE_SIZE * 2) - chaseGhost.x;
                const vecY = (player.y + (player.dirY || 0) * TILE_SIZE * 2) - chaseGhost.y;
                targetX = chaseGhost.x + vecX * 2;
                targetY = chaseGhost.y + vecY * 2;
                break;
            case 'RANDOM':
                const rMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.targetDirX = rMove.dx;
                this.targetDirY = rMove.dy;
                return;
        }

        let bestMove = validMoves[0];
        let minDist = Infinity;
        validMoves.forEach(m => {
            const nextX = (Math.round(this.x/TILE_SIZE) + m.dx) * TILE_SIZE;
            const nextY = (Math.round(this.y/TILE_SIZE) + m.dy) * TILE_SIZE;
            const dist = Math.sqrt((nextX - targetX)**2 + (nextY - targetY)**2);
            if (dist < minDist) {
                minDist = dist;
                bestMove = m;
            }
        });

        this.targetDirX = bestMove.dx;
        this.targetDirY = bestMove.dy;
    }

    checkPlayerCollision() {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < TILE_SIZE * 0.7) {
            if (this.frightened) {
                this.respawn();
                score += 1000;
                playSound('bribed');
                updateHUD();
            } else {
                handleDeath();
            }
        }
    }

    respawn() {
        this.x = this.startX * TILE_SIZE;
        this.y = this.startY * TILE_SIZE;
        this.dirX = 0;
        this.dirY = 0;
        this.targetDirX = 0;
        this.targetDirY = 0;
    }

    draw() {
        ctx.save();
        if (this.frightened) {
            ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
            if (powerUpTimer < 120 && powerUpTimer % 20 < 10) ctx.filter = 'none';
        } else {
            const flicker = Math.floor(Date.now() / 150) % 2 === 0;
            ctx.shadowBlur = 10;
            ctx.shadowColor = flicker ? '#ff0000' : '#0000ff';
        }
        ctx.drawImage(sprites.police, this.x, this.y, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    }
}

// Inicialização
let player = new Player(9, 15);
let enemies = [
    new Police(9, 9, 'CHASE'),
    new Police(8, 9, 'AMBUSH'),
    new Police(10, 9, 'FLANK'),
    new Police(9, 8, 'RANDOM')
];

function updateHUD() {
    scoreElement.textContent = score.toString().padStart(6, '0');
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const img = document.createElement('img');
        img.src = 'assets/player.png';
        img.className = 'life-icon';
        livesContainer.appendChild(img);
    }
}

function handleDeath() {
    playSound('death');
    lives--;
    updateHUD();
    if (lives <= 0) {
        endGame(false);
    } else {
        gameState = 'PAUSED';
        setTimeout(() => {
            resetPositions();
            gameState = 'PLAYING';
        }, 1000);
    }
}

function resetPositions() {
    player.x = 9 * TILE_SIZE;
    player.y = 15 * TILE_SIZE;
    player.dirX = 0;
    player.dirY = 0;
    player.targetDirX = 0;
    player.targetDirY = 0;
    enemies.forEach(e => e.respawn());
}

function checkWin() {
    let collectables = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (maze[r][c] === 2) collectables++;
        }
    }
    if (collectables === 0) endGame(true);
}

function endGame(won) {
    gameState = won ? 'WON' : 'OVER';
    overlay.classList.remove('hidden');
    overlayTitle.textContent = won ? 'MISSION ACCOMPLISHED' : 'BUSTED!';
    overlayTitle.style.color = won ? 'var(--primary-color)' : 'var(--secondary-color)';
    overlayMessage.textContent = won ? `You got away with $${score}!` : 'The long arm of the law caught you.';
    restartBtn.textContent = 'RETRY MISSION';
}

function restartGame() {
    score = 0;
    lives = 3;
    maze = JSON.parse(JSON.stringify(INITIAL_MAZE));
    resetPositions();
    gameState = 'PLAYING';
    overlay.classList.add('hidden');
    updateHUD();
}

// Input
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    
    switch(e.key) {
        case 'ArrowUp': player.targetDirX = 0; player.targetDirY = -1; break;
        case 'ArrowDown': player.targetDirX = 0; player.targetDirY = 1; break;
        case 'ArrowLeft': player.targetDirX = -1; player.targetDirY = 0; break;
        case 'ArrowRight': player.targetDirX = 1; player.targetDirY = 0; break;
    }
    
    if (gameState === 'START') {
        gameState = 'PLAYING';
        overlay.classList.add('hidden');
    }
});

restartBtn.addEventListener('click', restartGame);

function draw() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, canvas.height); ctx.stroke();
    }
    for(let i=0; i<ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(canvas.width, i*TILE_SIZE); ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = maze[r][c];
            const px = c * TILE_SIZE;
            const py = r * TILE_SIZE;

            if (tile === 1) {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (tile === 2) {
                ctx.drawImage(sprites.money, px + 8, py + 8, 16, 16);
            } else if (tile === 3) {
                const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
                const size = 24 * scale;
                ctx.drawImage(sprites.diamond, px + (TILE_SIZE - size)/2, py + (TILE_SIZE - size)/2, size, size);
            }
        }
    }

    if (gameState === 'PLAYING') {
        player.update();
        enemies.forEach(e => e.update());
        if (powerUpTimer > 0) powerUpTimer--;
    }

    enemies.forEach(e => e.draw());
    player.draw();

    requestAnimationFrame(draw);
}

updateHUD();
overlay.classList.remove('hidden');
overlayTitle.textContent = 'CITY CHASE';
overlayMessage.textContent = 'ARROW KEYS TO MOVE. COLLECT ALL MONEY BAGS.';
restartBtn.textContent = 'START HEIST';

draw();

