// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory, TurnContext } from 'botbuilder';

var moment = require("moment");
moment.locale('es');

// text
const welcomeMessage = (name) => `Welcome ${ name }. ` +
`Este bot te notificará cuando Daniel Fernando haya sido reportado en tu piso en las oficinas de Belatrix.`;
const floorMessage = 'Primero dime en qué piso estás para poder avisarte cuando Daniel esté en él.';
const reportMessage = 'Si sabes dónde está Daniel, repórtalo.';
const thanksMessage = 'Gracias por reportar la ubicación de Daniel.';

// User reports DF
const toLowerCase = text => text.toLowerCase();
const getWords = text => text.split(" ");
const wordsToListen = ["sw5", "sw05", "sw16", "sw19", "sw20", "sw21", "df5", "df05", "df16", "df19", "df20", "df21"];
const wordsToReplace = ["DF5", "DF5", "DF16", "DF19", "DF20", "DF21", "DF5", "DF5",  "DF16", "DF19", "DF20", "DF21"];
const isWordToListen = word => wordsToListen.includes(word.toLowerCase());
const getWordsToListen = words => words.map(toLowerCase).filter(isWordToListen)
const isLength1 = words => getWordsToListen(words).length === 1;
const getWordToReplace = word => wordsToReplace[wordsToListen.indexOf(word.toLowerCase())];
const wordsReducer = (arr, word) => { 
    if (isWordToListen(word)) {// Use replaced token, to get rid of SWs
        const wordToReplace = getWordToReplace(word)
        arr.push(wordToReplace);
    } else {// Use same word
        arr.push(word);
    }
    return arr;
};
const processWords = words => words.reduce(wordsReducer, []).join(" ");

// User is informed about DF whereabouts
let currentToken = null;
let fullText = null;
let currentDate = null;
const reportDF = () => {
    if (currentDate == null) {
        return "DF aún no ha sido reportado.";
    }
    const now = moment();
    const diff = moment.duration(now.diff(currentDate)).humanize();
    const mainReport = currentToken + " ha sido reportado hace " + diff + '.';
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
const subscribe = (context, text, userId) => {
    subscriptions["DF"+text].push(userId);
    references[userId] = TurnContext.getConversationReference(context.activity);
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
}
const changeMySubscription = "Change my subscription";

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
                const validAnswer = ["5", "16", "19", "20", "21"].includes(text);
                if(!validAnswer) {
                    await this.sendSuggestedActions(context, false);// Show subscription options (stays in same state)
                } else {
                    subscribe(context, text, userId);
                    await context.sendActivity(reportDF());// echo info about DF
                    await this.sendSuggestedActions(context, true);// Show report options
                }
            }  else if (text === changeMySubscription) {// I want to change my floor
                unsubscribe(userId);
                await this.sendSuggestedActions(context, false);// Show subscription options (stays in same state)
            } else {// I am subscribed and sent a text...
                const words = getWords(text);
                const wordsToListen = getWordsToListen(words);
                if (isLength1(wordsToListen)) {// The text is actually valid
                    const matchedWord = wordsToListen[0]
                    currentToken = getWordToReplace(matchedWord);
                    currentDate = moment();
                    const newText = processWords(words);
                    fullText = newText;
                    await context.sendActivity(thanksMessage);// echo parsed response to reporting user
                    // TODO: inform subscribers
                    const subscribedRefs = subscriptions[currentToken]
                        .filter(id => id !== userId)
                        .map(id => references[id]);
                    for (const ref of subscribedRefs) {
                        await context.adapter.continueConversation(ref, async innerContext => {
                            await innerContext.sendActivity(newText);// echo message to subscribers
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
            var firstSubReply = MessageFactory.suggestedActions(['5', '16', '19', '20', '21'], floorMessage);
            await context.sendActivity(firstSubReply);
        } else {
            var reportReply = MessageFactory.suggestedActions(['DF5', 'DF16', 'DF19', 'DF20', 'DF21', changeMySubscription], reportMessage);
            await context.sendActivity(reportReply);
        }
    }
}
