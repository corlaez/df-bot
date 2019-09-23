import { Location } from './types';
import { getDB } from './mongo';
const { query: q } = require('faunadb');

/*
client.query(q.Paginate(q.Ref("indexes"))).then(function(result) {
  result.data.forEach(function(index) {
    var p = document.createElement("p");
    p.innerText = index.value;
    document.body.appendChild(p);
  });
});
*/

export const setLocation = (location: Location) => {

}

export const getLocation = async(): Promise<Location> => {
    const arr = await getDB()
        .query(q.Get(
            // Matching an index can return a set of instances or just an instance.
            q.Match(q.Index('LocationIndex'))
            /* Or I could get a reference with the collection and id. The result is just an instance.
            q.Ref(
                q.Collection("CurrentLocation"),
                "244220844115493388"
            )*/
        ));
    return arr.data ? arr.data : {};
}

getLocation().then(l => console.log(l));