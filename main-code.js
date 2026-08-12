//Import other JS files
import {checkIntersection, getDataX, getDataY, calculateOffsetX, calculateOffsetY} from "./maths.js";
import { makeString, updateStrings, removeAttachedStrings, makeTempString } from "./strings.js";
import { toggleCut } from "./toggles.js";
import { createNote, createImage, cancelEditNote, applyEditNote, uploadImage, clearBoard } from "./itemHandling.js";
import { zoomHandler } from "./zoom.js";
import { saveBoard, loadBoard, saveNote, saveImage, boardToJson, rehydrateJson } from "./jsonHandling.js";

//Module-scoped variables stored in an object to easily pass to functions. These store major persistent DOM objects that many functions need to access, or store states that are tracked and modified for the corkboard functionality.
const stateVars = {
    inertiaToggle: true,
    cutToggle: false,
    currentEditedNote: null,
    connectStart: null,
    connectEnd: null,
    itemIDTracker: 1,
    editOverlay: null,
    confirmOverlay: null,
    corkboard: null,
    zoomSpace: null,
    stringLayer: null,
    cutLine: null,
    guideline: null,
    clipboard: null,
    zoomLevel: 1,
    keyMoveSpeed: 20,
    dbActive: false,
    db: null,
}

//Wait for DOM to finish loading then initialise the major elements and add their event listeners
document.addEventListener('DOMContentLoaded', () =>{
    //retrieve and store necessary elements to add listeners to
    stateVars.editOverlay = document.getElementById('modalOverlay');
    stateVars.confirmOverlay = document.getElementById('clearConfirmation');
    stateVars.corkboard = document.getElementById('corkboard');
    stateVars.stringLayer = document.getElementById('string');
    stateVars.zoomSpace = document.getElementById('zoomSpace');

    const createNoteButton = document.getElementById('createNoteButton');
    const uploadImageButton = document.getElementById('uploadImageButton');
    const saveBoardButton = document.getElementById('saveButton');
    const loadBoardButton = document.getElementById('loadButton');
    const clearButton = document.getElementById('clearButton');
    const cutButton = document.getElementById('cutButtonID');
    const cancelEditButton = document.getElementById('cancelNoteEditButton');
    const applyEditButton = document.getElementById('applyNoteEditButton');
    const confirmClearButton = document.getElementById('acceptClear');
    const cancelClearButton = document.getElementById('cancelClear');

    //Ensure Interact listeners are set after DOM has fully loaded
    setInteractListeners();

    //Add event listeners for the side buttons
    createNoteButton.addEventListener('click', () => createNote(null, stateVars));
    uploadImageButton.addEventListener('click', () => document.getElementById("uploadedImage").click());
    saveBoardButton.addEventListener('click', () => saveBoard(stateVars));
    loadBoardButton.addEventListener('click', () => document.getElementById("loadedBoard").click())
    clearButton.addEventListener('click', () => clearConfirmation());
    cutButton.addEventListener('click', () => toggleCut(stateVars));
    cancelEditButton.addEventListener('click', () => cancelEditNote(stateVars));
    applyEditButton.addEventListener('click', () => applyEditNote(stateVars));
    confirmClearButton.addEventListener('click', () => confirmClear());
    cancelClearButton.addEventListener('click', () => cancelClear());

    //Add event listener to the hidden image input to check when a new images is being uploaded
    document.getElementById("uploadedImage").addEventListener('change', () => uploadImage(event, stateVars));
    document.getElementById("loadedBoard").addEventListener('change', () => loadBoard(event, stateVars));

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

    //Event listener for clipboard copy/paste
    document.addEventListener('keydown', (event) => {
        //Store the current focused element
        let focus = document.activeElement;
        if(event.ctrlKey && event.key.toLowerCase() === 'c'){
            //If the focused element is a note, convert it to a JS object and store it in the stateVars as the current clipboard object. Remove the id property to prevent it being created with a duplicate id
            if(focus.classList.contains('note')){
                stateVars.clipboard = saveNote(focus);
                delete stateVars.clipboard.id;
                stateVars.clipboard.type = 'note'; //Add the note type so the correct function is used when pasting
                console.log(stateVars.clipboard);
            }
            if(focus.classList.contains('image')){
                stateVars.clipboard = saveImage(focus);
                delete stateVars.clipboard.id;
                stateVars.clipboard.type = 'image'; //Add the note type so the correct function is used when pasting
            }
        } else if(event.ctrlKey && event.key.toLowerCase() === 'v'){
            //Shift the coordinates of the stored object slightly to ensure it is not pasted directly ontop of the original object.
            stateVars.clipboard.x += 20;
            stateVars.clipboard.y += 20;

            //Depending on which type of object is stored in the clipboard, use the relevant function to create that object.
            if(stateVars.clipboard){
                switch (stateVars.clipboard.type){
                    case 'note':
                        createNote(null, stateVars, stateVars.clipboard);
                        break;
                    case 'image':
                        createImage(null, stateVars, stateVars.clipboard);
                        break;
                    default:
                        break;
                }
            }
        }
    });

    //Add the mousedown event listener to the corkboard to manage cut string logic
    stateVars.corkboard.addEventListener('mousedown', (event) => {
        if(stateVars.cutToggle == false) return;

        //Clean up any previously drawn cut lines that may have lingered due to moving the mouse outside the window
        document.querySelectorAll('.cutLine').forEach(line => {
            line.remove();
        })

        //make notes transparent to make string connections easier to see
        const boardNotes = document.querySelectorAll('.note, .image');
        boardNotes.forEach(item => {
            item.style.opacity = "0.5";
        })

        //get coordinates of where the mouse click occured.
        const mousePosX = (event.clientX - stateVars.corkboard.getBoundingClientRect().left)/stateVars.zoomLevel;
        const mousePosY = (event.clientY - stateVars.corkboard.getBoundingClientRect().top)/stateVars.zoomLevel;

        //Make a temporary string at the point of the mouse click
        stateVars.cutLine = makeTempString(stateVars, mousePosX, mousePosY);

        //Set the styling for the line
        stateVars.cutLine.classList.add('cutLine');
    });

    //Add event listener for right clicking to cancel a current connection
    window.addEventListener('contextmenu', (event) => {

        //Only proceed if the guideline is currently not null
        if(!(stateVars.guideline == null)){

            //Prevent the context menu from opening
            event.preventDefault();

            //Remove the guideline and set the guideline variable back to null
            stateVars.guideline.remove();
            stateVars.guideline = null;

            //Set the connectStart variable to null to prevent another click from making an unwanted string
            stateVars.connectStart = null;
        }
    })
    
    //Add event listener for updating temporary strings
    window.addEventListener('mousemove', (event) => {

        //Get new mouse coordinates as the mouse is moved
        const mousePosX = (event.clientX - stateVars.corkboard.getBoundingClientRect().left)/stateVars.zoomLevel;
        const mousePosY = (event.clientY - stateVars.corkboard.getBoundingClientRect().top)/stateVars.zoomLevel;

        if((stateVars.cutToggle == true) && !(stateVars.cutLine == null)){
            //Set new coordinates for the end of the line, moving it with the mouse.
            stateVars.cutLine.setAttribute('x2', mousePosX);
            stateVars.cutLine.setAttribute('y2', mousePosY);
        }

        if(!(stateVars.guideline == null)){
            //Set new coordinates for the end of the guideline, moving it with the mouse.
            stateVars.guideline.setAttribute('x2', mousePosX);
            stateVars.guideline.setAttribute('y2', mousePosY);
        }
    });

    stateVars.corkboard.addEventListener('mouseup', (event) => {
        if(stateVars.cutToggle == false) return;

        //Return note opacity to normal
        const boardNotes = document.querySelectorAll('.note, .image');
        boardNotes.forEach(item => {
            item.style.opacity = "1";
        })

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

    //Request to open the indexedDB database
    const dbRequest = window.indexedDB.open("backupDB", 1);

    //On first time initialisation, or in the event the DB version is increased, open a new object store named "backups"
    dbRequest.onupgradeneeded = (event) => {
        const database = event.target.result;

        if (!database.objectStoreNames.contains('backups')){
            database.createObjectStore('backups', {keyPath: 'id'});
        }
    }

    //Throw an error to the console and set dbActive to false in the case something goes wrong
    dbRequest.onerror = (event) => {
        console.error(`Unable to open database. Backup saving is disabled. Errror: ${event.target.error?.message}`);
        stateVars.dbActive = false;
    };

    //On success, set the db and dbActive in the state variables object
    dbRequest.onsuccess = (event) => {
        stateVars.db = event.target.result;
        stateVars.dbActive = true;

        //Make a request and check if there is an autosave already within the database
        const transaction = stateVars.db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        const getRequest = store.get('autosave');

        getRequest.onsuccess = () => {
            const boardBackup = getRequest.result;

            //If the backup exists and contains content, rehydrate the saved JSON. Otherwise, create the welcome note.
            if(boardBackup && boardBackup.content){
                rehydrateJson(boardBackup.content, stateVars);
            } else{
                createNote("Welcome to this website!", stateVars);
            }
        }

        
        getRequest.onerror = () => {
            createNote("Welcome to this website!", stateVars);
        }

    }

    //Set the debounce function to wrap the backupBoard function
    const autoSave = debounce(() => backupBoard());

    //Autosave when user interactions are detected
    document.addEventListener('input', autoSave);
    document.addEventListener('change', autoSave);
    document.addEventListener('click', autoSave);

    //Autosave when interact.js interactions end for dragging and resizing.
    window.addEventListener('dragend', autoSave);
    window.addEventListener('resizeend', autoSave);
})

//Debounce function sets a 500 ms delay before initiating the passed function
function debounce(func, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {func.apply(this, args);}, delay);
    }
}

