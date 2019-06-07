// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, ActivityTypes, MessageFactory } = require('botbuilder');

// const { microsoftTeams } = require('@microsoft/teams-js');
// const choiceProp = 'choiceProp';

class EchoBot extends ActivityHandler {
    /**
     *
     * @param {UserState} User state to persist boolean flag to indicate
     *                    if the bot had already welcomed the user
     */
    constructor(userState,conversationState,dialog,logger) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        if (!logger) {
            logger = console;
            logger.log('[DialogBot]: logger not passed in, defaulting to console');
        }
        // this.choiceProp = userState.createProperty(choiceProp);

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.logger = logger;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // console.log(context)
            // console.log('Message', context._activity.value)
            this.logger.log('Running dialog with Message Activity.');
    
            await this.dialog.run(context, this.dialogState);
            //console.log("hai");
            
            await next();
        });

        // this.on('task/fetch', async(event, next) => {
        //     console.log('invoke handler', event)
        //     await next();
        // })

        this.onUnrecognizedActivityType(async (context, next) => {

            // console.log(context.activity)
            if (context.activity.type === ActivityTypes.Invoke) {
                await context.sendActivity("hai");
            }
            await next();
            let invokeType = context.activity.name;
            let invokeValue = context.activity.value;
            if (invokeType === undefined) {
                invokeType = null;
            }
            // console.log(context)
           // console.log(context.activity)

           // console.log(invokeType)
            //console.log(invokeValue)
            //console.log((invokeValue !== undefined && invokeValue.data.taskModule === 'customform'))
            
            switch (invokeType) {
            case 'task/fetch': {
                if (invokeValue !== undefined && invokeValue.data.taskModule === 'customform') { // for Technical Preview, was invokeValue.taskModule
                    // Return the specified task module response to the bot
                    console.log("******************INSIDE**************")
                    let fetchTemplate={

                        'task': {
                            'type': 'continue',
                            'value': {
                                'title': 'Custom Form',
                                'height': 510,
                                'width': 430,
                                'fallbackUrl': 'https://www.pexels.com/',
                                'url': 'https://www.pexels.com/'
                            },
                        }
                    }
                    
                    await next(null,fetchTemplate, 200);
                    console.log("******************OUT**************")
                    
                };
                if (invokeValue !== undefined && invokeValue.data.taskModule === 'adaptivecard') { // for Technical Preview, was invokeValue.taskModule
                    let adaptiveCard = {
                        'type': 'AdaptiveCard',
                        'body': [
                            {
                                'type': 'TextBlock',
                                'text': 'Here is a ninja cat:'
                            },
                            {
                                'type': 'Image',
                                'url': 'http://adaptivecards.io/content/cats/1.png',
                                'size': 'Medium'
                            }
                        ],
                        'version': '1.0'
                    };
                        // Return the specified task module response to the bot
                    let fetchTemplate = {

                        'task': {
                            'type': 'continue',
                            'value': {
                                'title': 'Ninja Cat',
                                'height': 'small',
                                'width': 'small',
                                'card': {
                                    contentType: 'application/vnd.microsoft.card.adaptive',
                                    content: adaptiveCard,
                                }
                            },
                        }
                    }
                    await next(null, fetchTemplate, 200);
                }
                break;
            }
            case 'task/submit': {
                console.log("********************************Helloo******************************************")
                if (invokeValue.data !== undefined) {
                    // It's a valid task module response
                    let submitResponse = {
                        'task': {
                            'type': 'message',
                            'value': 'Task complete!',
                        }
                    }
                    await next(null, fetchTemplates.submitMessageResponse, 200);
                }
            }
            }

        })

        // if (context.activity.type === ActivityTypes.Invoke) {
        //     await this.dialog.run(context, this.dialogState);
        //     console.log("*******************")
        //     console.log(context.activity.name)
        //     console.log("*******************")
        //     console.log(context.activity.value.data)
            
        // }
        //await next();

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {

            const membersAdded = context.activity.membersAdded;
            // console.log(context.activity);
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                // console.log(membersAdded[cnt].id);
                // console.log(context.activity.recipient.id);
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    // await this.dialog.run(context, this.dialogState);
                    
                }
            }
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
