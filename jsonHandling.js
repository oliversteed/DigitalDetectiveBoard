//This handles JSON related functions such as saving and loading boards.

//This function takes the states object from main-code and then constructs a save data object to capture the current state of the board
export function saveBoard(stateVars){
    //Initialise the save state object
    const boardData = {
        currentID: stateVars.itemIDTracker,
        notes: [],
        images: [],
        strings: []
    }

    //Iterate over every note on the board and construct an object containing its attributes. For every note object created, push that to the notes array in the save state object.
    document.querySelectorAll('.note').forEach(note => {
        boardData.notes.push({
            id: note.getAttribute('id'),
            text: note.querySelector('p').textContent,
            x: parseFloat(note.getAttribute('data-x')),
            y: parseFloat(note.getAttribute('data-y')),
            width: note.offsetWidth,
            height: note.offsetHeight,
        });
    });

    //Iterate over every image on the board and construct an object containing its attributes. For every image object created, push that to the images array in the save state object.
    document.querySelectorAll('.image').forEach(image => {
        boardData.images.push({
            id: image.getAttribute('id'),
            src: image.querySelector('img').src,
            x: parseFloat(image.getAttribute('data-x')),
            y: parseFloat(image.getAttribute('data-y')),
            width: image.offsetWidth,
            height: image.offsetHeight
        });
    });

    //Iterate over every string on the board and construct an object containing its start and end connection IDs. For every string object created, push that to the strings array in the save state object.
    document.querySelectorAll('.string').forEach(string => {
        boardData.strings.push({
            start: string.getAttribute('data-noteStart'),
            end: string.getAttribute('data-noteEnd')
        });
    });

    //Create the JSON string from the save data object
    const json = JSON.stringify(boardData, null, 2);

    //Store the hidden link element to enable downloading the file
    const dlLink = document.getElementById('downloadLink');

    //Create a binary large object with the json string to prepare for download
    const blob = new Blob([json], {type: 'application/json'});

    //Create a temporary URL pointing to the newly created blob
    const downloadURL = URL.createObjectURL(blob);

    //Set the invisible download link to the blob URL
    dlLink.href = downloadURL;

    //Set download filename
    dlLink.download = `New-Board-${Date.now()}.board`;

    //Simulate link click to initiate the download
    dlLink.click();

    //Remove the pointer to the blob address to allow garbage collection to clear browser RAM
    URL.revokeObjectURL(downloadURL);
}