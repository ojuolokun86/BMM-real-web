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
    if (!musicFiles[index]) {
        console.warn('🎵 Invalid song index:', index);
        return;
    }

    const audioEl = getAudioElement();
    const fileName = musicFiles[index];
    audioEl.src = musicFolder + fileName;
    audioEl.volume = 0.5;
    audioEl.currentTime = seek;
    audioEl.onended = playNextSong;

    currentSongIndex = index;

    if (!isPaused) {
        audioEl.play()
            .then(() => {
                console.log(`🎵 Playing: ${fileName}`);
            })
            .catch(err => {
                console.warn('🎵 Auto-play blocked:', err.message);
            });
    }

    saveState();
}

function playNextSong() {
    let nextIndex = (currentSongIndex + 1) % musicFiles.length;
    playSong(nextIndex);
}

function saveState() {
    const audioEl = getAudioElement();
    localStorage.setItem('musicAllowed', 'yes');
    localStorage.setItem('musicPaused', isPaused ? 'true' : 'false');
    localStorage.setItem('musicIndex', currentSongIndex);
    localStorage.setItem('musicSeek', audioEl.currentTime || 0);
}

export function askAndPlayMusic() {
    const allowed = localStorage.getItem('musicAllowed');
    isPaused = localStorage.getItem('musicPaused') === 'true';
    currentSongIndex = parseInt(localStorage.getItem('musicIndex'), 10);
    let seek = parseFloat(localStorage.getItem('musicSeek')) || 0;
    if (isNaN(currentSongIndex) || !musicFiles[currentSongIndex]) {
        currentSongIndex = getRandomIndex();
    }

    if (allowed === 'yes') {
        playSong(currentSongIndex, seek);
        if (isPaused) {
            getAudioElement().play().then(() => {
                getAudioElement().pause();
            });
        }
        return;
    }

    // Show permission modal
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
        currentSongIndex = getRandomIndex();
        isPaused = false;

        const audioEl = getAudioElement();
        const fileName = musicFiles[currentSongIndex];
        audioEl.src = musicFolder + fileName;
        audioEl.volume = 0.5;
        audioEl.currentTime = 0;
        audioEl.onended = playNextSong;

        audioEl.play().then(() => {
            console.log(`🎵 Playing: ${fileName}`);
            localStorage.setItem('musicAllowed', 'yes');
            localStorage.setItem('musicPaused', 'false');
            saveState();
            document.body.removeChild(modal);
        }).catch(err => {
            console.error('🎵 Failed to play audio:', err.message);
            document.body.removeChild(modal);
        });
    };

    document.getElementById('musicNo').onclick = () => {
        localStorage.setItem('musicAllowed', 'no');
        document.body.removeChild(modal);
    };
}

export function pauseMusic() {
    getAudioElement().pause();
    isPaused = true;
    saveState();
}

export function playMusic() {
    const audioEl = getAudioElement();
    const file = audioEl.src.split('/').pop();
    if (!file || !file.endsWith('.mp3')) {
        // Fix if audio src is empty or invalid
        currentSongIndex = getRandomIndex();
        playSong(currentSongIndex);
        return;
    }

    audioEl.play().catch(err => {
        console.warn('🎵 Could not play:', err.message);
    });
    isPaused = false;
    saveState();
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', saveState);
}
