/**
 * @typedef {Object} Barre
 * @prop {string} [color]
 * @prop {number} fret
 * @prop {number} fromString
 * @prop {number} toString
 * @prop {string} [strokeColor]
 * @prop {number} [strokeWidth]
 * @prop {string} [text]
 * @prop {string} [textColor]
 */

/** @typedef {0} OpenString */
/** @typedef {'x'} SilentString */
/** @typedef {'circle'|'square'|'triangle'|'pentagon'} Shape */


/**
 * @typedef {Object} FingerOptions 
 * @prop {string} [text]
 * @prop {string} [color]
 * @prop {string} [textColor]
 * @prop {Shape} [shape]
 * @prop {string} [strokeColor]
 * @prop {number} [strokeWidth]
 */

/** @typedef {[string: number, fret: number | OpenString | SilentString, options: (string | FingerOptions)?]} Finger */

/**
 * @typedef {Object} Chord
 * @prop {Barre[]} barres The barre chords
 * @prop {Finger[]} fingers The fingers
 * @prop {number} [position] Position (defaults to 1). Can also be provided via ChordSettings.
 * @prop {string} [title] Title of the chart. Can also be provided via ChordSettings.
 */

/** @typedef {Chord} SVGuitarChordDef */

/**
 * @typedef {Object} SVGuitarChord
 * @prop {(chord: Chord) => SVGuitarChord} chord
 * @prop {(settings: any)=>SVGuitarChord} configure
 * @prop {()=>{height: number, width: number}} draw
 * @prop {()=>void} remove Completely remove the diagram from the DOM.
 */
