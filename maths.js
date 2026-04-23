//Checks whether 2 line segments intersect. Accepts the coordinates of the start and end points of both lines as parameters, returns true or false. Utilises the mathematical formula for line segment intersection.
export function checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4){
    
    //First calculate the denominator.
    const d = (y4 - y3) * (x2 - x1) - (y2 - y1) * (x4 - x3);

    //If the denominator is 0, the lines are parallel and therefore cannot intersect. Return early to prevent a divide by 0 error later in the calculation.
    if(d == 0){
        return false;
    }

    //Calculate the first numerator.
    const n1 = ((x4 - x3) * (y1 - y3) - ((y4 - y3) * (x1 - x3)));
    //Calculate the second numerator
    const n2 = ((x2 - x1) * (y1 - y3) - ((y2 - y1) * (x1 - x3)));

    //Solve for intersection position on line 1
    const pos1 = n1/d;

    //Solve for intersection position on line 2
    const pos2 = n2/d

    //The lines only intersect if both values fall within 0-1. Return true in this case.
    if((0 <= pos1) && (pos1 <= 1) && (0 <= pos2) && (pos2 <= 1)){
        return true
    }

    //If the lines do not intersect, return false.
    return false;

}