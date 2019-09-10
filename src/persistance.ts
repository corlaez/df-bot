import { getDB } from "./mongo";

const hasMongoCredentials = false;

export const close = () => {
    const db = getDB();
    hasMongoCredentials && db && db.close();
}
