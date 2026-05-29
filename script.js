window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let targetPoints = [];
    let activeName = "G_Frost"; // Prénom par défaut

    function resizeCanvas() {
        // Dimensions réelles de l'écran
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        initBackgroundStars();
        initNameMatrix(activeName);
        setupConstellation();
    }

    // Poussière cosmique en arrière-plan
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

    // Scanner le prénom SANS distorsion sur les ordonnées
    function initNameMatrix(text) {
        targetPoints = [];
        if (!text.trim()) return;

        // SOLUTION ANTI-ÉCRASEMENT : On utilise une résolution virtuelle fixe pour le calcul du texte
        const vWidth = 1920;
        const vHeight = 1080;

        const memCanvas = document.createElement('canvas');
        const memCtx = memCanvas.getContext('2d');
        memCanvas.width = vWidth;
        memCanvas.height = vHeight;
        
        // Taille de police virtuelle de base (très grande)
        let baseSize = vWidth * 0.15;
        if (text.length > 5) {
            baseSize = baseSize * (5 / text.length);
        }
        const fontSize = Math.max(baseSize, 100);
        
        memCtx.fillStyle = 'white';
        memCtx.font = `bold ${fontSize}px sans-serif`;
        memCtx.textBaseline = 'middle';
        memCtx.textAlign = 'center';
        
        // On écrit le texte au centre parfait de la matrice virtuelle
        memCtx.fillText(text.toUpperCase(), vWidth / 2, vHeight / 2);
        
        const imageData = memCtx.getImageData(0, 0, vWidth, vHeight);
        
        // Écart du scanner dans la matrice virtuelle
        const gap = 20; 

        // Calcul des facteurs d'adaptation à l'écran réel pour que ça reste GRAND mais proportionnel
        const isMobile = canvas.width < 768;
        const scale = isMobile ? (canvas.width * 0.85) / vWidth : (canvas.width * 0.7) / vWidth;
        
        // Centrage manuel sur le canvas réel
        const offsetX = (canvas.width - (vWidth * scale)) / 2;
        // On surélève légèrement sur l'axe Y (0.38) pour ne pas être caché par l'input du bas
        const offsetY = (canvas.height - (vHeight * scale)) * 0.38;

        for (let y = 0; y < vHeight; y += gap) {
            for (let x = 0; x < vWidth; x += gap) {
                const index = (y * vWidth + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    
                    // On applique le MÊME coefficient 'scale' sur X et sur Y -> Zéro déformation !
                    const realX = x * scale + offsetX + (Math.random() - 0.5) * 6;
                    const realY = y * scale + offsetY + (Math.random() - 0.5) * 6;
                    
                    targetPoints.push({ x: realX, y: realY });
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY, isExtra = false) {
            this.x = -50 - (Math.random() * 800); 
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            this.isExtra = isExtra;
            
            this.vx = Math.random() * 6 + 5; 
            this.vy = (Math.random() * 2 - 1) * 0.2;
            
            const rand = Math.random();
            if (rand > 0.88) {
                this.size = Math.random() * 2.5 + 2.2; // Étoiles majeures
                this.brightness = Math.random() * 10 + 85; 
            } else {
                this.size = Math.random() * 1.0 + 0.6; // Étoiles fines de structure
                this.brightness = Math.random() * 15 + 60;
            }
            
            this.hue = Math.random() * 25 + 195; 
            this.life = 1;
            this.ease = Math.random() * 0.06 + 0.03; 
            this.isCaptured = false;
        }
        
        update() {
            if (this.isExtra) {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x > canvas.width + 50) {
                    this.x = -50;
                    this.y = Math.random() * canvas.height;
                }
            } else {
                if (this.x >= this.targetX - 120) {
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
            
            ctx.shadowBlur = (this.isCaptured && this.size > 2) ? 12 : 0;
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
        targetPoints.forEach(point => {
            particlesArray.push(new Particle(point.x, point.y, false));
        });
        
        const extraCount = Math.min(targetPoints.length * 0.2, 60);
        for(let i = 0; i < extraCount; i++) {
            particlesArray.push(new Particle(0, 0, true));
        }
    }

    function connectParticles() {
        // Ajustement de la distance de connexion proportionnel à la taille de l'écran
        const maxDistance = canvas.width < 768 ? 45 : 35; 
        
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isExtra || !particlesArray[a].isCaptured) continue;
            
            let connections = 0;
            
            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isExtra || !particlesArray[b].isCaptured) continue;
                if (connections >= 2) break; 
                
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    connections++;
                    let opacity = (1 - (distance / maxDistance)) * 0.28;
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    ctx.lineWidth = 0.6;
                    
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
            initNameMatrix(activeName);
            setupConstellation();
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
