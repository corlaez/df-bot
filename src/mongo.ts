const faunadb = require('faunadb');

const secret = 'fnADY8Lh1uACDPwEVpFr2FkHA4PpZ_5d7whze7KF';
const client = new faunadb.Client({ secret });

export const getDB = () => client;
