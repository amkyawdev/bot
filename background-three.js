// js/background-three.js
// Simple 3D background effect for AmkyawDev AI

(function initBackground() {
    // Only run if we have the container
    const container = document.getElementById('three-bg');
    if (!container) return;

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 50;
    const COLORS = ['#10a37f', '#4d9e8a', '#0d8a6b', '#1a5e4f'];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();

            // Update position
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around screen
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        });

        // Draw connections
        ctx.strokeStyle = '#10a37f';
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = 0.1 * (1 - distance / 100);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(drawParticles);
    }

    // Initialize
    resize();
    createParticles();
    drawParticles();

    // Handle resize
    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
})();