let scoreh = document.getElementById("s1");
let scoreg = document.getElementById("s2");
let foulwonh = document.getElementById("foulsh");
let foulwong = document.getElementById("foulsg");
let finwin = document.getElementById("fw");
let resulth = 0;
let resultg = 0;
let flh = 0;
let flg = 0;
let minutes = 0;
let seconds = 0;
let maxPeriod = 0;
let periodno = 0;
let time = document.getElementById("timer");
let per = document.getElementById("period");
let timerInterval;
let timerPaused = true;
let team1Name = "TEAM 1";
let team2Name = "TEAM 2";
let periodTime = 0;
let gameStarted = false;
let breakTime = 5000;
let speechEnabled = false;
let ambientCommentaryInterval;
let lastAmbientTime = 0;
const minAmbientInterval = 10000;
const maxAmbientInterval = 12000;
let speechQueue = [];
let isSpeaking = false;
let gameActive = false;

loadGameState();
window.onload = function() {
    if (!localStorage.getItem('gameSetupComplete')) showSetupPopup();
    
    // Make sure New Game button exists
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv && !document.querySelector('.new-game-btn')) {
        const newBtn = document.createElement('button');
        newBtn.className = 'new-game-btn';
        newBtn.textContent = 'New Game';
        newBtn.onclick = restartGame;
        controlsDiv.appendChild(newBtn);
    }
    
    if (window.speechSynthesis) {
        if (window.speechSynthesis.getVoices().length > 0) createSpeechControls();
        else window.speechSynthesis.onvoiceschanged = createSpeechControls;
    }
    
    // Load game state after ensuring buttons exist
    loadGameState();
    winner();
};

function createSpeechControls() {
    if (document.querySelector('.speech-controls')) return;
    const speechContainer = document.createElement('div');
    speechContainer.className = 'speech-controls';
    speechContainer.innerHTML = `
        <button class="speech-btn" id="enable-speech">${speechEnabled ? 'Disable Commentary' : 'Enable Commentary'}</button>
        <div id="speech-status" style="text-align: center; margin-top: 5px; color: ${speechEnabled ? '#2ecc71' : '#888'}">${speechEnabled ? 'Commentary: On' : 'Commentary: Off'}</div>
    `;
    // Insert after timer, before box (since "ENJOY SCORING!" is removed)
    document.querySelector('.outer-box').insertBefore(speechContainer, document.querySelector('.box'));
    const button = document.getElementById('enable-speech');
    button.style.border = `2px dotted ${speechEnabled ? '#00ff00' : '#888'}`;
    button.onclick = enableSpeech;
    if (speechEnabled && gameActive) startAmbientCommentary();
}

function enableSpeech() {
    speechEnabled = !speechEnabled;
    const button = document.getElementById('enable-speech');
    const status = document.getElementById('speech-status');
    if (speechEnabled) {
        button.textContent = 'Disable Commentary';
        status.textContent = 'Commentary: On';
        status.style.color = '#00ff00';
        button.style.border = '2px dotted #00ff00'; // Full border property
        window.speechSynthesis.cancel();
        speechQueue = [];
        isSpeaking = false;
        const utterance = new SpeechSynthesisUtterance('');
        setMaleVoice(utterance);
        utterance.onend = function() {
            if (finwin.textContent !== "READY TO START ?") speakText(finwin.textContent, false);
            if (gameActive) startAmbientCommentary();
        };
        window.speechSynthesis.speak(utterance);
    } else {
        button.textContent = 'Enable Commentary';
        status.textContent = 'Commentary: Off';
        status.style.color = '#888';
        button.style.border = '2px dotted #888'; // Full border property
        window.speechSynthesis.cancel();
        speechQueue = [];
        isSpeaking = false;
        stopAmbientCommentary();
    }
    saveSpeechState();
}

function saveSpeechState() {
    localStorage.setItem('speechEnabled', speechEnabled);
    localStorage.setItem('lastDisplayText', finwin.textContent);
}

function loadSpeechState() {
    speechEnabled = localStorage.getItem('speechEnabled') === 'true';
    if (finwin) finwin.textContent = localStorage.getItem('lastDisplayText') || "READY TO START ?";
}

function setMaleVoice(utterance) {
    const voices = window.speechSynthesis.getVoices();
    let maleVoice = voices.find(voice => /Male|male|David|James|Daniel|Alex|Google UK English Male/i.test(voice.name)) ||
                     voices.find(voice => !/Female|female|Samantha|Victoria|Zira|Karen/i.test(voice.name));
    if (maleVoice) utterance.voice = maleVoice;
    utterance.pitch = 0.8;
}

