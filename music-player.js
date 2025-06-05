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
let isPaused = false;

function getAudioElement() {
    if (!audio) {
        audio = document.getElementById('globalMusicPlayer');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'globalMusicPlayer';
            audio.style.display = 'none';
            document.body.appendChild(audio);
        }
    }
    return audio;
}

function getRandomIndex() {
    return Math.floor(Math.random() * musicFiles.length);
}

function playSong(index, seek = 0) {
    const audioEl = getAudioElement();
    audioEl.src = musicFolder + musicFiles[index];
    audioEl.volume = 0.5;
    audioEl.currentTime = seek;
    audioEl.onended = playNextSong;
    if (!isPaused) audioEl.play();
    saveState();
}

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % musicFiles.length;
    playSong(currentSongIndex);
}

function saveState() {
    const audioEl = getAudioElement();
    localStorage.setItem('musicAllowed', 'yes');
    localStorage.setItem('musicPaused', isPaused ? 'true' : 'false');
    localStorage.setItem('musicIndex', currentSongIndex);
    localStorage.setItem('musicSeek', audioEl.currentTime);
}

export function askAndPlayMusic() {
    const allowed = localStorage.getItem('musicAllowed');
    isPaused = localStorage.getItem('musicPaused') === 'true';
    currentSongIndex = parseInt(localStorage.getItem('musicIndex'), 10);
    let seek = parseFloat(localStorage.getItem('musicSeek')) || 0;
    if (isNaN(currentSongIndex)) currentSongIndex = getRandomIndex();

    if (allowed === 'yes') {
        playSong(currentSongIndex, seek);
        if (isPaused) getAudioElement().pause();
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
        localStorage.setItem('musicPaused', 'false');
        document.body.removeChild(modal);
        isPaused = false;
        currentSongIndex = getRandomIndex();
        playSong(currentSongIndex);
    };
    document.getElementById('musicNo').onclick = () => {
        localStorage.setItem('musicAllowed', 'no');
        document.body.removeChild(modal);
    };
}

// Pause and play controls
export function pauseMusic() {
    getAudioElement().pause();
    isPaused = true;
    saveState();
}
export function playMusic() {
    getAudioElement().play();
    isPaused = false;
    saveState();
}

// Save state on unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', saveState);
}