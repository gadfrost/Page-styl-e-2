window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let targetPoints = [];
    let activeName = "G_Frost"; // Prénom par défaut au premier chargement

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initNameMatrix(activeName);
        setupConstellation();
    }

    // 1. Poussière cosmique en arrière-plan (scintillement discret)
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

    // 2. Scanner le prénom avec un effet organique et une taille dynamique grand format
    function initNameMatrix(text) {
        targetPoints = [];
        if (!text.trim()) return;

        const memCanvas = document.createElement('canvas');
        const memCtx = memCanvas.getContext('2d');
        
        memCanvas.width = canvas.width;
        memCanvas.height = canvas.height;
        
        const isMobile = canvas.width < 768;
        
        // NOUVEAU : Calcul de taille dynamique beaucoup plus généreux pour les noms courts
        let fontSize;
        if (text.length <= 4) {
            fontSize = isMobile ? canvas.width * 0.22 : canvas.width * 0.16; // Très grand pour les prénoms courts
        } else if (text.length <= 7) {
            fontSize = isMobile ? canvas.width * 0.16 : canvas.width * 0.11;
        } else {
            fontSize = isMobile ? canvas.width * 0.11 : canvas.width * 0.08; // Plus compact pour les noms longs
        }
        
        memCtx.fillStyle = 'white';
        memCtx.font = `bold ${fontSize}px sans-serif`;
        memCtx.textBaseline = 'middle';
        memCtx.textAlign = 'center';
        
        // Dessiner le texte sur le canvas invisible (légèrement surélevé pour laisser place à l'interface en bas)
        memCtx.fillText(text.toUpperCase(), memCanvas.width / 2, memCanvas.height * 0.42);
        
        const imageData = memCtx.getImageData(0, 0, memCanvas.width, memCanvas.height);
        
        // Résolution du scan : un écart bien dosé pour éviter l'effet "gros paquets de pixels"
        const gap = isMobile ? 8 : 13; 
        
        for (let y = 0; y < memCanvas.height; y += gap) {
            for (let x = 0; x < memCanvas.width; x += gap) {
                const index = (y * memCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    // MÉTAMORPHOSE 1 : Désalignement cosmique (Jitter) pour casser la grille informatique
                    const offsetX = (Math.random() - 0.5) * 5;
                    const offsetY = (Math.random() - 0.5) * 5;
                    targetPoints.push({ x: x + offsetX, y: y + offsetY });
                }
            }
        }
    }

    // 3. Classe représentant chaque étoile mobile
    class Particle {
        constructor(targetX, targetY, isExtra = false) {
            // Effet de pluie/vague venant de la gauche
            this.x = -50 - (Math.random() * 800); 
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            this.isExtra = isExtra;
            
            this.vx = Math.random() * 5 + 4; // Vitesse de la pluie vers la droite
            this.vy = (Math.random() * 2 - 1) * 0.3;
            
            // MÉTAMORPHOSE 2 : Profondeur spatiale (Grosses étoiles majeures VS petites étoiles secondaires)
            const rand = Math.random();
            if (rand > 0.90) {
                this.size = Math.random() * 2.5 + 2.2; // Étoile clé très brillante
                this.brightness = Math.random() * 10 + 85; 
            } else {
                this.size = Math.random() * 1.0 + 0.7; // Étoile fine de remplissage
                this.brightness = Math.random() * 15 + 60;
            }
            
            this.hue = Math.random() * 30 + 195; // Teintes Cyan / Bleu néon céleste
            this.life = 1;
            this.ease = Math.random() * 0.05 + 0.03; // Force d'attraction
            this.isCaptured = false;
        }
        
        update() {
            if (this.isExtra) {
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // Dès que l'étoile filante arrive à portée du prénom, le magnétisme s'active
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
            
            // Lueur uniquement sur les étoiles principales fixes pour ne pas saturer l'écran
            ctx.shadowBlur = (this.isCaptured && this.size > 2) ? 10 : 0;
            ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset pour les performances
        }
    }

    function setupConstellation() {
        particlesArray = [];
        
        // Création des étoiles qui composent le prénom
        targetPoints.forEach(point => {
            particlesArray.push(new Particle(point.x, point.y, false));
        });
        
        // Étoiles de passage qui traversent l'écran sans s'arrêter
        const extraCount = Math.min(targetPoints.length * 0.25, 80);
        for(let i = 0; i < extraCount; i++) {
            particlesArray.push(new Particle(0, 0, true));
        }
    }

    // MÉTAMORPHOSE 3 : Filaments d'or épurés (Fini l'effet "grillage lourd")
    function connectParticles() {
        const maxDistance = 38; 
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isExtra || !particlesArray[a].isCaptured) continue;
            
            let connections = 0; // Limiteur strict de liens
            
            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isExtra || !particlesArray[b].isCaptured) continue;
                if (connections >= 2) break; // Maximum 2 connexions par étoile pour garder le tracé pur
                
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    connections++;
                    let opacity = (1 - (distance / maxDistance)) * 0.3; // Lignes d'or translucides et fines
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
        // Traînée noire pour l'effet de mouvement fluide des météores
        ctx.fillStyle = 'rgba(6, 6, 14, 0.24)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessin du fond étoilé scintillant
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

    // Gestion de l'interaction utilisateur
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
