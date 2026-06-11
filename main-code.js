//Import other JS files
import {checkIntersection, getDataX, getDataY, calculateOffsetX, calculateOffsetY} from "./maths.js";
import { makeString, updateStrings, removeAttachedStrings } from "./strings.js";
import { toggleCut, toggleInertia } from "./toggles.js";
import { createNote, cancelEditNote, applyEditNote, uploadImage } from "./itemHandling.js";
import { zoomHandler } from "./zoom.js";
import { saveBoard } from "./jsonHandling.js";

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
    zoomSpace: null,
    stringLayer: null,
    cutLine: null,
    zoomLevel: 1,
    keyMoveSpeed: 20
}

//Wait for DOM to finish loading then initialise the major elements and add their event listeners
document.addEventListener('DOMContentLoaded', () =>{
    //retrieve and store necessary elements to add listeners to
    stateVars.editOverlay = document.getElementById('modalOverlay');
    stateVars.corkboard = document.getElementById('corkboard');
    stateVars.stringLayer = document.getElementById('string');
    stateVars.zoomSpace = document.getElementById('zoomSpace');

    const createNoteButton = document.getElementById('createNoteButton');
    const uploadImageButton = document.getElementById('uploadImageButton');
    const saveBoardButton = document.getElementById('saveButton')
    const inertiaButton = document.getElementById('inertiaButtonID');
    const cutButton = document.getElementById('cutButtonID');
    const cancelEditButton = document.getElementById('cancelNoteEditButton');
    const applyEditButton = document.getElementById('applyNoteEditButton');

    //Ensure Interact listeners are set after DOM has fully loaded
    setInteractListeners();

    //Add event listeners for the side buttons
    createNoteButton.addEventListener('click', () => createNote(null, stateVars));
    uploadImageButton.addEventListener('click', () => document.getElementById("uploadedImage").click());
    saveBoardButton.addEventListener('click', () => saveBoard(stateVars));
    inertiaButton.addEventListener('click', () => toggleInertia(stateVars));
    cutButton.addEventListener('click', () => toggleCut(stateVars));
    cancelEditButton.addEventListener('click', () => cancelEditNote(stateVars));
    applyEditButton.addEventListener('click', () => applyEditNote(stateVars));

    //Add event listener to the hidden image input to check when a new images is being uploaded
    document.getElementById("uploadedImage").addEventListener('change', () => uploadImage(event, stateVars));

    //Event listener for zooming in/out on the corkboard
    stateVars.zoomSpace.addEventListener('wheel', (event) => {
        if(event.ctrlKey){
            //Prevent browser's default zoom
            event.preventDefault();
            zoomHandler(event, stateVars);
        }
    });

    //Event listener for arrow key movement
    document.addEventListener('keydown', () => arrowKeyMovement(event));

    //Add the mousedown event listener to the corkboard to manage cut string logic
    stateVars.corkboard.addEventListener('mousedown', (event) => {
        if(stateVars.cutToggle == false) return;

        //get coordinates of where the mouse click occured.
        const mousePosX = (event.clientX - stateVars.corkboard.getBoundingClientRect().left)/stateVars.zoomLevel;
        const mousePosY = (event.clientY - stateVars.corkboard.getBoundingClientRect().top)/stateVars.zoomLevel;

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
        const mousePosX = (event.clientX - stateVars.corkboard.getBoundingClientRect().left)/stateVars.zoomLevel;
        const mousePosY = (event.clientY - stateVars.corkboard.getBoundingClientRect().top)/stateVars.zoomLevel;

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
        autoScroll: false
    })

    //Interact.js logic for dragging and resizing images
    interact('.image').resizable({
        edges: {left: true, right: true, bottom: true, top: true},

        listeners: {move: resizeListener},
        inertia: false,
        autoscroll: false,
        modifiers: [
            interact.modifiers.aspectRatio({
                ratio: 'preserve'
            })
        ]
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
}

//Logic for updating position of element when dragging
function dragMoveListener(event){
    //Do not move if the user is currently using the cut string tool
    if(stateVars.cutToggle) return;

    var x = getDataX(event) + (event.dx/stateVars.zoomLevel);
    var y = getDataY(event) + (event.dy/stateVars.zoomLevel);

    event.target.style.transform = `translate(${x}px, ${y}px)`;

    event.target.setAttribute('data-x', x);
    event.target.setAttribute('data-y', y);

    //Update any attached strings
    updateStrings(event.target);
}

//Function for moving items with the arrow keys
function arrowKeyMovement(event){
    let focusItem = document.activeElement;

    var moveSpeed = stateVars.keyMoveSpeed;

    //If a draggable element is not focused, move the corkboard instead. Make the moveSpeed var negative to make the corkboard move intuitively.
    if(!document.activeElement.classList.contains('draggable')){
        focusItem = stateVars.corkboard;
        moveSpeed = moveSpeed * -1;
    }

    //Get focused item's current coordinates
    var x = parseFloat(focusItem.getAttribute('data-x'));
    var y = parseFloat(focusItem.getAttribute('data-y'));

    //Adjust the coordinates based on which arrow key was pressed.
    switch (event.key){
        case 'ArrowUp':
            y = y - moveSpeed;
            console.log("go up");
            break;
        case 'ArrowDown':
            y = y + moveSpeed;
            console.log("Go down");
            break;
        case 'ArrowLeft':
            x = x - moveSpeed;
            console.log("Go left");
            break;
        case 'ArrowRight':
            x = x + moveSpeed;
            console.log("Go right");
            break;
        default:
            break;
    }

    focusItem.style.transform = `translate(${x}px, ${y}px)`;

    focusItem.setAttribute('data-x', x);
    focusItem.setAttribute('data-y', y);
    
}

//Logic for updating position/width and height of element when resizing
function resizeListener(event){
    //Do not resize if the user is currently using the cut string tool
    if(stateVars.cutToggle) return;

    var x = getDataX(event);
    var y = getDataY(event);

    event.target.style.width = (event.rect.width/stateVars.zoomLevel) + 'px'; //Width
    event.target.style.height = (event.rect.height/stateVars.zoomLevel) + 'px'; //Height

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