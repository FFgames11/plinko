// game.js — Plinko Physics Engine
let balls = [];

// game.js - Result-First Logic

async function dropBall() {
    if (balance < bet) {
        $('noBalanceModal').classList.remove('hidden');
        return;
    }

    balance -= bet;
    updateBalance();
    
    const board = $('plinkoBoard');
    const boardWidth = board.clientWidth;
    
    // 1. Determine destination BEFORE dropping
    const targetSlot = getWeightedRandomSlot(currentRows);
    
    // 2. Calculate visual target X — must match buildBoard() slot count exactly
    const numSlots = MULTIPLIERS[currentRows][currentRisk].length;
    const slotWidth = boardWidth / numSlots;
    const targetX = (targetSlot * slotWidth) + (slotWidth / 2);
    // Clamp safely inside board so nudge never aims outside
    const safeTargetX = Math.max(slotWidth * 0.5, Math.min(boardWidth - slotWidth * 0.5, targetX));

    const ball = {
        x: boardWidth / 2,           // Always start dead-center
        y: 10,
        vx: (Math.random() - 0.5) * 1.0,  // Tiny initial randomness
        vy: 0,
        radius: 9,
        targetSlotIndex: targetSlot,
        destinyX: safeTargetX,
        id: Date.now()
    };

    balls.push(ball);
    setControlsDisabled(true);
    if (balls.length === 1) requestAnimationFrame(updatePhysics);
}

function updatePhysics() {
    const board = $('plinkoBoard');
    const ctx = $('plinkoCanvas').getContext('2d');
    ctx.clearRect(0, 0, board.clientWidth, board.clientHeight);

    const gravity = 0.10;   // Reduced from 0.28 → slow, floaty fall
    const maxVy   = 4.5;    // Terminal velocity cap for smooth look

    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        
        // Apply Gravity (capped)
        b.vy = Math.min(b.vy + gravity, maxVy);
        
        // Gentle horizontal damping for smoother motion
        b.vx *= 0.97;

        // --- THE "DESTINY" NUDGE ---
        // Strength grows as ball falls, but stays gentle to avoid wild swings
        const fallProgress = Math.min(b.y / board.clientHeight, 0.85);
        const nudgeForce = 0.025 * fallProgress;
        b.vx += (b.destinyX - b.x) * nudgeForce;

        // Hard-clamp vx so ball can NEVER shoot out of bounds
        b.vx = Math.max(-5, Math.min(5, b.vx));

        b.x += b.vx;
        b.y += b.vy;
        
        // Boundary Walls — hard push back, no clipping
        if (b.x < b.radius) { b.x = b.radius + 1; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > board.clientWidth - b.radius) { b.x = board.clientWidth - b.radius - 1; b.vx = -Math.abs(b.vx) * 0.6; }

        // Peg Collisions — light up peg on hit
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
                // Slower bounce speed after collision
                b.vx = Math.cos(angle) * 2.2;
                b.vy = Math.abs(Math.sin(angle) * 2.2);

                // Light up the peg
                if (!peg.classList.contains('peg-hit')) {
                    peg.classList.add('peg-hit');
                    setTimeout(() => peg.classList.remove('peg-hit'), 300);
                }
            }
        });

        // Draw Ball — shrink + fade out when landing
        const alpha = b.landing ? Math.max(0, 1 - b.landingProgress) : 1;
        const drawRadius = b.radius * (b.landing ? (1 + b.landingProgress * 0.6) : 1);
        if (alpha > 0) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(b.x, b.y, drawRadius, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.BALL || '#ff00ff';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }

        // Landing — detect when ball reaches the slot strip
        if (!b.landing) {
            const slots = document.querySelectorAll('.slot');
            const targetSlotEl = slots[b.targetSlotIndex];
            const boardRect = board.getBoundingClientRect();
            const slotTriggerY = targetSlotEl
                ? targetSlotEl.getBoundingClientRect().top - boardRect.top
                : board.clientHeight - 35;

            if (b.y > slotTriggerY) {
                b.landing = true;
                b.landingProgress = 0;

                if (targetSlotEl) {
                    targetSlotEl.classList.add('slot-hit');
                    setTimeout(() => targetSlotEl.classList.remove('slot-hit'), 900);

                    // Floating win text above the slot
                    const rect = targetSlotEl.getBoundingClientRect();
                    const floatEl = document.createElement('div');
                    floatEl.className = 'float-win-text';
                    const finalMult = MULTIPLIERS[currentRows][currentRisk][b.targetSlotIndex];
                    const winAmt = bet * finalMult;
                    floatEl.textContent = '+$' + winAmt.toFixed(2);
                    floatEl.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
                    floatEl.style.top = (rect.top - boardRect.top - 10) + 'px';
                    board.appendChild(floatEl);
                    setTimeout(() => floatEl.remove(), 1000);
                }

                const finalMult = MULTIPLIERS[currentRows][currentRisk][b.targetSlotIndex];
                processResult(bet * finalMult, finalMult);
            }
        }

        // Advance fade-out, then remove ball
        if (b.landing) {
            b.landingProgress += 0.06;
            if (b.landingProgress >= 1) {
                balls.splice(i, 1);
                if (balls.length === 0) setControlsDisabled(false);
            }
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
    showWin(win, mult);
    if (mult >= 5) spawnParticles(true);
}