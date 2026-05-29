const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
let backgroundStars = [];
let targetPoints = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initBackgroundStars();
    initTargetPoints(); // Recalculer la position de la lettre selon la taille de l'écran
}
window.addEventListener('resize', resizeCanvas);

// 1. Poussière cosmique en arrière-plan
function initBackgroundStars() {
    backgroundStars = [];
    const numberOfBackgroundStars = Math.min(window.innerWidth * 0.1, 120); // S'adapte à la taille de l'écran
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

// 2. Génération des points cibles pour former la lettre "G" au centre
function initTargetPoints() {
    targetPoints = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Ajustement de la taille de la lettre selon l'écran (PC ou Mobile)
    const radius = Math.min(canvas.width, canvas.height) * 0.25; 
    
    // Tracer l'arc du G
    for (let angle = 0.1; angle < Math.PI * 1.75; angle += 0.08) {
        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius;
        targetPoints.push({ x: x, y: y });
    }
    
    // Tracer la barre horizontale du G
    const barLength = radius * 0.6;
    const startBarX = centerX + Math.cos(Math.PI * 1.75) * radius; // Point d'arrêt de l'arc
    const barY = centerY + Math.sin(0) * radius * 0.2; // Hauteur de la barre centrale
    
    for (let xOffset = 0; xOffset < barLength; xOffset += 8) {
        targetPoints.push({
            x: centerX + (barLength - xOffset),
            y: centerY
        });
    }
    
    // Tracer la petite barre verticale descendante du G
    for (let yOffset = 0; yOffset < radius * 0.4; yOffset += 8) {
        targetPoints.push({
            x: centerX + barLength,
            y: centerY + yOffset
        });
    }
}

resizeCanvas();

class Particle {
    constructor(targetX, targetY) {
        // Naissance au centre de l'écran avec une petite explosion aléatoire
        this.x = canvas.width / 2 + (Math.random() * 40 - 20);
        this.y = canvas.height / 2 + (Math.random() * 40 - 20);
        
        this.targetX = targetX;
        this.targetY = targetY;
        
        this.size = Math.random() * 5 + 3;
        this.hue = Math.random() * 40 + 195; // Bleu/Cyan Néon
        this.brightness = Math.random() * 20 + 65;
        this.life = 0; // Allez de 0 à 1 pour apparaître en fondu
        
        // Vitesse d'attraction vers sa cible
        this.ease = Math.random() * 0.04 + 0.02;
    }
    
    update() {
        // Logique d'attraction magnétique vers le point de la lettre
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        
        this.x += dx * this.ease;
        this.y += dy * this.ease;
        
        if (this.life < 1) this.life += 0.01; // Apparition douce
    }
    
    draw() {
        ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.life})`;
        
        // EFFET NÉON (BLOOM)
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset
    }
}

// Remplir le tableau de particules basé sur les points cibles créés
function setupConstellation() {
    particlesArray = [];
    targetPoints.forEach(point => {
        particlesArray.push(new Particle(point.x, point.y));
    });
}
setupConstellation();

// Connexion des filaments dorés entre les étoiles de la lettre
function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            // Connexion si les étoiles sont proches en formant la structure
            if (distance < 65) {
                let opacity = (1 - (distance / 65)) * 0.6;
                
                ctx.shadowBlur = 3;
                ctx.shadowColor = "rgba(212, 175, 55, 1)";
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
    // Fond sombre cosmique
    ctx.fillStyle = 'rgba(6, 6, 14, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scintillement du fond
    backgroundStars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    
    // Mettre à jour et dessiner les étoiles de la lettre
    particlesArray.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    connectParticles();
    
    requestAnimationFrame(animate);
}

// Relancer l'animation au clic ou touché pour l'effet de réapparition
window.addEventListener('click', setupConstellation);
window.addEventListener('touchstart', setupConstellation);

animate();
