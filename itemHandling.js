import { removeAttachedStrings, makeString } from "./strings.js";
import { getDataX, getDataY, calculateOffsetX, calculateOffsetY, checkIntersection } from "./maths.js";
//Handles the creation, deletion, and editing of notes.

//Creates a new note
export function createNote(defaultText, stateVars){
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
        
        stateVars.currentEditedNote = newNote;
        document.getElementById('modalTextInput').value = newNote.textContent;

        //Opens the edit modal overlay and passes the relevant note
        openEditModal(newNote, stateVars);

        //Unhides the overlay
        stateVars.editOverlay.classList.remove("hidden");

        //moves focus to the overlay for accessibility purposes
        document.getElementById('modalTextInput').focus();
    }

    connectButton.setAttribute('class', 'connectButton');
    connectButton.onclick = function(event){

        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(stateVars.connectStart == newNote){
            return;
        }

        //If connectStart is null, store the note in that variable.
        if(stateVars.connectStart == null){
            stateVars.connectStart = newNote;
        }
    }

    //Handles whether clicks on the note are to connect notes or not.
    newNote.onclick = function(event){
        //If the connect function has not been initiated (no note stored in the connectStart variable) then don't do anything.
        if(stateVars.connectStart == null){
            return;
        }
        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(stateVars.connectStart == newNote){
            return;
        }

        stateVars.connectEnd = newNote;
        makeString(stateVars);
    }

    //Logic for the delete note button
    deleteButton.setAttribute('class', 'deleteButton');
    deleteButton.addEventListener('click', event => {
        deleteNote(newNote);
    });

    newNote.addEventListener('keydown', event => {
        if(event.code == "Delete"){
            deleteNote(newNote);
        }
    });

    //Make the buttons children of the parent note
    newNote.appendChild(deleteButton);
    newNote.appendChild(editButton);
    newNote.appendChild(connectButton);

    //Set note HTML attributes
    newNote.setAttribute('class', 'draggable note'); //set note to have draggable and note classes
    newNote.setAttribute('tabindex', '0'); //Insert the div into the tab order, this makes deleteNote work

    //Set note ID and update ID
    newNote.setAttribute('id', `item${stateVars.itemIDTracker}`);
    stateVars.itemIDTracker++;

    //If user created this note
    if(defaultText == null){
        const noteX = calculateOffsetX(stateVars) - 100;
        const noteY = calculateOffsetY(stateVars) - 90;

        //reposition note in the centre of the viewport
        newNote.style.transform = `translate(${noteX}px, ${noteY}px`;

        //Update interact.js data-x and data-y so it can calculate draggable correctly
        newNote.setAttribute('data-x', noteX);
        newNote.setAttribute('data-y', noteY);
    }

    //Make the note a child of the corkboard base
    stateVars.corkboard.appendChild(newNote);
}

function appendDeleteButton(item){


}

//This function opens the modal for editing a note. It calls the showModal function and then sets the currently edited note global variable to the passed note.
export function openEditModal(note, stateVars){
    stateVars.editOverlay.showModal();
    stateVars.currentEditedNote = note;
}

//This closes the modal, makes it hidden again, and sets the currently edited note to null.
export function cancelEditNote(stateVars){
    stateVars.editOverlay.close();
    stateVars.currentEditedNote = null;
    stateVars.editOverlay.classList.add("hidden");
}

//This closes the modal, makes it hidden again, applies the inputed text to the currently edited note, and sets the currently edited note back to null.
export function applyEditNote(stateVars){
    stateVars.currentEditedNote.querySelector('p').textContent = document.getElementById('modalTextInput').value;
    stateVars.currentEditedNote = null;
    stateVars.editOverlay.close();
    stateVars.editOverlay.classList.add("hidden");
}

//Delete a note using the note's appended delete button. Does not need an event passed
function deleteNote(item){
    removeAttachedStrings(item);
    item.remove();
}