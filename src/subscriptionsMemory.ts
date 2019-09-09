// Proactive messaging
let conversationRefs = {};
const subscriptions = {
    DF5: [],
    DF16: [],
    DF19: [],
    DF20: [],
    DF21: [],
}
const subsKeys = Object.keys(subscriptions);
const logSubs = () => {
    const lengths = subsKeys.reduce((acc, key) => { 
        acc[key] = subscriptions[key].length;
        return acc;
    }, {});
    console.log(JSON.stringify(subscriptions));
    console.log(JSON.stringify(lengths));
}

export const isSubscribedUser = id => conversationRefs[id] != undefined;

export const subscribe = (conversationRef, floor) => {
    const userId = conversationRef.user.id;
    conversationRefs = { ...conversationRefs, [userId]: conversationRef };
    subscriptions["DF"+floor] = [
        ...subscriptions["DF"+floor],
        userId
    ];
    logSubs();
}

export const unsubscribe = id => {
    conversationRefs[id] = undefined;
    subsKeys.forEach((key) => {
        const subArray = subscriptions[key]
        let index = subArray.indexOf(id);
        if (index > -1) {
            subscriptions[key] = [...subArray.slice(0, index), ...subArray.slice(index + 1)];
        }
    });
    logSubs();
}

export const getConversationRefs = (floor, userId) => {
    const key = "DF" + floor;
    const ids = subscriptions[key].filter(id => id !== userId);
    return ids.map(id => conversationRefs[id]);
};