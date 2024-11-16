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