//Autosave the board to the database
function backupBoard(){
    //Do not autosave if the database is inactive
    if(!stateVars.dbActive) return;

    console.log("Autosaving board");
    const json = boardToJson(stateVars);
    saveToDB(json);

}

function saveToDB(json){
    const transaction = stateVars.db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');

    const record = {
        id: 'autosave',
        content: json,
        updated: Date.now()
    };

    const request = store.put(record);

    request.onsuccess = () => {
        console.log("autosaving complete");
    }

    request.onerror = (e) => {
        console.log(`Autosaving failed. Errror: ${e.target.error?.message}`);
    }
}

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
        mouseButtons: 4, //Use middlemouse click
        inertia: false,
        autoScroll: false
    })

    //Allows middlemouse dragging the background of the page to move the corkboard
    interact(document.body).draggable({
        mouseButtons: 4, //Use middlemouse click
        listeners: {
            move(event){
                //Update the new position of the corkboard based on the drag event
                var x = (parseFloat(corkboard.getAttribute('data-x')) || 0) + event.dx;
                var y = (parseFloat(corkboard.getAttribute('data-y')) || 0) + event.dy;

                //Update the corkboard element's position and its data-x and data-y values
                corkboard.style.transform = `translate(${x}px, ${y}px)`;
                corkboard.setAttribute('data-x', x);
                corkboard.setAttribute('data-y', y);
            }
        }
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
    var moveCorkboard = false;

    //If a draggable element is not focused, move the corkboard instead. Make the moveSpeed var negative to make the corkboard move intuitively.
    if(!document.activeElement.classList.contains('draggable') && !document.activeElement.classList.contains('image')){
        focusItem = stateVars.corkboard;
        moveSpeed = moveSpeed * -1;
        moveCorkboard = true;
    }

    //Get focused item's current coordinates
    var x = parseFloat(focusItem.getAttribute('data-x'));
    var y = parseFloat(focusItem.getAttribute('data-y'));

    //Adjust the coordinates based on which arrow key was pressed.
    switch(event.key){
        case 'ArrowUp':
            y = y - moveSpeed;
            break;
        case 'ArrowDown':
            y = y + moveSpeed;
            break;
        case 'ArrowLeft':
            x = x - moveSpeed;
            break;
        case 'ArrowRight':
            x = x + moveSpeed;
            break;
        default:
            break;
    }

    //Prevent items going out of bounds
    if((x < 0) || ((x + focusItem.offsetWidth)  > 5000) || (y < 0) || ((y + focusItem.offsetHeight) > 5000)) return;

    focusItem.style.transform = `translate(${x}px, ${y}px)`;

    focusItem.setAttribute('data-x', x);
    focusItem.setAttribute('data-y', y);

    //If the item being moved is not the corkboard, update the position of any attached strings
    if(!moveCorkboard){
        updateStrings(focusItem);
    }
    
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

function clearConfirmation(){
    stateVars.confirmOverlay.classList.remove('hidden');
    stateVars.confirmOverlay.showModal();
}

function confirmClear(){
    clearBoard(stateVars);
    stateVars.confirmOverlay.classList.add('hidden');
    stateVars.confirmOverlay.close();
}

function cancelClear(){
    stateVars.confirmOverlay.classList.add('hidden');
    stateVars.confirmOverlay.close();
}