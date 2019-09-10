import { ActivityHandler, MessageFactory } from 'botbuilder';
import { TurnContext } from 'botbuilder';
import subscriptions from './subscriptions';
import location from './location';

const { subscribe, unsubscribe, isSubscribedUser, getConversationRefs } = subscriptions;
const { getLocation, setLocation } = location;
const moment = require("moment");
moment.locale('es');

// text
const welcomeMessage = () => `Bienvenid@! ` +
`Soy un bot que te escribirá cuando me avisen que Daniel Fernando está en tu piso.`;
const floorMessage = 'Dime ¿En qué piso estás?';
const reportMessage = 'Sabes dónde está Daniel? Repórtalo.';
const thanksMessage = 'Gracias por reportar la ubicación de Daniel.';
const floorUpdatedText = 'Listo. Te avisaré cuando sepa que Daniel llegó a tu piso.'
const changeFloor = "Cambiar mi piso";
const reportLocation = () => {
    const lastLocation = getLocation();
    const { currentToken, fullText, currentDateMs } = lastLocation;
    if (currentDateMs == null) {
        return "Lo siento, aún no sé nada de Daniel.";
    }
    const now = moment();
    const currentDate = moment(currentDateMs);
    const diff = moment.duration(now.diff(currentDate)).humanize();
    const mainReport = `Daniel ha sido visto hace ${diff} en el piso ${currentToken}.`;
    const isFullTextVisible =  fullText !== currentToken;
    const fullTextReport =  ' Mensaje completo: ' + fullText;
    return isFullTextVisible ? mainReport + fullTextReport : mainReport;
}

// User reports DF
const belatrixFloors = ['5', '16', '19', '20', '21'];
const toLowerCase = text => text.toLowerCase();
const getWords = text => text.split(" ");
const wordsToListen = [
    "5", "16", "19", "20", "21",
    "sw5", "sw05", "sw16", "sw19", "sw20", "sw21",
    "df5", "df05", "df16", "df19", "df20", "df21",
];
const wordsToReplace = [
    "5", "16", "19", "20", "21",
    "5", "5", "16", "19", "20", "21",
    "5", "5", "16", "19", "20", "21",
];
const isWordToListen = word => wordsToListen.includes(word.toLowerCase());
const getWordsToListen = words => words.map(toLowerCase).filter(isWordToListen)
const isLength1 = words => getWordsToListen(words).length === 1;
const getWordToReplace = word => wordsToReplace[wordsToListen.indexOf(word.toLowerCase())];

export class MyBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            const userId = context.activity.from.id;
            const isSubscribed = isSubscribedUser(userId);
            if(!isSubscribed) {// Please subscribe
                const validAnswer = belatrixFloors.includes(text);
                if(!validAnswer) {
                    await this.sendSuggestedActions(context, false);// Show subscription options (stays in same state)
                } else {
                    const conversationRef = TurnContext.getConversationReference(context.activity)
                    subscribe(conversationRef, text);
                    await context.sendActivity(floorUpdatedText);
                    await context.sendActivity(reportLocation());// echo info about DF
                    await this.sendSuggestedActions(context, true);// Show report options
                }
            }  else if (text === changeFloor) {// I want to change my floor
                unsubscribe(userId);
                await this.sendSuggestedActions(context, false);// Show subscription options (stays in same state)
            } else {// I am subscribed and sent a text...
                const words = getWords(text);
                const wordsToListen = getWordsToListen(words);
                if (isLength1(wordsToListen)) {// The text is actually valid
                    const matchedWord = wordsToListen[0];
                    const floor = getWordToReplace(matchedWord);
                    const lastLocation = getLocation();
                    const newLocation = {
                        currentToken: floor, fullText: text, currentDateMs: moment().valueOf()
                    }
                    setLocation(newLocation);
                    await context.sendActivity(thanksMessage);// echo parsed response to reporting user
                    // TODO: inform subscribers
                    const subscribedRefs = getConversationRefs(floor, userId)
                    for (const ref of subscribedRefs) {
                        await context.adapter.continueConversation(ref, async innerContext => {
                            await innerContext.sendActivity(text);// echo message to subscribers
                        });
                    }
                } else {// I sent some not handled text
                    await context.sendActivity(reportLocation());// echo info about DF
                    await this.sendSuggestedActions(context, true);// Show report options
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMessage(context) {
        // Iterate over all new members added to the conversation.
        for (const idx in context.activity.membersAdded) {
            const member = context.activity.membersAdded[idx];
            const userId = member.id
            const userIsNotTheBot = userId !== context.activity.recipient.id
            if (userIsNotTheBot) {
                const isSubscribed = isSubscribedUser(userId)
                await context.sendActivity(welcomeMessage());
                await this.sendSuggestedActions(context, isSubscribed);
            }
        }
    }

    async sendSuggestedActions(context, isSubscribed) {
        if(!isSubscribed) {
            var firstSubReply = MessageFactory.suggestedActions(belatrixFloors, floorMessage);
            await context.sendActivity(firstSubReply);
        } else {
            var reportReply = MessageFactory.suggestedActions([...belatrixFloors, changeFloor], reportMessage);
            await context.sendActivity(reportReply);
        }
    }
}
