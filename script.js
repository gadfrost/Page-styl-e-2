window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let shootingStars = []; 
    let activeName = "G_Frost"; 

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initStarText(activeName);
    }

    // AMÉLIORATION : Plus d'étoiles en arrière-plan et un peu plus visibles
    function initBackgroundStars() {
        backgroundStars = [];
        // Augmentation du nombre d'étoiles de fond (multiplié par ~2.5)
        const count = Math.min(window.innerWidth * 0.2, 180);
        for (let i = 0; i < count; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.3, // Un poil plus grandes
                alpha: Math.random() * 0.8 + 0.2, // Plus lumineuses de base
                speed: Math.random() * 0.015 + 0.005
            });
        }
    }

    // AMÉLIORATION : Plus d'étoiles filantes et trajectoires qui croisent le centre
    function addShootingStar() {
        // Augmentation de la probabilité (passée de 0.01 à 0.025) pour en voir plus souvent
        if (shootingStars.length < 3 && Math.random() < 0.025) { 
            const isMobile = canvas.width < 768;
            // Elles visent globalement la zone centrale où se trouve le prénom
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
                // Si elle vient d'une étoile filante, elle démarre de là où l'étoile filante s'est éteinte
                this.x = startX;
                this.y = startY;
                this.vx = 0;
                this.vy = 0;
                this.isCaptured = true; // Déjà sur place ou presque
            } else {
                // Arrivée cosmique initiale classique
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
            
            this.hue = Math.random() * 25 + 195; 
            this.ease = fromShootingStar ? 0.08 : (Math.random() * 0.05 + 0.03); 
            
            this.twinkleSpeed = Math.random() * 0.04 + 0.01;
            this.twinkleAngle = Math.random() * Math.PI * 2;
            this.glowPulse = Math.random() * Math.PI;

            // Système d'éjection (quand l'étoile doit partir)
            this.isEjected = false;
            this.evacuationVx = 0;
            this.evacuationVy = 0;
        }

        eject() {
            this.isEjected = true;
            this.isCaptured = false;
            // Direction de fuite aléatoire et rapide vers le bas ou les côtés
            this.evacuationVx = (Math.random() * 4 - 2);
            this.evacuationVy = Math.random() * 4 + 2; 
        }

        update() {
            if (this.isEjected) {
                this.x += this.evacuationVx;
                this.y += this.evacuationVy;
                this.size -= 0.01; // Elle rétrécit en partant
                return;
            }

            if (!this.isCaptured && this.x >= this.targetX - 80) {
                this.isCaptured = true;
            }

            if (this.isCaptured) {
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
                currentAlpha = Math.max(0, this.size); // Finit par disparaître
            }

            let currentGlow = 0;
            if (this.isCaptured && this.isBright) {
                currentGlow = 8 + Math.sin(this.glowPulse) * 4;
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
        
        // 1. Étoiles de fond (Toile de l'espace enrichie)
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // 2. Étoiles filantes + Logique d'interaction/remplacement
        addShootingStar();
        shootingStars.forEach((s, index) => {
            s.x += s.speedX;
            s.y += s.speedY;
            
            // L'étoile filante commence à s'estomper à l'approche de sa zone
            if (s.x > s.targetZoneX - 50) {
                s.opacity -= 0.04;
            }

            // CRUCIAL : Quand l'étoile filante croise ou dépasse sa zone cible dans le prénom
            if (!s.hasTriggeredSwitch && s.x >= s.targetZoneX && particlesArray.length > 0) {
                s.hasTriggeredSwitch = true;

                // On filtre les étoiles du prénom qui sont stables et pas déjà en train de partir
                const activeParticles = particlesArray.filter(p => p.isCaptured && !p.isEjected);
                
                if (activeParticles.length > 0) {
                    // 1. Choisir une étoile au hasard dans le prénom
                    const randomIndex = Math.floor(Math.random() * activeParticles.length);
                    const particleToReplace = activeParticles[randomIndex];
                    
                    // Stocker ses coordonnées cibles
                    const savedTargetX = particleToReplace.targetX;
                    const savedTargetY = particleToReplace.targetY;

                    // 2. Éjecter l'ancienne étoile (elle tombe et s'en va)
                    particleToReplace.eject();

                    // 3. Injecter immédiatement la nouvelle étoile à sa place exacte
                    particlesArray.push(new Particle(savedTargetX, savedTargetY, true, s.x, s.y));
                }
            }

            if (s.opacity <= 0 || s.x > canvas.width || s.y > canvas.height) {
                shootingStars.splice(index, 1);
            } else {
                ctx.strokeStyle = `rgba(160, 225, 255, ${Math.max(0, s.opacity)})`;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.length, s.y - (s.length * (s.speedY / s.speedX)));
                ctx.stroke();
            }
        });
        
        // 3. Nettoyage et rendu des étoiles du prénom
        particlesArray = particlesArray.filter(p => !p.isEjected || p.size > 0);
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
