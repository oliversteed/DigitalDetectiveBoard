import { removeAttachedStrings, makeString } from "./strings.js";
import { getDataX, getDataY, calculateOffsetX, calculateOffsetY, checkIntersection } from "./maths.js";
//Handles the creation, deletion, and editing of notes.

//Creates a new note
export function createNote(defaultText, stateVars, noteObject){
    const newNote = document.createElement("div"); //Creates the base note div
    const noteText = document.createElement("p"); //Creates a text container

    newNote.append(noteText);

    //Set parameter to null if it was just an eventCode passed
    if(defaultText instanceof Event) defaultText = null;

    //Sets the text content of the note only if text was passed to the function. This is primarily for notes created on load as welcome messages.
    if(defaultText != null){
        noteText.textContent = defaultText;
    }

    //Create and add all relevant buttons
    appendDeleteButton(newNote);
    appendEditButton(newNote, stateVars);
    appendConnectButton(newNote, stateVars);

    //Set note HTML attributes
    newNote.setAttribute('class', 'draggable note'); //set note to have draggable and note classes
    newNote.setAttribute('tabindex', '0'); //Insert the div into the tab order, this makes deleteNote work and assists with accessibility

    //Declare the variables for the X and Y coordinates of the note
    var noteX;
    var noteY;

    //If a note object was passed, set the attributes according to the object's attributes
    if(noteObject){
        //Set the id to the id of the passed object
        newNote.setAttribute('id', noteObject.id);

        //Set the x and y coordinates equal to the values stored in the object.
        noteX = noteObject.x;
        noteY = noteObject.y;

        //Set the width and height based on the object's stored attributes
        newNote.style.width = noteObject.width + "px";
        newNote.style.height = noteObject.height + "px";

        //Set the text of the note based on the object's stored value
        noteText.textContent = noteObject.text;
    } else{
        //Set the id according to the itemIDTracker in the stateVars object and increment the tracker variable
        newNote.setAttribute('id', `item${stateVars.itemIDTracker}`);
        stateVars.itemIDTracker++;

        //Calculate offset to the middle of the corkboard
        noteX = calculateOffsetX(stateVars) - 100;
        noteY = calculateOffsetY(stateVars) - 90;
    }

    //reposition the note to the stored X and Y coordinates
    newNote.style.transform = `translate(${noteX}px, ${noteY}px`;

    //Update interact.js data-x and data-y so it can calculate draggable correctly
    newNote.setAttribute('data-x', noteX);
    newNote.setAttribute('data-y', noteY);

    //Make the note a child of the corkboard base
    stateVars.corkboard.appendChild(newNote);
}

//Initiates image upload
export function uploadImage(event, stateVars){
    //Set selected uploaded image
    const image = event.target.files[0];

    //If there is no image (userr cancelled operation) return and do nothing.
    if(!image) return;

    const reader = new FileReader();

    //Once loaded, retrieve the images Base64 string.
    reader.onload = function(e) {
        const imageBase64 = e.target.result;

        createImage(imageBase64, stateVars);
    }

    //Initiate reading image from the provided path
    reader.readAsDataURL(image);
}

export function createImage(image, stateVars, loadedImage){
    const newImage = document.createElement("div"); //Creates the base wrapper div
    
    newImage.setAttribute('class', 'image'); //set image to have the draggable class
    newImage.setAttribute('tabindex', '0'); //Insert the div into the tab order, this makes deleteNote work and assists with accessibility

    //Create and append the relevant controls
    appendDeleteButton(newImage);
    appendConnectButton(newImage, stateVars);

    //Create the image element and set its source as the Base64 for the uploaded image.
    const img = document.createElement('img');
    img.setAttribute('draggable', 'false'); //Prevent default browser image dragging behaviour
    
    var imageX;
    var imageY;

    //Check if an image JS object has been passed and set attributes based on the JS object if so. Use default values if not.
    if(loadedImage){
        //Set coordinates based off passsed JS object
        imageX = loadedImage.x;
        imageY = loadedImage.y;

        //Set source as the JS object's src value
        img.src = loadedImage.src;

        //Set the id
        newImage.setAttribute('id', loadedImage.id);

        //Set the width and height of the image
        newImage.style.width = loadedImage.width + "px";
        newImage.style.height = loadedImage.height + "px";
    }else{
        //Calculate offset to the middle of the corkboard
        imageX = calculateOffsetX(stateVars) - 100;
        imageY = calculateOffsetY(stateVars) - 90;
        
        //Set the img source
        img.src = image;

        //Set image ID and update ID
        newImage.setAttribute('id', `item${stateVars.itemIDTracker}`);
        stateVars.itemIDTracker++;
    }

    //reposition image based on the imageX and imageY variable values
    newImage.style.transform = `translate(${imageX}px, ${imageY}px`;

    //Update interact.js data-x and data-y so it can calculate draggable correctly
    newImage.setAttribute('data-x', imageX);
    newImage.setAttribute('data-y', imageY);

    //Make the image a child of the corkboard base and the img element a child of the wrapper
    newImage.appendChild(img);
    stateVars.corkboard.appendChild(newImage);
}

