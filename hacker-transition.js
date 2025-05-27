export function showHackerTransition(nextUrl) {
    const overlay = document.getElementById('hackerTransition');
    const canvas = document.getElementById('hackerTransitionCanvas');
    const ctx = canvas.getContext('2d');
    overlay.style.display = 'flex';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 18;
    const columns = Math.floor(canvas.width / fontSize);
    let drops = Array.from({ length: columns }).fill(1);

    let frames = 0;
    function draw() {
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00FF00";
        ctx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        frames++;
        if (frames < 25) {
            requestAnimationFrame(draw);
        } else {
            overlay.style.opacity = 0;
            setTimeout(() => {
                window.location.href = nextUrl;
            }, 250);
        }
    }
    overlay.style.opacity = 1;
    draw();
}