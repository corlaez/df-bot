export const isSubscribedUser = id => false;

export const subscribe = (conversationRef, floor) => {
    const userId = conversationRef.user.id;
    const key = "DF"+floor;
}

export const unsubscribe = id => {
}

export const getConversationRefs = (floor, userId) => {
    const key = "DF" + floor;
    return [];
};