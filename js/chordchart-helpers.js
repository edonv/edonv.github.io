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
 * @prop {Finger[]} fingers The fingers. Its fret numbers are relative to `position`.
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

/**
 * Loads guitar.json data on its first call, but it should "cache" the value after its first call.
 * @type {() => Promise<Record<string, ChordProChordDef>>}
 */
const getChordProGuitarChords = (() => {
    let chordsProm = null;
    return () => {
        if (!chordsProm) {
            chordsProm = fetch('/js/json/guitar.json')
                .then(response => response.json());
        }
        return chordsProm;
    };
})();

/**
 * Converts any number of `ChordPro` chords, whether in `ChordProJS` format or `ChordPro` config format (flattening `copy` field if present), to `ChordProJS` format.
 * @param  {...(ChordProChordDef|ChordProJSChordDef)} chords 
 * @returns {Promise<ChordProJSChordDef[]>}
 */
async function cleanChordProChords(...chords) {
    const allChords = await getChordProGuitarChords();
    return chords
        .filter(ch => ch && !ch.name.startsWith('/'))
        .map(ch => {
            if ('base' in ch || 'copy' in ch) {
                /** @type {ChordProChordDef} */
                let finalConfigDef = ch;

                while ('copy' in finalConfigDef) {
                    const matchingChord = allChords[finalConfigDef.copy];
            
                    finalConfigDef = {
                        ...matchingChord,
                        name: finalConfigDef.name,
                        base: finalConfigDef.base,
                        frets: finalConfigDef.frets,
                        fingers: finalConfigDef.fingers,
                    };
                }

                return {
                    name: finalConfigDef.name,
                    baseFret: finalConfigDef.base,
                    frets: finalConfigDef.frets,
                    fingers: finalConfigDef.fingers,
                };
            } else {
                // This path confirm it does not have `base` and it does not have `copy`.
                return {
                    ...ch,
                    baseFret: ch.baseFret,
                };
            }
        });
}

/**
 * Searches for chord definitions in `guitar.json` from the provided chord names.
 * 
 * Note: If a chord is not found, its position in the input will be `undefined` in the returned array.
 * @param  {...string} chordNames
 * @returns {Promise<ChordProChordDef[]>} 
 */
async function getChordsFromConfig(...chordNames) {
    const allChords = await getChordProGuitarChords();
    return chordNames
        .filter(ch => !ch.startsWith('/'))
        .map(ch => {
            return allChords[ch];
        });
}

/**
 * Calls {@link renderChords} with chords from `song`.
 * @param {ChordProSong} song Song, whose chords should be rendered.
 */
async function renderChordsForSong(song) {
    // If the song sets the `diagrams` directive to `off`, don't render diagrams.
    const diagramsDirective = getFirstDirective(song, 'diagrams');
    if (diagramsDirective == 'off') {
        return;
    }

    // Get all explicitly-defined chords
    const chordDefs = song.getChordDefinitions();

    // Get all other chords
    const otherChords = new Set(song.getChords());
    // Remove `chordDefs` chords from `otherChords`
    Object.keys(chordDefs)
        .forEach(ch => otherChords.delete(ch));
    const otherChordDefs = await getChordsFromConfig(...otherChords)
        .then(chords => cleanChordProChords(...chords));

    renderChords([
        ...Object.values(chordDefs),
        ...otherChordDefs,
    ], '#song-body .song-metadata', 'song-diagrams');
}

/**
 * Creates and inserts SVG chord diagrams for the chord definitions provided.
 * @param {(ChordProJSChordDef|SVGuitarChordDef)[]} chords 
 * @param {string} selector CSS selector string, after which to add the diagrams.
 * @param {string} containerID If provided, custom HTML ID for the generated container element of all diagrams.
 */
