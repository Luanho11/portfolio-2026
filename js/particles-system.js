// Particles system with sinusoidal motion

const ParticlesSystem = (() => {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animFrameId = null;
    // Reduced particle count per audit (Problema 11): 12 desktop, 0 mobile
    const P_COUNT = 12;
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 0 : P_COUNT;

    const COLORS = [
        { r: 128, g: 128, b: 160 },  // soul
        { r: 168, g: 136, b: 80 },   // warm
        { r: 64,  g: 160, b: 96 },   // green
    ];

    class Particle {
        constructor(init) {
            this.reset(init);
        }

        reset(init) {
            if (!canvas) return;
            this.x = Math.random() * canvas.width;
            this.y = init ? Math.random() * canvas.height : canvas.height + Math.random() * 60;
            this.radius = Math.random() * 1.2 + 0.6;
            this.vy = -(Math.random() * 0.15 + 0.04);
            this.vx = (Math.random() - 0.5) * 0.03;
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.2 + 0.04;
            this.fadeSpeed = Math.random() * 0.0015 + 0.0005;
            this.fadingIn = true;
            // Sinusoidal params
            this.sinAmplitude = Math.random() * 0.8 + 0.2;
            this.sinFrequency = Math.random() * 0.003 + 0.001;
            this.sinOffset = Math.random() * Math.PI * 2;
            // Color
            const c = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.color = c;
            // Is star?
            this.isStar = Math.random() < 0.15;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.005;
        }

        update() {
            if (!canvas) return;
            this.y += this.vy;
            this.x += this.vx + Math.sin(this.y * this.sinFrequency + this.sinOffset) * this.sinAmplitude * 0.08;
            this.rotation += this.rotationSpeed;

            if (this.fadingIn) {
                this.opacity += this.fadeSpeed * 1.5;
                if (this.opacity >= this.maxOpacity) this.fadingIn = false;
            } else {
                this.opacity -= this.fadeSpeed;
            }

            if (this.opacity <= 0 || this.y < -30) this.reset(false);
        }

        draw(ctx) {
            const { r, g, b } = this.color;
            if (this.isStar) {
                this.drawStar(ctx, r, g, b);
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
                ctx.fill();
            }
        }

        drawStar(ctx, r, g, b) {
            const size = this.radius * 2.5;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
                const outerX = Math.cos(angle) * size;
                const outerY = Math.sin(angle) * size;
                const innerAngle = angle + Math.PI / 4;
                const innerX = Math.cos(innerAngle) * size * 0.3;
                const innerY = Math.sin(innerAngle) * size * 0.3;
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity * 0.8})`;
            ctx.fill();
            ctx.restore();
        }
    }

    function init() {
        canvas = document.getElementById('particles');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', debounce(resize, 200));

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle(true));
        }

        loop();
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function loop() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(ctx);
        }
        animFrameId = requestAnimationFrame(loop);
    }

    function debounce(fn, wait) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function destroy() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        particles = [];
    }

    return { init, destroy };
})();
