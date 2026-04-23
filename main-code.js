//Import other JS files
import {checkIntersection} from "./maths.js";

//global variables
var inertiaToggle = true;
var corkboardInertiaToggle = false;
var cutToggle = false;
var currentEditedNote = null;
var connectStart = null;
var connectEnd = null;
var itemIDTracker = 1;
let editOverlay;
let corkboard;
let stringLayer;

document.addEventListener('DOMContentLoaded', () =>{ //Wait for DOM to finish loading before retrieving global variables with DOM objects assigned to them
    //retrieve and store necessary elements to add listeners to
    editOverlay = document.getElementById('modalOverlay');
    corkboard = document.getElementById("corkboard");
    stringLayer = document.getElementById('string');
    const createNoteButton = document.getElementById('createNoteButton');
    const inertiaButton = document.getElementById('inertiaButtonID');
    const cutButton = document.getElementById('cutButtonID');
    const cancelEditButton = document.getElementById('cancelNoteEditButton');
    const applyEditButton = document.getElementById('applyNoteEditButton');
    let cutLine = null;

    //Ensure Interact listeners are set after DOM has fully loaded
    setInteractListeners();

    //Add event listeners for the side buttons
    createNoteButton.addEventListener('click', createNote);
    inertiaButton.addEventListener('click', toggleInertia);
    cutButton.addEventListener('click', toggleCut);
    cancelEditButton.addEventListener('click', cancelEditNote);
    applyEditButton.addEventListener('click', applyEditNote);

    //Add the mousedown event listener to the corkboard to manage cut string logic
    corkboard.addEventListener('mousedown', (event) => {
        if(cutToggle == false) return;

        //get coordinates of where the mouse click occured.
        const mousePosX = event.clientX - corkboard.getBoundingClientRect().left;
        const mousePosY = event.clientY - corkboard.getBoundingClientRect().top;

        //Create a new line with the same start and end point initially
        cutLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        cutLine.setAttribute('x1', mousePosX);
        cutLine.setAttribute('y1', mousePosY);
        cutLine.setAttribute('x2', mousePosX);
        cutLine.setAttribute('y2', mousePosY);

        //Set the styling for the line
        cutLine.classList.add('cutLine');

        stringLayer.appendChild(cutLine);
    });

    window.addEventListener('mousemove', (event) => {
        if(cutToggle == false) return;
        if(cutLine == null) return;

        //Get new mouse coordinates as the mouse is moved
        const mousePosX = event.clientX - corkboard.getBoundingClientRect().left;
        const mousePosY = event.clientY - corkboard.getBoundingClientRect().top;

        //Set new coordinates for the end of the line, moving it with the mouse.
        cutLine.setAttribute('x2', mousePosX);
        cutLine.setAttribute('y2', mousePosY);
    });

    corkboard.addEventListener('mouseup', (event) => {
        if(cutToggle == false) return;

        //Get the start and end positions of the final cut line.
        const cutStartX = parseFloat(cutLine.getAttribute('x1'));
        const cutStartY = parseFloat(cutLine.getAttribute('y1'));
        const cutEndX = parseFloat(cutLine.getAttribute('x2'));
        const cutEndY = parseFloat(cutLine.getAttribute('y2'));

        //Check if cutLine intersects with any existing strings and remove those strings if so.
        document.querySelectorAll('line.string').forEach(string => {
            const stringStartX = parseFloat(string.getAttribute('x1'));
            const stringStartY = parseFloat(string.getAttribute('y1'));
            const stringEndX = parseFloat(string.getAttribute('x2'));
            const stringEndY = parseFloat(string.getAttribute('y2'));

            //If string intersects, delete string.
            if(checkIntersection(stringStartX, stringStartY, stringEndX, stringEndY, cutStartX, cutStartY, cutEndX, cutEndY)){
                string.remove();
            }
        });

        cutLine.remove();
    });

    createNote("Welcome to this website!")
})

function setInteractListeners(){
    //Interact.js logic for dragging and resizing notes
    interact('.draggable').resizable({
        //Allows resizing from all edges and corners
        edges: {left: true, right: true, bottom: true, top: true},

        listeners: {move: resizeListener},
        inertia: false,
        autoScroll: false
    })
    .draggable({
        listeners: {move: dragMoveListener},
        inertia: inertiaToggle,
        autoScroll: false,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: false
            })
        ]
    })

    //Interact.js logic for dragging the corkboard itself
    interact('.corkdrag').resizable({
        //Does not allow resizing of the corkboard
        edges: {left: false, right: false, bottom: false, top: false},

        listeners: {move: resizeListener},
        inertia: false,
        autoScroll: false,
    })
    .draggable({
        listeners: {move: dragMoveListener},
        inertia: corkboardInertiaToggle,
        autoScroll: false,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: false,
                //elementRect: {left: 1, right: 0, top: 1, bottom: 0}
            })
        ]
    })
}