function renderChords(chords, selector, containerID) {
    // If there are no chords to render, skip.
    if (chords.length == 0) {
        return;
    }

    const diagramsContainerWrapper = document.querySelector(selector);

    if (!diagramsContainerWrapper) {
        console.error(`Could not find element by selector: \`${selector}\`, after which chord diagrams should be displayed.`);
        return;
    }

    const diagramContainer = document.createElement('div');
    diagramContainer.id = containerID;
    diagramsContainerWrapper.insertAdjacentElement('afterend', diagramContainer);

    const chordElements = chords.map(chord => {
        const chordWrapper = document.createElement('div');
        chordWrapper.classList.add('chord');

        /** @type {SVGuitarChord} */
        const chart = new svguitar.SVGuitarChord(chordWrapper);

        const convertedChord = chordProChordToSVGuitarChord(chord);
        chart
            .chord(convertedChord)
            .configure({
                ...svguitarConfigFromChord(convertedChord),
                titleFontSize: 78,
                fretLabelFontSize: 60,
                fingerTextSize: 32, // 24
                strokeWidth: 3,
                nutWidth: 15,
            })
            .draw();

        return chordWrapper;
    });

    diagramContainer.append(...chordElements);
    diagramsContainerWrapper.insertAdjacentElement('afterend', diagramContainer);

    // Manually touch-up all diagram SVGs to have appropriate `viewBox` attributes, and other things
    document.querySelectorAll(`${selector} #${containerID} svg`)
        .forEach(cleanUpSVGDiagram);
}

/**
 * Converts string index from ChordPro diagrams format to SVGuitar format.
 * 
 * ChordPro is ordered from low E string to high E (0-5), while SVGuitar is indexed high E to low E (1-6).
 * @param {number} stringCount 
 * @param {number} stringIndex 
 * @returns {number}
 */
function convertChordProStringIndexToSVGuitarChord(stringCount, stringIndex) {
    return stringCount - stringIndex;
}

/**
 * Converts chord definitions to `SVGuitar` format.
 * @param {SVGuitarChordDef|ChordProJSChordDef} chord 
 * @returns {SVGuitarChordDef}
 */
function chordProChordToSVGuitarChord(chord) {
    // If input is already in `SVGuitar` format, return it immediately.
    if ('title' in chord || 'barres' in chord) {
        return chord;
    }

    // Map frets to barres
    // If frets have non-adjacent strings on same fret

    /** @type {Barre|undefined} */
    let barre = undefined;

    // Get counts of each finger number (if they're present)
    // For every finger that occurs more than once, it's a barre
    // If no fingers, use old algorithm
    if (chord.fingers) {
        /** @type {Record<number, number>} */
        const fingerOccurCounts = chord.fingers.reduce((counts, finger) => {
            if (typeof finger == 'number') {
                if (counts[finger]) {
                    counts[finger] += 1;
                } else {
                    counts[finger] = 1;
                }
            }
            return counts;
        }, {});

        if (Object.keys(fingerOccurCounts).length > 1) {
            for (const fingerStr in fingerOccurCounts) {
                const finger = parseInt(fingerStr);
                const count = fingerOccurCounts[finger];

                if (count <= 1) { continue; }

                const firstStrIndex = chord.fingers.findIndex(f => f == finger);
                const lastStrIndex = chord.fingers.length - [...chord.fingers].reverse()
                    .findIndex(f => f == finger) - 1;
                if (firstStrIndex > -1 && lastStrIndex > -1) {
                    const fretNum = chord.frets[firstStrIndex];
                    barre = {
                        fret: fretNum,
                        text: finger.toString(),
                        fromString: convertChordProStringIndexToSVGuitarChord(chord.frets.length, firstStrIndex), // high number
                        toString: convertChordProStringIndexToSVGuitarChord(chord.frets.length, lastStrIndex), // low number
                    };
                }
            }
        }
    } else {
        chord.frets.forEach((f, i) => {
            // Start from index 2, because it'd be too early to 2 strings before anyway
            if (i < 2) {
                return;
            }

            // If the fret value is a number and not open...
            if (typeof f == 'number' && f > 0) {
                const matchingStringIndex = chord.frets
                    // `i - 1` because it would be `- 2` but it's an exclusive index
                    .slice(0, i - 1)
                    // Get index of string with same fret
                    .findIndex((fret, strIndex, arr) => {
                        const fretBetween = arr.at(strIndex + 1);
                        return fret == f
                            // Only count as barre if fret in-between strings are lower than current fret
                            && fretBetween && typeof fretBetween == 'number'
                            && fretBetween > fret;
                    });
            
                if (matchingStringIndex > -1) {
                    const matchingStringNum = convertChordProStringIndexToSVGuitarChord(chord.frets.length, matchingStringIndex);
                    const stringNum = convertChordProStringIndexToSVGuitarChord(chord.frets.length, i);
                    if (typeof barre == 'undefined') {
                        barre = {
                            fret: f,
                            text: chord.fingers?.[i]?.toString(),
                            fromString: Math.max(matchingStringNum, stringNum), // high number
                            toString: Math.min(matchingStringNum, stringNum), // low number
                        };
                    } else {
                        barre.toString = Math.min(barre.toString, stringNum);
                    }
                }
            }
        });
    }

    return {
        barres: [barre].filter(b => b),
        fingers: chord.frets.map((f, i) => {
            // Index is in reverse order from SVGuitarChord string indices
            const stringNum = convertChordProStringIndexToSVGuitarChord(chord.frets.length, i);

            /** @type {Finger[1]} */
            let fretNum;
            /** @type {Finger[2]} */
            let fingerLabel = undefined;
            if (f == 'N' || f == 'x' || f < 0) {
                fretNum = 'x';
            } else if (f == 0) {
                fretNum = 0;
            } else {
                fretNum = f;

                // Skip if already included in the `barre`
                if (barre && fretNum == barre.fret) {
                    return [];
                }

                fingerLabel = chord.fingers?.[i]?.toString();
            }

            // [string #, fret #, dot text?]
            return [stringNum, fretNum, fingerLabel]
                .filter(a => a !== undefined);
        })
        .filter(f => f.length > 0),
        position: chord.baseFret,
        title: chord.name,
    };
}