function getAmbientCommentary() {
    const ambientComments = [
        // General basketball-related
        `What a beautiful day for ${team1Name} and ${team2Name}, the atmosphere is electric.`,
        "The fans are really into this game tonight, on their feet for every play.",
        "What a display of teamwork out there, a classic basketball showdown.",

        // About host city
        "This city really loves its basketball, the streets outside are buzzing with game-day excitement.",

        // About weather
        "Perfect conditions for today's game, ideal for some indoor hoops action.",

        // About teams
        `Both ${team1Name} and ${team2Name} have been playing well this season, the rivalry between these two teams goes back many years.`,
        `${team1Name} defense is a wall tonight has that championship pedigree on display.`,
        `${team2Name} offense is firing on all cylinders showing why they are fan favorite.`,

        // About coaches
        "The coaches are really animated on the sidelines, executing their master plans.",
        `${team1Name} coach is a master tactician under pressure, a pure genius.`,
        `${team2Name} coach knows how to rally the troops, especially in close encounters.`,

        // Strengths
        `${team1Name} shooting is their strength tonight, while ${team2Name} is more focused on rebounds.`,
        "Both teams are showcasing their depth tonight, every player stands tall.",

        // Weaknesses
        `${team1Name} might need to tighten up their turnovers, before they screw up.`,
        `${team2Name} perimeter defense looks shaky, causing a lot trouble.`,

    ];
    let contextualComments = [];
    if (resulth > resultg && resulth - resultg > 10) contextualComments.push(`${team1Name} has a comfortable lead.`);
    else if (resultg > resulth && resultg - resulth > 10) contextualComments.push(`${team2Name} is dominating.`);
    if (flh > 5) contextualComments.push(`${team1Name} needs to watch those fouls.`);
    if (flg > 5) contextualComments.push(`${team2Name}'s foul count is piling up.`);
    else if (periodno === maxPeriod) contextualComments.push("Final period, every moment counts.");
    const allComments = [...ambientComments, ...contextualComments];
    return allComments[Math.floor(Math.random() * allComments.length)];
}

function startAmbientCommentary() {
    stopAmbientCommentary();
    scheduleNextAmbientComment();
}

function scheduleNextAmbientComment() {
    if (!speechEnabled || !gameActive) return;
    const randomDelay = Math.floor(Math.random() * (maxAmbientInterval - minAmbientInterval)) + minAmbientInterval;
    ambientCommentaryInterval = setTimeout(() => {
        if (speechEnabled && !isSpeaking && speechQueue.length === 0) {
            speakText(getAmbientCommentary(), true);
        }
        scheduleNextAmbientComment();
    }, randomDelay);
}

function stopAmbientCommentary() {
    if (ambientCommentaryInterval) clearTimeout(ambientCommentaryInterval);
}

function speakText(text, isAmbient = false) {
    if (!speechEnabled || !text) return;
    if (isAmbient) {
        if (isSpeaking || speechQueue.length > 0) return;
        const utterance = createUtterance(text, isAmbient);
        isSpeaking = true;
        window.speechSynthesis.speak(utterance);
    } else {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
        }
        speechQueue.push(text);
        processSpeechQueue();
    }
}

function createUtterance(text, isAmbient) {
    const utterance = new SpeechSynthesisUtterance(text);
    setMaleVoice(utterance);
    if (!isAmbient) finwin.classList.add('speaking');
    utterance.volume = 1;
    utterance.rate = text.includes("SCORES") || text.includes("BEATS") ? 1.2 : 1;
    utterance.pitch = text.includes("SCORES") || text.includes("BEATS") ? 1.1 : 0.8;
    utterance.onend = () => {
        if (!isAmbient) finwin.classList.remove('speaking');
        isSpeaking = false;
        if (!isAmbient) setTimeout(processSpeechQueue, 500);
    };
    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        if (!isAmbient) finwin.classList.remove('speaking');
        isSpeaking = false;
        if (!isAmbient) setTimeout(processSpeechQueue, 500);
    };
    return utterance;
}

function processSpeechQueue() {
    if (!speechEnabled || speechQueue.length === 0 || isSpeaking) return;
    const nextText = speechQueue.shift();
    const utterance = createUtterance(nextText, false);
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
}

