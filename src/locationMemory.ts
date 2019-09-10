import { Location } from './types';

let currentToken = null;
let fullText = null;
let currentDateMs = null;

export const setLocation = (location: Location) => {
    currentToken = location.currentToken;
    fullText = location.fullText;
    currentDateMs = location.currentDateMs;
}

export const getLocation = (): Location => {
    return { currentToken, fullText, currentDateMs };
}
