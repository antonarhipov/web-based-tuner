/**
 * Visualization Module
 * Handles audio visualization using p5.js
 */

import p5 from 'p5';

// Global variables
let visualizationP5;
let analyzer;
let dataArray;
let bufferLength;
let currentVisualization = 'waveform'; // Default visualization type
let particles = []; // Array to store particle objects

/**
 * Set up the visualization canvas and p5 instance
 * @param {HTMLElement} container - The container element for the visualization
 * @param {AnalyserNode} [analyzerNode] - Optional analyzer node from Web Audio API
 */
export function setupVisualization(container, analyzerNode = null) {
    // Store the analyzer node if provided
    if (analyzerNode) {
        analyzer = analyzerNode;
        bufferLength = analyzer.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    // Create a new p5 instance
    visualizationP5 = new p5((p) => {
        // Setup function
        p.setup = () => {
            // Create canvas to fill the window
            const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
            canvas.parent(container);
            canvas.style('display', 'block'); // Ensure canvas takes full space
            canvas.style('position', 'absolute');
            canvas.style('top', '0');
            canvas.style('left', '0');

            // Set basic drawing parameters
            p.colorMode(p.HSB, 360, 100, 100, 1);
            p.strokeWeight(2);
            p.noFill();

            // Create default data array if no analyzer provided
            if (!analyzer) {
                bufferLength = 128;
                dataArray = new Uint8Array(bufferLength).map(() => p.random(128));
            }
        };

        // Draw function - called continuously
        p.draw = () => {
            // Clear background with transparency to allow layering
            p.clear();
            p.background(230, 10, 95, 0.3);

            // Update data if analyzer is available
            if (analyzer) {
                if (currentVisualization === 'waveform') {
                    analyzer.getByteTimeDomainData(dataArray);
                } else {
                    analyzer.getByteFrequencyData(dataArray);
                }
            } else {
                // Generate random data for preview
                dataArray = dataArray.map(val => {
                    return val + p.random(-5, 5);
                });
            }

            // Draw the selected visualization
            switch (currentVisualization) {
                case 'waveform':
                    drawWaveform(p);
                    break;
                case 'spectrum':
                    drawSpectrum(p);
                    break;
                case 'particles':
                    drawParticles(p);
                    break;
                default:
                    drawWaveform(p);
            }
        };

        // Window resize event
        p.windowResized = () => {
            p.resizeCanvas(window.innerWidth, window.innerHeight);
        };
    });

    // Return the p5 instance for external control
    return visualizationP5;
}

/**
 * Set the analyzer node for visualization
 * @param {AnalyserNode} analyzerNode - The analyzer node from Web Audio API
 */
export function setAnalyzer(analyzerNode) {
    analyzer = analyzerNode;
    bufferLength = analyzer.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

/**
 * Change the visualization type
 * @param {string} type - The visualization type ('waveform', 'spectrum', 'particles')
 */
export function changeVisualization(type) {
    currentVisualization = type;

    // Initialize particles if switching to particles visualization
    if (type === 'particles' && visualizationP5 && particles.length === 0) {
        initializeParticles(visualizationP5);
    }
}

/**
 * Draw waveform visualization
 * @param {p5} p - The p5 instance
 */
function drawWaveform(p) {
    p.stroke(200, 80, 80);
    p.beginShape();

    const sliceWidth = p.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * p.height / 2;

        if (i === 0) {
            p.vertex(x, y);
        } else {
            p.vertex(x, y);
        }

        x += sliceWidth;
    }

    p.endShape();
}

/**
 * Draw frequency spectrum visualization
 * @param {p5} p - The p5 instance
 */
function drawSpectrum(p) {
    const barWidth = p.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = p.map(dataArray[i], 0, 255, 0, p.height);
        const hue = p.map(i, 0, bufferLength, 0, 360);

        p.fill(hue, 80, 80);
        p.stroke(hue, 80, 60);
        p.rect(x, p.height - barHeight, barWidth, barHeight);

        x += barWidth;
    }
}

/**
 * Particle class for flying particles visualization
 */
class Particle {
    constructor(p) {
        this.p = p;
        this.position = p.createVector(p.random(p.width), p.random(p.height));
        this.velocity = p.createVector(p.random(-1, 1), p.random(-1, 1));
        this.acceleration = p.createVector(0, 0);
        this.size = p.random(101, 199);
        this.color = {
            h: p.random(360),
            s: 80,
            b: 80,
            a: p.random(0.5, 0.9)
        };
        this.maxSpeed = 3;
        this.lifespan = 255;
        this.audioResponsiveness = p.random(0.1, 0.5);
    }

    // Apply force to particle
    applyForce(force) {
        this.acceleration.add(force);
    }

    // Update particle position and properties
    update(audioValue) {
        // Apply audio-reactive force
        const audioForce = this.p.map(audioValue, 0, 255, 0, this.audioResponsiveness);
        const forceDirection = this.p.createVector(
            this.p.random(-1, 1),
            this.p.random(-1, 1)
        ).normalize().mult(audioForce);

        this.applyForce(forceDirection);

        // Update velocity and position
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);

        // Reset acceleration
        this.acceleration.mult(0);

        // Update color based on audio
        this.color.h = (this.color.h + audioValue / 50) % 360;

        // Decrease lifespan
        this.lifespan -= 1;

        // Update size based on audio
        this.size = this.p.map(audioValue, 50, 255, 99, 136) * this.audioResponsiveness;
    }

    // Check if particle is still alive
    isDead() {
        return this.lifespan < 0;
    }

    // Wrap around edges of canvas
    edges() {
        if (this.position.x > this.p.width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = this.p.width;
        if (this.position.y > this.p.height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = this.p.height;
    }

    // Display the particle
    display() {
        this.p.noStroke();
        this.p.fill(
            this.color.h,
            this.color.s,
            this.color.b,
            this.color.a * (this.lifespan / 255)
        );
        this.p.ellipse(this.position.x, this.position.y, this.size);
    }
}

/**
 * Initialize particles for visualization
 * @param {p5} p - The p5 instance
 */
function initializeParticles(p) {
    // Clear existing particles
    particles = [];

    // Create new particles
    const particleCount = 100; // Adjust based on performance
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(p));
    }
}

/**
 * Draw particles visualization
 * @param {p5} p - The p5 instance
 */
function drawParticles(p) {
    // Initialize particles if needed
    if (particles.length === 0) {
        initializeParticles(p);
    }

    // Calculate average audio level for this frame
    let avgAudio = 0;
    for (let i = 0; i < bufferLength; i++) {
        avgAudio += dataArray[i];
    }
    avgAudio /= bufferLength;

    // Add new particles based on audio level
    if (p.frameCount % 5 === 0) { // Add particles every 5 frames
        const newParticleCount = Math.floor(p.map(avgAudio, 0, 255, 0, 3));
        for (let i = 0; i < newParticleCount; i++) {
            particles.push(new Particle(p));
        }
    }

    // Update and display particles
    for (let i = particles.length - 1; i >= 0; i--) {
        // Get audio value for this particle
        const audioIndex = i % bufferLength;
        const audioValue = dataArray[audioIndex];

        // Update particle
        particles[i].update(audioValue);
        particles[i].edges();
        particles[i].display();

        // Remove dead particles
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Limit the number of particles for performance
    const maxParticles = 200;
    if (particles.length > maxParticles) {
        particles.splice(0, particles.length - maxParticles);
    }
}
