window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let shootingStars = []; 
    let activeName = "G_Frost"; 

    // Variables pour l'interaction au clic (Onde de choc)
    let mouse = {
        x: null,
        y: null,
        radius: 120, // Zone d'impact du clic
        isActive: false,
        timer: 0
    };

    // Variable pour l'évolution globale des couleurs (Nébuleuse)
    let globalHueBase = 200; 

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initStarText(activeName);
    }

    function initBackgroundStars() {
        backgroundStars = [];
        const count = Math.min(window.innerWidth * 0.2, 180);
        for (let i = 0; i < count; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.015 + 0.005
            });
        }
    }

    function addShootingStar() {
        if (shootingStars.length < 3 && Math.random() < 0.025) { 
            const targetX = canvas.width / 2 + (Math.random() * 200 - 100);
            const targetY = canvas.height * 0.35 + (Math.random() * 100 - 50);
            
            shootingStars.push({
                x: Math.random() * canvas.width * 0.4, 
                y: 0,
                length: Math.random() * 60 + 40,
                speedX: Math.random() * 6 + 6,
                speedY: Math.random() * 4 + 4,
                opacity: 1,
                hasTriggeredSwitch: false,
                targetZoneX: targetX,
                targetZoneY: targetY
            });
        }
    }

    function initStarText(text) {
        particlesArray = [];
        if (!text.trim()) return;

        const isMobile = canvas.width < 768;
        let fontSize = isMobile ? (canvas.width / (text.length * 0.65)) : (canvas.width / (text.length * 0.85));
        
        const maxFontSize = isMobile ? 110 : 180;
        const minFontSize = isMobile ? 65 : 100;
        fontSize = Math.min(Math.max(fontSize, minFontSize), maxFontSize);

        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        const textX = canvas.width / 2;
        const textY = canvas.height * 0.35; 

        ctx.fillStyle = 'white';
        ctx.fillText(text.toUpperCase(), textX, textY);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gap = isMobile ? 7 : 11;

        for (let y = 0; y < canvas.height; y += gap) {
            for (let x = 0; x < canvas.width; x += gap) {
                const index = (y * canvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    particlesArray.push(new Particle(x, y));
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY, fromShootingStar = false, startX = null, startY = null) {
            this.targetX = targetX;
            this.targetY = targetY;
            
            if (fromShootingStar) {
                this.x = startX;
                this.y = startY;
                this.vx = 0;
                this.vy = 0;
                this.isCaptured = true; 
            } else {
                this.x = -20 - (Math.random() * 400);
                this.y = Math.random() * canvas.height;
                this.vx = Math.random() * 7 + 5; 
                this.vy = (Math.random() * 2 - 1) * 0.2;
                this.isCaptured = false;
            }
            
            const rand = Math.random();
            if (rand > 0.75) {
                this.size = Math.random() * 2.2 + 1.6; 
                this.isBright = true;
            } else {
                this.size = Math.random() * 0.9 + 0.5; 
                this.isBright = false;
            }
            
            // Teinte de départ unique légèrement décalée
            this.hueOffset = Math.random() * 30 - 15; 
            this.ease = fromShootingStar ? 0.08 : (Math.random() * 0.05 + 0.03); 
            
            this.twinkleSpeed = Math.random() * 0.04 + 0.01;
            this.twinkleAngle = Math.random() * Math.PI * 2;
            this.glowPulse = Math.random() * Math.PI;

            this.isEjected = false;
            this.evacuationVx = 0;
            this.evacuationVy = 0;
        }

        eject() {
            this.isEjected = true;
            this.isCaptured = false;
            this.evacuationVx = (Math.random() * 4 - 2);
            this.evacuationVy = Math.random() * 4 + 2; 
        }

        update() {
            if (this.isEjected) {
                this.x += this.evacuationVx;
                this.y += this.evacuationVy;
                this.size -= 0.01; 
                return;
            }

            if (!this.isCaptured && this.x >= this.targetX - 80) {
                this.isCaptured = true;
            }

            if (this.isCaptured) {
                // AMÉLIORATION INTERACTIVE : Gestion de la poussée au clic
                if (mouse.isActive) {
                    let dx = this.x - mouse.x;
                    let dy = this.y - mouse.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        // Calcule de la force de poussée (plus on est près, plus c'est fort)
                        let force = (mouse.radius - distance) / mouse.radius;
                        let pushX = (dx / distance) * force * 15;
                        let pushY = (dy / distance) * force * 15;
                        
                        this.x += pushX;
                        this.y += pushY;
                    }
                }

                // Retour fluide vers la position cible (effet élastique/gravitationnel)
                this.x += (this.targetX - this.x) * this.ease;
                this.y += (this.targetY - this.y) * this.ease;
                
                this.twinkleAngle += this.twinkleSpeed;
                if (this.isBright) {
                    this.glowPulse += 0.02;
                }
            } else {
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        draw() {
            if (this.size <= 0) return;

            let currentAlpha = 1;
            if (this.isCaptured) {
                currentAlpha = 0.7 + Math.sin(this.twinkleAngle) * 0.3;
            } else if (this.isEjected) {
                currentAlpha = Math.max(0, this.size);
            }

            let currentGlow = 0;
            if (this.isCaptured && this.isBright) {
                currentGlow = 8 + Math.sin(this.glowPulse) * 4;
            }

            // AMÉLIORATION COULEUR : Teinte dynamique basée sur le cycle global "Nébuleuse"
            let currentHue = (globalHueBase + this.hueOffset) % 360;

            ctx.fillStyle = `hsla(${currentHue}, 100%, ${this.isBright ? 88 : 70}%, ${currentAlpha})`;
            
            if (currentGlow > 0) {
                ctx.shadowBlur = currentGlow;
                ctx.shadowColor = `hsl(${currentHue}, 100%, 70%)`;
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0; 
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(6, 6, 14, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Faire évoluer la couleur globale très lentement (effet aurore boréale)
        // Cycle principalement entre le bleu (200), le violet (270) et le rose magenta (320)
        globalHueBase += 0.05;
        if (globalHueBase > 330) {
            globalHueBase = 190; // Revient au bleu-turquoise
        }

        // Gestion du timer du clic
        if (mouse.isActive) {
            mouse.timer++;
            if (mouse.timer > 15) { // L'onde de choc dure 15 frames
                mouse.isActive = false;
                mouse.timer = 0;
            }
        }
        
        // 1. Étoiles de fond
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // 2. Étoiles filantes + Remplacement
        addShootingStar();
        shootingStars.forEach((s, index) => {
            s.x += s.speedX;
            s.y += s.speedY;
            
            if (s.x > s.targetZoneX - 50) {
                s.opacity -= 0.04;
            }

            if (!s.hasTriggeredSwitch && s.x >= s.targetZoneX && particlesArray.length > 0) {
                s.hasTriggeredSwitch = true;
                const activeParticles = particlesArray.filter(p => p.isCaptured && !p.isEjected);
                
                if (activeParticles.length > 0) {
                    const randomIndex = Math.floor(Math.random() * activeParticles.length);
                    const particleToReplace = activeParticles[randomIndex];
                    
                    const savedTargetX = particleToReplace.targetX;
                    const savedTargetY = particleToReplace.targetY;

                    particleToReplace.eject();
                    particlesArray.push(new Particle(savedTargetX, savedTargetY, true, s.x, s.y));
                }
            }

            if (s.opacity <= 0 || s.x > canvas.width || s.y > canvas.height) {
                shootingStars.splice(index, 1);
            } else {
                // L'étoile filante adopte aussi la couleur de la nébuleuse
                ctx.strokeStyle = `hsla(${globalHueBase}, 100%, 80%, ${Math.max(0, s.opacity)})`;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.length, s.y - (s.length * (s.speedY / s.speedX)));
                ctx.stroke();
            }
        });
        
        // 3. Étoiles du prénom
        particlesArray = particlesArray.filter(p => !p.isEjected || p.size > 0);
        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }

    // ÉCOUTEURS D'ÉVÉNEMENTS POUR L'EXPLOSION AU CLIC
    // Pour PC (Souris)
    canvas.addEventListener('mousedown', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.isActive = true;
        mouse.timer = 0;
    });

    // Pour Mobile (Tactile)
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.isActive = true;
            mouse.timer = 0;
        }
    });

    generateBtn.addEventListener('click', () => {
        const inputName = nameInput.value.trim();
        if (inputName.length > 0) {
            activeName = inputName;
            initStarText(activeName);
        }
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
});
