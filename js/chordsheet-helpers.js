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

        // Map each line to a `tr` element
        const gridLineRows = gridLines.map(line => {
            let trimmedLine = line;

            const lineWrapper = document.createElement('tr');
            lineWrapper.classList.add('grid-line');

            // Extract any lead or trailing text
            const leadingText = /^(.*?)\|/g
                .exec(trimmedLine)
                .at(1)?.trim();
            if (leadingText) {
                trimmedLine = trimmedLine
                    .replace(leadingText, '')
                    .trim();

                const leadingTextSpan = document.createElement('td');
                leadingTextSpan.classList.add('grid-margin-text');
                leadingTextSpan.innerText = leadingText;
                lineWrapper.append(leadingTextSpan);
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
                const trailingTextSpan = document.createElement('td');
                trailingTextSpan.classList.add('grid-margin-text');
                trailingTextSpan.innerText = trailingText;
                lineWrapper.append(trailingTextSpan);
            }

            return lineWrapper;
        });

        const tableBody = document.createElement('tbody');
        tableBody.append(...gridLineRows);

        grid.innerHTML = '';
        grid.append(tableBody);
    });
}