/**
 * Generates a chord-specific configuration for displaying a diagram with `SVGuitar`.
 * @param {SVGuitarChordDef} chord 
 * @returns {svguit}
 */
function svguitarConfigFromChord(chord) {
    const fretNums = chord.fingers
        .map(f => f[1])
        .filter(f => f != 'x' && f > 0);
    const fretSpan = Math.max(...fretNums) - Math.min(...fretNums);

    return {
        svgTitle: chord.title,
        frets: Math.max(fretSpan, 4),
    };
}

/**
 * Apply some tweaks to a given `SVGuitar` SVG diagram.
 * @param {SVGElement} svg 
 */
function cleanUpSVGDiagram(svg) {
    // If chord has no closed/open string markings, add empty `rect` to fill in space so it aligns with diagrams that have
    const children = Array.from(svg.children);
    const needsStringMarkerSpacer = !children
        .filter(el => el.tagName == 'line' || el.tagName == 'circle')
        .some(el => {
            if (el.tagName == 'line') {
                // nut line and fret lines has same y1/y2
                // string lines has same x1/x2
                const attrs = el.attributes;
                return attrs.getNamedItem('y1')?.value != attrs.getNamedItem('y2')?.value
                    && attrs.getNamedItem('x1')?.value != attrs.getNamedItem('x2')?.value;
            } else {
                // el.tagName == 'circle'
                return el.classList.contains('open-string');
            }
        });
    if (needsStringMarkerSpacer) {
        // svg.setAttribute("addedSpace", 'true');
        // 82.5 - 44.1 = 38.4 (nut y)
        // - bring up `y` of title text by 48.04 (9.64 + 38.4)
        const titleText = svg.querySelector('text.title');
        const yAttr = titleText?.getAttribute('y')
        if (titleText && yAttr && parseFloat(yAttr)) {
            titleText.setAttribute('y', (parseFloat(yAttr) - 36).toString());
        }
    }

    // This BBox must not include the fret position label, if there is one
    /** @type {SVGElement|null} */
    const fretLabel = svg.querySelector('text.fret-position');
    
    const fullBBox = svg.getBBox();
    const width = fullBBox.width;
    if (fretLabel) {
        fretLabel.style.setProperty('display', 'none');
    }
    const cutOffBBox = svg.getBBox();
    const { x, y, height } = { x: cutOffBBox.x, y: cutOffBBox.y, height: cutOffBBox.height };
    if (fretLabel) {
        fretLabel.style.removeProperty('display');
    }

    svg.setAttribute("viewBox", `${x} ${y} ${cutOffBBox.width} ${height}`);
    svg.setAttribute("overflow", "visible");
}
