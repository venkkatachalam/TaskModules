// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// import * as builder from "botbuilder";
// import * as msteams from "botbuilder-teams";
const { ActivityTypes,CardFactory,AttachmentLayoutTypes } = require('botbuilder');
const { QnAMaker } = require('botbuilder-ai');
const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog,
    ConfirmPrompt
} = require('botbuilder-dialogs');
const { UserProfile } = require('./userProfile');

const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UserProfileDialog extends ComponentDialog {
    constructor(userState, logger) {

        super('userProfileDialog');

        try {
            this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAAuthKey,
                host: process.env.QnAEndpointHostName
            });
        } catch (err) {
            logger.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.logger = logger;

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.AskorSearchStep.bind(this),
            this.textStep.bind(this),
            // this.textConfirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async AskorSearchStep(step) {
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Choose your option wisely!',
            choices: ChoiceFactory.toChoices(['Ask', 'Search'])
        });
    }

    async textStep(step) {
        step.values.Qtype = step.result.value;
        return await step.prompt(NAME_PROMPT, `What do you want to ${step.result.value} for?`);
    }
    async textConfirmStep(step) {
        step.values.Ques = step.result;

        // We can send messages to the user at any point in the WaterfallStep.
        await step.context.sendActivity(`Please wait while we search for ${ step.result }.`);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CONFIRM_PROMPT, 'Confirm?', ['yes', 'no']);
    }

    

    async onInvoke(event, cb){
      let invokeType = (event).name;
      let invokeValue = (event).value;
      if (invokeType === undefined) {
          invokeType = null;
      }
      switch (invokeType) {
          case "task/fetch": {
              if (invokeValue !== undefined && invokeValue.data.taskModule === "customform") { // for Technical Preview, was invokeValue.taskModule
                  // Return the specified task module response to the bot
                  let fetchTemplate = {
                    "task": {
                      "type": "continue",
                      "value": {
                          "title": "Custom Form",
                          "height": 510,
                          "width": 430,
                          "fallbackUrl": "https://contoso.com/teamsapp/customform",
                          "url": "https://contoso.com/teamsapp/customform",
                      },
                  }
                }
                  cb(null, fetchTemplate, 200);
              };
              if (invokeValue !== undefined && invokeValue.data.taskModule === "adaptivecard") { // for Technical Preview, was invokeValue.taskModule
                  let adaptiveCard = {
                      "type": "AdaptiveCard",
                      "body": [
                          {
                              "type": "TextBlock",
                              "text": "Here is a ninja cat:"
                          },
                          {
                              "type": "Image",
                              "url": "http://adaptivecards.io/content/cats/1.png",
                              "size": "Medium"
                          }
                      ],
                      "version": "1.0"
                  };
                  // Return the specified task module response to the bot
                  let fetchTemplate= {
                    "task": {
                      "type": "continue",
                      "value": {
                          "title": "Ninja Cat",
                          "height": "small",
                          "width": "small",
                          "card": {
                              contentType: "application/vnd.microsoft.card.adaptive",
                              content: adaptiveCard,
                          }
                      }
                    }
                  }
                  cb(null, fetchTemplate, 200);
              };
              break;
          }
          case "task/submit": {
              if (invokeValue.data !== undefined) {
                  // It's a valid task module response
                  let submitResponse= {
                    "task": {
                      "type": "message",
                      "value": "Task complete!",
                  }
                }
                  cb(null, fetchTemplates.submitMessageResponse, 200)
              }
          }
      }
  }

    createHeroCard() {
        
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
              {
                "type": "TextBlock",
                "text": "Publish Adaptive Card schema",
                "weight": "bolder",
                "size": "medium"
              },
              {
                "type": "TextBlock",
                "text": "Now that we have defined the main rules and features of the format, we need to produce a schema and publish it to GitHub. The schema will be the starting point of our reference documentation.",
                "wrap": true
              },
            ],
            
            "actions": [
              {
                  
                      "type": "Action.Submit",
                      "id": "btnBuy",
                      "title": "Buy",
                      "data": {
                    
                        "msteams": {
                          "type": "task/fetch"
                        }
                      }
                    
              }
            ]
        
            
          });
    }

    getInternetAttachment() {
        // NOTE: The contentUrl must be HTTPS.
        return {
            name: 'sample.pdf',
            contentType: 'doc/pdf',
            contentUrl: 'http://www.africau.edu/images/default/sample.pdf'
        };
    }

    async summaryStep(step) {
        if (step.result) {
            step.values.Ques = step.result;
            // Get the current profile object from user state.
            const userProfile = await this.userProfile.get(step.context, new UserProfile());

            userProfile.Qtype = step.values.Qtype;
            userProfile.Ques = step.values.Ques;
           
            await step.context.sendActivity(
            {
              attachments: [
        
                  this.createHeroCard(),
                  this.createHeroCard()
        
              ],
              attachmentLayout: AttachmentLayoutTypes.Carousel
            });
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog, here it is the end.
        return await step.endDialog();
    }
}

module.exports.UserProfileDialog = UserProfileDialog;
