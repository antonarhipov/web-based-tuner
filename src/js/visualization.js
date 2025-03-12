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
            // Create canvas to fill the container
            const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
            canvas.parent(container);
            
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
            // Clear background
            p.background(230, 10, 95);
            
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
                case 'circular':
                    drawCircular(p);
                    break;
                default:
                    drawWaveform(p);
            }
        };
        
        // Window resize event
        p.windowResized = () => {
            p.resizeCanvas(container.clientWidth, container.clientHeight);
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
 * @param {string} type - The visualization type ('waveform', 'spectrum', 'circular')
 */
export function changeVisualization(type) {
    currentVisualization = type;
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
 * Draw circular visualization
 * @param {p5} p - The p5 instance
 */
function drawCircular(p) {
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) / 3;
    
    p.translate(centerX, centerY);
    
    // Draw multiple circles with varying radius based on audio data
    for (let j = 0; j < 3; j++) {
        const multiplier = (j + 1) * 0.4;
        const circleRadius = radius * multiplier;
        
        p.beginShape();
        for (let i = 0; i < bufferLength; i++) {
            const angle = p.map(i, 0, bufferLength, 0, p.TWO_PI);
            const r = circleRadius + p.map(dataArray[i], 0, 255, 0, radius * 0.5);
            const x = r * p.cos(angle);
            const y = r * p.sin(angle);
            
            const hue = (p.frameCount + i) % 360;
            p.stroke(hue, 80, 80, 0.7);
            
            if (i === 0) {
                p.vertex(x, y);
            } else {
                p.vertex(x, y);
            }
        }
        p.endShape(p.CLOSE);
    }
}