// ui.js — Plinko UI
function updateBalance() {
    $('balanceDisplay').textContent = '$' + balance.toFixed(2);
}

function setRows(val) {
    currentRows = parseInt(val);
    buildBoard();
}

function setRisk(risk) {
    currentRisk = risk;
    buildBoard();
}

// ui.js — Dynamic Board Scaler
function buildBoard() {
  const container = $('plinkoBoard');
  if (!container) return;

  // 1. Clear and Setup Canvas
  container.innerHTML = '<canvas id="plinkoCanvas"></canvas>';
  const canvas = $('plinkoCanvas');
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w;
  canvas.height = h;

  const rows = currentRows;
  
  // 2. Calculate Responsive Spacing
  // We leave a 10% margin at the top and 15% at the bottom for slots
  const marginTop = h * 0.1;
  const marginBottom = h * 0.15;
  const availableHeight = h - marginTop - marginBottom;
  
  const spacingY = availableHeight / rows;
  const spacingX = w / (rows + 2);

  // 3. Build Pegs
  for (let i = 0; i < rows; i++) {
    const rowY = marginTop + (i * spacingY);
    // Number of pegs increases per row: Row 0 has 3 pegs, Row 1 has 4, etc.
    const pegsInRow = i + 3; 
    const rowWidth = (pegsInRow - 1) * spacingX;
    const startX = (w - rowWidth) / 2;

    for (let j = 0; j < pegsInRow; j++) {
      const peg = document.createElement('div');
      peg.className = 'peg';
      const x = startX + (j * spacingX);
      
      // We use transform for better performance and sub-pixel accuracy
      peg.style.left = `0px`; 
      peg.style.top = `0px`;
      peg.style.transform = `translate(${x - 4}px, ${rowY - 4}px)`;
      container.appendChild(peg);
    }
  }

  // 4. Build Slots (Perfectly aligned to the last row of pegs)
  const slotContainer = document.createElement('div');
  slotContainer.className = 'slot-container';
  const currentMults = MULTIPLIERS[rows][currentRisk];
  
  // The slot width should match the spacing of the final pegs
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
    buildBoard();
}

// Reuse your existing showWin and spawnParticles from original ui.js
function showWin(amount) {
    const m = $('winMessage');
    $('winText').textContent = `WIN: $${amount.toFixed(2)}`;
    m.classList.add('show');
    setTimeout(() => m.classList.remove('show'), 1500);
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