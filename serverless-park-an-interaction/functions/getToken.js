const AccessToken = require('twilio').jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

// used for HTTP request 
exports.handler = async function generateteSyncToken(context, event, callback) {
  // Create a custom Twilio Response
  // Set the CORS headers to allow Flex to make an HTTP request to the Twilio Function
  const response = new Twilio.Response()
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");
  response.appendHeader("Content-Type", "application/json");

  console.log("##### generateteSyncToken #####");

  // Used when generating any kind of tokens
  // To set up environmental variables, see http://twil.io/secure
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;
  const twilioSyncService = process.env.TWILIO_SYNC_SERVICE_SID;

  // Used specifically for creating Sync tokens
  //const identity = 'SyncTokenUser';
  const identity = event.identity == null ? 'SyncTokenUser' : event.identity ;

  // Create a "grant" which enables a client to use Sync as a given user
  const syncGrant = new SyncGrant({
    serviceSid: twilioSyncService,
  });

  try {
  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    { identity: identity }
  );
  token.addGrant(syncGrant);


  // Serialize the token to a JWT string
  console.log(token.toJwt());
  
  response.setBody({ token: token.toJwt() });

  callback(null, response);  

  } catch (error) {
    response.setStatusCode(500);
    response.setBody({ success: false, message: error });
    
    callback(null, response);
  }
  
}

// Used by other other functions
exports.getSyncToken = async () => {
  console.log('###### getSyncToken started ######')
  // Used when generating any kind of tokens
  // To set up environmental variables, see http://twil.io/secure
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;
  const twilioSyncService = process.env.TWILIO_SYNC_SERVICE_SID;

  // Used specifically for creating Sync tokens
  const identity = 'SyncTokenUser';

  // Create a "grant" which enables a client to use Sync as a given user
  const syncGrant = new SyncGrant({
    serviceSid: twilioSyncService,
  });

  try {
  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    { identity: identity }
  );
  token.addGrant(syncGrant);

  // Serialize the token to a JWT string
  //console.log(token.toJwt());
  
  //response.setBody({ token: token.toJwt() });

    return { token: token.toJwt() }

  } catch (error) {   
    return error
  }
  
}