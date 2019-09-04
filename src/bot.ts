// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory, TurnContext } from 'botbuilder';

var moment = require("moment");
moment.locale('es');

// text
const welcomeMessage = (name) => `Bienvenid@! ` +
`Soy un bot que te escribirá cuando me avisen que Daniel Fernando está en tu piso.`;
const floorMessage = 'Primero dime ¿En qué piso estás?';
const reportMessage = 'Sabes dónde está Daniel? Repórtalo.';
const thanksMessage = 'Gracias por reportar la ubicación de Daniel.';
const floorUpdatedText = 'Listo. Te avisaré cuando sepa que Daniel llegó a tu piso.'
const changeFloor = "Cambiar mi piso";

// User reports DF
const belatrixFloors = ['5', '16', '19', '20', '21'];
const toLowerCase = text => text.toLowerCase();
const getWords = text => text.split(" ");
const wordsToListen = [
    "sw5", "sw05", "sw16", "sw19", "sw20", "sw21",
    "df5", "df05", "df16", "df19", "df20", "df21",
    "5", "16", "19", "20", "21"
];
const wordsToReplace = [
    "5", "5", "16", "19", "20", "21",
    "5", "5", "16", "19", "20", "21",
    "5", "16", "19", "20", "21"
];
const isWordToListen = word => wordsToListen.includes(word.toLowerCase());
const getWordsToListen = words => words.map(toLowerCase).filter(isWordToListen)
const isLength1 = words => getWordsToListen(words).length === 1;
const getWordToReplace = word => wordsToReplace[wordsToListen.indexOf(word.toLowerCase())];

// User is informed about DF whereabouts
let currentToken = null;
let fullText = null;
let currentDate = null;
const reportDF = () => {
    if (currentDate == null) {
        return "Lo siento, aún no sé nada de Daniel.";
    }
    const now = moment();
    const diff = moment.duration(now.diff(currentDate)).humanize();
    const mainReport = `Daniel ha sido viso hace ${diff} en el piso ${currentToken}.`;
    const isFullTextVisible =  fullText !== currentToken;
    const fullTextReport =  ' Mensaje completo: ' + fullText;
    return isFullTextVisible ? mainReport + fullTextReport : mainReport;
}
const subscriptions = {
    DF5: [],
    DF16: [],
    DF19: [],
    DF20: [],
    DF21: [],
}
const isSubscribedUser = id => Object.values(subscriptions).some(list => list.includes(id));
const logSubs = () => console.log(JSON.stringify(subscriptions));
const subscribe = (context, text, userId) => {
    subscriptions["DF"+text].push(userId);
    references[userId] = TurnContext.getConversationReference(context.activity);
    logSubs();
}
const unsubscribe = id => {
    references[id] = null
    let index = subscriptions.DF5.indexOf(id);
    if (index > -1) {
        subscriptions.DF5 = [...subscriptions.DF5.slice(0, index), ...subscriptions.DF5.slice(index + 1)]
    }
    index = subscriptions.DF16.indexOf(id);
    if (index > -1) {
        subscriptions.DF16 = [...subscriptions.DF16.slice(0, index), ...subscriptions.DF16.slice(index + 1)]
    }
    index = subscriptions.DF19.indexOf(id);
    if (index > -1) {
        subscriptions.DF19 = [...subscriptions.DF19.slice(0, index), ...subscriptions.DF19.slice(index + 1)]
    }
    index = subscriptions.DF21.indexOf(id);
    if (index > -1) {
        subscriptions.DF21 = [...subscriptions.DF21.slice(0, index), ...subscriptions.DF21.slice(index + 1)]
    }
    logSubs();
}

// proactive messaging
const references = {};

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
                    subscribe(context, text, userId);
                    await context.sendActivity(floorUpdatedText);
                    await context.sendActivity(reportDF());// echo info about DF
                    await this.sendSuggestedActions(context, true);// Show report options
                }
            }  else if (text === changeFloor) {// I want to change my floor
                unsubscribe(userId);
                await this.sendSuggestedActions(context, false);// Show subscription options (stays in same state)
            } else {// I am subscribed and sent a text...
                const words = getWords(text);
                const wordsToListen = getWordsToListen(words);
                if (isLength1(wordsToListen)) {// The text is actually valid
                    const matchedWord = wordsToListen[0]
                    currentToken = getWordToReplace(matchedWord);
                    currentDate = moment();
                    fullText = text;
                    await context.sendActivity(thanksMessage);// echo parsed response to reporting user
                    // TODO: inform subscribers
                    const subscribedRefs = subscriptions["DF" + currentToken]
                        .filter(id => id !== userId)
                        .map(id => references[id]);
                    for (const ref of subscribedRefs) {
                        await context.adapter.continueConversation(ref, async innerContext => {
                            await innerContext.sendActivity(text);// echo message to subscribers
                        });
                    }
                } else {// I sent some not handled text
                    await context.sendActivity(reportDF());// echo info about DF
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
            if (userId !== context.activity.recipient.id) {
                const isSubscribed = isSubscribedUser(userId)
                await context.sendActivity(welcomeMessage(member.name));
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
