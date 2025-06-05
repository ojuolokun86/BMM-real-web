const musicFolder = './music/';
const musicFiles = [
    'song1.mp3',
    'song2.mp3',
    'song3.mp3',
    'song4.mp3',
    'song5.mp3',
    'song6.mp3',
    // Add more filenames as needed
];

let audio = null;
let currentSongIndex = -1;

function getRandomIndex() {
    return Math.floor(Math.random() * musicFiles.length);
}

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % musicFiles.length;
    playSong(currentSongIndex);
}

function playSong(index) {
    if (audio) {
        audio.pause();
        audio = null;
    }
    audio = new Audio(musicFolder + musicFiles[index]);
    audio.volume = 0.5;
    audio.play();
    audio.onended = playNextSong;
}

export function askAndPlayMusic() {
    if (localStorage.getItem('musicAllowed') === 'yes') {
        // Already allowed, start music
        currentSongIndex = getRandomIndex();
        playSong(currentSongIndex);
        return;
    }
    // Show a simple modal/prompt
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 9999;
    modal.innerHTML = `
        <div style="background:#181828;padding:32px 24px;border-radius:12px;text-align:center;box-shadow:0 4px 24px #000;">
            <h2 style="color:#ffd700;">🎵 Play background music?</h2>
            <p style="color:#e0e0e0;">Would you like to enjoy music while using Techitoon Bot?</p>
            <button id="musicYes" style="margin:8px 18px 0 0;" class="btn-primary">Yes</button>
            <button id="musicNo" class="btn-secondary">No</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('musicYes').onclick = () => {
        localStorage.setItem('musicAllowed', 'yes');
        document.body.removeChild(modal);
        currentSongIndex = getRandomIndex();
        playSong(currentSongIndex);
    };
    document.getElementById('musicNo').onclick = () => {
        localStorage.setItem('musicAllowed', 'no');
        document.body.removeChild(modal);
    };
}