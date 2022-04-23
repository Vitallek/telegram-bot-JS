import {Markup} from "telegraf";

export const kb = (mode, data) => {
    if (mode === 'first_player') {
        return JSON.stringify([Markup.button.callback('Player 1, press me!','first_player')])
    } else if (mode === 'second_player') {
        return JSON.stringify([Markup.button.callback('Player 2, press me!','second_player')])
    } else if (mode === 'gamestart') {
        return JSON.stringify([
                [
                    Markup.button.callback(' ','0'),
                    Markup.button.callback(' ','1'),
                    Markup.button.callback(' ','2'),
                ],
                [
                    Markup.button.callback(' ','3'),
                    Markup.button.callback(' ','4'),
                    Markup.button.callback(' ','5'),
                ],
                [
                    Markup.button.callback(' ','6'),
                    Markup.button.callback(' ','7'),
                    Markup.button.callback(' ','8'),
                ]
            ]
        )
    } else {
        return JSON.stringify([
                [
                    Markup.button.callback(`${data[0]}`,'0'),
                    Markup.button.callback(`${data[1]}`,'1'),
                    Markup.button.callback(`${data[2]}`,'2'),
                ],
                [
                    Markup.button.callback(`${data[3]}`,'3'),
                    Markup.button.callback(`${data[4]}`,'4'),
                    Markup.button.callback(`${data[5]}`,'5'),
                ],
                [
                    Markup.button.callback(`${data[6]}`,'6'),
                    Markup.button.callback(`${data[7]}`,'7'),
                    Markup.button.callback(`${data[8]}`,'8'),
                ]
            ]
        );
    }
}