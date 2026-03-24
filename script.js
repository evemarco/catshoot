// ============================================================
// CatShoot — The Absurd Captcha
// Pure JavaScript, no dependencies
// ============================================================

(function () {
    'use strict';

    // ===== DOM refs =====
    const captchaZone = document.getElementById('captcha-zone');
    const bgCanvas = document.getElementById('bg-canvas');
    const animalCanvas = document.getElementById('animal-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    const ctx = animalCanvas.getContext('2d');

    const overlaySuccess = document.getElementById('overlay-success');
    const overlayFail = document.getElementById('overlay-fail');
    const failReason = document.getElementById('fail-reason');
    const killCountEl = document.getElementById('kill-count');
    const gameStatusEl = document.getElementById('game-status');
    const btnStart = document.getElementById('btn-start');
    const btnRetrySuccess = document.getElementById('btn-retry-success');
    const btnRetryFail = document.getElementById('btn-retry-fail');

    // ===== Audio Context =====
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    // ===== Sound Effects =====
    function playMeow() {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.25);
        osc.frequency.exponentialRampToValueAtTime(350, ac.currentTime + 0.5);
        gain.gain.setValueAtTime(0.25, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.55);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.55);
    }

    function playSplat() {
        const ac = getAudioCtx();
        const bufferSize = ac.sampleRate * 0.3;
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const source = ac.createBufferSource();
        const gain = ac.createGain();
        const filter = ac.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        gain.gain.setValueAtTime(0.35, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.3);
        source.start();
    }

    function playBark() {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.25);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.25);
        // Second bark
        const osc2 = ac.createOscillator();
        const gain2 = ac.createGain();
        osc2.connect(gain2);
        gain2.connect(ac.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(220, ac.currentTime + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(550, ac.currentTime + 0.35);
        osc2.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.5);
        gain2.gain.setValueAtTime(0.2, ac.currentTime + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.55);
        osc2.start(ac.currentTime + 0.3);
        osc2.stop(ac.currentTime + 0.55);
    }

    function playSuccess() {
        const ac = getAudioCtx();
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = 'sine';
            const t = ac.currentTime + i * 0.12;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    }

    function playFail() {
        const ac = getAudioCtx();
        const notes = [400, 350, 300, 250];
        notes.forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = 'square';
            const t = ac.currentTime + i * 0.15;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    // ===== Canvas Sizing =====
    let W, H;

    function resizeCanvases() {
        const rect = captchaZone.getBoundingClientRect();
        W = Math.floor(rect.width);
        H = Math.floor(rect.height);
        bgCanvas.width = W;
        bgCanvas.height = H;
        animalCanvas.width = W;
        animalCanvas.height = H;
    }

    // ===== Background Captcha Generation =====
    const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const CAPTCHA_COLORS = [
        '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
        '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0',
        '#ff6348', '#7bed9f', '#70a1ff', '#ffa502'
    ];

    function drawCaptchaBackground() {
        // Dark background
        bgCtx.fillStyle = '#1a1a2e';
        bgCtx.fillRect(0, 0, W, H);

        // Noise dots
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const r = Math.random() * 1.5;
            bgCtx.fillStyle = `rgba(${Math.random()*100 + 80}, ${Math.random()*100 + 80}, ${Math.random()*100 + 80}, ${Math.random() * 0.3})`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, r, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // Scattered characters
        const charCount = Math.floor((W * H) / 2800);
        for (let i = 0; i < charCount; i++) {
            const char = CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
            const x = Math.random() * W;
            const y = Math.random() * H;
            const size = 10 + Math.random() * 18;
            const angle = (Math.random() - 0.5) * 0.8;
            const color = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];

            bgCtx.save();
            bgCtx.translate(x, y);
            bgCtx.rotate(angle);
            bgCtx.font = `bold ${size}px 'Courier New', monospace`;
            bgCtx.fillStyle = color;
            bgCtx.globalAlpha = 0.3 + Math.random() * 0.5;
            bgCtx.fillText(char, 0, 0);
            bgCtx.restore();
        }

        // Curves
        for (let i = 0; i < 8; i++) {
            bgCtx.beginPath();
            const startX = Math.random() * W;
            const startY = Math.random() * H;
            const cp1x = Math.random() * W;
            const cp1y = Math.random() * H;
            const cp2x = Math.random() * W;
            const cp2y = Math.random() * H;
            const endX = Math.random() * W;
            const endY = Math.random() * H;

            bgCtx.moveTo(startX, startY);
            bgCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            bgCtx.strokeStyle = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];
            bgCtx.globalAlpha = 0.15 + Math.random() * 0.2;
            bgCtx.lineWidth = 1 + Math.random() * 3;
            bgCtx.stroke();
        }

        // Straight lines
        for (let i = 0; i < 12; i++) {
            bgCtx.beginPath();
            bgCtx.moveTo(Math.random() * W, Math.random() * H);
            bgCtx.lineTo(Math.random() * W, Math.random() * H);
            bgCtx.strokeStyle = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];
            bgCtx.globalAlpha = 0.1 + Math.random() * 0.2;
            bgCtx.lineWidth = 0.5 + Math.random() * 2;
            bgCtx.stroke();
        }

        bgCtx.globalAlpha = 1;
    }

    // ===== Drawing Animals =====

    function drawCat(c, x, y, size, flipX) {
        const s = size / 40;
        c.save();
        c.translate(x, y);
        if (flipX) c.scale(-1, 1);

        // Body
        c.fillStyle = '#ff9f43';
        c.beginPath();
        c.ellipse(0, 4 * s, 18 * s, 14 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#e17055';
        c.lineWidth = 1.5 * s;
        c.stroke();

        // Head
        c.fillStyle = '#ff9f43';
        c.beginPath();
        c.arc(0, -14 * s, 12 * s, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Ears
        c.fillStyle = '#ff9f43';
        c.beginPath();
        c.moveTo(-10 * s, -22 * s);
        c.lineTo(-6 * s, -34 * s);
        c.lineTo(-2 * s, -22 * s);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(2 * s, -22 * s);
        c.lineTo(6 * s, -34 * s);
        c.lineTo(10 * s, -22 * s);
        c.fill();
        c.stroke();

        // Inner ears
        c.fillStyle = '#fd79a8';
        c.beginPath();
        c.moveTo(-8 * s, -23 * s);
        c.lineTo(-6 * s, -30 * s);
        c.lineTo(-4 * s, -23 * s);
        c.fill();

        c.beginPath();
        c.moveTo(4 * s, -23 * s);
        c.lineTo(6 * s, -30 * s);
        c.lineTo(8 * s, -23 * s);
        c.fill();

        // Eyes
        c.fillStyle = '#2d3436';
        c.beginPath();
        c.ellipse(-5 * s, -16 * s, 3 * s, 3.5 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(5 * s, -16 * s, 3 * s, 3.5 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Eye highlights
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(-4 * s, -17.5 * s, 1.2 * s, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(6 * s, -17.5 * s, 1.2 * s, 0, Math.PI * 2);
        c.fill();

        // Nose
        c.fillStyle = '#fd79a8';
        c.beginPath();
        c.moveTo(0, -11 * s);
        c.lineTo(-2 * s, -9 * s);
        c.lineTo(2 * s, -9 * s);
        c.closePath();
        c.fill();

        // Mouth
        c.strokeStyle = '#e17055';
        c.lineWidth = 1 * s;
        c.beginPath();
        c.moveTo(0, -9 * s);
        c.lineTo(0, -7 * s);
        c.stroke();
        c.beginPath();
        c.arc(-3 * s, -6 * s, 3 * s, -0.3, Math.PI + 0.3, true);
        c.stroke();
        c.beginPath();
        c.arc(3 * s, -6 * s, 3 * s, -Math.PI - 0.3, 0.3, true);
        c.stroke();

        // Whiskers
        c.strokeStyle = '#dfe6e9';
        c.lineWidth = 0.8 * s;
        // Left
        c.beginPath();
        c.moveTo(-8 * s, -10 * s);
        c.lineTo(-20 * s, -14 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(-8 * s, -9 * s);
        c.lineTo(-20 * s, -9 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(-8 * s, -8 * s);
        c.lineTo(-18 * s, -5 * s);
        c.stroke();
        // Right
        c.beginPath();
        c.moveTo(8 * s, -10 * s);
        c.lineTo(20 * s, -14 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(8 * s, -9 * s);
        c.lineTo(20 * s, -9 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(8 * s, -8 * s);
        c.lineTo(18 * s, -5 * s);
        c.stroke();

        // Tail
        c.strokeStyle = '#e17055';
        c.lineWidth = 3 * s;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(16 * s, 6 * s);
        c.quadraticCurveTo(28 * s, -4 * s, 22 * s, -16 * s);
        c.stroke();

        // Paws
        c.fillStyle = '#ff9f43';
        c.strokeStyle = '#e17055';
        c.lineWidth = 1.2 * s;
        c.beginPath();
        c.ellipse(-8 * s, 16 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.ellipse(8 * s, 16 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
    }

    function drawDeadCat(c, x, y, size) {
        const s = size / 40;
        c.save();
        c.translate(x, y);

        // Blood puddle
        c.fillStyle = 'rgba(180, 30, 30, 0.6)';
        c.beginPath();
        c.ellipse(0, 10 * s, 28 * s, 10 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Splatter
        c.fillStyle = 'rgba(180, 30, 30, 0.35)';
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 * s + Math.random() * 12 * s;
            c.beginPath();
            c.arc(Math.cos(angle) * dist, 10 * s + Math.sin(angle) * dist * 0.4, 2 * s + Math.random() * 3 * s, 0, Math.PI * 2);
            c.fill();
        }

        // Flattened body
        c.fillStyle = '#ff9f43';
        c.beginPath();
        c.ellipse(0, 4 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#e17055';
        c.lineWidth = 1.5 * s;
        c.stroke();

        // Head (squished)
        c.fillStyle = '#ff9f43';
        c.beginPath();
        c.ellipse(0, -4 * s, 14 * s, 7 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // X eyes
        c.strokeStyle = '#2d3436';
        c.lineWidth = 2.5 * s;
        c.lineCap = 'round';

        // Left X eye
        c.beginPath();
        c.moveTo(-8 * s, -8 * s);
        c.lineTo(-3 * s, -2 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(-3 * s, -8 * s);
        c.lineTo(-8 * s, -2 * s);
        c.stroke();

        // Right X eye
        c.beginPath();
        c.moveTo(3 * s, -8 * s);
        c.lineTo(8 * s, -2 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(8 * s, -8 * s);
        c.lineTo(3 * s, -2 * s);
        c.stroke();

        // Tongue sticking out
        c.fillStyle = '#fd79a8';
        c.beginPath();
        c.ellipse(3 * s, 1 * s, 3 * s, 5 * s, 0.2, 0, Math.PI * 2);
        c.fill();

        c.restore();
    }

    function drawDog(c, x, y, size, flipX) {
        const s = size / 40;
        c.save();
        c.translate(x, y);
        if (flipX) c.scale(-1, 1);

        // Body
        c.fillStyle = '#a0522d';
        c.beginPath();
        c.ellipse(0, 4 * s, 18 * s, 14 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#8B4513';
        c.lineWidth = 1.5 * s;
        c.stroke();

        // Head
        c.fillStyle = '#a0522d';
        c.beginPath();
        c.arc(0, -14 * s, 13 * s, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Snout
        c.fillStyle = '#deb887';
        c.beginPath();
        c.ellipse(0, -8 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#8B4513';
        c.stroke();

        // Ears (floppy)
        c.fillStyle = '#8B4513';
        c.beginPath();
        c.ellipse(-12 * s, -18 * s, 6 * s, 12 * s, -0.3, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#654321';
        c.stroke();

        c.beginPath();
        c.ellipse(12 * s, -18 * s, 6 * s, 12 * s, 0.3, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Eyes
        c.fillStyle = '#2d3436';
        c.beginPath();
        c.ellipse(-5 * s, -17 * s, 3 * s, 3.5 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(5 * s, -17 * s, 3 * s, 3.5 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Eye highlights
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(-4 * s, -18.5 * s, 1.2 * s, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(6 * s, -18.5 * s, 1.2 * s, 0, Math.PI * 2);
        c.fill();

        // Nose
        c.fillStyle = '#2d3436';
        c.beginPath();
        c.ellipse(0, -9 * s, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Nose highlight
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.beginPath();
        c.ellipse(-1 * s, -10 * s, 1.5 * s, 1 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Mouth
        c.strokeStyle = '#8B4513';
        c.lineWidth = 1 * s;
        c.beginPath();
        c.moveTo(0, -6.5 * s);
        c.lineTo(0, -4 * s);
        c.stroke();
        c.beginPath();
        c.arc(-3 * s, -3 * s, 3 * s, -0.2, Math.PI + 0.2, true);
        c.stroke();
        c.beginPath();
        c.arc(3 * s, -3 * s, 3 * s, -Math.PI - 0.2, 0.2, true);
        c.stroke();

        // Tongue (sticking out)
        c.fillStyle = '#fd79a8';
        c.beginPath();
        c.ellipse(0, -2 * s, 3 * s, 5 * s, 0, 0, Math.PI);
        c.fill();

        // Tail (wagging style - curved up)
        c.strokeStyle = '#8B4513';
        c.lineWidth = 3 * s;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(16 * s, 2 * s);
        c.quadraticCurveTo(26 * s, -10 * s, 20 * s, -18 * s);
        c.stroke();

        // Paws
        c.fillStyle = '#a0522d';
        c.strokeStyle = '#8B4513';
        c.lineWidth = 1.2 * s;
        c.beginPath();
        c.ellipse(-8 * s, 16 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.ellipse(8 * s, 16 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
    }

    function drawDeadDog(c, x, y, size) {
        const s = size / 40;
        c.save();
        c.translate(x, y);

        // Blood puddle
        c.fillStyle = 'rgba(180, 30, 30, 0.6)';
        c.beginPath();
        c.ellipse(0, 10 * s, 28 * s, 10 * s, 0, 0, Math.PI * 2);
        c.fill();

        // Splatter
        c.fillStyle = 'rgba(180, 30, 30, 0.35)';
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 * s + Math.random() * 12 * s;
            c.beginPath();
            c.arc(Math.cos(angle) * dist, 10 * s + Math.sin(angle) * dist * 0.4, 2 * s + Math.random() * 3 * s, 0, Math.PI * 2);
            c.fill();
        }

        // Flattened body
        c.fillStyle = '#a0522d';
        c.beginPath();
        c.ellipse(0, 4 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#8B4513';
        c.lineWidth = 1.5 * s;
        c.stroke();

        // Head (squished)
        c.fillStyle = '#a0522d';
        c.beginPath();
        c.ellipse(0, -4 * s, 14 * s, 7 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Snout squished
        c.fillStyle = '#deb887';
        c.beginPath();
        c.ellipse(0, -2 * s, 9 * s, 3.5 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#8B4513';
        c.stroke();

        // X eyes
        c.strokeStyle = '#2d3436';
        c.lineWidth = 2.5 * s;
        c.lineCap = 'round';

        c.beginPath();
        c.moveTo(-8 * s, -8 * s);
        c.lineTo(-3 * s, -2 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(-3 * s, -8 * s);
        c.lineTo(-8 * s, -2 * s);
        c.stroke();

        c.beginPath();
        c.moveTo(3 * s, -8 * s);
        c.lineTo(8 * s, -2 * s);
        c.stroke();
        c.beginPath();
        c.moveTo(8 * s, -8 * s);
        c.lineTo(3 * s, -2 * s);
        c.stroke();

        // Tongue out
        c.fillStyle = '#fd79a8';
        c.beginPath();
        c.ellipse(4 * s, 1 * s, 3 * s, 5 * s, 0.3, 0, Math.PI * 2);
        c.fill();

        c.restore();
    }

    // ===== Game State =====
    const ANIMAL_SIZE = 44;
    const MIN_SPEED = 1.5;
    const MAX_SPEED = 4.5;
    const DOG_CHANCE = 0.25;
    const SPAWN_DELAY = 600;
    const ESCAPE_MARGIN = 60;

    let gameRunning = false;
    let killCount = 0;
    let currentAnimal = null;
    let deadAnimals = [];
    let animFrameId = null;
    let lastTime = 0;
    let animalActive = false;

    // ===== Animal Entity =====
    function createAnimal() {
        const isDog = Math.random() < DOG_CHANCE;
        const size = ANIMAL_SIZE + Math.random() * 12;
        const margin = size;

        // Spawn from edges
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;

        switch (side) {
            case 0:
                x = margin + Math.random() * (W - 2 * margin);
                y = -margin;
                break;
            case 1:
                x = W + margin;
                y = margin + Math.random() * (H - 2 * margin);
                break;
            case 2:
                x = margin + Math.random() * (W - 2 * margin);
                y = H + margin;
                break;
            case 3:
                x = -margin;
                y = margin + Math.random() * (H - 2 * margin);
                break;
        }

        // Move toward center area
        const targetX = W * 0.2 + Math.random() * W * 0.6;
        const targetY = H * 0.2 + Math.random() * H * 0.6;
        const angle = Math.atan2(targetY - y, targetX - x);
        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);

        const angleOffset = (Math.random() - 0.5) * 1.2;
        vx = Math.cos(angle + angleOffset) * speed;
        vy = Math.sin(angle + angleOffset) * speed;

        return {
            type: isDog ? 'dog' : 'cat',
            x, y, vx, vy,
            size,
            alive: true,
            deathTimer: 0,
            flipX: vx > 0,
            hitRadius: size * 0.6,
        };
    }

    function isAnimalOffScreen(animal) {
        const margin = ESCAPE_MARGIN + animal.size;
        return animal.x < -margin || animal.x > W + margin ||
               animal.y < -margin || animal.y > H + margin;
    }

    // ===== HUD Updates =====
    function updateHUD() {
        killCountEl.textContent = killCount;
    }

    function setStatus(text, cls) {
        gameStatusEl.textContent = text;
        gameStatusEl.className = 'hud-value ' + cls;
    }

    // ===== Score Popup =====
    function showScorePopup(x, y, text, isGood) {
        const el = document.createElement('div');
        el.className = 'score-popup ' + (isGood ? 'good' : 'bad');
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        captchaZone.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    // ===== Game Logic =====
    function spawnAnimal() {
        currentAnimal = createAnimal();
        animalActive = true;
        setStatus(currentAnimal.type === 'dog' ? 'Watch out: DOG!' : 'Cat spotted!', 'status-killing');
    }

    function killAnimal(animal, clickX, clickY) {
        animal.alive = false;
        animal.deathTimer = 1500;

        if (animal.type === 'cat') {
            killCount++;
            updateHUD();
            playMeow();
            setTimeout(playSplat, 150);
            showScorePopup(clickX, clickY, '+1 Cat eliminated', true);

            if (killCount >= 3) {
                setTimeout(() => gameWin(), 400);
                return;
            }

            setStatus(`${killCount}/3 cats eliminated`, 'status-killing');
        } else {
            playBark();
            showScorePopup(clickX, clickY, 'Oops! That was a dog!', false);
            setTimeout(() => gameFail('You killed a dog. Naughty.'), 400);
            return;
        }

        animalActive = false;
        deadAnimals.push(animal);
        setTimeout(() => {
            if (gameRunning && !animalActive) {
                spawnAnimal();
            }
        }, SPAWN_DELAY);
    }

    function animalEscaped(animal) {
        animalActive = false;
        currentAnimal = null;

        if (animal.type === 'cat') {
            gameFail('A cat slipped through your paws!');
        } else {
            // Dog escaped - that's fine, spawn next animal
            setStatus('Dog escaped. Next...', 'status-active');
            setTimeout(() => {
                if (gameRunning && !animalActive) {
                    spawnAnimal();
                }
            }, SPAWN_DELAY);
        }
    }

    function gameWin() {
        gameRunning = false;
        animalActive = false;
        setStatus('PASSED!', 'status-success');
        btnStart.disabled = false;
        btnStart.textContent = 'Play Again';
        playSuccess();
        overlaySuccess.classList.remove('hidden');
        captchaZone.classList.add('inactive');
    }

    function gameFail(reason) {
        gameRunning = false;
        animalActive = false;
        setStatus('FAILED', 'status-dead');
        btnStart.disabled = false;
        btnStart.textContent = 'Try Again';
        playFail();
        failReason.textContent = reason;
        overlayFail.classList.remove('hidden');
        captchaZone.classList.add('inactive');
    }

    function startGame() {
        killCount = 0;
        currentAnimal = null;
        deadAnimals = [];
        gameRunning = true;
        animalActive = false;
        lastTime = performance.now();

        updateHUD();
        setStatus('Get ready...', 'status-killing');
        btnStart.disabled = true;
        btnStart.textContent = 'In progress...';
        overlaySuccess.classList.add('hidden');
        overlayFail.classList.add('hidden');
        captchaZone.classList.remove('inactive');

        drawCaptchaBackground();

        // Give user time to get ready before first spawn
        setTimeout(() => {
            if (gameRunning) {
                setStatus('GO! Find the cat!', 'status-killing');
                spawnAnimal();
            }
        }, 1500);

        if (animFrameId) cancelAnimationFrame(animFrameId);
        gameLoop(performance.now());
    }

    // ===== Game Loop =====
    function gameLoop(timestamp) {
        if (!gameRunning) return;

        const dt = Math.min(timestamp - lastTime, 50);
        lastTime = timestamp;

        ctx.clearRect(0, 0, W, H);

        // Draw dead animals (fading)
        deadAnimals = deadAnimals.filter(a => {
            a.deathTimer -= dt;
            if (a.deathTimer <= 0) return false;

            const alpha = Math.min(1, a.deathTimer / 500);
            ctx.globalAlpha = alpha;
            if (a.type === 'cat') {
                drawDeadCat(ctx, a.x, a.y, a.size);
            } else {
                drawDeadDog(ctx, a.x, a.y, a.size);
            }
            ctx.globalAlpha = 1;
            return true;
        });

        // Update and draw current animal
        if (currentAnimal && currentAnimal.alive) {
            const a = currentAnimal;
            a.x += a.vx * (dt / 16);
            a.y += a.vy * (dt / 16);
            a.flipX = a.vx > 0;

            if (isAnimalOffScreen(a)) {
                animalEscaped(a);
                currentAnimal = null;
            } else {
                if (a.type === 'cat') {
                    drawCat(ctx, a.x, a.y, a.size, a.flipX);
                } else {
                    drawDog(ctx, a.x, a.y, a.size, a.flipX);
                }
            }
        }

        animFrameId = requestAnimationFrame(gameLoop);
    }

    // ===== Click Handler =====
    captchaZone.addEventListener('click', function (e) {
        if (!gameRunning || !currentAnimal || !currentAnimal.alive) return;

        const rect = captchaZone.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const a = currentAnimal;
        const dx = clickX - a.x;
        const dy = clickY - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= a.hitRadius) {
            killAnimal(a, clickX, clickY);
            currentAnimal = null;
        }
    });

    // ===== Event Listeners =====
    btnStart.addEventListener('click', function () {
        startGame();
    });

    btnRetrySuccess.addEventListener('click', function () {
        startGame();
    });

    btnRetryFail.addEventListener('click', function () {
        startGame();
    });

    // ===== Init =====
    window.addEventListener('resize', function () {
        resizeCanvases();
        drawCaptchaBackground();
    });

    resizeCanvases();
    drawCaptchaBackground();
    setStatus('Click "Start Captcha" to begin', 'status-active');

})();
