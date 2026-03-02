// ui.js — Plinko UI
function updateBalance() {
    $('balanceDisplay').textContent = '$' + balance.toFixed(2);
}

function setRows(val) {
    currentRows = parseInt(val);
    // Update slider track fill: 8→0%, 12→50%, 16→100%
    const pct = ((currentRows - 8) / (16 - 8)) * 100;
    const slider = document.getElementById('rowsSlider');
    if (slider) slider.style.background = `linear-gradient(90deg, var(--gold) ${pct}%, var(--gold) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
    buildBoard();
}

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

function cycleRisk(dir) {
    const idx = RISK_LEVELS.indexOf(currentRisk);
    const next = (idx + dir + RISK_LEVELS.length) % RISK_LEVELS.length;
    currentRisk = RISK_LEVELS[next];
    $('riskLabel').textContent = currentRisk;
    buildBoard();
}

function setRisk(risk) {
    currentRisk = risk;
    if ($('riskLabel')) $('riskLabel').textContent = risk;
    buildBoard();
}

// ui.js — Dynamic Board Scaler
function buildBoard() {
  const container = $('plinkoBoard');
  if (!container) return;

  // 1. Clear and Setup Canvas
  container.innerHTML = '<canvas id="plinkoCanvas"></canvas>';
  const canvas = $('plinkoCanvas');

  // Use getBoundingClientRect for accurate post-layout dimensions
  const rect = container.getBoundingClientRect();
  const w = rect.width  || container.clientWidth;
  const h = rect.height || container.clientHeight;
  canvas.width  = w;
  canvas.height = h;

  const rows = currentRows;

  // 2. Dynamic spacing — always fills the board tightly for any row count
  const slotStripHeight = 0;
  const paddingTop = 20;
  const paddingX = 20;

  // Max pegs in last row = rows + 2
  const maxPegs = rows + 2;
  const spacingX = (w - paddingX * 2) / (maxPegs - 1);

  const availableHeight = h - paddingTop - slotStripHeight - spacingX; // square cells
  const spacingY = Math.min(spacingX, availableHeight / (rows - 1 + 1));

  // 3. Build Pegs
  for (let i = 0; i < rows; i++) {
    const rowY = paddingTop + i * spacingY;
    const pegsInRow = i + 3;
    const rowWidth = (pegsInRow - 1) * spacingX;
    const startX = (w - rowWidth) / 2;

    for (let j = 0; j < pegsInRow; j++) {
      const peg = document.createElement('div');
      peg.className = 'peg';
      const x = startX + j * spacingX;
      const tx = x - 3;
      const ty = rowY - 3;
      peg.style.left = '0px';
      peg.style.top = '0px';
      peg.style.setProperty('--tx', `${tx}px`);
      peg.style.setProperty('--ty', `${ty}px`);
      peg.style.transform = `translate(${tx}px, ${ty}px)`;
      container.appendChild(peg);
    }
  }

  // 4. Build Slots — flush below the last peg row
  const lastRowY = paddingTop + (rows - 1) * spacingY;
  const slotContainer = document.createElement('div');
  slotContainer.className = 'slot-container';
  slotContainer.style.top = (lastRowY + spacingY * 0.6) + 'px';
  slotContainer.style.bottom = 'auto';
  const currentMults = MULTIPLIERS[rows][currentRisk];
  const slotWidth = w / currentMults.length;

  currentMults.forEach(m => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = m + 'x';
    slot.style.background = getSlotColor(m);
    slot.style.width = `${slotWidth}px`;
    slotContainer.appendChild(slot);
  });
  container.appendChild(slotContainer);
}

function getSlotColor(m) {
    if (m >= 10) return '#ef4444';
    if (m >= 2) return '#f59e0b';
    if (m >= 1) return '#10b981';
    return '#3b82f6';
}

function startGame() {
    $('mainMenu').classList.add('hidden');
    $('gameRoot').classList.remove('hidden');
    // Defer so browser finishes layout before reading dimensions
    requestAnimationFrame(() => requestAnimationFrame(() => buildBoard()));

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => buildBoard(), 150);
    });
}

function showWin(amount, mult) {
    const pillClass = 'side-pill ' + (mult >= 10 ? 'pill-big' : mult >= 2 ? 'pill-win' : mult >= 1 ? 'pill-mid' : 'pill-loss');
    const pillText = mult + 'x';

    // Side strip (desktop/tablet)
    const side = $('winHistorySide');
    if (side) {
        const pill = document.createElement('div');
        pill.className = pillClass;
        pill.textContent = pillText;
        side.insertBefore(pill, side.firstChild);
        while (side.children.length > 10) side.removeChild(side.lastChild);
    }

    // Bottom strip (mobile)
    const bottom = $('winHistoryBottom');
    if (bottom) {
        const pill = document.createElement('div');
        pill.className = pillClass;
        pill.textContent = pillText;
        bottom.insertBefore(pill, bottom.firstChild);
        while (bottom.children.length > 10) bottom.removeChild(bottom.lastChild);
    }
}

function spawnParticles(big = false) {
    const ct = $('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = 'gold';
        p.style.top = '-10px';
        p.style.animationDuration = (1 + Math.random()) + 's';
        ct.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
}

// ui.js — Robust Loading Screen
async function runLoadingScreen() {
  const ct = $('loadStars');
  
  // 1. Generate Stars (if container exists)
  if (ct) {
    for (let i = 0; i < 50; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const sz = 1 + Math.random() * 3;
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;position:absolute;background:#fff;border-radius:50%;`;
      ct.appendChild(s);
    }
  }

  // 2. Simple timeout to simulate loading since we don't have a progress bar anymore
  await delay(2000); 

  // 3. Hide loading and show menu
  const loader = $('loadingScreen');
  const menu = $('mainMenu');
  
  if (loader) loader.classList.add('hidden');
  await delay(500);
  if (menu) menu.classList.remove('hidden');
}
function adjustBet(dir) {
    const steps = [1, 2, 5, 10, 25, 50, 100];
    const idx = steps.indexOf(bet);
    let newIdx;
    if (idx === -1) {
        // Snap to nearest step
        newIdx = dir > 0 ? 0 : steps.length - 1;
    } else {
        newIdx = Math.max(0, Math.min(steps.length - 1, idx + dir));
    }
    bet = steps[newIdx];
    const label = $('betLabel');
    if (label) label.textContent = '$' + bet.toFixed(2);
}

function setControlsDisabled(disabled) {
    const els = document.querySelectorAll('.bet-arrow, .risk-arrow, #rowsSlider');
    els.forEach(el => {
        el.disabled = disabled;
        el.style.opacity = disabled ? '0.4' : '1';
        el.style.pointerEvents = disabled ? 'none' : '';
    });
}