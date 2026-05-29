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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initNameMatrix(activeName);
        setupConstellation();
    }

    // Poussière cosmique en arrière-plan
    function initBackgroundStars() {
        backgroundStars = [];
        const numberOfBackgroundStars = Math.min(window.innerWidth * 0.1, 100);
        for (let i = 0; i < numberOfBackgroundStars; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.2,
                alpha: Math.random(),
                speed: Math.random() * 0.01 + 0.005
            });
        }
    }

    // Moteur de scan ultra-épuré et aéré
    function initNameMatrix(text) {
        targetPoints = [];
        if (!text.trim()) return;

        // Résolution virtuelle stable pour éviter toute distorsion Y
        const vWidth = 1920;
        const vHeight = 1080;

        const memCanvas = document.createElement('canvas');
        const memCtx = memCanvas.getContext('2d');
        memCanvas.width = vWidth;
        memCanvas.height = vHeight;
        
        // Taille adaptée à la longueur pour que ça reste imposant sans déborder
        let baseSize = vWidth * 0.16;
        if (text.length > 5) {
            baseSize = baseSize * (5 / text.length);
        }
        const fontSize = Math.max(baseSize, 90);
        
        memCtx.fillStyle = 'white';
        // CHANGEMENT MAJEUR : On utilise une police serif fine (style constellation) non-grasse
        memCtx.font = `${fontSize}px 'Courier New', Georgia, serif`;
        memCtx.textBaseline = 'middle';
        memCtx.textAlign = 'center';
        
        memCtx.fillText(text.toUpperCase(), vWidth / 2, vHeight / 2);
        
        const imageData = memCtx.getImageData(0, 0, vWidth, vHeight);
        
        // CHANGEMENT MAJEUR : Un très grand GAP pour espacer au maximum les étoiles
        const isMobile = window.innerWidth < 768;
        const gap = isMobile ? 32 : 26; 

        // Facteur d'échelle pour l'écran réel
        const scale = isMobile ? (canvas.width * 0.9) / vWidth : (canvas.width * 0.75) / vWidth;
        
        const offsetX = (canvas.width - (vWidth * scale)) / 2;
        const offsetY = (canvas.height - (vHeight * scale)) * 0.38; // Surélevé pour l'interface

        for (let y = 0; y < vHeight; y += gap) {
            for (let x = 0; x < vWidth; x += gap) {
                const index = (y * vWidth + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    // Positions pures sans Jitter pour préserver la clarté du tracé
                    const realX = x * scale + offsetX;
                    const realY = y * scale + offsetY;
                    
                    targetPoints.push({ x: realX, y: realY });
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY, isExtra = false) {
            this.x = -50 - (Math.random() * 600); 
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            this.isExtra = isExtra;
            
            this.vx = Math.random() * 5 + 4; 
            this.vy = (Math.random() * 2 - 1) * 0.1;
            
            // Étoiles plus fines pour un rendu élégant
            const rand = Math.random();
            if (rand > 0.85) {
                this.size = Math.random() * 2.0 + 1.8; // Étoiles repères lumineuses
                this.brightness = 85; 
            } else {
                this.size = Math.random() * 0.8 + 0.6; // Étoiles de structure très discrètes
                this.brightness = 65;
            }
            
            this.hue = Math.random() * 20 + 195; // Cyan/Bleu cosmique
            this.life = 1;
            this.ease = Math.random() * 0.05 + 0.03; 
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
                if (this.x >= this.targetX - 100) {
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
            
            // Effet lueur uniquement sur les étoiles majeures pour garder la netteté
            ctx.shadowBlur = (this.isCaptured && this.size > 1.7) ? 8 : 0;
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
        
        // Moins d'étoiles de passage pour purifier la scène
        const extraCount = Math.min(targetPoints.length * 0.15, 40);
        for(let i = 0; i < extraCount; i++) {
            particlesArray.push(new Particle(0, 0, true));
        }
    }

    function connectParticles() {
        // On augmente la distance max car les étoiles sont plus éloignées les unes des autres
        const maxDistance = window.innerWidth < 768 ? 65 : 55; 
        
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isExtra || !particlesArray[a].isCaptured) continue;
            
            let connections = 0;
            
            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isExtra || !particlesArray[b].isCaptured) continue;
                if (connections >= 2) break; // Maximum 2 liens pour un effet filaire géométrique épuré
                
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    connections++;
                    let opacity = (1 - (distance / maxDistance)) * 0.35;
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    ctx.lineWidth = 0.7; // Ligne fine dorée
                    
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
