//Functions related to the creation, deletion, and management of corkboard strings.

//Creates a string between the 2 notes defined in the global variables "connectStart" and "connectEnd"
export function makeString(stateVars){
    //Create the string
    const stringLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

    //Get the coordinates
    const note1X = parseFloat(stateVars.connectStart.getAttribute('data-x')) + (stateVars.connectStart.offsetWidth/2);
    const note1Y = parseFloat(stateVars.connectStart.getAttribute('data-y')) + (stateVars.connectStart.offsetHeight/2);
    const note2X = parseFloat(stateVars.connectEnd.getAttribute('data-x')) + (stateVars.connectEnd.offsetWidth/2);
    const note2Y = parseFloat(stateVars.connectEnd.getAttribute('data-y')) + (stateVars.connectEnd.offsetHeight/2);

    //Set the SVG line's coordinates
    stringLine.setAttribute("x1", note1X);
    stringLine.setAttribute("y1", note1Y);
    stringLine.setAttribute("x2", note2X);
    stringLine.setAttribute("y2", note2Y);

    //Track which notes it is connected to
    stringLine.setAttribute("data-noteStart", stateVars.connectStart.id);
    stringLine.setAttribute("data-noteEnd", stateVars.connectEnd.id);

    //give the string its class
    stringLine.setAttribute("class", "string");

    //Append the created string to the SVG HTML element
    stateVars.stringLayer.appendChild(stringLine);

    //Reset the global variables to null once function has completed
    stateVars.connectStart = null;
    stateVars.connectEnd = null;
}

//Passes a moved item, such as a note, and updates all strings connected to that item.
export function updateStrings(movedItem){
    const posX = parseFloat(movedItem.getAttribute('data-x')) + (movedItem.offsetWidth/2);
    const posY = parseFloat(movedItem.getAttribute('data-y')) + (movedItem.offsetHeight/2);


    //Find all strings that start with this note and update their start coordinates
    document.querySelectorAll(`[data-noteStart="${movedItem.id}"]`).forEach(string => {
        string.setAttribute('x1', posX);
        string.setAttribute('y1', posY);
    });

    //Find all strings that end with this note and update their end coordinates
    document.querySelectorAll(`[data-noteEnd="${movedItem.id}"]`).forEach(string => {
        string.setAttribute('x2', posX);
        string.setAttribute('y2', posY);
    });
}

export function removeAttachedStrings(note){
    const itemID = note.id;

    //Find all strings that start with the deleted note and delete them
    document.querySelectorAll(`[data-noteStart="${itemID}"]`).forEach(string => {
        string.remove();
    });

    //Find all strings that end with the deleted note and delete them
    document.querySelectorAll(`[data-noteEnd="${itemID}"]`).forEach(string => {
        string.remove();
    });
}