import { MongoClient, Collection } from 'mongodb';

const uri = "";

let db = null;

export const initDB = async () => {
    try {
        const client = await MongoClient.connect(uri);
        db = client.db('df-bot');
    } catch(e) {
        console.error(e);
    }
};

export const getDB = () => db;

export const find = (param, collection: Collection) => {
    let r = null;
    collection.find(param).toArray((err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            r = res;
        }
    });
    return r;
}