//Logic for updating position of element when dragging
function dragMoveListener(event){
    //Do not move if the user is currently using the cut string tool
    if(cutToggle) return;

    var x = getDataX(event) + event.dx;
    var y = getDataY(event) + event.dy;

    event.target.style.transform = `translate(${x}px, ${y}px)`;

    event.target.setAttribute('data-x', x);
    event.target.setAttribute('data-y', y);

    //Update any attached strings
    updateStrings(event.target);
}

//Logic for updating position/width and height of element when resizing
function resizeListener(event){
    //Do not resize if the user is currently using the cut string tool
    if(cutToggle) return;

    var x = getDataX(event);
    var y = getDataY(event);

    event.target.style.width = event.rect.width + 'px'; //Width
    event.target.style.height = event.rect.height + 'px'; //Height

    x += event.deltaRect.left;
    y += event.deltaRect.top;

    //update target's style
    event.target.style.transform = `translate(${x}px, ${y}px)`; //Position

    //Transform the target
    event.target.setAttribute('data-x', x); //x position
    event.target.setAttribute('data-y', y); //y position

    //update any attached strings
    updateStrings(event.target);
}

function getDataX(event){
    return (parseFloat(event.target.getAttribute('data-x')) || 0);
}

function getDataY(event){
    return (parseFloat(event.target.getAttribute('data-y')) || 0);
}

//Allows the user to toggle draggable inertia
function toggleInertia(){
    inertiaToggle = !inertiaToggle;
    interact('.draggable').draggable({
        inertia: inertiaToggle
    });
    
    if(inertiaToggle){
        document.getElementById("inertiaButton").style.backgroundColor = "rgb(0, 202, 0)";
        return;
    }

    document.getElementById("inertiaButton").style.backgroundColor = "red";
}

//Allows the user to toggle corkboard drag inertia
function toggleCorkboardInertia(){
    corkboardInertiaToggle = !corkboardInertiaToggle;
    interact('.corkdrag').draggable({
        inertia: corkboardInertiaToggle
    });
    
    if(corkboardInertiaToggle){
        document.getElementById("inertiaCorkboardButton").style.backgroundColor = "rgb(0, 202, 0)";
        return;
    }

    document.getElementById("inertiaCorkboardButton").style.backgroundColor = "red";
}

//Toggles the string cutting tool
function toggleCut(){
    cutToggle = !cutToggle;

    if(cutToggle){
        document.getElementById("cutButton").style.backgroundColor = "rgb(0, 202, 0)";
        corkboard.classList.add('dragging');
        return;
    }

    corkboard.classList.remove('dragging');
    document.getElementById("cutButton").style.backgroundColor = "red";
}

//Creates a new note
function createNote(defaultText){
    const newNote = document.createElement("div"); //Creates the base note div
    const noteText = document.createElement("p"); //Creates a text container
    const deleteButton = document.createElement("button"); //Creates the delete button
    const editButton = document.createElement("button"); //Creates the edit button
    const connectButton = document.createElement("button"); //Creates the button to connect with "string"

    newNote.append(noteText);

    //Set parameter to null if it was just an eventCode passed
    if(defaultText instanceof Event) defaultText = null;

    if(defaultText != null){ //Sets the text content of the note only if text was passed to the function. This is primarily for notes created on load as welcome messages.
        noteText.textContent = defaultText;
    }

    editButton.setAttribute('class', 'editButton'); //Give editButton the appropriate class
    editButton.onclick = function(event){ //The logic for the notes' edit buttons
        event.stopPropagation(); //Prevents the draggable functionality from stopping the click button being registered
        
        currentEditedNote = newNote;
        document.getElementById('modalTextInput').value = newNote.textContent;

        //Opens the edit modal overlay and passes the relevant note
        openEditModal(newNote);

        //Unhides the overlay
        editOverlay.classList.remove("hidden");

        //moves focus to the overlay for accessibility purposes
        document.getElementById('modalTextInput').focus();
    }

    connectButton.setAttribute('class', 'connectButton');
    connectButton.onclick = function(event){

        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(connectStart == newNote){
            return;
        }

        //If connectStart is null, store the note in that variable; otherwise set this note to the final connection for the string and run makeString().
        if(connectStart == null){
            connectStart = newNote;
        }
    }

    //Handles whether clicks on the note are to connect notes or not.
    newNote.onclick = function(event){
        //If the connect function has not been initiated (no note stored in the connectStart variable) then don't do anything.
        if(connectStart == null){
            return;
        }
        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(connectStart == newNote){
            return;
        }

        connectEnd = newNote;
        makeString();
    }

    //Logic for the delete note button
    deleteButton.setAttribute('class', 'deleteButton');
    deleteButton.addEventListener('click', event => {
        deleteNoteButton(newNote);
    });

    //Make the buttons children of the parent note
    newNote.appendChild(deleteButton);
    newNote.appendChild(editButton);
    newNote.appendChild(connectButton);

    //Set note HTML attributes
    newNote.setAttribute('class', 'draggable note'); //set note to have draggable and note classes
    newNote.setAttribute('onkeydown', 'deleteNote(event, this)'); //Set note to be deletable
    newNote.setAttribute('tabindex', '0'); //Insert the div into the tab order, this makes deleteNote work

    //Set note ID and update ID
    newNote.setAttribute('id', `item${itemIDTracker}`);
    itemIDTracker++;

    //If user created this note
    if(defaultText == null){
        const noteX = calculateOffsetX() - 100;
        const noteY = calculateOffsetY() - 90;

        //reposition note in the centre of the viewport
        newNote.style.transform = `translate(${noteX}px, ${noteY}px`;

        //Update interact.js data-x and data-y so it can calculate draggable correctly
        newNote.setAttribute('data-x', noteX);
        newNote.setAttribute('data-y', noteY);
    }

    //Make the note a child of the corkboard base
    corkboard.appendChild(newNote);
}

