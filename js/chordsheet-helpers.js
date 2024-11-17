/**
 * Adds song to page, specifically to `div#song-body` element.
 * @param {string} songContent 
 */
function insertSong(songContent) {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(
        cleanUpChordSheetString(songContent)
    );

    // const formatter = new ChordSheetJS.HtmlTableFormatter({
    const formatter = new ChordSheetJS.HtmlDivFormatter({
        normalizeChords: false,
    });
    const disp = formatter.format(song);
    const songBody = document.getElementById('song-body');
    songBody.innerHTML = disp;

    // Remove extra trailing commas from ends of some lines
    removeTrailingCommas();

    // Traverse all `grids` after adding HTML to adjust layouts to add styling
    formatGrids();

    // Add additional styling to misc sections
    addMiscStyling();
}

/**
 * @param {string} song 
 * @returns {string}
 */
function cleanUpChordSheetString(song) {
    return song
        .trim()
        .replace(/: label="(.+)"/g, ": $1")
        .replace(/^ +/gm, "")
        .replace(/\bcomment_italic|ci\b/g, "c")
        // Replace section directive that aren't officially recognized be changed to `verse`
        .replace(/\{(start|end)_of_(?!bridge|chorus|grid|indeterminate|none|tab|verse|ly|abc)(?:[a-z_]+)(.*\})/g, "{$1_of_verse$2");
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

function formatGrids() {
    /**
     * | E . . . . . | A . . . . . |
     * | E B/D# . C#m7 . B | A A#º7 . B7 . . |
     * | E . . . . . | A . . F#7 . . |
     * | E/B Cº7 . C#m7 . B | A A#º7 . B7 . . | B7 . |
     */
    const gridElements = document.querySelectorAll('#song-body .grid div.literal');

    // Process each grid separately
    gridElements.forEach(grid => {
        const gridContent = grid.innerHTML;
        if (!gridContent) {
            return;
        }

        // this will have `display: table` styling to act as a `table`
        grid.classList.add('grid-wrap');
        const gridLines = gridContent.split("<br>");

        /**
         * This is to track which lines have leading text.
         * 
         * If this isn't empty, any lines that don't have leading text need to have an empty cell added so the table lines up.
         * @type {Set<number>} 
         */
        let gridLinesWithLeadingText = new Set();

        // Map each line to a `tr` element
        const gridLineRows = gridLines.map((line, lineNumber) => {
            let trimmedLine = line;

            const lineWrapper = document.createElement('tr');
            lineWrapper.classList.add('grid-line');

            // Extract any lead or trailing text
            const leadingText = /^(.*?)\|/g
                .exec(trimmedLine)
                .at(1)?.trim();
            if (leadingText) {
                gridLinesWithLeadingText.add(lineNumber);

                trimmedLine = trimmedLine
                    .replace(leadingText, '')
                    .trim();

                lineWrapper.append(createGridMarginElement(leadingText));
            }

            const trailingText = /(?:.+)\|(.*?)$/g
                .exec(trimmedLine)
                .at(1)?.trim();
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

            // Map each measure to an array of `td` elements
            const allRowCellsByMeasure = measures.map(bar => {
                const cells = bar.trim().split(' ');

                // Map each cell to a `td` element
                const cellElements = cells.map(c => {
                    const gridCell = document.createElement('td');
                    gridCell.classList.add('grid-cell');
                    if (c == '.') {
                        // empty spacer cell
                        // gridCell.innerHTML = "&#8203;";
                        // gridCell.innerHTML = "\t";
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

        // If any lines have leading text, add empty leading cells to other rows
        if (gridLinesWithLeadingText.size > 0) {
            for (let i = 0; i < gridLineRows.length; i++) {
                if (!gridLinesWithLeadingText.has(i)) {
                    gridLineRows[i].insertBefore(createGridMarginElement(''), gridLineRows[i].cells.item(0));
                }
            }
        }

        const tableBody = document.createElement('tbody');
        tableBody.append(...gridLineRows);

        grid.innerHTML = '';
        grid.append(tableBody);
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

function addMiscStyling() {
    // Added `bordered` class to `.chord-sheet`
    const chordSheet = document.querySelector('#song-body .chord-sheet');
    if (chordSheet) {
        chordSheet.classList.add('bordered');
    }
}
