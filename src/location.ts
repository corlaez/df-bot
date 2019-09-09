// Inform user about Daniel's last know location
var moment = require("moment");
moment.locale('es');

let currentToken = null;
let fullText = null;
let currentDate = null;

export const reportLocation = () => {
    if (currentDate == null) {
        return "Lo siento, aún no sé nada de Daniel.";
    }
    const now = moment();
    const diff = moment.duration(now.diff(currentDate)).humanize();
    const mainReport = `Daniel ha sido visto hace ${diff} en el piso ${currentToken}.`;
    const isFullTextVisible =  fullText !== currentToken;
    const fullTextReport =  ' Mensaje completo: ' + fullText;
    return isFullTextVisible ? mainReport + fullTextReport : mainReport;
}

export const setLocation = (floor, text) => {
    currentToken = floor;
    fullText = text;
    currentDate = moment();
}
