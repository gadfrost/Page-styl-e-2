window.addEventListener('load', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    let particlesArray = [];
    let backgroundStars = [];
    let activeName = "G_Frost"; // Prénom par défaut

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        initStarText(activeName);
    }

    // Fond de l'espace subtil
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

    // Génération pure des lettres par les étoiles
    function initStarText(text) {
        particlesArray = [];
        if (!text.trim()) return;

        const isMobile = canvas.width < 768;
        
        // TAILLE DYNAMIQUE ET GRANDE : s'adapte parfaitement à l'écran du téléphone
        let fontSize = isMobile ? (canvas.width / (text.length * 0.65)) : (canvas.width / (text.length * 0.85));
        
        // Limites pour éviter que ce soit gigantesque sur PC ou minuscule sur mobile
        const maxFontSize = isMobile ? 110 : 180;
        const minFontSize = isMobile ? 65 : 100;
        fontSize = Math.min(Math.max(fontSize, minFontSize), maxFontSize);

        // Utilisation d'une police grasse et standard pour avoir une belle densité d'étoiles
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        const textX = canvas.width / 2;
        // Placé à 35% de la hauteur pour être parfaitement visible au-dessus de l'interface
        const textY = canvas.height * 0.35; 

        // Dessin temporaire pour capturer la forme parfaite des lettres
        ctx.fillStyle = 'white';
        ctx.fillText(text.toUpperCase(), textX, textY);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // On efface le texte blanc immédiatement

        // Ajustement de la distance entre les étoiles pour que les lettres soient denses et nettes
        const gap = isMobile ? 6 : 10;

        for (let y = 0; y < canvas.height; y += gap) {
            for (let x = 0; x < canvas.width; x += gap) {
                const index = (y * canvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    // On crée une particule-étoile pour ce point précis
                    particlesArray.push(new Particle(x, y));
                }
            }
        }
    }

    class Particle {
        constructor(targetX, targetY) {
            // Les étoiles arrivent de la gauche avec un effet de vélocité cosmique
            this.x = -20 - (Math.random() * 400);
            this.y = Math.random() * canvas.height;
            
            this.targetX = targetX;
            this.targetY = targetY;
            
            this.vx = Math.random() * 7 + 5; 
            this.vy = (Math.random() * 2 - 1) * 0.2;
            
            // Look des étoiles : un mix de petites et de moyennes pour créer du relief
            const rand = Math.random();
            if (rand > 0.80) {
                this.size = Math.random() * 2.0 + 1.6; // Étoiles brillantes de contour
                this.brightness = Math.random() * 10 + 85; 
            } else {
                this.size = Math.random() * 1.0 + 0.5; // Étoiles fines de remplissage
                this.brightness = Math.random() * 15 + 65;
            }
            
            // Teinte bleue/cyan lumineuse (effet néon cosmique)
            this.hue = Math.random() * 20 + 195; 
            this.ease = Math.random() * 0.05 + 0.03; // Vitesse d'assemblage fluide
            this.isCaptured = false;
        }

        update() {
            if (!this.isCaptured && this.x >= this.targetX - 80) {
                this.isCaptured = true;
            }

            if (this.isCaptured) {
                // Guidage parfait vers la cible sans tremblement (Pas de Jitter)
                this.x += (this.targetX - this.x) * this.ease;
                this.y += (this.targetY - this.y) * this.ease;
            } else {
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
            
            // Bel effet de lueur cosmique uniquement pour les étoiles principales stabilisées
            ctx.shadowBlur = (this.isCaptured && this.size > 1.5) ? 10 : 0;
            ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset pour ne pas alourdir le processeur mobile
        }
    }

    function animate() {
        // Traînée de mouvement propre (effet de fondu noir)
        ctx.fillStyle = 'rgba(6, 6, 14, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rendu des étoiles de fond
        backgroundStars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        // Rendu des étoiles du prénom (sans AUCUNE ligne dorée)
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
