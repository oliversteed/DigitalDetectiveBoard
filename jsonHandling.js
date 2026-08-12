import { makeString } from "./strings.js";
import { createNote, createImage, clearBoard } from "./itemHandling.js";
//This handles JSON related functions such as saving and loading boards.

//This function takes the states object from main-code and then constructs a save data object to capture the current state of the board
export function saveBoard(stateVars){
    const json = boardToJson(stateVars);

    //Check the file picker is supported in the browser. Use if supported, download directly to downloads if unsupported.
    if('showSaveFilePicker' in window){
        saveBoardAs(json);
    } else{
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
}

export function boardToJson(stateVars){
    //Initialise the save state object
    const boardData = {
        currentID: stateVars.itemIDTracker,
        notes: [],
        images: [],
        strings: []
    }

    //Iterate over every note on the board and construct an object containing its attributes. For every note object created, push that to the notes array in the save state object.
    document.querySelectorAll('.note').forEach(note => {
        boardData.notes.push(saveNote(note));
    });

    //Iterate over every image on the board and construct an object containing its attributes. For every image object created, push that to the images array in the save state object.
    document.querySelectorAll('.image').forEach(image => {
        boardData.images.push(saveImage(image));
    });

    //Iterate over every string on the board and construct an object containing its start and end connection IDs. For every string object created, push that to the strings array in the save state object.
    document.querySelectorAll('.string').forEach(string => {
        boardData.strings.push(saveString(string));
    });

    //Create the JSON string from the save data object
    const json = JSON.stringify(boardData, null, 2);

    return json;
}

async function saveBoardAs(json){
    try{
        //Open the file picker window with the specified options.
        const saveWindow = await window.showSaveFilePicker({
            id: 1,
            startIn: "documents",
            suggestedName: "my_board.board",
            types: [{
                description: "Corkboard save file",
                accept: {
                    //Accepts the custom extension for corkboard save files.
                    'application/json': ['.board']
                }
            }]
        });

        //Write the json file to the selected file location 
        const savedFile = await saveWindow.createWritable();
        await savedFile.write(json);
        await savedFile.close();

    //If an error occurs during the process that is not the user aborting the save window, catch and write the error to the console.
    } catch(error){
        if(error.name !== 'AbortError'){
            console.error("Save unsuccessful:", error);
        }
    }
}

export function loadBoard(event, stateVars){

    const board = event.target.files[0];

    //Return if there is no uploaded file
    if(!board) return;

    const reader = new FileReader();

    //Once reader is loaded, parse the JSON from the .board file and pass the created JS board state object to the rehydration function
    reader.onload = function(e){
        rehydrateJson(e.target.result, stateVars);
    }

    //Initiate reading the text content of the file
    reader.readAsText(board);
}

export function rehydrateJson(board, stateVars){
    board = JSON.parse(board);

    //Clear the board before loading the new file
    clearBoard(stateVars);

    //Pass each note object through the createNote function
    board.notes.forEach(note => createNote(null, stateVars, note));

    //Pass each image object through the createImage function
    board.images.forEach(image => createImage(null, stateVars, image));

    //Pass each string object through the makeString function
    board.strings.forEach(string => makeString(stateVars, string));

    //Set the save item ID tracker value from the loaded JSON
    stateVars.itemIDTracker = board.currentID;
}

//Takes a reference to a note from the board and converts it to a Javascript Object then returns that object.
export function saveNote(note){
    const savedObj = {
        id: note.getAttribute('id'),
        text: note.querySelector('p').textContent,
        x: parseFloat(note.getAttribute('data-x')),
        y: parseFloat(note.getAttribute('data-y')),
        width: note.offsetWidth,
        height: note.offsetHeight,
        colour: note.getAttribute('colour'),
    }

    return savedObj;
}

//Takes a reference to an image from the board and converts it to a Javascript Object then returns that object.
export function saveImage(image){
    const savedObj = {
        id: image.getAttribute('id'),
        src: image.querySelector('img.innerImg').src,
        x: parseFloat(image.getAttribute('data-x')),
        y: parseFloat(image.getAttribute('data-y')),
        width: image.offsetWidth,
        height: image.offsetHeight
    }

    return savedObj;
}

//Takes a reference to a string from the board and converts it to a Javascript Object then returns that object.
function saveString(string){
    const savedObj = {
        start: string.getAttribute('data-noteStart'),
        end: string.getAttribute('data-noteEnd')
    }

    return savedObj
}