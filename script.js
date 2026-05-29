window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let activeName = "GAD"; // Nom par défaut

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initConstellation(activeName);
    }

    // Étoiles de fond scintillantes
    function initBackgroundStars() {
        backgroundStars = [];
        const count = Math.min(window.innerWidth * 0.1, 80);
        for (let i = 0; i < count; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005
            });
        }
    }

    // NOUVELLE APPROCHE : Génération directe et proportionnelle des cibles
    function initConstellation(text) {
        particlesArray = [];
        if (!text.trim()) return;

        const isMobile = canvas.width < 768;
        
        // Taille de la police 100% responsive (prend une grande partie de l'écran)
        let fontSize = isMobile ? canvas.width / (text.length * 0.7) : canvas.width / (text.length * 0.9);
        // Limites pour garder un affichage harmonieux
        const maxFontSize = isMobile ? 80 : 140;
        fontSize = Math.min(fontSize, maxFontSize);

        // Configuration temporaire pour analyser l'emplacement réel du texte
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Positionnement au centre de l'écran (ajusté pour l'interface du bas)
        const textX = canvas.width / 2;
        const textY = canvas.height * 0.42;

        // On dessine le texte en blanc très rapidement pour capturer ses coordonnées réelles
        ctx.fillStyle = 'white';
        ctx.fillText(text.toUpperCase(), textX, textY);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // On efface immédiatement pour ne garder que le fond noir

        // Écartement des étoiles pour que le tracé soit aéré et pur
        const gap = isMobile ? 9 : 14;

        // Parcours de la zone réelle de ton écran
        for (let y = 0; y < canvas.height; y += gap) {
            for (let x = 0; x < canvas.width; x += gap) {
                const index = (y * canvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    // On crée l'étoile à sa position cible directe sur ton écran
                    particlesArray.push(new Particle(x, y));
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY) {
            // Effet d'arrivée fluide depuis la gauche de l'écran
            this.x = -40 - (Math.random() * 500);
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            
            this.vx = Math.random() * 6 + 5;
            this.vy = (Math.random() * 2 - 1) * 0.2;
            
            // Profondeur des étoiles (grosses et petites)
            const rand = Math.random();
            if (rand > 0.88) {
                this.size = Math.random() * 2.2 + 2.0; // Étoiles repères lumineuses
                this.brightness = 85;
            } else {
                this.size = Math.random() * 0.8 + 0.6; // Étoiles fines de connexion
                this.brightness = 65;
            }
            
            this.hue = Math.random() * 20 + 195; // Teintes bleu néon
            this.ease = Math.random() * 0.06 + 0.03; // Vitesse de stabilisation
            this.isCaptured = false;
        }

        update() {
            if (!this.isCaptured && this.x >= this.targetX - 100) {
                this.isCaptured = true;
            }

            if (this.isCaptured) {
                this.x += (this.targetX - this.x) * this.ease;
                this.y += (this.targetY - this.y) * this.ease;
            } else {
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
            ctx.shadowBlur = (this.isCaptured && this.size > 1.8) ? 8 : 0;
            ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function connectParticles() {
        const maxDistance = canvas.width < 768 ? 50 : 40;
        
        for (let a = 0; a < particlesArray.length; a++) {
            if (!particlesArray[a].isCaptured) continue;
            let connections = 0;

            for (let b = a + 1; b < particlesArray.length; b++) {
                if (!particlesArray[b].isCaptured) continue;
                if (connections >= 2) break; // Maximum 2 lignes par étoile pour un effet épuré

                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    connections++;
                    let opacity = (1 - (distance / maxDistance)) * 0.35;
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
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
        ctx.fillStyle = 'rgba(6, 6, 14, 0.24)';
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

    generateBtn.addEventListener('click', () => {
        const inputName = nameInput.value.trim();
        if (inputName.length > 0) {
            activeName = inputName;
            initConstellation(activeName);
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
