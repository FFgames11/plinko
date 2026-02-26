// game.js — Plinko Physics Engine
let balls = [];

// game.js - Result-First Logic

async function dropBall() {
    if (balance < bet) return;

    balance -= bet;
    updateBalance();
    
    const board = $('plinkoBoard');
    const boardWidth = board.clientWidth;
    
    // 1. Determine destination BEFORE dropping
    const targetSlot = getWeightedRandomSlot(currentRows);
    
    // 2. Calculate visual target X
    const slotWidth = boardWidth / (currentRows + 1);
    const targetX = (targetSlot * slotWidth) + (slotWidth / 2);

    const ball = {
        x: boardWidth / 2 + (Math.random() * 20 - 10),
        y: 10,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: 5,
        targetSlotIndex: targetSlot, // Store the intended outcome
        destinyX: targetX,           // Store the intended X
        id: Date.now()
    };

    balls.push(ball);
    if (balls.length === 1) requestAnimationFrame(updatePhysics);
}

function updatePhysics() {
    const board = $('plinkoBoard');
    const ctx = $('plinkoCanvas').getContext('2d');
    ctx.clearRect(0, 0, board.clientWidth, board.clientHeight);

    const gravity = 0.28;
    const friction = 0.98;

    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        
        // Apply Gravity
        b.vy += gravity;
        
        // --- THE "DESTINY" NUDGE ---
        // Gently guide ball toward its destinyX based on how far it has fallen
        const fallProgress = b.y / board.clientHeight;
        const nudgeForce = 0.05 * fallProgress; 
        b.vx += (b.destinyX - b.x) * nudgeForce;

        b.x += b.vx;
        b.y += b.vy;
        
        // Boundary Walls (Prevents balls flying off and hitting 1000x by mistake)
        if (b.x < b.radius) { b.x = b.radius; b.vx *= -0.5; }
        if (b.x > board.clientWidth - b.radius) { b.x = board.clientWidth - b.radius; b.vx *= -0.5; }

        // Peg Collisions (Visual Only)
        document.querySelectorAll('.peg').forEach(peg => {
            const rect = peg.getBoundingClientRect();
            const bRect = board.getBoundingClientRect();
            const px = rect.left - bRect.left + 3;
            const py = rect.top - bRect.top + 3;
            
            const dx = b.x - px;
            const dy = b.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < b.radius + 3) {
                const angle = Math.atan2(dy, dx);
                b.vx = Math.cos(angle) * 3;
                b.vy = Math.abs(Math.sin(angle) * 3);
            }
        });

        // Draw Ball
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.BALL || '#ff00ff';
        ctx.fill();
        ctx.closePath();

        // Landing Logic
        if (b.y > board.clientHeight - 35) {
            // IGNORE final X position, use the pre-calculated targetSlotIndex
            const finalMult = MULTIPLIERS[currentRows][currentRisk][b.targetSlotIndex];
            processResult(bet * finalMult, finalMult);
            balls.splice(i, 1);
        }
    }

    if (balls.length > 0) requestAnimationFrame(updatePhysics);
}

function calculateLanding(finalX) {
    const boardWidth = $('plinkoBoard').clientWidth;
    const slotWidth = boardWidth / (currentRows + 1);
    const slotIdx = Math.floor(finalX / slotWidth);
    const clampedIdx = Math.max(0, Math.min(slotIdx, currentRows));
    
    const mult = MULTIPLIERS[currentRows][currentRisk][clampedIdx];
    const winAmount = bet * mult;

    processResult(winAmount, mult);
}

function processResult(win, mult) {
    balance += win;
    updateBalance();
    
    if (win > 0) {
        $('winDisplay').textContent = '$' + win.toFixed(2);
        showWin(win, false);
        if (mult >= 5) spawnParticles(true);
    }
}