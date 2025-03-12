/**
 * Web Tuner Application
 * Main JavaScript file for handling audio input and processing
 */

// Import dependencies
import { setupVisualization, changeVisualization, setAnalyzer } from './visualization.js';
import { detectPitch } from './pitch-detection.js';
import { noteFromFrequency } from './note-recognition.js';

// Global variables
let audioContext;
let analyzer;
let microphone;
let isListening = false;
let animationFrameId;
let referenceFrequency = 440; // A4 reference frequency in Hz

// DOM elements
const startButton = document.getElementById('start-btn');
const noteNameElement = document.querySelector('.note-name');
const octaveElement = document.querySelector('.octave');
const frequencyDisplay = document.querySelector('.frequency-display');
const centsDeviationElement = document.querySelector('.cents-deviation');
const meterIndicator = document.querySelector('.meter-indicator');
const referenceFreqInput = document.getElementById('reference-freq');
const instrumentSelect = document.getElementById('instrument');
const visualizationContainer = document.querySelector('.visualization-container');
const visualizationSelect = document.getElementById('visualization-type');

// Initialize the application
function init() {
    // Set up event listeners
    startButton.addEventListener('click', toggleListening);
    referenceFreqInput.addEventListener('change', updateReferenceFrequency);
    visualizationSelect.addEventListener('change', updateVisualization);

    // Create visualization canvas
    setupVisualization(visualizationContainer);

    // Display initial state
    updateDisplay(null, null, null);
}

// Update visualization type
function updateVisualization() {
    const visualizationType = visualizationSelect.value;
    changeVisualization(visualizationType);
}

// Toggle microphone listening
async function toggleListening() {
    if (isListening) {
        stopListening();
        startButton.textContent = 'Start Tuner';
    } else {
        try {
            await startListening();
            startButton.textContent = 'Stop Tuner';
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions and try again.');
        }
    }
}

// Start listening to microphone
async function startListening() {
    // Create audio context if it doesn't exist
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Get microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Create microphone source
    microphone = audioContext.createMediaStreamSource(stream);

    // Create analyzer node
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;

    // Connect microphone to analyzer
    microphone.connect(analyzer);

    // Set analyzer for visualization
    setAnalyzer(analyzer);

    // Start processing audio
    isListening = true;
    processAudio();
}

// Stop listening to microphone
function stopListening() {
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    isListening = false;
    updateDisplay(null, null, null);
}

// Process audio data
function processAudio() {
    // Create buffer for frequency data
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    // Get time domain data
    analyzer.getFloatTimeDomainData(dataArray);

    // Detect pitch
    const frequency = detectPitch(dataArray, audioContext.sampleRate);

    if (frequency !== -1) {
        // Get note information
        const { note, octave, cents } = noteFromFrequency(frequency, referenceFrequency);

        // Update display
        updateDisplay(note, octave, frequency, cents);
    }

    // Continue processing in animation frame
    animationFrameId = requestAnimationFrame(processAudio);
}

// Update reference frequency
function updateReferenceFrequency() {
    referenceFrequency = parseFloat(referenceFreqInput.value);
}

// Update display with note information
function updateDisplay(note, octave, frequency, cents = 0) {
    if (note && octave && frequency) {
        noteNameElement.textContent = note;
        octaveElement.textContent = octave;
        frequencyDisplay.textContent = `${frequency.toFixed(2)} Hz`;
        centsDeviationElement.textContent = `${cents.toFixed(0)} cents`;

        // Update meter position based on cents deviation
        const position = 50 + (cents / 50) * 50; // Convert cents to percentage (±50 cents = ±50%)
        meterIndicator.style.left = `${Math.max(0, Math.min(100, position))}%`;

        // Change color based on tuning accuracy
        if (Math.abs(cents) < 5) {
            meterIndicator.style.backgroundColor = 'var(--success-color)';
        } else if (Math.abs(cents) < 15) {
            meterIndicator.style.backgroundColor = 'var(--accent-color)';
        } else {
            meterIndicator.style.backgroundColor = 'var(--error-color)';
        }
    } else {
        // Reset display when not listening
        noteNameElement.textContent = '--';
        octaveElement.textContent = '-';
        frequencyDisplay.textContent = '0 Hz';
        centsDeviationElement.textContent = '0 cents';
        meterIndicator.style.left = '50%';
        meterIndicator.style.backgroundColor = 'var(--accent-color)';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
