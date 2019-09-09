import * as subscriptionsMemory from './subscriptionsMemory';
import * as subscriptionsMongo from './subscriptionsMongo';

const hasMongoCredentials = false;

export default  hasMongoCredentials ? 
    subscriptionsMongo : subscriptionsMemory;
