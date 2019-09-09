import * as locationMemory from './locationMemory';
import * as locationMongo from './locationMongo';

const hasMongoCredentials = false;

export default hasMongoCredentials ? 
    locationMongo : locationMemory;
