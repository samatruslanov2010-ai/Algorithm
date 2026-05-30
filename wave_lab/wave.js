const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const container = document.getElementById('canvas-container');
const statsOverlay = document.getElementById('stats-overlay');
const fpsEl = document.getElementById('fps-val');

// 1. ОБЪЯВЛЯЕМ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
let width = 0;
let height = 0;
let circles = [];
let ripples = [];
let frames = 0;
let lastTime = 0;

// 2. ИСПРАВЛЕНО: переименовано в conf, чтобы совпадало с остальным кодом
const conf = {
    spacing: 30,
    baseRadius: 1,
    maxGrowth: 60,
    triggerRadius: 80,
    sharpness: 0.12,
    waveSpeed: 12,
    baseColor: '#151515',
    activeColor: '#4ddbff',
    isRainbow: true,
    shape: 'circle'
};

const hexToRgb = hex => {
    const i = parseInt(hex.slice(1), 16);
    return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
};

function resize() {
    width = canvas.width = container.offsetWidth;
    height = canvas.height = container.offsetHeight;
    circles = [];
    for (let x = 0; x <= width + conf.spacing; x += conf.spacing) {
        for (let y = 0; y <= height + conf.spacing; y += conf.spacing) {
            circles.push({ x, y, r: conf.baseRadius });
        }
    }
}

// 3. ИСПРАВЛЕНО: функция animate теперь только анимирует
function animate(t) {
    frames++;

    // Обновление счетчика FPS раз в секунду
    if (t > lastTime + 1000) {
        if (!statsOverlay.classList.contains('hidden')) {
            fpsEl.innerText = Math.round((frames * 1000) / (t - lastTime));
        }
        frames = 0;
        lastTime = t;
    }

    // Отрисовка кадра (теперь выполняется постоянно, а не раз в секунду)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const bC = hexToRgb(conf.baseColor);
    const aC = hexToRgb(conf.activeColor);

    // Обновление волн
    for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].radius += conf.waveSpeed;
        ripples[i].power *= 0.985;
        if (ripples[i].power < 0.01) ripples.splice(i, 1);
    }

    // Обновление и отрисовка кругов
    for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        let influence = 0;

        for (let j = 0; j < ripples.length; j++) {
            const r = ripples[j];
            const d = Math.sqrt((r.x - c.x) ** 2 + (r.y - c.y) ** 2);
            const diff = Math.abs(d - r.radius);
            if (diff < conf.triggerRadius / 2) {
                influence = Math.max(influence, (1 - diff / (conf.triggerRadius / 2)) * r.power);
            }
        }

        if (conf.isRainbow) {
            ctx.fillStyle = `hsl(${(t / 40 + influence * 80) % 360}, 70%, ${20 + influence * 60}%)`;
        } else {
            const r = (bC.r + (aC.r - bC.r) * influence) | 0;
            const g = (bC.g + (aC.g - bC.g) * influence) | 0;
            const b = (bC.b + (aC.b - bC.b) * influence) | 0;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
        }

        let targetR = conf.baseRadius + (conf.maxGrowth * influence);
        c.r += (targetR - c.r) * conf.sharpness;

        if (c.r > 0.1) {
            if (conf.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, 6.28);
                ctx.fill();
            } else {
                ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
            }
        }
    }

    requestAnimationFrame(animate);
}

// 4. ИСПРАВЛЕНО: Все обработчики событий вынесены за пределы функции animate

const createWave = e => {
    const r = canvas.getBoundingClientRect();
    const ev = e.touches ? e.touches[0] : e;
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    ripples.push({ x, y, radius: 0, power: 1 });
};

canvas.addEventListener('mousedown', createWave);
canvas.addEventListener('touchstart', e => { createWave(e); e.preventDefault(); }, { passive: false });

const densityInput = document.getElementById('density');
const updateDensityText = (val) => {
    let label = "Medium";
    if (val <= 20) label = "0.1";
    else if (val <= 25) label = "1";
    else if (val <= 35) label = "2";
    else if (val <= 45) label = "3";
    else label = "4";
    document.getElementById('v-density').innerText = label;
};

if (densityInput) {
    densityInput.oninput = e => {
        const val = parseInt(e.target.value);
        conf.spacing = 75 - val;
        updateDensityText(val);
        resize();
    };
    densityInput.value = 75 - conf.spacing;
    updateDensityText(parseInt(densityInput.value));
}

['baseRadius', 'waveSpeed', 'triggerRadius', 'maxGrowth', 'sharpness', 'baseColor', 'activeColor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.oninput = e => {
            conf[id] = id.includes('Color') ? e.target.value : parseFloat(e.target.value);
            const valEl = document.getElementById('v-' + id);
            if (valEl) valEl.innerText = e.target.value;
        };
    }
});

const shapeSelect = document.getElementById('shape-select');
if (shapeSelect) {
    shapeSelect.onchange = e => conf.shape = e.target.value;
    shapeSelect.value = conf.shape;
}

const isRainbowInput = document.getElementById('isRainbow');
if (isRainbowInput) {
    isRainbowInput.onchange = e => conf.isRainbow = e.target.checked;
    isRainbowInput.checked = conf.isRainbow;
}

const resetBtn = document.getElementById('resetBtn');
if (resetBtn) resetBtn.onclick = () => ripples = [];

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.onclick = () => {
        const a = document.createElement('a');
        a.download = 'wave-engine.png';
        a.href = canvas.toDataURL();
        a.click();
    };
}

// Синхронизация начальных значений UI
['baseRadius', 'waveSpeed', 'triggerRadius', 'maxGrowth', 'sharpness', 'baseColor', 'activeColor'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.value = conf[id];
        const label = document.getElementById('v-' + id);
        if (label) label.innerText = conf[id];
    }
});

// Кнопки интерфейса
const hideStatsBtn = document.getElementById('hide-stats-btn');
const showStatsBtn = document.getElementById('show-stats-btn');
if (hideStatsBtn && showStatsBtn) {
    hideStatsBtn.onclick = () => {
        statsOverlay.classList.add('hidden');
        showStatsBtn.style.display = 'flex';
    };
    showStatsBtn.onclick = () => {
        statsOverlay.classList.remove('hidden');
        showStatsBtn.style.display = 'none';
    };
}

const closeControlsBtn = document.getElementById('close-controls-btn');
const openControlsBtn = document.getElementById('open-controls-btn');
if (closeControlsBtn && openControlsBtn) {
    closeControlsBtn.onclick = () => {
        document.body.classList.add('controls-hidden');
        setTimeout(resize, 0);
    };
    openControlsBtn.onclick = () => {
        document.body.classList.remove('controls-hidden');
        setTimeout(resize, 0);
    };
}

window.addEventListener('resize', resize);

// Старт
resize();
requestAnimationFrame(animate);