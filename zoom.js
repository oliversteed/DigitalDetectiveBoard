//handles zooming in and out on the corkboard

export function zoomHandler(event, stateVars){
    //Increase/decrease the zoom level based on scroll wheel movement.
    if(event.deltaY > 0){
        stateVars.zoomLevel -= 0.1;
    }
    else{
        stateVars.zoomLevel += 0.1;
    }

    //If the zoom level exceeds the min/max bounds, set them to their maximum or minimum value respectively.
    if(stateVars.zoomLevel > 2) stateVars.zoomLevel = 2;
    if(stateVars.zoomLevel < 0.5) stateVars.zoomLevel = 0.5;

    //Transform the zoomSpace div to scale the board based on the new zoomLevel
    stateVars.zoomSpace.style.transform = `scale(${stateVars.zoomLevel})`;
}