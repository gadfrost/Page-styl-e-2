// On attend que la page soit complètement chargée pour éviter les bugs d'écran noir
window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    let backgroundStars = [];
    let targetPoints = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initTargetPoints(); // Repositionne le G au centre de l'écran (PC ou Mobile)
        setupConstellation();
    }

    // 1. Poussière cosmique en arrière-plan
    function initBackgroundStars() {
        backgroundStars = [];
        const numberOfBackgroundStars = Math.min(window.innerWidth * 0.1, 120);
        for (let i = 0; i < numberOfBackgroundStars; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005
            });
        }
    }

    // 2. Calcul des coordonnées de la lettre "G" proportionnellement à l'écran
    function initTargetPoints() {
        targetPoints = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // La taille du G s'adapte à la taille de l'écran (plus petit sur mobile)
        const radius = Math.min(canvas.width, canvas.height) * 0.25; 
        
        // Arc principal de la lettre G
        for (let angle = 0.1; angle < Math.PI * 1.75; angle += 0.08) {
            let x = centerX + Math.cos(angle) * radius;
            let y = centerY + Math.sin(angle) * radius;
            targetPoints.push({ x: x, y: y });
        }
        
        // Barre horizontale du G
        const barLength = radius * 0.6;
        for (let xOffset = 0; xOffset < barLength; xOffset += 8) {
            targetPoints.push({
                x: centerX + (barLength - xOffset),
                y: centerY
            });
        }
        
        // Petite barre verticale descendante du G
        for (let yOffset = 0; yOffset < radius * 0.4; yOffset += 8) {
            targetPoints.push({
                x: centerX + barLength,
                y: centerY + yOffset
            });
        }
    }

    class Particle {
        constructor(targetX, targetY) {
            // Naissance des étoiles au centre exact (effet Big Bang)
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            
            this.targetX = targetX;
            this.targetY = targetY;
            
            this.size = Math.random() * 4 + 2;
            this.hue = Math.random() * 30 + 195; // Teintes Bleu / Cyan Néon
            this.brightness = Math.random() * 20 + 65;
            this.life = 0;
            this.ease = Math.random() * 0.05 + 0.02; // Vitesse d'aimantation
        }
        
        update() {
            // Attraction vers la position de la lettre
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            
            this.x += dx * this.ease;
            this.y += dy * this.ease;
            
            if (this.life < 1) this.life += 0.02;
        }
        
        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.life})`;
            
            // Effet Brillance Néon
            ctx.shadowBlur = 12;
            ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset pour ne pas alourdir le rendu
        }
    }

    function setupConstellation() {
        particlesArray = [];
        targetPoints.forEach(point => {
            particlesArray.push(new Particle(point.x, point.y));
        });
    }

    // Connexion des filaments dorés
    function connectParticles() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 60) {
                    let opacity = (1 - (distance / 60)) * 0.5;
                    
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = "rgba(212, 175, 55, 1)"; // Doré
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    ctx.lineWidth = 1;
                    
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(6, 6, 14, 0.2)'; // Trainée noire
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Étoiles de fond
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        // Particules de la lettre
        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        connectParticles();
        
        requestAnimationFrame(animate);
    }

    // Gestion du redimensionnement et lancement
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('click', setupConstellation);
    window.addEventListener('touchstart', setupConstellation);

    resizeCanvas();
    animate();
});
