const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

const statsOverlay = document.getElementById('stats-overlay');
const hideStatsBtn = document.getElementById('hide-stats-btn');
const showStatsBtn = document.getElementById('show-stats-btn');

const closeControlsBtn = document.getElementById('close-controls-btn');
const openControlsBtn = document.getElementById('open-controls-btn');

const fpsEl = document.getElementById('fps-val');
const countEl = document.getElementById('count-val');
const spawnEl = document.getElementById('spawn-val');
const scaleEl = document.getElementById('scale-val');

let particles = [], isDrawing = false;
let lastTime = 0, frames = 0, fps = 0;
let mouse = { x: 0, y: 0 };

const config = {
    sPattern: 'circle_solid',
    speed: 3.5,
    spawnDensity: 8,
    lifeSpan: 70,
    trailAlpha: 0.05,
    color: '#4ddbff',
    isRainbow: true,
    pSize: 4,
    spawnScale: 45
};

function resize() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

window.addEventListener('resize', resize);
resize();

// Панель информации (HUD)
hideStatsBtn.onclick = () => {
    statsOverlay.classList.add('hidden');
    showStatsBtn.style.display = 'flex';
};
showStatsBtn.onclick = () => {
    statsOverlay.classList.remove('hidden');
    showStatsBtn.style.display = 'none';
};

// Панель настроек (Включение/Выключение)
closeControlsBtn.onclick = () => {
    document.body.classList.add('controls-hidden');
    setTimeout(resize, 0);
};
openControlsBtn.onclick = () => {
    document.body.classList.remove('controls-hidden');
    setTimeout(resize, 0);
};

function getPatternPoints() {
    const points = [];
    const density = config.spawnDensity;
    const scale = config.spawnScale;

    if (config.sPattern === 'circle_solid') {
        const total = density * 8;
        for (let i = 0; i < total; i++) {
            let angle = (i / total) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * scale,
                y: Math.sin(angle) * scale,
                vx: Math.cos(angle), vy: Math.sin(angle)
            });
        }
    }
    else if (config.sPattern === 'square_outline') {
        for (let i = -density; i <= density; i++) {
            let pos = (i / density) * scale;
            points.push({ x: pos, y: -scale, vx: pos / scale, vy: -1 });
            points.push({ x: pos, y: scale, vx: pos / scale, vy: 1 });
            points.push({ x: -scale, y: pos, vx: -1, vy: pos / scale });
            points.push({ x: scale, y: pos, vx: 1, vy: pos / scale });
        }
    }
    return points;
}

class Particle {
    constructor(x, y, vx, vy, hue) {
        this.x = x; this.y = y;
        this.vx = vx * config.speed;
        this.vy = vy * config.speed;
        this.life = 1.0;
        this.hue = hue;
        this.decay = 0.11 - (config.lifeSpan / 1000);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw() {
        ctx.fillStyle = config.isRainbow ? `hsl(${this.hue}, 80%, 60%)` : config.color;
        ctx.globalAlpha = Math.max(0, this.life);
        const s = config.pSize;
        ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    }
}

function updateStats(timestamp) {
    frames++;
    if (timestamp > lastTime + 1000) {
        fps = Math.round((frames * 1000) / (timestamp - lastTime));
        lastTime = timestamp;
        frames = 0;
        if (!statsOverlay.classList.contains('hidden')) fpsEl.innerText = fps;
    }
    if (!statsOverlay.classList.contains('hidden')) {
        countEl.innerText = particles.length;
        scaleEl.innerText = config.spawnScale;
        spawnEl.innerText = isDrawing ? getPatternPoints().length : 0;
    }
}

function animate(timestamp) {
    updateStats(timestamp);

    ctx.globalAlpha = 1.0;
    const fillOpacity = 0.51 - config.trailAlpha;
    ctx.fillStyle = `rgba(3, 3, 3, ${fillOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isDrawing) {
        const pts = getPatternPoints();
        pts.forEach(p => {
            particles.push(new Particle(
                mouse.x + p.x,
                mouse.y + p.y,
                p.vx,
                p.vy,
                (Date.now() / 10) % 360
            ));
        });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(animate);
}

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
}

canvas.addEventListener('mousedown', (e) => { isDrawing = true; handleInput(e); });
canvas.addEventListener('mousemove', handleInput);
window.addEventListener('mouseup', () => isDrawing = false);

canvas.addEventListener('touchstart', (e) => { isDrawing = true; handleInput(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { handleInput(e); e.preventDefault(); }, { passive: false });
window.addEventListener('touchend', () => isDrawing = false);

document.getElementById('particleColor').oninput = (e) => config.color = e.target.value;
document.getElementById('rainbowMode').onchange = (e) => config.isRainbow = e.target.checked;
document.getElementById('sPattern').onchange = (e) => config.sPattern = e.target.value;

['pSize', 'spawnDensity', 'trailAlpha', 'lifeSpan', 'speed', 'spawnScale'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.oninput = (e) => {
            config[id] = parseFloat(e.target.value);
            document.getElementById('val-' + id).innerText = config[id];
        };
    }
});

document.getElementById('clearBtn').onclick = () => { particles = []; ctx.clearRect(0, 0, canvas.width, canvas.height); };
document.getElementById('saveBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL();
    link.click();
};

requestAnimationFrame(animate);