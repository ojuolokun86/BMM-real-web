const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

function resizeMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeMatrix();

const letters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ2TGH58TSFJKKWQUOPLKVNASD2589DDF45C11XDAXX";
const fontSize = 16;
let columns = Math.floor(window.innerWidth / fontSize);
let drops = Array.from({ length: columns }).fill(1);

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
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
}

setInterval(drawMatrix, 33);

window.addEventListener('resize', () => {
    resizeMatrix();
    columns = Math.floor(window.innerWidth / fontSize);
    drops = Array.from({ length: columns }).fill(1);
});