const path = Runtime.getFunctions()['response-header'].path;
const response = require(path).response();
const getTokenPath = Runtime.getFunctions()['getToken'].path;
const SyncClient = require('twilio-sync').Client;

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient()
  const CONVERSATIONS_WEBHOOK_URL = context.CONVERSATIONS_WEBHOOK_URL
  
  const syncToken = require(getTokenPath);
  const sync = await syncToken.getSyncToken();
  //console.log('####### syncToken ', sync.token)

  const syncClient = new SyncClient(sync.token);
  //console.log('####### token ', syncToken.token)


  const interactionSid = event.interactionSid
  const channelSid = event.channelSid
  const participantSid = event.participantSid
  const conversationSid = event.conversationSid
  const taskSid = event.taskSid
  const workflowSid = event.workflowSid
  const taskChannelUniqueName = event.taskChannelUniqueName
  const targetSid = event.targetSid
  const workerName = event.workerName
  const taskAttributes = event.taskAttributes

  try {
    // Remove the agent
    await client.flexApi.v1
      .interaction(interactionSid)
      .channels(channelSid)
      .participants(participantSid)
      .update({ status: 'closed' })
      .then(interaction_channel_participant =>
        console.log(interaction_channel_participant)
      )

    // Create the webhook and update conversation attributes
    await client.conversations
      .conversations(conversationSid)
      .webhooks.create({
        'configuration.method': 'POST',
        'configuration.filters': ['onMessageAdded'],
        'configuration.url': CONVERSATIONS_WEBHOOK_URL,
        target: 'webhook'
      })
      .then(async webhook => {
        const webhookSid = webhook.sid
        const attributes = {
          interactionSid,
          channelSid,
          participantSid,
          taskSid,
          workflowSid,
          taskChannelUniqueName,
          targetSid,
          workerName,
          taskAttributes,
          webhookSid
        }

        await client.conversations
          .conversations(conversationSid)
          .update({ attributes: `${JSON.stringify(attributes)}` })
          .then(conversation => {
            console.log('conversation attributes updated')
            console.log(conversation)
          })
      })

    // Open a Sync Map by unique name and update its data  
    await syncClient.map(workerName)
          .then(async (map) => {
            console.log('Successfully added/updated a map. SID:', map.sid);
            try {
              await map.set(conversationSid, { 
                  interactionSid : interactionSid,
                  flexInteractionChannelSid : channelSid,
                  participantSid : participantSid,
                  workflowSid : workflowSid,
                  taskChannelUniqueName : taskChannelUniqueName,
                  targetSid : targetSid,
                  taskAttributes : taskAttributes
                }, { ttl: 86400 });
 
            } catch (error) {
              console.error('#### Sync - add Map Item failed', error);
            }
            map.on('itemUpdated', (event) => {
              console.log('Received an "itemUpdated" event:', event);
          });
    })
    .catch((error) => {
      console.error('Unexpected error adding a MAP', error);
    });

    callback(null, response)
  } catch (error) {
    console.log(error)
    callback(error)
  }
}
