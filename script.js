window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    let backgroundStars = [];
    let targetPoints = [];
    
    // CHANGE ICI LE PRÉNOM POUR TA VIDÉO
    const currentName = "G_FROST"; 

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initNameMatrix(currentName);
        setupConstellation();
    }

    // 1. Poussière cosmique en arrière-plan (scintillement fixe)
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

    // 2. Scanner le prénom et adapter sa taille au centre
    function initNameMatrix(text) {
        targetPoints = [];
        const memCanvas = document.createElement('canvas');
        const memCtx = memCanvas.getContext('2d');
        
        memCanvas.width = canvas.width;
        memCanvas.height = canvas.height;
        
        const baseSize = Math.min(canvas.width * 0.25, canvas.height * 0.25); 
        const fontSize = Math.max(baseSize - (text.length * (canvas.width > 768 ? 12 : 8)), 30);
        
        memCtx.fillStyle = 'white';
        memCtx.font = `bold ${fontSize}px sans-serif`;
        memCtx.textBaseline = 'middle';
        memCtx.textAlign = 'center';
        
        memCtx.fillText(text, memCanvas.width / 2, memCanvas.height / 2);
        
        const imageData = memCtx.getImageData(0, 0, memCanvas.width, memCanvas.height);
        const gap = canvas.width > 768 ? 11 : 8; 
        
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
            // EFFET EFFLUVES : Les étoiles naissent aléatoirement à gauche de l'écran
            this.x = -50 - (Math.random() * 600); // Échelonnées pour arriver en vague
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            this.isExtra = isExtra; // Savoir si c'est une étoile qui va juste passer ou rester
            
            // Vitesse de la pluie vers la droite
            this.vx = Math.random() * 4 + 3;
            this.vy = (Math.random() * 2 - 1) * 0.5; // Légère déviation verticale pour le style
            
            this.size = Math.random() * 3 + 1.5;
            this.hue = Math.random() * 30 + 195; // Cyan / Bleu Néon
            this.brightness = Math.random() * 20 + 65;
            this.life = 1;
            
            // Force d'accroche (Ease)
            this.ease = Math.random() * 0.04 + 0.02;
            this.isCaptured = false;
        }
        
        update() {
            if (this.isExtra) {
                // Les étoiles en trop traversent tout l'écran sans s'arrêter
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // Logique pour les étoiles qui forment le prénom
                // Dès que l'étoile filante arrive assez près horizontalement de sa zone de capture
                if (this.x >= this.targetX - 200) {
                    this.isCaptured = true;
                }
                
                if (this.isCaptured) {
                    // Attraction magnétique douce vers sa cible finale
                    let dx = this.targetX - this.x;
                    let dy = this.targetY - this.y;
                    this.x += dx * this.ease;
                    this.y += dy * this.ease;
                } else {
                    // Continue de voler vers la droite en attendant d'être capturée
                    this.x += this.vx;
                    this.y += this.vy;
                }
            }
        }
        
        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.life})`;
            
            // Effet brillance néon
            ctx.shadowBlur = this.isCaptured ? 10 : 4;
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
        
        // 1. On crée les étoiles qui vont s'accrocher pour former le prénom
        targetPoints.forEach(point => {
            particlesArray.push(new Particle(point.x, point.y, false));
        });
        
        // 2. AJOUT DES ÉTOILES SUPPLÉMENTAIRES (Celles qui ne font que passer pour l'effet visuel)
        const extraStarsCount = Math.min(targetPoints.length * 0.4, 150);
        for(let i = 0; i < extraStarsCount; i++) {
            particlesArray.push(new Particle(0, 0, true));
        }
    }

    // Connexion des filaments dorés (Seulement pour les étoiles capturées dans le prénom)
    function connectParticles() {
        const maxDistance = 40; 
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isExtra || !particlesArray[a].isCaptured) continue;
            
            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isExtra || !particlesArray[b].isCaptured) continue;
                
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.4;
                    
                    ctx.shadowBlur = 1;
                    ctx.shadowColor = "rgba(212, 175, 55, 1)";
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    
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
        // Traînée noire pour un effet de mouvement fluide (effet météore)
        ctx.fillStyle = 'rgba(6, 6, 14, 0.22)';
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

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('click', setupConstellation);
    window.addEventListener('touchstart', setupConstellation);

    resizeCanvas();
    animate();
});
