// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory } from 'botbuilder';
var moment = require("moment");

// welcome
const welcomeMessage = (context, name) => `Welcome to suggestedActionsBot ${ name }. ` +
`This bot will introduce you to Suggested Actions. ` +
`Please select an option:`;

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
let currentDate = null;
const reportDF = () => {
    if (currentDate == null) {
        return "DF hasn't been reported yet";
    }
    const now = moment();
    const diff = moment.duration(now.diff(currentDate)).humanize()
    return currentToken + " reported " + diff + ' ago.';
}
const subscriptions = {
    DF5: [],
    DF16: [],
    DF19: [],
    DF20: [],
    DF21: [],
}

export class MyBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            const words = getWords(text);
            const wordsToListen = getWordsToListen(words);
            if (isLength1(wordsToListen)) {
                const matchedWord = wordsToListen[0]
                currentToken = getWordToReplace(matchedWord);
                currentDate = moment();
                const newText = processWords(words);
                await context.sendActivity(newText);// TODO: Send to the chat groups (directly if possible or through another lambda)
            } else {
                await context.sendActivity(reportDF());
                await this.sendSuggestedActions(context);
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
            if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                const member = context.activity.membersAdded[idx]
                const name = member.name;
                await context.sendActivity(welcomeMessage(context, name));
                await this.sendSuggestedActions(context);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['DF5', 'DF19', 'DF20', 'DF21'], 'Dónde está Daniel Fernando Y?');
        await turnContext.sendActivity(reply);
    }
}
