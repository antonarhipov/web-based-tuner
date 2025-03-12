/**
 * Pitch Detection Module
 * Implements the autocorrelation algorithm for pitch detection
 */

/**
 * Detect the fundamental frequency of an audio signal using autocorrelation
 * @param {Float32Array} buffer - Audio data buffer
 * @param {number} sampleRate - Audio sample rate in Hz
 * @returns {number} - Detected frequency in Hz, or -1 if no pitch detected
 */
export function detectPitch(buffer, sampleRate) {
    // Constants for pitch detection
    const THRESHOLD = 0.2; // Clarity threshold
    const MIN_FREQUENCY = 50; // Minimum detectable frequency in Hz
    const MAX_FREQUENCY = 1500; // Maximum detectable frequency in Hz
    
    // Calculate buffer properties
    const bufferLength = buffer.length;
    
    // Check if signal has enough energy
    let signalEnergy = 0;
    for (let i = 0; i < bufferLength; i++) {
        signalEnergy += buffer[i] * buffer[i];
    }
    signalEnergy /= bufferLength;
    
    // If signal energy is too low, return no pitch
    if (signalEnergy < 0.001) {
        return -1;
    }
    
    // Calculate autocorrelation
    const correlations = new Float32Array(bufferLength);
    
    for (let lag = 0; lag < bufferLength; lag++) {
        let correlation = 0;
        
        for (let i = 0; i < bufferLength - lag; i++) {
            correlation += buffer[i] * buffer[i + lag];
        }
        
        correlations[lag] = correlation / (bufferLength - lag);
    }
    
    // Find peaks in autocorrelation
    const minPeriod = Math.floor(sampleRate / MAX_FREQUENCY);
    const maxPeriod = Math.ceil(sampleRate / MIN_FREQUENCY);
    
    let bestPeriod = -1;
    let bestCorrelation = 0;
    
    // Skip the first few samples to avoid false positives
    for (let period = minPeriod; period < maxPeriod; period++) {
        if (correlations[period] > bestCorrelation) {
            bestCorrelation = correlations[period];
            bestPeriod = period;
        }
    }
    
    // Normalize correlation
    const normalizedCorrelation = bestCorrelation / correlations[0];
    
    // Check if correlation is strong enough
    if (normalizedCorrelation < THRESHOLD) {
        return -1; // No clear pitch detected
    }
    
    // Refine the period using parabolic interpolation
    let refinedPeriod = bestPeriod;
    
    if (bestPeriod > 0 && bestPeriod < bufferLength - 1) {
        const leftCorr = correlations[bestPeriod - 1];
        const centerCorr = correlations[bestPeriod];
        const rightCorr = correlations[bestPeriod + 1];
        
        const peakOffset = 0.5 * (leftCorr - rightCorr) / (leftCorr - 2 * centerCorr + rightCorr);
        refinedPeriod = bestPeriod + peakOffset;
    }
    
    // Convert period to frequency
    const frequency = sampleRate / refinedPeriod;
    
    // Return the detected frequency
    return frequency;
}

/**
 * Alternative pitch detection using YIN algorithm
 * This is a more accurate but more computationally expensive algorithm
 * @param {Float32Array} buffer - Audio data buffer
 * @param {number} sampleRate - Audio sample rate in Hz
 * @returns {number} - Detected frequency in Hz, or -1 if no pitch detected
 */
export function detectPitchYIN(buffer, sampleRate) {
    // Constants for YIN algorithm
    const THRESHOLD = 0.15;
    const MIN_FREQUENCY = 50;
    const MAX_FREQUENCY = 1500;
    
    const bufferLength = buffer.length;
    const yinBuffer = new Float32Array(bufferLength / 2);
    
    // Step 1: Calculate difference function
    for (let tau = 0; tau < yinBuffer.length; tau++) {
        yinBuffer[tau] = 0;
        
        for (let i = 0; i < yinBuffer.length; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }
    
    // Step 2: Cumulative normalization
    let runningSum = 0;
    yinBuffer[0] = 1;
    
    for (let tau = 1; tau < yinBuffer.length; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }
    
    // Step 3: Find minimum below threshold
    let minTau = -1;
    let minVal = 1000;
    
    // Define search range based on frequency limits
    const minPeriod = Math.floor(sampleRate / MAX_FREQUENCY);
    const maxPeriod = Math.ceil(sampleRate / MIN_FREQUENCY);
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
        if (yinBuffer[tau] < THRESHOLD) {
            while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            minVal = yinBuffer[tau];
            minTau = tau;
            break;
        } else if (yinBuffer[tau] < minVal) {
            minVal = yinBuffer[tau];
            minTau = tau;
        }
    }
    
    // No valid pitch found
    if (minTau === -1 || minVal >= THRESHOLD) {
        return -1;
    }
    
    // Step 4: Parabolic interpolation for better accuracy
    let betterTau;
    const x0 = (minTau < 1) ? minTau : minTau - 1;
    const x2 = (minTau + 1 < yinBuffer.length) ? minTau + 1 : minTau;
    
    if (x0 === minTau) {
        if (yinBuffer[minTau] <= yinBuffer[x2]) {
            betterTau = minTau;
        } else {
            betterTau = x2;
        }
    } else if (x2 === minTau) {
        if (yinBuffer[minTau] <= yinBuffer[x0]) {
            betterTau = minTau;
        } else {
            betterTau = x0;
        }
    } else {
        const s0 = yinBuffer[x0];
        const s1 = yinBuffer[minTau];
        const s2 = yinBuffer[x2];
        betterTau = minTau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }
    
    // Convert period to frequency
    return sampleRate / betterTau;
}