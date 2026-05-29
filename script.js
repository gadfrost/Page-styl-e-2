window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let targetPoints = [];
    let activeName = "G_FROST"; // Nom par défaut au premier chargement

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initNameMatrix(activeName);
        setupConstellation();
    }

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

    // Traduction du prénom en matrice de points adaptative
    function initNameMatrix(text) {
        targetPoints = [];
        if (!text.trim()) return;

        const memCanvas = document.createElement('canvas');
        const memCtx = memCanvas.getContext('2d');
        
        memCanvas.width = canvas.width;
        memCanvas.height = canvas.height;
        
        // ADAPTATION INTELLIGENTE DE LA TAILLE :
        // On calcule une taille de police qui rétrécit si le nom est long ou si l'écran est petit (Mobile)
        const isMobile = canvas.width < 768;
        let baseSize = isMobile ? canvas.width * 0.18 : canvas.width * 0.12;
        
        // Ajustement proportionnel à la longueur du texte
        if (text.length > 6) {
            baseSize = baseSize * (6 / text.length);
        }
        const fontSize = Math.max(baseSize, isMobile ? 24 : 40);
        
        memCtx.fillStyle = 'white';
        memCtx.font = `bold ${fontSize}px sans-serif`;
        memCtx.textBaseline = 'middle';
        memCtx.textAlign = 'center';
        
        // Dessiner au centre de l'écran
        memCtx.fillText(text.toUpperCase(), memCanvas.width / 2, memCanvas.height * 0.45); // Un peu surélevé pour l'input
        
        const imageData = memCtx.getImageData(0, 0, memCanvas.width, memCanvas.height);
        
        // Résolution du scan (gap) : plus petit sur mobile pour que les lettres courtes soient nettes
        const gap = isMobile ? 6 : 9; 
        
        for (let y = 0; y < memCanvas.height; y += gap) {
            for (let x = 0; x < memCanvas.width; x += gap) {
                const index = (y * memCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    targetPoints.push({ x: x, y: y });
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY, isExtra = false) {
            // Effet vague : Arrivée décalée depuis la gauche
            this.x = -50 - (Math.random() * 800); 
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            this.isExtra = isExtra;
            
            this.vx = Math.random() * 5 + 4; // Vitesse de déplacement horizontale
            this.vy = (Math.random() * 2 - 1) * 0.3;
            
            this.size = Math.random() * 2.5 + 1.2;
            this.hue = Math.random() * 30 + 195; // Bleu néon
            this.brightness = Math.random() * 20 + 65;
            this.life = 1;
            
            this.ease = Math.random() * 0.05 + 0.03; // Vitesse de capture
            this.isCaptured = false;
        }
        
        update() {
            if (this.isExtra) {
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // Dès que l'étoile filante s'approche de sa zone cible, elle se fait capturer
                if (this.x >= this.targetX - 150) {
                    this.isCaptured = true;
                }
                
                if (this.isCaptured) {
                    let dx = this.targetX - this.x;
                    let dy = this.targetY - this.y;
                    this.x += dx * this.ease;
                    this.y += dy * this.ease;
                } else {
                    this.x += this.vx;
                    this.y += this.vy;
                }
            }
        }
        
        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.life})`;
            ctx.shadowBlur = this.isCaptured ? 8 : 3;
            ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function setupConstellation() {
        particlesArray = [];
        
        // Étoiles de la constellation
        targetPoints.forEach(point => {
            particlesArray.push(new Particle(point.x, point.y, false));
        });
        
        // Étoiles d'ambiance qui traversent l'écran
        const extraCount = Math.min(targetPoints.length * 0.3, 100);
        for(let i = 0; i < extraCount; i++) {
            particlesArray.push(new Particle(0, 0, true));
        }
    }

    function connectParticles() {
        const maxDistance = 35; // Resserre les liens pour éviter les paquets de fils
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isExtra || !particlesArray[a].isCaptured) continue;
            
            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isExtra || !particlesArray[b].isCaptured) continue;
                
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.35;
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`; // Filaments d'or
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(6, 6, 14, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        connectParticles();
        requestAnimationFrame(animate);
    }

    // Événement au clic sur le bouton
    generateBtn.addEventListener('click', () => {
        const inputName = nameInput.value.trim();
        if (inputName.length > 0) {
            activeName = inputName;
            initNameMatrix(activeName);
            setupConstellation();
        }
    });

    // Permet de valider aussi en appuyant sur "Entrée"
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
});
