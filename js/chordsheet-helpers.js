// MARK: Typings

/** @typedef {'tab'|'abc'|'ly'|'grid'} ChordProSectionContentType */
/** @typedef {(_string: string) => string} ChordProSectionDelegate */

/**
 * @typedef {number|'N'|'x'} ChordProFret 
 * Fret positions are relative to the offset minus one, so with base-fret 1 (the default),
 * the topmost fret position is 1. With base-fret 3, fret position 1 indicates the 3rd position.
 * `0` (zero) denotes an open string. Use `-1`, `N` or `x` to denote a non-sounding string.
 */

/**
 * @typedef {number|'-'|'x'|'X'|'N'|string} ChordProFinger
 * Finger settings may be numeric (0 .. 9) or uppercase letters (A .. Z).
 * Note that the values -, x, X, and N are used to designate a string without finger setting.
 */

/**
 * A description of a chord, in `ChordProJS`-related contexts.
 * @typedef {Object} ChordProJSChordDef
 * @prop {string} name
 * @prop {number} [baseFret]
 * @prop {ChordProFret[]} frets
 * @prop {ChordProFinger[]} fingers
 */

/**
 * A full description of a chord, in contexts relating to `ChordPro` config files.
 * @typedef {Object} ChordProChordDefFull
 * @prop {string} name
 * @prop {number} [base]
 * @prop {ChordProFret[]} frets
 * @prop {ChordProFinger[]} [fingers]
 */
/**
 * A description of a chord in contexts relating to `ChordPro` config files, that have a `copy` property, indicating its remaining properties are to be copied from another definition with a `name` that matches `copy`.
 * @typedef {Omit<ChordProChordDefFull, 'frets'> & {copy: string, frets?: ChordProFret[]}} ChordProChordDefCopying
 */
/** 
 * A description of a chord, in contexts relating to `ChordPro` config files.
 * @typedef {ChordProChordDefFull | ChordProChordDefCopying} ChordProChordDef 
 */

/**
 * @typedef {Object} ChordProSong
 * @prop {Object[]} lines
 * @prop {()=>Record<string, ChordProJSChordDef>} getChordDefinitions
 * @prop {()=>string[]} getChords
 */

// MARK: Public Functions

/**
 * Returns the value of the first directive with the given name, if there is one.
 * @param {ChordProSong} song 
 * @param {string} directive 
 * @returns {string|undefined}
 */
function getFirstDirective(song, directive) {
    return song.lines
        .flatMap(l => {
            const item = l.items.find(i => i.originalName == directive);
            if (item) {
                return [item.value];
            } else {
                return [];
            }
        })?.[0];
}

/**
 * Returns all values of directives with the given name, if there are any.
 * @param {ChordProSong} song 
 * @param {string} directive 
 * @returns {string[]}
 */
function getDirective(song, directive) {
    return song.lines
        .flatMap(l => {
            const item = l.items.find(i => i.originalName == directive);
            if (item) {
                return [item.value];
            } else {
                return [];
            }
        });
}

/**
 * Adds song to page, specifically to `div#song-body` element.
 * @param {string} songContent 
 * @returns {ChordProSong}
 */
function insertSong(songContent) {
    const songBody = document.getElementById('song-body');
    if (!songBody) {
        return;
    }

    const parser = new ChordSheetJS.ChordProParser();
    const cleanedChordSheet = cleanUpChordSheetString(songContent);
    let song;
    try {
        song = parser.parse(cleanedChordSheet);
    } catch (error) {
        console.error("Error parsing song.", {
            error,
            songContent,
        });
        songBody.insertAdjacentHTML(
            'beforeend',
            `<br>
            <div style="text-align: center; font-family: \'Roboto Serif\', serif;">
                Error displaying song. It can still be downloaded.
            </div>`
        );
        return;
    }

    // If there is a capo, all non-delegate sections will be transposed down (which it shouldn't do)
    // If this is the case, transpose back up.
    /** @type {string} */
    const capo = song.getMetadata('capo');
    if (capo && parseInt(capo)) {
        // If there's a capo, it's stored, but remove it from ChordProSong metadata
        // This is to workaround ChordProJS's formatter that outputs capoed songs in concert key.
        song = song.setCapo(null);
    }

    // const formatter = new ChordSheetJS.HtmlTableFormatter({
    const formatter = new ChordSheetJS.HtmlDivFormatter({
        normalizeChords: false,
        // expandChorusDirective: true,
        /** @type {Partial<Record<ChordProSectionContentType, ChordProSectionDelegate>>} */
        delegates: {
            grid(input) {
                return gridHTMLFromGridContent(input).outerHTML;
            },
            ly: lilypondDelegate,
        }
    });
    /** @type {string} */
    let disp = formatter.format(song);

    // Due to weird rendering issue, must manually change grid wrapper from <div> to <table> before inserting HTML
    // Otherwise, grid sections in HTML string will not be added correctly
    // Find all grid `div`s after generating HTML string but before adding HTML to change from `div` to `table`
    disp = changeGridDivsToTables(disp);

    songBody.insertAdjacentHTML('beforeend', disp);

    // Remove extra trailing commas from ends of some lines
    removeTrailingCommas();

    // Traverse all `grids` after adding HTML to adjust layouts to add styling
    formatGrids();

    // Add other metadata like capo and artist(s)
    addSongMetadataHeader(song, capo);

    // Add additional styling to misc sections
    addMiscStyling();

    return song;
}

