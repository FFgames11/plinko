// reel.js — Dragon vs. Tiger Optimized Grid
function randSym() {
  // Use DECK from config.js for Dragon vs Tiger
  return DECK[Math.floor(Math.random() * DECK.length)];
}

function buildGrid() {
  const g = $('grid');
  if (!g) return;
  
  g.innerHTML = '';
  reelCols = [];

  // Safety height check: use actual height or a default for the large cards
  const gridHeight = g.getBoundingClientRect().height;
  const tileH = gridHeight > 0 ? gridHeight / ROWS : 350; 

  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('div');
    col.className = 'reel-col';
    col.id = 'col_' + c;
    g.appendChild(col);

    const tiles = [];
    for (let r = 0; r < ROWS; r++) {
      const t = document.createElement('div');
      t.className  = 'reel-tile';
      t.textContent = randSym();
      // Added vertical centering for the single row cards
      t.style.cssText = `height:${tileH}px; line-height:${tileH}px; position:absolute; left:0; right:0; top:${r * tileH}px; display:flex; align-items:center; justify-content:center; font-size: 80px;`;
      col.appendChild(t);
      tiles.push(t);
    }
    reelCols.push({ el: col, tiles, tileH });
  }
}

async function rollColumn(c, finals, dur) {
  const { el: col, tiles, tileH } = reelCols[c];
  const SCROLL_ROWS = 12; // More fodder for a faster "shuffling" look
  const totalRows = SCROLL_ROWS + ROWS + ROWS;

  const strip = document.createElement('div');
  strip.style.cssText = 'position:absolute;left:0;right:0;';

  // Section 1: Shuffling fodder
  for (let r = 0; r < SCROLL_ROWS; r++) {
    const t = document.createElement('div');
    t.className = 'reel-tile';
    t.style.cssText = `height:${tileH}px; display:flex; align-items:center; justify-content:center; font-size:80px;`;
    t.textContent = randSym();
    strip.appendChild(t);
  }

  // Section 2: The actual card
  for (let r = 0; r < ROWS; r++) {
    const t = document.createElement('div');
    t.className = 'reel-tile';
    t.style.cssText = `height:${tileH}px; display:flex; align-items:center; justify-content:center; font-size:80px;`;
    t.textContent = finals[r];
    strip.appendChild(t);
  }

  // Section 3: Previous card
  for (let r = 0; r < ROWS; r++) {
    const t = document.createElement('div');
    t.className = 'reel-tile';
    t.style.cssText = `height:${tileH}px; display:flex; align-items:center; justify-content:center; font-size:80px;`;
    t.textContent = tiles[r].textContent;
    strip.appendChild(t);
  }

  const startY = -(SCROLL_ROWS + ROWS) * tileH;
  strip.style.top = startY + 'px';
  tiles.forEach(t => t.style.visibility = 'hidden');
  col.appendChild(strip);

  await new Promise(resolve => {
    let startTime = null;
    function tick(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // Fast start, smooth stop
      const eased = 1 - Math.pow(1 - progress, 3);
      strip.style.top = (startY + (0 - startY) * eased) + 'px';
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });

  // Final card snap
  finals.forEach((s, r) => {
    tiles[r].textContent = s || '?';
    tiles[r].style.visibility = '';
  });
  col.removeChild(strip);
}