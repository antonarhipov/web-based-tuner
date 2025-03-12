/**
 * Note Recognition Module
 * Converts frequencies to musical notes and calculates cents deviation
 */

// Note names in scientific pitch notation
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert a frequency to a musical note
 * @param {number} frequency - The frequency in Hz
 * @param {number} referenceFrequency - Reference frequency for A4 in Hz (default: 440)
 * @returns {Object} - Object containing note name, octave, and cents deviation
 */
export function noteFromFrequency(frequency, referenceFrequency = 440) {
    // Guard against invalid input
    if (!frequency || frequency <= 0) {
        return { note: null, octave: null, cents: 0 };
    }
    
    // Calculate the number of half steps away from A4
    // Formula: 12 * log2(f/referenceFrequency)
    const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / referenceFrequency));
    
    // Calculate the exact number of half steps (including cents)
    const exactHalfStepsFromA4 = 12 * Math.log2(frequency / referenceFrequency);
    
    // Calculate cents deviation (100 cents = 1 half step)
    const cents = Math.round((exactHalfStepsFromA4 - halfStepsFromA4) * 100);
    
    // A4 is the 57th note on the piano (0-indexed would be 56)
    // So we add 56 to get the note index from the half steps from A4
    const noteIndex = (halfStepsFromA4 + 57) % 12;
    
    // Calculate the octave
    // A4 is in the 4th octave, and each octave has 12 half steps
    const octave = Math.floor((halfStepsFromA4 + 57) / 12);
    
    // Get the note name
    const note = NOTE_NAMES[noteIndex];
    
    return { note, octave, cents };
}

/**
 * Get the frequency of a specific note
 * @param {string} note - The note name (e.g., 'A', 'C#')
 * @param {number} octave - The octave number
 * @param {number} referenceFrequency - Reference frequency for A4 in Hz (default: 440)
 * @returns {number} - The frequency in Hz
 */
export function frequencyFromNote(note, octave, referenceFrequency = 440) {
    // Find the index of the note in the NOTE_NAMES array
    const noteIndex = NOTE_NAMES.indexOf(note);
    
    if (noteIndex === -1) {
        throw new Error(`Invalid note name: ${note}`);
    }
    
    // Calculate the number of half steps from A4
    // A4 is the 57th note on the piano (0-indexed would be 56)
    const halfStepsFromA4 = noteIndex + (octave * 12) - 57;
    
    // Calculate the frequency using the formula: referenceFrequency * 2^(halfSteps/12)
    const frequency = referenceFrequency * Math.pow(2, halfStepsFromA4 / 12);
    
    return frequency;
}

/**
 * Get the closest note for a given frequency
 * @param {number} frequency - The frequency in Hz
 * @param {number} referenceFrequency - Reference frequency for A4 in Hz (default: 440)
 * @returns {Object} - Object containing note name, octave, frequency, and cents deviation
 */
export function getClosestNote(frequency, referenceFrequency = 440) {
    const { note, octave, cents } = noteFromFrequency(frequency, referenceFrequency);
    
    if (!note) {
        return null;
    }
    
    // Calculate the exact frequency of the note
    const exactFrequency = frequencyFromNote(note, octave, referenceFrequency);
    
    return {
        note,
        octave,
        frequency: exactFrequency,
        cents
    };
}

/**
 * Get reference frequencies for different instruments
 * @param {string} instrument - The instrument name
 * @returns {Object} - Object containing reference frequencies for the instrument
 */
export function getInstrumentReferences(instrument) {
    const references = {
        guitar: {
            strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            frequencies: [
                frequencyFromNote('E', 2),
                frequencyFromNote('A', 2),
                frequencyFromNote('D', 3),
                frequencyFromNote('G', 3),
                frequencyFromNote('B', 3),
                frequencyFromNote('E', 4)
            ]
        },
        bass: {
            strings: ['E1', 'A1', 'D2', 'G2'],
            frequencies: [
                frequencyFromNote('E', 1),
                frequencyFromNote('A', 1),
                frequencyFromNote('D', 2),
                frequencyFromNote('G', 2)
            ]
        },
        violin: {
            strings: ['G3', 'D4', 'A4', 'E5'],
            frequencies: [
                frequencyFromNote('G', 3),
                frequencyFromNote('D', 4),
                frequencyFromNote('A', 4),
                frequencyFromNote('E', 5)
            ]
        },
        ukulele: {
            strings: ['G4', 'C4', 'E4', 'A4'],
            frequencies: [
                frequencyFromNote('G', 4),
                frequencyFromNote('C', 4),
                frequencyFromNote('E', 4),
                frequencyFromNote('A', 4)
            ]
        }
    };
    
    return references[instrument] || null;
}