function showSetupPopup() {
    if (localStorage.getItem('gameSetupComplete')) return;
    const popup = document.createElement('div');
    popup.className = 'setup-popup';
    popup.innerHTML = `
        <div class="popup-content" style="position: relative;">
            <button id="closePopupBtn" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer; color: white;">&#x2715;</button>
            <h2>Game Setup</h2>
            <div style="display: flex; justify-content: center; gap: 10px;">
            <div>
            <label style=" margin-top: 17px;" for="team1">Team 1 Name:</label>
            <label style=" margin-top: 24px;" for="team2">Team 2 Name:</label>
            <label style=" margin-top: 24px;" for="totalTime">Total Game Time (mins):</label>
            <label style=" margin-top: 24px;" for="numPeriods">Number of Periods:</label>
            <label style=" margin-top: 26px;" for="breakTimeInput">Break Time (secs):</label>
            </div>
            <div>
            <div style=" margin-top: 10px;"><input maxlength="15" type="text" id="team1" value="Ankle Breakers"></div>
            <div style=" margin-top: 10px;"><input maxlength="15" type="text" id="team2" value="Brick City"></div>
            <div style=" margin-top: 10px;"><input type="number" id="totalTime" min="1" value="4"></div>
            <div style=" margin-top: 10px;"><input type="number" id="numPeriods" min="1" value="4"></div>
            <div style=" margin-top: 10px;"><input type="number" id="breakTimeInput" min="1" value="1"></div>
            </div>
            </div>
            <div><button id="startGameBtn">Start Game</button></div>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Setup close button functionality
    document.getElementById('closePopupBtn').onclick = () => {
        document.body.removeChild(popup);
        showOnlyNewGameButton();
    };
    
    document.getElementById('startGameBtn').onclick = () => {
        team1Name = (document.getElementById('team1').value || "ANKLE BREAKERS").toUpperCase();
        team2Name = (document.getElementById('team2').value || "BRICK CITY").toUpperCase();
        const totalTime = parseInt(document.getElementById('totalTime').value) || 48;
        maxPeriod = parseInt(document.getElementById('numPeriods').value) || 4;
        breakTime = (parseInt(document.getElementById('breakTimeInput').value) || 5) * 1000;
        periodTime = Math.floor(totalTime / maxPeriod);
        minutes = periodTime;
        seconds = 0;
        document.querySelector('.left-box .container div').textContent = team1Name; // Team 1 name
        document.querySelector('.right-box .container div').textContent = team2Name; // Team 2 name
        updatetimedis();
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'Pause';
            startBtn.onclick = pauseGame;
        }
        gameStarted = true;
        gameActive = true;
        timerPaused = false;
        periodno = 1;
        per.textContent = periodno;
        finwin.textContent = `PERIOD ${periodno} STARTS, HERE WE GO`;
        speakText(finwin.textContent, false);
        updatetimedis();
        updatetime();
        if (speechEnabled) startAmbientCommentary();
        saveGameState();
        localStorage.setItem('gameSetupComplete', 'true');
        document.body.removeChild(popup);
    };
}

// New function to show only the New Game button
function showOnlyNewGameButton() {
    // Hide the start/pause button
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.style.display = 'none';
    }
    
    // Make sure New Game button is visible
    const newGameBtn = document.querySelector('.new-game-btn');
    if (newGameBtn) {
        newGameBtn.style.display = 'inline-block';
    } else {
        // Create New Game button if it doesn't exist
        const controlsDiv = document.querySelector('.controls');
        if (controlsDiv) {
            const newBtn = document.createElement('button');
            newBtn.className = 'new-game-btn';
            newBtn.textContent = 'New Game';
            newBtn.onclick = restartGame;
            controlsDiv.appendChild(newBtn);
        }
    }
    
    // Set game state to not started but don't save to localStorage
    // This way the popup will show again when New Game is clicked
    gameStarted = false;
    gameActive = false;
    disableButtons(true);
}

function saveGameState() {
    const state = {
        resulth, resultg, flh, flg, minutes, seconds, periodno, maxPeriod,
        timerPaused, team1Name, team2Name, periodTime, gameActive, gameStarted,
        finwinText: finwin.textContent, breakTime,
        team1Highlighted: scoreh.classList.contains('highlighted'),
        team2Highlighted: scoreg.classList.contains('highlighted'),
        timerText: time.textContent // Save timer display state
    };
    localStorage.setItem('gameState', JSON.stringify(state));
    saveSpeechState();
}

function loadGameState() {
    const state = JSON.parse(localStorage.getItem('gameState'));
    loadSpeechState();
    if (state) {
        resulth = state.resulth || 0;
        resultg = state.resultg || 0;
        flh = state.flh || 0;
        flg = state.flg || 0;
        minutes = state.minutes || 0;
        seconds = state.seconds || 0;
        periodno = state.periodno || 0;
        maxPeriod = state.maxPeriod || 4;
        timerPaused = state.timerPaused !== undefined ? state.timerPaused : true;
        team1Name = state.team1Name || "TEAM 1";
        team2Name = state.team2Name || "TEAM 2";
        periodTime = state.periodTime || 12;
        gameActive = state.gameActive !== undefined ? state.gameActive : false;
        gameStarted = state.gameStarted || false;
        breakTime = state.breakTime || 5000;
        if (state.finwinText && finwin) finwin.textContent = state.finwinText;
        
        // Restore timer display ( GAME OVER or time)
        time.textContent = state.timerText || `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        scoreh.textContent = resulth;
        scoreg.textContent = resultg;
        foulwonh.textContent = flh;
        foulwong.textContent = flg;
        per.textContent = periodno;
        document.querySelector('.left-box .container div').textContent = team1Name;
        document.querySelector('.right-box .container div').textContent = team2Name;
        
        if (state.team1Highlighted) scoreh.classList.add('highlighted');
        else scoreh.classList.remove('highlighted');
        if (state.team2Highlighted) scoreg.classList.add('highlighted');
        else scoreg.classList.remove('highlighted');
        
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) {
            // Check for GAME OVER conditions - either explicit state or end of max period with zero time
            const isGameOver = state.timerText === "THAT'S THE WHISTLE, GAME OVER" || 
                              (state.finwinText && state.finwinText.includes("THAT'S THE WHISTLE! GAME OVER")) ||
                              (state.finwinText && (state.finwinText.includes("BEATS") || state.finwinText.includes("DRAWS"))) ||
                              (periodno >= maxPeriod && minutes === 0 && seconds === 0);
                              
            if (isGameOver) {
                startBtn.style.display = 'none'; // Hide if game is over
                gameActive = false;
                disableButtons(true);
            } else {
                startBtn.style.display = 'inline-block';
                updateStartButton();
                if (!timerPaused) updatetime();
            }
        }
    }
}