//Creates and appends a delete button to the passed item.
function appendDeleteButton(item){
    const deleteButton = document.createElement("button"); //Creates the delete button
    const deleteIcon = document.createElement("img"); //Creates the delete button icon element

    //Sets the attributes for the delete button's icon
    deleteIcon.setAttribute('class', 'smallIcon');
    deleteIcon.setAttribute('src', 'Resources/x-lg.svg');

    //Append the icon to the button
    deleteButton.appendChild(deleteIcon);

    //Logic for the delete note button
    deleteButton.setAttribute('class', 'deleteButton');
    deleteButton.addEventListener('click', event => {
        deleteNote(item);
    });

    //Add event listener to allow use of DEL key
    item.addEventListener('keydown', event => {
        if(event.code == "Delete"){
            deleteNote(item);
        }
    });

    //append button
    item.appendChild(deleteButton);
}

//Creates and appends an edit button to the passed item.
function appendEditButton(item, stateVars){
    const editButton = document.createElement("button"); //Creates the edit button
    const editIcon = document.createElement("img"); //Creates the edit button icon element

    //Sets the attributes for the edit button's icon
    editIcon.setAttribute('class', 'smallIcon');
    editIcon.setAttribute('src', 'Resources/pencil.svg');

    editButton.append(editIcon); //Appends the icon to the button

    editButton.setAttribute('class', 'editButton'); //Give editButton the appropriate class
    editButton.onclick = function(event){ //The logic for the notes' edit buttons
        event.stopPropagation(); //Prevents the draggable functionality from stopping the click button being registered
        
        stateVars.currentEditedNote = item;
        document.getElementById('modalTextInput').value = item.textContent;

        //Opens the edit modal overlay and passes the relevant note
        openEditModal(item, stateVars);

        //Unhides the overlay
        stateVars.editOverlay.classList.remove("hidden");

        //moves focus to the overlay for accessibility purposes
        document.getElementById('modalTextInput').focus();
    }

    //append button
    item.appendChild(editButton);
}

//Creates and appends a connect button to the passed item.
function appendConnectButton(item, stateVars){
    const connectButton = document.createElement("button"); //Creates the button to connect with "string"
    const connectIcon = document.createElement("img"); //Creates the connect button icon element

    //Sets the attributes for the connect button's icon
    connectIcon.setAttribute('class', 'smallIconConnect');
    connectIcon.setAttribute('src', 'Resources/link-45deg.svg');

    connectButton.appendChild(connectIcon); //Appends the icon to the button

    connectButton.setAttribute('class', 'connectButton');
    connectButton.onclick = function(event){

        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(stateVars.connectStart == item){
            return;
        }

        //If connectStart is null, store the note in that variable.
        if(stateVars.connectStart == null){
            stateVars.connectStart = item;
        }
    }

    //Handles whether clicks on the note are to connect notes or not.
    item.onclick = function(event){
        //If the connect function has not been initiated (no note stored in the connectStart variable) then don't do anything.
        if(stateVars.connectStart == null){
            return;
        }
        //If this note is already stored as the start connection, don't do anything, otherwise it would connect to itself.
        if(stateVars.connectStart == item){
            return;
        }

        stateVars.connectEnd = item;
        makeString(stateVars);
    }

    //Append button
    item.appendChild(connectButton);
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

export function clearBoard(stateVars){
    document.querySelectorAll('.note').forEach(note => deleteNote(note));
    document.querySelectorAll('.image').forEach(image => deleteNote(image));

    stateVars.itemIDTracker = 1;
}

//Delete a note using the note's appended delete button. Does not need an event passed
function deleteNote(item){
    removeAttachedStrings(item);
    item.remove();
}