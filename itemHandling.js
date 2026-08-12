import { removeAttachedStrings, makeString, makeTempString } from "./strings.js";
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

    //Set the id to an id from the passed object if possible, use the itemIDTracker if not    
    if(noteObject && noteObject.id){
        newNote.setAttribute('id', noteObject.id);
    } else{
        newNote.setAttribute('id', `item${stateVars.itemIDTracker}`);
        stateVars.itemIDTracker ++;
    }

    //Set the x coordinate property to the value from the passed object if possible, use the default centering if not.
    if(noteObject && noteObject.x){
        noteX = noteObject.x;
    } else{
        noteX = calculateOffsetX(stateVars) - 100;
    }

    //Set the y coordinate property to the value from the passed object if possible, use the default centering if not.
    if(noteObject && noteObject.y){
        noteY = noteObject.y;
    } else{
        noteY = calculateOffsetY(stateVars) - 90;
    }

    //Set the width if possible
    if(noteObject && noteObject.width){
        newNote.style.width = noteObject.width + "px";
    }

    //Set the height if possible
    if(noteObject && noteObject.height){
        newNote.style.height = noteObject.height + "px";
    }

    //Set the text content if possible
    if(noteObject && noteObject.text){
        noteText.textContent = noteObject.text;
    }

    //Set the colour if an object was passed with a defined colour
    if(noteObject && noteObject.colour){
        newNote.style.backgroundColor = noteObject.colour;
        newNote.setAttribute('colour', noteObject.colour);
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
    img.setAttribute('class', 'innerImg');
    
    var imageX;
    var imageY;

    //Set the id to an id from the passed object if possible, use the itemIDTracker if not
    if(loadedImage && loadedImage.id){
        newImage.setAttribute('id', loadedImage.id);
    } else{
        newImage.setAttribute('id', `item${stateVars.itemIDTracker}`);
        stateVars.itemIDTracker++;
    }

    //Set the x coordinate property to the value passed by the loadedImage object if possible, otherwise use default centering.
    if(loadedImage && loadedImage.x){
        imageX = loadedImage.x;
    } else{
        imageX = calculateOffsetX(stateVars) - 100;
    }

    //Set the y coordinate property to the value passed by the loadedImage object if possible, otherwise use default centering.
    if(loadedImage && loadedImage.y){
        imageY = loadedImage.y;
    } else{
        imageY = calculateOffsetY(stateVars) - 90;
    }

    //Set the image source from the passed image object if possible, otherwise set it to the passed source parameter "image". At least one of these should never be null.
    if(loadedImage && loadedImage.src){
        img.src = loadedImage.src;
    } else{
        img.src = image;
    }

    //Set width if possible
    if(loadedImage && loadedImage.width){
        newImage.style.width = loadedImage.width + "px";
    }

    //Set height if possible
    if(loadedImage && loadedImage.height){
        newImage.style.height = loadedImage.height + "px";
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

        //Prevents a potential string connection attempt when the delete button is clicked
        event.stopPropagation();
        
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

        //If connectStart is null, store the note in that variable and create the temporary guideline string.
        if(stateVars.connectStart == null){
            stateVars.connectStart = item;

            //Create the gudeline string
            stateVars.guideline = makeTempString(stateVars, (parseFloat(item.getAttribute('data-x')) + item.offsetWidth/2), (parseFloat(item.getAttribute('data-y')) + item.offsetHeight/2));
            stateVars.guideline.classList.add('string');
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

        //Remove and set the guideline to null
        stateVars.guideline.remove();
        stateVars.guideline = null;
    }

    //Append button
    item.appendChild(connectButton);
}

//This function opens the modal for editing a note. It calls the showModal function and then sets the currently edited note global variable to the passed note.
export function openEditModal(note, stateVars){
    stateVars.editOverlay.showModal();
    stateVars.currentEditedNote = note;

    //If the note has a set colour, ensure the corresponding colour radio option is checked, otherwise default to yellow
    if(stateVars.currentEditedNote.getAttribute('colour')){
        document.querySelector(`input[name="noteColour"][value="${stateVars.currentEditedNote.getAttribute('colour')}"]`).checked = true;
    } else{
        document.querySelector('input[name="noteColour"][value="#fff200"]').checked = true;
    }
}

//This closes the modal, makes it hidden again, and sets the currently edited note to null.
export function cancelEditNote(stateVars){
    stateVars.editOverlay.close();
    stateVars.currentEditedNote = null;
    stateVars.editOverlay.classList.add("hidden");
}

//This closes the modal, makes it hidden again, applies the inputed text to the currently edited note, and sets the currently edited note back to null.
export function applyEditNote(stateVars){
    const selectedColour = document.querySelector('input[name="noteColour"]:checked'); //Retrieves the value of the checked colour when applied

    //Alter properties of the note currently being edited based on user selections in the edit modal
    stateVars.currentEditedNote.style.backgroundColor = selectedColour.value;
    stateVars.currentEditedNote.setAttribute('colour', selectedColour.value);
    stateVars.currentEditedNote.querySelector('p').textContent = document.getElementById('modalTextInput').value;
    stateVars.currentEditedNote.style
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