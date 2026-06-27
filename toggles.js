//These are the functions to implement toggle button functionalities

//Toggles the string cutting tool
export function toggleCut(stateVars){
    stateVars.cutToggle = !stateVars.cutToggle;
    const cutButton = document.getElementById('cutButtonID');

    if(stateVars.cutToggle){
        
        stateVars.corkboard.classList.add('dragging');
        cutButton.classList.add('sideButtonActive');
        return;
    }

    stateVars.corkboard.classList.remove('dragging');
    cutButton.classList.remove('sideButtonActive');
}