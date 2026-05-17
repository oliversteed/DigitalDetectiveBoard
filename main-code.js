//Import other JS files
import {checkIntersection, getDataX, getDataY, calculateOffsetX, calculateOffsetY} from "./maths.js";
import { makeString, updateStrings, removeAttachedStrings } from "./strings.js";
import { toggleCut, toggleInertia } from "./toggles.js";
import { createNote, cancelEditNote, applyEditNote } from "./noteHandling.js";

//Module-scoped variables stored in an object to easily pass to functions. These store major persistent DOM objects that many functions need to access, or store states that are tracked and modified for the corkboard functionality.
const stateVars = {
    inertiaToggle: true,
    cutToggle: false,
    currentEditedNote: null,
    connectStart: null,
    connectEnd: null,
    itemIDTracker: 1,
    editOverlay: null,
    corkboard: null,
    stringLayer: null,
    cutLine: null
}

//Wait for DOM to finish loading then initialise the major elements and add their event listeners
document.addEventListener('DOMContentLoaded', () =>{
    //retrieve and store necessary elements to add listeners to
    stateVars.editOverlay = document.getElementById('modalOverlay');
    stateVars.corkboard = document.getElementById("corkboard");
    stateVars.stringLayer = document.getElementById('string');
    const createNoteButton = document.getElementById('createNoteButton');
    const inertiaButton = document.getElementById('inertiaButtonID');
    const cutButton = document.getElementById('cutButtonID');
    const cancelEditButton = document.getElementById('cancelNoteEditButton');
    const applyEditButton = document.getElementById('applyNoteEditButton');

    //Ensure Interact listeners are set after DOM has fully loaded
    setInteractListeners();

    //Add event listeners for the side buttons
    createNoteButton.addEventListener('click', () => createNote(null, stateVars));
    inertiaButton.addEventListener('click', () => toggleInertia(stateVars));
    cutButton.addEventListener('click', () => toggleCut(stateVars));
    cancelEditButton.addEventListener('click', () => cancelEditNote(stateVars));
    applyEditButton.addEventListener('click', () => applyEditNote(stateVars));

    //Add the mousedown event listener to the corkboard to manage cut string logic
    stateVars.corkboard.addEventListener('mousedown', (event) => {
        if(stateVars.cutToggle == false) return;

        //get coordinates of where the mouse click occured.
        const mousePosX = event.clientX - corkboard.getBoundingClientRect().left;
        const mousePosY = event.clientY - corkboard.getBoundingClientRect().top;

        //Create a new line with the same start and end point initially
        stateVars.cutLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        stateVars.cutLine.setAttribute('x1', mousePosX);
        stateVars.cutLine.setAttribute('y1', mousePosY);
        stateVars.cutLine.setAttribute('x2', mousePosX);
        stateVars.cutLine.setAttribute('y2', mousePosY);

        //Set the styling for the line
        stateVars.cutLine.classList.add('cutLine');

        stateVars.stringLayer.appendChild(stateVars.cutLine);
    });

    window.addEventListener('mousemove', (event) => {
        if(stateVars.cutToggle == false) return;
        if(stateVars.cutLine == null) return;

        //Get new mouse coordinates as the mouse is moved
        const mousePosX = event.clientX - stateVars.corkboard.getBoundingClientRect().left;
        const mousePosY = event.clientY - stateVars.corkboard.getBoundingClientRect().top;

        //Set new coordinates for the end of the line, moving it with the mouse.
        stateVars.cutLine.setAttribute('x2', mousePosX);
        stateVars.cutLine.setAttribute('y2', mousePosY);
    });

    stateVars.corkboard.addEventListener('mouseup', (event) => {
        if(stateVars.cutToggle == false) return;

        //Get the start and end positions of the final cut line.
        const cutStartX = parseFloat(stateVars.cutLine.getAttribute('x1'));
        const cutStartY = parseFloat(stateVars.cutLine.getAttribute('y1'));
        const cutEndX = parseFloat(stateVars.cutLine.getAttribute('x2'));
        const cutEndY = parseFloat(stateVars.cutLine.getAttribute('y2'));

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

        stateVars.cutLine.remove();
    });

    createNote("Welcome to this website!", stateVars);
})

//Sets the listeners for Interact.JS to work.
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
        inertia: stateVars.inertiaToggle,
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
        inertia: false,
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
    if(stateVars.cutToggle) return;

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
    if(stateVars.cutToggle) return;

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