import {kb} from "./inline_keyboard.js";
import {checker} from "./combination_checker.js";

const TTT_EMOJI = {
    "Cross": "\u274C",
    "Zero": "\u2B55",
    "Empty": "\u2B1C",
}
var isPlayingTTT = false
var drawCounter = 0
const currentGames = new Map();

const updateMoves = (layout, cell, player) => {
    drawCounter++
    if (player === '1') {
        layout[cell] = 'X';
        return layout;
    } else {
        layout[cell] = '0';
        return layout;
    }
}
export const tttHandler = (ctx) => {

    console.log("got callback")
    console.log(ctx.update.callback_query)
    const chatID = ctx.update.callback_query.message.chat.id
    const msgID = ctx.update.callback_query.message.message_id
    // building the key for our currentGames map:
    // as the combo of chat id and message id will be
    // the unique combination to identify a certain game
    const key = chatID + ',' + msgID;

    // if it's the first stage when the first player has been picked
    if (ctx.update.callback_query.data === 'first_player') {
        console.log("from first player")
        /* initialData will be the value for the key in curretGames.
         * It's a JSON object that contains all the data we need to
         * store about a particular game.
         * p1 & p2 lets are arrays with names and ids of players;
         * layout contains an array that represents the state of the
         * game field; The let turn contains info about which player's turn
         * it is at the moment.
         */
        let initialData = JSON.stringify({
            p1: [ctx.update.callback_query.from.id,
                ctx.update.callback_query.from.first_name,
            ],
            p2: [],
            layout: [],
            turn: ' ',
            date: ' '
        });
        currentGames.set(key, initialData);
        let text = `Okay, got it. P1 is ${ctx.update.callback_query.from.first_name}\nNow, player 2 hit the button!`
        // create keyboard layout that says "Second player"
        let keyboard = JSON.parse(kb('second_player'));
        // build a json object for the method "editMessageText"
        let data = {message_id: msgID,
            chat_id: chatID,
            reply_markup: {
                inline_keyboard: [
                    keyboard
                ]
            }};
        // this one edits the game message
        return ctx.editMessageText(text, data);
    }

    // if it's the second stage when the 2nd player has been picked
    if (ctx.update.callback_query.data === 'second_player') {
        console.log("from second player")
        // extract the value from currentGames
        let json = JSON.parse(currentGames.get(key));
        // update the JSON object the value contains
        json.p2 = [ctx.update.callback_query.from.id,
            ctx.update.callback_query.from.first_name,
        ];
        json.layout = [' ',' ',' ',' ',' ',' ',' ',' ',' ',];
        json.turn = [json.p1[0], json.p1[1]];
        json.date = new Date();
        // save updated data
        currentGames.set(key, JSON.stringify(json));

        let text = json.p1[1] + ' vs. ' + json.p2[1] +
            '! Let the battle begin!\n' +
            'It\'s ' + json.turn[1] + '\'s turn';
        // Create 3 by 3 empty gaming field (aka inline keyboard)
        let keyboard = kb('gamestart')
        let idKBoard = {message_id: msgID,
            chat_id: chatID,
            reply_markup: {
                inline_keyboard: JSON.parse(keyboard)
            }}

        return ctx.editMessageText(text, idKBoard);
    }

    // At this point the game initialization is over

    // check if key exists not to let other chat members intrude
    if (currentGames.get(key) === undefined) {
        return;
    }

    // extract json value from the currentGames map
    let json = JSON.parse(currentGames.get(key));

    // check if the player hits a button in the right turn
    if (json.turn[0] !== ctx.update.callback_query.from.id) {
        return;
    }

    // update turn data
    let currentPlayer = '';
    let nextPlayer = [];
    if (json.turn[0] === json.p1[0]) {
        currentPlayer = '1';
        nextPlayer = json.p2;
    } else {
        currentPlayer = '2';
        nextPlayer = json.p1;
    }

    let updatedLayout;
    // check if players hit availiable cells
    if (json.layout[ctx.update.callback_query.data] === ' ') {
        // if the cell has no X nor 0 we update the layout data
        updatedLayout = updateMoves(json.layout, ctx.update.callback_query.data, currentPlayer);
    } else {
        // frown
        return;
    }

    // update JSON object with game data
    json.layout = updatedLayout;

    // check if there's a win or draw combination
    if(drawCounter > 8){
        drawCounter = 0
        let idKBoard = {message_id: msgID,
            chat_id: chatID};

        // show a win message
        ctx.editMessageText('It\'s a draw!');
        isPlayingTTT = !isPlayingTTT
        return ctx.scene.leave();
    }
    if (checker(json.layout)) {
        drawCounter = 0
        let idKBoard = {message_id: msgID,
            chat_id: chatID};

        // show a win message
        ctx.editMessageText(json.turn[1] + ' wins!', idKBoard);
        isPlayingTTT = !isPlayingTTT
        return ctx.scene.leave();
    } else {
        console.log('I checked. No win');
    }

    // update turn and date in the json object
    json.turn = nextPlayer;
    json.date = new Date();
    // save updated data
    currentGames.set(key, JSON.stringify(json));

    // update layout with new game data
    let keyboard = kb('', updatedLayout);
    let idKBoard = {message_id: msgID,
        chat_id: chatID,
        reply_markup: {
            inline_keyboard: JSON.parse(keyboard)
        }};

    let text = json.turn[1] + '\'s turn!';
    // update the message
    return ctx.editMessageText(text, idKBoard);
}

export const getPlayingState = () => {
    return isPlayingTTT
}
export const setPlayingState = (isPlaying) => {
    isPlayingTTT = isPlaying
}
export const getDrawCounter = () => {
    return drawCounter
}
export const setDrawCounter = (counter) => {
    drawCounter = counter
}