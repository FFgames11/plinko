// config.js
const $ = id => document.getElementById(id);
const delay = ms => new Promise(r => setTimeout(r, ms));

// Game State
let balance = 100.00;
let bet = 1.00;
let spinning = false; // "dropping" status
let autoMode = false;

// Plinko Settings
let currentRows = 12; // 8 to 16
let currentRisk = 'MEDIUM'; // LOW, MEDIUM, HIGH

// Multiplier Table (Deterministic based on Rows & Risk)
const MULTIPLIERS = {
    8: {
        LOW:    [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        HIGH:   [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    12: {
        LOW:    [10, 5, 2, 1.6, 1.4, 1.2, 1.1, 1.2, 1.4, 1.6, 2, 5, 10],
        MEDIUM: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        HIGH:   [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
    },
    16: {
        LOW:    [16, 9, 4.2, 2.8, 2, 1.7, 1.4, 1.3, 1.1, 1.3, 1.4, 1.7, 2, 2.8, 4.2, 9, 16],
        MEDIUM: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        HIGH:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
};

// config.js addition

// The length of these arrays must match the number of slots (Rows + 1)
// Higher numbers = Higher chance.
// config.js - Corrected for Rows + 1 slots
const PROBABILITY_WEIGHTS = {
    // 8 Rows = 9 Slots
    8: [0.05, 2, 10, 20, 35.9, 20, 10, 2, 0.05], 
    
    // 12 Rows = 13 Slots
    12: [0.01, 0.2, 2, 6, 12, 18, 23.58, 18, 12, 6, 2, 0.2, 0.01], 
    
    // 16 Rows = 17 Slots (Ultra Rare 1000x)
    // The 0.0005 weight makes 1000x roughly 1 in 200,000 drops
    16: [0.0005, 0.01, 0.1, 0.5, 2, 5, 10, 18, 28.778, 18, 10, 5, 2, 0.5, 0.1, 0.01, 0.0005]
};

function getWeightedRandomSlot(rows) {
    const weights = PROBABILITY_WEIGHTS[rows];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
        if (random < weights[i]) return i;
        random -= weights[i];
    }
    return Math.floor(weights.length / 2); // Fallback to center
}

const COLORS = {
    LOW: '#4ade80',
    MEDIUM: '#fbbf24',
    HIGH: '#f87171',
    BALL: '#ff69b4'
};