function disableButtons(disable) {
    document.getElementById("sh1").disabled = disable;
    document.getElementById("sh2").disabled = disable;
    document.getElementById("sh3").disabled = disable;
    document.getElementById("sg1").disabled = disable;
    document.getElementById("sg2").disabled = disable;
    document.getElementById("sg3").disabled = disable;
    document.getElementById("inc1").disabled = disable;
    document.getElementById("inc3").disabled = disable;
}

function fh() {
    flh += 1;
    foulwonh.textContent = flh;
    finwin.textContent = `CONTACT ON THE DRIVE AND THAT'S A FOUL BY ${team1Name}`;
    speakText(finwin.textContent, false);
    saveGameState();
}

function fg() {
    flg += 1;
    foulwong.textContent = flg;
    finwin.textContent = `OH THAT'S AN UNNECESSARY HIT, COULD BE A FLAGRANT FOUL BY ${team2Name}`;
    speakText(finwin.textContent, false);
    saveGameState();
}

function updatetimedis() {
    time.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    saveGameState();
}

function updatetime() {
    if (!timerPaused) {
        disableButtons(false);
        if (minutes === 0 && seconds === 0) {
            timerPaused = true;
            disableButtons(true);
            if (periodno < maxPeriod) {
                finwin.textContent = "IT'S BREAK TIME";
                speakText(finwin.textContent, false);
                saveGameState();
                setTimeout(() => {
                    periodno += 1;
                    per.textContent = periodno;
                    finwin.textContent = `PERIOD ${periodno} STARTS, HERE WE GO`;
                    speakText(finwin.textContent, false);
                    minutes = periodTime;
                    seconds = 0;
                    updatetimedis();
                    timerPaused = false;
                    updatetime();
                    saveGameState();
                }, breakTime);
            } else if (periodno === maxPeriod) {
                time.textContent = "THAT'S THE WHISTLE, GAME OVER";
                finwin.textContent = "THAT'S THE WHISTLE, GAME OVER";
                speakText(finwin.textContent, false);
                gameActive = false;
                stopAmbientCommentary();
                clearInterval(timerInterval);
                const startBtn = document.querySelector('.start-btn');
                if (startBtn) startBtn.style.display = 'none';
                saveGameState();
                setTimeout(() => {
                    finalwinner();
                    saveGameState();
                }, 3000);
            }
        } else if (seconds === 0) {
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        updatetimedis();
        if (!timerPaused) timerInterval = setTimeout(updatetime, 1000);
    }
}

updatetimedis();

function oneh() {
    resulth += 1;
    scoreh.textContent = resulth;
    finwin.textContent = `STEPS UP TO THE LINE AND SINKS IT, ANOTHER POINT FOR ${team1Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function oneg() {
    resultg += 1;
    scoreg.textContent = resultg;
    finwin.textContent = `ONE DRIBBLE TWO DRIBBLES PERFECT SHOT, ANOTHER POINT FOR ${team2Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function twoh() {
    resulth += 2;
    scoreh.textContent = resulth;
    finwin.textContent = `SPINS FADES AND NAILS IT BEAUTIFUL, TWO-POINT PLAY BY ${team1Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function twog() {
    resultg += 2;
    scoreg.textContent = resultg;
    finwin.textContent = `DRIVES TO THE HOOP AND LAYS IT IN, TWO POINTS FOR ${team2Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function threeh() {
    resulth += 3;
    scoreh.textContent = resulth;
    finwin.textContent = `FROM DOWNTOWN BANG, THREE POINTS FOR ${team1Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function threeg() {
    resultg += 3;
    scoreg.textContent = resultg;
    finwin.textContent = `CATCH FIRE BOOM, ANOTHER THREE FOR ${team2Name}`;
    speakText(finwin.textContent, false);
    winner();
    saveGameState();
}

function startGame() {
    const startBtn = document.querySelector('.start-btn');
    if (!gameStarted) {
        gameStarted = true;
        gameActive = true;
        timerPaused = false;
        minutes = periodTime;
        seconds = 0;
        periodno = 1;
        per.textContent = periodno;
        finwin.textContent = `PERIOD ${periodno} STARTS, HERE WE GO`;
        speakText(finwin.textContent, false);
        updatetimedis();
        updatetime();
        if (speechEnabled) startAmbientCommentary();
        startBtn.textContent = 'Pause';
        startBtn.onclick = pauseGame;
    } else if (!timerPaused) {
        pauseGame();
    } else {
        resumeGame();
    }
    saveGameState();
}

function pauseGame() {
    timerPaused = true;
    clearTimeout(timerInterval);
    document.querySelector('.start-btn').textContent = 'Resume';
    document.querySelector('.start-btn').onclick = resumeGame;
    finwin.textContent = "OH, THE GAME PAUSED";
    speakText(finwin.textContent, false);
    saveGameState();
}

function resumeGame() {
    timerPaused = false;
    updatetime();
    document.querySelector('.start-btn').textContent = 'Pause';
    document.querySelector('.start-btn').onclick = pauseGame;
    finwin.textContent = `YES, PERIOD ${periodno} RESUMES`;
    speakText(finwin.textContent, false);
    saveGameState();
}

function updateStartButton() {
    const startBtn = document.querySelector('.start-btn');
    if (gameStarted && !timerPaused) {
        startBtn.textContent = 'Pause';
        startBtn.onclick = pauseGame;
    } else if (gameStarted) {
        startBtn.textContent = 'Resume';
        startBtn.onclick = resumeGame;
    } else {
        startBtn.textContent = 'Start';
        startBtn.onclick = startGame;
    }
}

function restartGame() {
    localStorage.clear(); // Clear all localStorage
    localStorage.removeItem('gameSetupComplete'); // Specifically ensure this is removed
    window.location.reload(); // Reload the page to start fresh
}

function winner() {
    if (resulth > resultg) {
        scoreh.classList.add("highlighted");
        scoreg.classList.remove("highlighted");
    } else if (resulth < resultg) {
        scoreg.classList.add("highlighted");
        scoreh.classList.remove("highlighted");
    } else {
        scoreh.classList.add("highlighted");
        scoreg.classList.add("highlighted");
    }
}

function finalwinner() {
    finwin.textContent = resulth > resultg ? `THEY CAME THEY FOUGHT AND THEY CONQUERED, ${team1Name} BEATS ${team2Name} BY ${resulth - resultg} POINTS` :
                         resulth < resultg ? `THEY FOUGHT TILL THE END AND IT PAYS OFF, ${team2Name} BEATS ${team1Name} BY ${resultg - resulth} POINTS` :
                         `NO WINNERS NO LOSERS, ${team1Name} DRAWS WITH ${team2Name} HAVING ${resulth} POINTS EACH`;
    speakText(finwin.textContent, false);
    saveGameState();
}
disableButtons(true);
