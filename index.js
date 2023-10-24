let scoreh = document.getElementById("s1")
let scoreg = document.getElementById("s2")
let foulwonh = document.getElementById("foulsh")
let foulwong = document.getElementById("foulsg")
let finwin = document.getElementById("fw")
let resulth = 0;
let resultg = 0;
let flh = 0;
let flg = 0;
let minutes = 0;
let seconds = 3;
let maxPeriod = 4;
let periodno = 0; // Start from 0
let time = document.getElementById("timer");
let per = document.getElementById("period");
let timerInterval;
let timerPaused = true;
winner();
function disableButtons(disable) {
    document.getElementById("inc1").disabled = disable;
    document.getElementById("inc3").disabled = disable;
    document.getElementById("sh1").disabled = disable;
    document.getElementById("sh2").disabled = disable;
    document.getElementById("sh3").disabled = disable;
    document.getElementById("sg1").disabled = disable;
    document.getElementById("sg2").disabled = disable;
    document.getElementById("sg3").disabled = disable;
    
}
function fh() {
    flh += 1;
    foulwonh.textContent = flh;
    finwin.textContent = "TEAM 1 COMMITS A FOUL"
}
function fg() {
    flg += 1;
    foulwong.textContent = flg;
    finwin.textContent = "TEAM 2 COMMITS A FOUL"
}
function pinc() {
    if (timerPaused && periodno < maxPeriod) {
        disableButtons(true) // Check if the timer is paused
        finwin.textContent = "BREAK"
        periodno += 1
        per.textContent = periodno;
        finwin.textContent = "PERIOD " + periodno + " "+ "STARTS"
        // Start the timer when the period is incremented
        timerPaused = false;
        minutes = 0; // Reset minutes
        seconds = 3; // Reset seconds
        updatetimedis(); // Update the timer display
        updatetime(); // Manually initiate timer update
        if (periodno === 4) {
            setTimeout(() => {
                time.textContent = "GAME OVER";
                finalwinner()
                clearInterval(timerInterval);
            }, 3000);
        }
    } else if (timerPaused && periodno === maxPeriod) {
        disableButtons(true)
        finwin.textContent = "BREAK"
            time.textContent = "GAME OVER";
         // Display "Game Over" 5 seconds after reaching period 4
        clearInterval(timerInterval);
    }
}

function updatetimedis() {
    time.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updatetime() {
    if (!timerPaused) {
        disableButtons(false)
        if (minutes === 0 && seconds === 0) {
            timerPaused = true;
            disableButtons(true) // Pause the timer after each cycle
            finwin.textContent = "BREAK"
        } else if (seconds === 0) {
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }

        updatetimedis();

        if (!timerPaused) {
            // Continue the timer update
            timerInterval = setTimeout(updatetime, 1000);
        }
    }
}

updatetimedis();

function oneh() {
    resulth += 1;
    scoreh.textContent = resulth;
    finwin.textContent = "TEAM 1 SCORES ONE POINT"
    winner();
}

function oneg() {
    resultg += 1;
    scoreg.textContent = resultg;
    finwin.textContent = "TEAM 2 SCORES ONE POINT"
    winner();
}

function twoh() {
    resulth += 2;
    scoreh.textContent = resulth;
    finwin.textContent = "TEAM 1 SCORES TWO POINTS"
    winner();
}

function twog() {
    resultg += 2;
    scoreg.textContent = resultg;
    finwin.textContent = "TEAM 2 SCORES TWO POINTS"
    winner();
}

function threeh() {
    resulth += 3;
    scoreh.textContent = resulth;
    finwin.textContent = "TEAM 1 SCORES THREE POINTS"
    winner();
}

function threeg() {
    resultg += 3;
    scoreg.textContent = resultg;
    finwin.textContent = "TEAM 2 SCORES THREE POINTS"
    winner();
}

function newgame() {
    resulth = 0;
    resultg = 0;
    flh = 0;
    flg = 0;
    foulwonh.textContent = 0;
    foulwong.textContent = 0;
    scoreh.textContent = 0;
    scoreg.textContent = 0;
    minutes = 0;
    seconds = 3;
    periodno = 0; // Reset period to 0
    per.textContent = 0; // Reset the displayed period to 0
    time.textContent = "00:00"
    finwin.textContent = "READY TO START ?"
    winner();
    disableButtons(true)
    // Reset the timer
    timerPaused = true;
    updatetimedis();
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
function finalwinner(){
    let res = "FINAL SCORE: TEAM 1 [" + resulth + "-" + resultg + "] TEAM 2"
    if (resulth > resultg) {
        let diff1 = resulth - resultg
        finwin.textContent = res + "\nTEAM 1 BEATS TEAM2 BY " + diff1 + " " + "POINTS"}
     else if (resulth < resultg){
          let diff2 = resultg - resulth
        finwin.textContent = finwin.textContent = res + "\nTEAM 2 BEATS TEAM1 BY " + diff2 + " POINTS";} 
     else {
          finwin.textContent = res + "\nTEAM 1 DRAWS WITH TEAM2 HAVING " + resulth + " " + "POINTS EACH"}    
}
disableButtons(true)
