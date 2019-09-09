// Inform user about Daniel's last know location
let currentToken = null;
let fullText = null;
let currentDateMs = null;

export const setLocation = (floor, text, ms) => {
    currentToken = floor;
    fullText = text;
    currentDateMs = ms;
}

export const getLocation = () => {
    return { currentToken, fullText, currentDateMs };
}
