const socket = new WebSocket('ws://localhost:8765');

socket.onopen = () =>
{
    console.log('WebSocket bağlantısı kuruldu.');
};

socket.onmessage = (event) =>
{
    console.log('Gelen mesaj:', event.data);
};

// JavaScript Kodları
const keyColorMap = {
    's': 's',
    'd': 'd',
    'f': 'f',
    'j': 'j',
    'k': 'k',
    'l': 'l'
};

const activeKeys = new Set();
const colorBoxes = {};
for (let key in keyColorMap)
{
    colorBoxes[key] = document.getElementById(key);
}

let isRecording = false;
let recordingStartTime = null;
const recordedEvents = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const playBtn = document.getElementById('playBtn');
const backgroundMusic = document.getElementById('backgroundMusic');
const playMusicBtn = document.getElementById('playMusicBtn');
const pauseMusicBtn = document.getElementById('pauseMusicBtn');
const musicFileInput = document.getElementById('musicFile');

let musicLoaded = false;

musicFileInput.addEventListener('change', (event) =>
{
    const file = event.target.files[0];
    if (file)
    {
        const fileURL = URL.createObjectURL(file);
        backgroundMusic.src = fileURL;
        musicLoaded = true;
        playMusicBtn.disabled = false;
        alert("Müzik dosyası başarıyla yüklendi!");
    } else
    {
        backgroundMusic.src = '';
        musicLoaded = false;
        playMusicBtn.disabled = true;
        pauseMusicBtn.disabled = true;
        alert("Hiçbir müzik dosyası seçilmedi.");
    }
});

playMusicBtn.addEventListener('click', () =>
{
    if (!musicLoaded)
    {
        alert("Lütfen önce müzik dosyasını yükleyin.");
        return;
    }
    backgroundMusic.play();
    playMusicBtn.disabled = true;
    pauseMusicBtn.disabled = false;
});

pauseMusicBtn.addEventListener('click', () =>
{
    backgroundMusic.pause();
    playMusicBtn.disabled = false;
    pauseMusicBtn.disabled = true;
});

startBtn.addEventListener('click', () =>
{
    if (!musicLoaded)
    {
        alert("Lütfen önce müzik dosyasını yükleyin.");
        return;
    }
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    playMusicBtn.disabled = true;
    pauseMusicBtn.disabled = false;

    isRecording = true;
    recordingStartTime = Date.now();
    recordedEvents.length = 0;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    playBtn.disabled = true;
    console.log('Kayıt başlatıldı.');

    backgroundMusic.addEventListener('ended', stopRecordingOnMusicEnd);
});

function stopRecordingOnMusicEnd()
{
    if (isRecording)
    {
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        playBtn.disabled = recordedEvents.length === 0;
        console.log('Kayıt durduruldu (müzik sona erdi).');
        if (recordedEvents.length > 0)
        {
            console.log('Kaydedilen Etkinlikler:', recordedEvents);
        }
        backgroundMusic.removeEventListener('ended', stopRecordingOnMusicEnd);
    }
}

stopBtn.addEventListener('click', () =>
{
    if (isRecording)
    {
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        playBtn.disabled = recordedEvents.length === 0;
        console.log('Kayıt durduruldu.');
        if (recordedEvents.length > 0)
        {
            console.log('Kaydedilen Etkinlikler:', recordedEvents);
        }
        backgroundMusic.removeEventListener('ended', stopRecordingOnMusicEnd);
        backgroundMusic.pause();
        playMusicBtn.disabled = false;
        pauseMusicBtn.disabled = true;
    }
});

playBtn.addEventListener('click', () =>
{
    if (recordedEvents.length === 0) return;

    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    playMusicBtn.disabled = true;
    pauseMusicBtn.disabled = false;

    playBtn.disabled = true;
    startBtn.disabled = true;
    stopBtn.disabled = true;
    console.log('Kayıt oynatılıyor...');

    recordedEvents.forEach(event =>
    {
        const { type, key, timestamp } = event;
        const delay = timestamp;
        setTimeout(() =>
        {
            if (type === 'keydown')
            {
                activateKey(key);
            } else if (type === 'keyup')
            {
                deactivateKey(key);
            }

            if (event === recordedEvents[recordedEvents.length - 1])
            {
                setTimeout(() =>
                {
                    playBtn.disabled = false;
                    startBtn.disabled = false;
                    console.log('Oynatma tamamlandı.');
                }, 100);
            }
        }, delay);
    });
});

function activateKey(key)
{
    if (keyColorMap[key] && !activeKeys.has(key))
    {
        activeKeys.add(key);
        colorBoxes[key].classList.add('active');
        console.log(`Aktif tuş: ${key}`);
        // WebSocket ile LED'i aç
        socket.send(`open:${key}`);
    }
}

function deactivateKey(key)
{
    if (keyColorMap[key] && activeKeys.has(key))
    {
        activeKeys.delete(key);
        colorBoxes[key].classList.remove('active');
        console.log(`Pasif tuş: ${key}`);
        // WebSocket ile LED'i kapat
        socket.send(`close:${key}`);
    }
}

window.addEventListener('keydown', (event) =>
{
    const key = event.key.toLowerCase();
    if (keyColorMap[key] && !activeKeys.has(key))
    {
        activateKey(key);
    }

    if (isRecording)
    {
        const timestamp = Date.now() - recordingStartTime;
        recordedEvents.push({
            type: 'keydown',
            key: key,
            timestamp: timestamp
        });
    }
});

window.addEventListener('keyup', (event) =>
{
    const key = event.key.toLowerCase();
    if (keyColorMap[key] && activeKeys.has(key))
    {
        deactivateKey(key);
    }

    if (isRecording)
    {
        const timestamp = Date.now() - recordingStartTime;
        recordedEvents.push({
            type: 'keyup',
            key: key,
            timestamp: timestamp
        });
    }
});

const exportBtn = document.getElementById('exportBtn');

stopBtn.addEventListener('click', () =>
{
    exportBtn.disabled = recordedEvents.length === 0;
});

exportBtn.addEventListener('click', () =>
{
    if (recordedEvents.length === 0)
    {
        alert("Dışa aktarılacak kayıt bulunmuyor.");
        return;
    }

    const dataStr = JSON.stringify(recordedEvents, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recorded_events.json';
    a.click();
    URL.revokeObjectURL(url);

    console.log('Kayıt dışa aktarıldı.');
});

playBtn.addEventListener('click', () =>
{
    exportBtn.disabled = true;
});