// MARK: Internal Functions

/**
 * @param {string} song 
 * @returns {string}
 */
function cleanUpChordSheetString(song) {
    return song
        // Trim off any newlines/whitespace
        .trim()
        // Remove all page/column break directives
        .replace(/^\{(?:np|new_page|column_break|cb)\}\n+/gm, '\n')
        // Remove any leading asterisks from chords in grid sections
        .replace(/\*(.+\*)(?=.*\|$)/gm, '$1')
        // Remove all line-leading whitespace
        .replace(/^ +/gm, "")
        // Replace all `comment_italic` directives with normal `comment`
        .replace(/\bcomment_italic|ci\b/g, "c")
        // Replace all \n characters in section labels
        .replaceAll(/\{.+?: ([^{}]*\n+[^{}]*)\}/g, (match, label) => {
            return match
                .replace(label, label.replace('\n', ' '));
        })
        // Catch `{chorus: label=""}` recalls, add "Chorus" into label
        .replaceAll(/\{chorus: label="(.*)"\}/g, (match, labelContent) => {
            // '{chorus: label="Chorus ($1)"}'
            if (labelContent.length > 0) {
                const label = labelContent
                    .replace(/^\(/g, '')
                    .replace(/\)$/g, '')
                    .trim();
                return `{chorus: label="[Chorus] (${label})"}`;
            } else {
                // Don't include the colon if there is no label.
                return `{chorus: label="[Chorus]"}`;
            }
        })
    
        // Smart Quotes
        // Used this for reference (with some changes): https://gist.github.com/zerolab/1633661
        // NOTE: These assume that section labels' formatting has already been cleaned up by other replacemeng
        // Replace dumb apostrophes with smart ones
        .replace(/\b'(\b| )/g, '\u2019$1')
        // Replace dumb opening/closing double-quotes with smart ones
        .replace(/(?<!\{.*label=)\B"\b([^"\u201C\u201D\u201E\u201F\u2033\u2036\r\n]+)\b"\B(?!.*\})/g, '\u201c$1\u201d')
}

function removeTrailingCommas() {
    // Find all elements that could possible have a comma added to the end of the line by ChordProJS.
    // It seems to happen at the end of a line of lyrics that ends with multiple spaces then a chord after
    const elements = document.querySelectorAll('.column:has(+ .column .chord:not(:empty) + .lyrics:empty) > .chord:empty + .lyrics:not(:empty)');
    elements.forEach(el => {
        if (el.textContent) {
            el.textContent = el.textContent.replace(/ (, )+$/g, ' ');
        }
    });
}

// MARK: Grids

/**
 * Converts grid section content to an HTML `<tbody>` element to layout the section.
 * @param {string} gridContent 
 * @returns {HTMLTableSectionElement}
 */
function gridHTMLFromGridContent(gridContent) {
    const gridLines = gridContent.split("\n");

    /**
     * This is to track which lines have leading text.
     * 
     * If this isn't empty, any lines that don't have leading text need to have an empty cell added so the table lines up.
     * @type {Set<number>} 
     */
    let gridLinesWithLeadingText = new Set();

    // Map each line to a `<tr>` element
    const gridLineRows = gridLines.map((line, lineNumber) => {
        let trimmedLine = line;

        const lineWrapper = document.createElement('tr');
        lineWrapper.classList.add('grid-line');

        // Extract any lead or trailing text
        const leadingText = /^(.*?)\|/g
            .exec(trimmedLine)?.at(1)?.trim();
        if (leadingText) {
            gridLinesWithLeadingText.add(lineNumber);

            trimmedLine = trimmedLine
                .replace(leadingText, '')
                .trim();

            lineWrapper.append(createGridMarginElement(leadingText));
        }

        const trailingText = /(?:.+)\|(.*?)$/g
            .exec(trimmedLine)?.at(1)?.trim();
        if (trailingText) {
            trimmedLine = trimmedLine
                .replace(trailingText, '')
                .trim();
        }

        const barlineRegex = / ?(:?\|:?) ?/g;
        const barlines = [...trimmedLine.matchAll(barlineRegex)]
            .flatMap(m => {
                const barline = m.at(1);
                return barline ? [barline] : [];
            });

        const measures = trimmedLine
            .split(barlineRegex)
            .filter(bar => bar && !bar.includes("|"));

        // Map each measure to an array of `<td>` elements
        const allRowCellsByMeasure = measures.map(bar => {
            const cells = bar.trim().split(' ');

            // Map each cell to a `<td>` element
            const cellElements = cells.map(c => {
                // let gridCellContent;
                const gridCell = document.createElement('td');
                gridCell.classList.add('grid-cell');
                if (c == '.') {
                    // empty spacer cell
                    gridCell.innerHTML = "&#8203;";
                    gridCell.innerHTML = "\t";
                } else {
                    gridCell.classList.add('chord');
                    gridCell.innerText = c;
                }
                return gridCell;
            });

            return cellElements;
        });

        // Interleave barlines with measures
        for (let i = 0; i < barlines.length; i++) {
            const barlineSpan = document.createElement('td');
            barlineSpan.classList.add('grid-barline');
            barlineSpan.innerText = barlines[i];

            lineWrapper.append(barlineSpan);
            if (i < allRowCellsByMeasure.length) {
                // Add all cells between barlines as inline elements, not wrapped themselves
                lineWrapper.append(...allRowCellsByMeasure[i]);
            }
        }

        if (trailingText) {
            lineWrapper.append(createGridMarginElement(trailingText));
        }

        return lineWrapper;
    });

    // If any lines have leading text, add empty leading cells to all rows that don't to ensure spacing
    if (gridLinesWithLeadingText.size > 0) {
        for (let i = 0; i < gridLineRows.length; i++) {
            if (!gridLinesWithLeadingText.has(i)) {
                gridLineRows[i].insertBefore(createGridMarginElement(''), gridLineRows[i].cells.item(0));
            }
        }
    }

    const tableBody = document.createElement('tbody');
    tableBody.append(...gridLineRows);

    return tableBody;
}

/**
 * Uses to RegEx to change all `<div>`s wrapping grid sections to `<table>`s.
 * @param {string} htmlString 
 * @returns {string}
 */
function changeGridDivsToTables(htmlString) {
    return htmlString
        .replace(/<div class="literal"><tbody>/g, '<table class="literal"><tbody>')
        .replace(/<\/tbody><\/div>/g, '</tbody></table>');
}

/**
 * Queries for all elements that wrap around grid sections, and gives them the `.grid-wrap` CSS class.
 */
function formatGrids() {
    // this will have `display: table` styling to act as a `table`
    const gridElements = document.querySelectorAll('#song-body .grid .literal');

    // Process each grid separately
    gridElements.forEach(grid => {
        grid.classList.add('grid-wrap');
    });
}

/**
 * @param {string} text 
 * @returns {HTMLTableCellElement}
 */
function createGridMarginElement(text) {
    const cell = document.createElement('td');
    cell.classList.add('grid-margin-text');
    cell.innerText = text;
    return cell;
}

// MARK: Lilypond

/**
 * Converts incoming Lilypond section content to HTML embedding an SVG file.
 * @param {string} input The Lilypond section content. It *should* be a partial relative path to the intended SVG file.
 * @returns {string}
 */
function lilypondDelegate(input) {
    return `<object
        class="ly-svg"
        data="/files/song_ly/${input}"
        type="image/svg+xml"></object>`
        .replace(/\s+/g, ' ');
}

// MARK: Misc Content/Styling

/**
 * Add other metadata like capo and artist(s).
 * @param {string|null} capo Capo value (as a string) from `song.getMetadata('capo')`.
 * It's plugged in separately from `song` because if it's non-`null`, it will have been removed from
 * `song`'s metadata before this method is called.
 */
function addSongMetadataHeader(song, capo) {
    const songBody = document.getElementById('song-body');
    const songTitleH1 = document.querySelector('#song-body h1');
    if (!songBody || !songTitleH1) {
        return;
    }

    const metadataHeaderDiv = document.createElement('div');
    metadataHeaderDiv.classList.add('song-metadata');

    /** @type {Element} */
    const songTitleCopy = songTitleH1.cloneNode(true);
    songTitleCopy.classList.add('song-title');
    if (capo && parseInt(capo) && parseInt(capo) > 0) {
        songTitleCopy.textContent = `${songTitleCopy.textContent} (Capo: ${capo})`;
    }

    const artistsSubtitle = document.createElement('h2');
    artistsSubtitle.classList.add('song-subtitle');
    const artists = song.getMetadata('artist');
    if (artists) {
        if (typeof artists == 'string') {
            artistsSubtitle.textContent = artists;
        } else {
            artistsSubtitle.textContent = `${[...artists].join(', ')}`;
        }
    }

    metadataHeaderDiv.append(songTitleCopy, artistsSubtitle);
    songBody.insertBefore(metadataHeaderDiv, songTitleH1);
    songBody.removeChild(songTitleH1);
}

function addMiscStyling() {
    // Added `bordered` class to `.chord-sheet`
    const chordSheetDiv = document.querySelector('#song-body .chord-sheet');
    if (chordSheetDiv) {
        chordSheetDiv.classList.add('bordered');
    }
}
