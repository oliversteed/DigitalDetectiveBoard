//These are the functions to implement toggle button functionalities

//Allows the user to toggle draggable inertia
export function toggleInertia(stateVars){
    stateVars.inertiaToggle = !stateVars.inertiaToggle;
    interact('.draggable').draggable({
        inertia: stateVars.inertiaToggle
    });
    
    if(stateVars.inertiaToggle){
        document.getElementById("inertiaButton").style.backgroundColor = "rgb(0, 202, 0)";
        return;
    }

    document.getElementById("inertiaButton").style.backgroundColor = "red";
}

//Toggles the string cutting tool
export function toggleCut(stateVars){
    stateVars.cutToggle = !stateVars.cutToggle;

    if(stateVars.cutToggle){
        document.getElementById("cutButton").style.backgroundColor = "rgb(0, 202, 0)";
        stateVars.corkboard.classList.add('dragging');
        return;
    }

    stateVars.corkboard.classList.remove('dragging');
    document.getElementById("cutButton").style.backgroundColor = "red";
}