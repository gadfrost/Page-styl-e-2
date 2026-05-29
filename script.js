window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let shootingStars = []; // Nouvelle gestion des étoiles filantes
    let activeName = "G_Frost"; 

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initStarText(activeName);
    }

    function initBackgroundStars() {
        backgroundStars = [];
        const count = Math.min(window.innerWidth * 0.08, 60);
        for (let i = 0; i < count; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.2,
                alpha: Math.random(),
                speed: Math.random() * 0.01 + 0.003
            });
        }
    }

    // Fonction pour déclencher une étoile filante en arrière-plan
    function addShootingStar() {
        if (shootingStars.length < 2 && Math.random() < 0.01) { // 1% de chance par frame
            shootingStars.push({
                x: Math.random() * canvas.width * 0.5, // Part du haut/gauche
                y: 0,
                length: Math.random() * 80 + 40,
                speedX: Math.random() * 8 + 6,
                speedY: Math.random() * 6 + 4,
                opacity: 1
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

        // Gap légèrement ajusté pour garder une belle forme tout en laissant respirer
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
        constructor(targetX, targetY) {
            this.x = -20 - (Math.random() * 400);
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            
            this.vx = Math.random() * 7 + 5; 
            this.vy = (Math.random() * 2 - 1) * 0.2;
            
            const rand = Math.random();
            if (rand > 0.75) {
                this.size = Math.random() * 2.2 + 1.6; // Étoiles majeures
                this.isBright = true;
            } else {
                this.size = Math.random() * 0.9 + 0.5; // Poussière d'étoile de structure
                this.isBright = false;
            }
            
            this.hue = Math.random() * 25 + 195; 
            this.ease = Math.random() * 0.05 + 0.03; 
            this.isCaptured = false;

            // Variables d'animation pour le scintillement (Twinkle)
            this.twinkleSpeed = Math.random() * 0.04 + 0.01;
            this.twinkleAngle = Math.random() * Math.PI * 2;
            
            // Variable pour faire pulser la lueur des grosses étoiles
            this.glowPulse = Math.random() * Math.PI;
        }

        update() {
            if (!this.isCaptured && this.x >= this.targetX - 80) {
                this.isCaptured = true;
            }

            if (this.isCaptured) {
                this.x += (this.targetX - this.x) * this.ease;
                this.y += (this.targetY - this.y) * this.ease;
                
                // On fait évoluer les angles d'animation uniquement quand elles sont en place
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
            // AMÉLIORATION 1 : Calcul de l'alpha dynamique pour le scintillement
            let currentAlpha = 1;
            if (this.isCaptured) {
                // Fait varier l'opacité entre 0.4 et 1 de manière fluide
                currentAlpha = 0.7 + Math.sin(this.twinkleAngle) * 0.3;
            }

            // AMÉLIORATION 2 : Calcul de la lueur pulsante pour les étoiles majeures
            let currentGlow = 0;
            if (this.isCaptured && this.isBright) {
                currentGlow = 8 + Math.sin(this.glowPulse) * 4; // Varie entre 4px et 12px de flou
            }

            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.isBright ? 88 : 70}%, ${currentAlpha})`;
            
            if (currentGlow > 0) {
                ctx.shadowBlur = currentGlow;
                ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
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
        
        // 1. Étoiles de fond fixes
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // 2. AMÉLIORATION 3 : Gestion et tracé des étoiles filantes
        addShootingStar();
        shootingStars.forEach((s, index) => {
            s.x += s.speedX;
            s.y += s.speedY;
            s.opacity -= 0.015; // S'efface progressivement

            if (s.opacity <= 0 || s.x > canvas.width || s.y > canvas.height) {
                shootingStars.splice(index, 1);
            } else {
                ctx.strokeStyle = `rgba(150, 220, 255, ${s.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                // Crée un effet de traînée linéaire
                ctx.lineTo(s.x - s.length, s.y - (s.length * (s.speedY / s.speedX)));
                ctx.stroke();
            }
        });
        
        // 3. Étoiles du prénom animées
        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }

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
