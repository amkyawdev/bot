// Three.js Glass Background Effect
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('three-bg');
    if (!container) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: !prefersReducedMotion,
        powerPreference: 'high-performance'
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    container.appendChild(renderer.domElement);
    
    // Create particles with glass effect
    const particlesCount = prefersReducedMotion ? 300 : (window.innerWidth < 768 ? 500 : 1000);
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    
    const accentColor = new THREE.Color(0x19c37d);
    const secondaryColor = new THREE.Color(0x6b9deb);
    
    for (let i = 0; i < particlesCount; i++) {
        // Spherical distribution
        const radius = 4 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Color gradient
        const mix = Math.random();
        const color = accentColor.clone().lerp(secondaryColor, mix);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Glass-like particles
    const particlesMaterial = new THREE.PointsMaterial({
        size: window.innerWidth < 768 ? 0.03 : 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Add connecting lines for glass effect
    if (!prefersReducedMotion && window.innerWidth >= 768) {
        const linesGeometry = new THREE.BufferGeometry();
        const linePositions = [];
        
        for (let i = 0; i < Math.min(particlesCount, 200); i += 2) {
            for (let j = i + 1; j < Math.min(particlesCount, 200); j += 2) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (distance < 1.8) {
                    linePositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                }
            }
        }
        
        if (linePositions.length > 0) {
            linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            
            const linesMaterial = new THREE.LineBasicMaterial({
                color: 0x19c37d,
                transparent: true,
                opacity: 0.05,
                blending: THREE.AdditiveBlending
            });
            
            const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
            scene.add(linesMesh);
        }
    }
    
    camera.position.z = 6;
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    
    if (!prefersReducedMotion) {
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            
            targetRotationY = mouseX * 0.2;
            targetRotationX = mouseY * 0.15;
        });
        
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length) {
                mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
                
                targetRotationY = mouseX * 0.15;
                targetRotationX = mouseY * 0.1;
            }
        }, { passive: true });
    }
    
    // Animation loop
    let lastTime = 0;
    const fpsInterval = 1000 / 30; // 30fps for battery saving
    
    function animate(currentTime) {
        requestAnimationFrame(animate);
        
        const elapsed = currentTime - lastTime;
        if (elapsed < fpsInterval && !prefersReducedMotion) return;
        
        lastTime = currentTime - (elapsed % fpsInterval);
        
        if (!prefersReducedMotion) {
            // Smooth rotation
            currentRotationX += (targetRotationX - currentRotationX) * 0.05;
            currentRotationY += (targetRotationY - currentRotationY) * 0.05;
            
            // Auto rotation when no interaction
            if (Math.abs(targetRotationX) < 0.01 && Math.abs(targetRotationY) < 0.01) {
                currentRotationY += 0.0005;
            }
            
            particlesMesh.rotation.x = currentRotationX;
            particlesMesh.rotation.y = currentRotationY;
            
            // Pulsing opacity for glass effect
            particlesMaterial.opacity = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
        } else {
            // Static rotation for reduced motion
            particlesMesh.rotation.y += 0.0002;
        }
        
        renderer.render(scene, camera);
    }
    
    animate(0);
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 150);
    });
    
    // Cleanup
    window.addEventListener('beforeunload', () => {
        renderer.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
    });
});