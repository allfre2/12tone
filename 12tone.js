const SHARPS = ["C ", "C#", "D ", "D#", "E ", "F ", "F#", "G ", "G#", "A ", "A#", "B "];
const FLATS  = ["C ", "Db", "D ", "Eb", "E ", "F ", "Gb", "G ", "Ab", "A ", "Bb", "B "];

let notationUsed = FLATS;

// Helper function for modulo arithmetic (handles negative numbers)
function mod(a, b) {
  return ((a % b) + b) % b;
}

class series {
  constructor(s) {
    this.notes = s === undefined ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : s;
    this.inverted0 = this._calculateInverted0();
    this.Matrix = this._calculateMatrix();
  }

  transpose(note) {
    return Array.from({ length: 12 }, (_, i) => 
      mod(note + (this.notes[i] - this.notes[0]), 12)
    );
  }

  _calculateInverted0() {
    return Array.from({ length: 12 }, (_, j) => 
      mod((2 * this.notes[0]) - this.notes[j], 12)
    );
  }

  _calculateMatrix() {
    return Array.from({ length: 12 }, (_, i) => 
      this.transpose(this.inverted0[i])
    );
  }

  matrixString() {
    let out = "";
    let headerRow = "     ";
    
    // Build header row
    for (let j = 0; j < 12; ++j) {
      const n = mod(this.Matrix[0][j] - this.Matrix[0][0], 12);
      headerRow += n + (n > 9 ? "  " : "   ");
    }
    headerRow += "\n\n";
    
    // Build matrix body
    for (let i = 0; i < 12; ++i) {
      const n = mod(this.Matrix[i][0] - this.Matrix[0][0], 12);
      out += n + (n > 9 ? "  " : "   ");
      
      for (let j = 0; j < 12; ++j) {
        out += ` ${notationUsed[this.Matrix[i][j]]} `;
      }
      out += "\n";
    }
    
    return (headerRow + out).replace(/undefined/g, "! ");
  }

  consolePrintMatrix() {
    console.log(this.matrixString());
  }
}

// --- Web Audio API Synthesizer ---
let audioCtx;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, startTime) {
  const duration = 2.5; // longer ring for a piano sound
  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  // Piano-like envelope: immediate attack, quick initial decay, long sustain/release
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.015); // strike
  gainNode.gain.exponentialRampToValueAtTime(0.2, startTime + 0.3);  // decay to sustain
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // fade out

  // Fundamental frequency (Triangle gives a mix of even/odd harmonics, typical for plucked/struck string)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.value = frequency;
  osc1.connect(gainNode);

  // First harmonic (Octave - Sine wave to add body to the fundamental)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = frequency * 2;
  const gain2 = audioCtx.createGain();
  gain2.gain.value = 0.5;
  osc2.connect(gain2);
  gain2.connect(gainNode);
  
  // Second/Third harmonics for the "hammer" attack sound
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = frequency * 3.01; // slightly detuned for piano realism
  const gain3 = audioCtx.createGain();
  gain3.gain.setValueAtTime(0, startTime);
  gain3.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
  gain3.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15); // decays very fast
  osc3.connect(gain3);
  gain3.connect(gainNode);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
  osc3.stop(startTime + duration);
}

function playNoteArray(pitchClasses, callback) {
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const noteDuration = 0.7; // slower playback speed
  let startTime = audioCtx.currentTime + 0.1;

  pitchClasses.forEach((n, index) => {
    // Treat note 0 as C4 (MIDI 60) for a standard piano register
    const frequency = 440 * Math.pow(2, (n + 60 - 69) / 12);
    playTone(frequency, startTime + index * noteDuration);
  });

  // Execute callback after the sequence finishes
  if (callback) {
    setTimeout(callback, (pitchClasses.length * noteDuration + 0.1) * 1000);
  }
}
// ---------------------------------

function _12toneController($scope, $timeout) {
  $scope.notation = notationUsed;
  $scope.s = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  $scope.serie = new series($scope.s);
  $scope.use_flats = true;

  // Track active playing button per type
  $scope.playingRow = -1;
  $scope.playingCol = -1;
  $scope.playingRowRev = -1;
  $scope.playingColRev = -1;

  // Colors for each pitch class 0-11 in a light grayish-blue palette
  const pitchColors = [
    '#e1e6ed', '#dbe2e9', '#d5dce6', '#cfd7e2',
    '#c8d2de', '#c2ccdb', '#bbc6d7', '#b5c1d4',
    '#aebcd0', '#a8b6cd', '#a2b1c9', '#9bacc6'
  ];

  $scope.getCellStyle = function(pitchClass) {
    return {
      'background-color': pitchColors[pitchClass % 12]
    };
  };

  $scope.isPlayingRow = function(index) { return $scope.playingRow === index; };
  $scope.isPlayingCol = function(index) { return $scope.playingCol === index; };
  $scope.isPlayingRowReverse = function(index) { return $scope.playingRowRev === index; };
  $scope.isPlayingColReverse = function(index) { return $scope.playingColRev === index; };

  $scope.updateMatrix = function () {
    $scope.serie = new series($scope.s);
  };

  $scope.changeNotation = function () {
    if (notationUsed === FLATS) {
      notationUsed = SHARPS;
      $scope.use_flats = false;
    } else {
      notationUsed = FLATS;
      $scope.use_flats = true;
    }
    $scope.notation = notationUsed;
    $scope.updateMatrix();
  };

  $scope.random = function () {
    const newserie = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    // Fisher-Yates shuffle algorithm
    for (let i = newserie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newserie[i], newserie[j]] = [newserie[j], newserie[i]];
    }
    
    $scope.s = newserie;
    $scope.updateMatrix();
  };

  // --- Audio Playback Functions ---
  $scope.playRow = function(index) {
    $scope.playingRow = index;
    playNoteArray($scope.serie.Matrix[index], () => {
      $timeout(() => { $scope.playingRow = -1; });
    });
  };

  $scope.playRowReverse = function(index) {
    $scope.playingRowRev = index;
    playNoteArray([...$scope.serie.Matrix[index]].reverse(), () => {
      $timeout(() => { $scope.playingRowRev = -1; });
    });
  };

  $scope.playCol = function(index) {
    $scope.playingCol = index;
    const col = $scope.serie.Matrix.map(row => row[index]);
    playNoteArray(col, () => {
      $timeout(() => { $scope.playingCol = -1; });
    });
  };

  $scope.playColReverse = function(index) {
    $scope.playingColRev = index;
    const col = $scope.serie.Matrix.map(row => row[index]).reverse();
    playNoteArray(col, () => {
      $timeout(() => { $scope.playingColRev = -1; });
    });
  };

  $scope.getHeaderInterval = function(colIndex) {
    return mod($scope.serie.Matrix[0][colIndex] - $scope.serie.Matrix[0][0], 12);
  };

  $scope.getRowInterval = function(rowIndex) {
    return mod($scope.serie.Matrix[rowIndex][0] - $scope.serie.Matrix[0][0], 12);
  };
}