//Creates a string between the 2 notes defined in the global variables "connectStart" and "connectEnd"
function makeString(){
    //Create the string
    const stringLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

    //Get the coordinates
    const note1X = parseFloat(connectStart.getAttribute('data-x')) + (connectStart.offsetWidth/2);
    const note1Y = parseFloat(connectStart.getAttribute('data-y')) + (connectStart.offsetHeight/2);
    const note2X = parseFloat(connectEnd.getAttribute('data-x')) + (connectEnd.offsetWidth/2);
    const note2Y = parseFloat(connectEnd.getAttribute('data-y')) + (connectEnd.offsetHeight/2);

    //Set the SVG line's coordinates
    stringLine.setAttribute("x1", note1X);
    stringLine.setAttribute("y1", note1Y);
    stringLine.setAttribute("x2", note2X);
    stringLine.setAttribute("y2", note2Y);

    //Track which notes it is connected to
    stringLine.setAttribute("data-noteStart", connectStart.id);
    stringLine.setAttribute("data-noteEnd", connectEnd.id);

    //give the string its class
    stringLine.setAttribute("class", "string");

    //Append the created string to the SVG HTML element
    stringLayer.appendChild(stringLine);

    //Reset the global variables to null once function has completed
    connectStart = null;
    connectEnd = null;
}

//Passes a moved item, such as a note, and updates all strings connected to that item.
function updateStrings(movedItem){
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

//These 2 functions return the offset number relative to the corkboard and the viewport for positioning maths.
function calculateOffsetX(){
    const corkRect = corkboard.getBoundingClientRect();
    const corkX = corkRect.x || 0;
    //returns corkboard X coord - the width of the viewport.
    return (window.innerWidth/2) - corkX;
}

function calculateOffsetY(){
    const corkRect = corkboard.getBoundingClientRect();
    const corkY = corkRect.y || 0;
    //returns corkboard X coord - the width of the viewport.
    return (window.innerHeight/2) - corkY;
}

//This function opens the modal for editing a note. It calls the showModal function and then sets the currently edited note global variable to the passed note.
function openEditModal(note){
    editOverlay.showModal();
    currentEditedNote = note;
}

//This closes the modal, makes it hidden again, and sets the currently edited note to null.
function cancelEditNote(){
    editOverlay.close();
    currentEditedNote = null;
    editOverlay.classList.add("hidden");
}

//This closes the modal, makes it hidden again, applies the inputed text to the currently edited note, and sets the currently edited note back to null.
function applyEditNote(){
    currentEditedNote.querySelector('p').textContent = document.getElementById('modalTextInput').value;
    currentEditedNote = null;
    editOverlay.close();
    editOverlay.classList.add("hidden");
}

//Delete a note
function deleteNote(event, note){
    if(event.code == "Delete"){
        removeAttachedStrings(note);
        note.remove();
    }
}

//Delete a note using the note's appended delete button. Does not need an event passed
function deleteNoteButton(note){
    removeAttachedStrings(note);
    note.remove();
}

function removeAttachedStrings(note){
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