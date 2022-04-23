import {Telegraf, Markup, session, Scenes} from 'telegraf'
const Stage = Scenes.Stage
const WizardScene = Scenes.WizardScene
import dotenv from 'dotenv'

import {kb} from './tictactoe_handler/inline_keyboard.js'
import {getStat, clearStat} from "./db_operations/firebase_operations.js";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
dotenv.config()

//db controller
import {deleteStat, insertStat, showStat} from './db_operations/dbController.js'

import {weatherHandlerOffer} from "./weather_handlers/weather_autocomplete_handler.js";
import {weatherHandlerAnswer} from "./weather_handlers/weather_autocomplete_handler.js";

const multipleCitiesWeatherWizard = new WizardScene(
    'multipleCitiesWeatherWizard', ctx => weatherHandlerOffer(bot,ctx),
    ctx => weatherHandlerAnswer(bot,ctx)
);

import {tttHandler, getPlayingState, getDrawCounter, setPlayingState, setDrawCounter} from "./tictactoe_handler/ttt_handler.js";

const tttWizard = new WizardScene(
    'tttWizard',
    ctx => {
        try{
            console.log('game is started')
            // const chatId = ctx.update.message.chat.id
            const text = 'You are in Tic Tac Toe game mode. \nTo exit write \'Exit\' or \'Cancel\'\n\nPlayer 1 play the button under this message:';
            // create initial keyboard layout that says "First player"
            const requestKBbuttons = JSON.parse(kb('first_player'))
            console.log(requestKBbuttons)
            ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: [
                        requestKBbuttons
                    ]
                },
                parse_mode: 'Markdown'
            })


        } catch (error){
            console.log(error)
            ctx.reply('Значит, в другой раз')
            return ctx.scene.leave()
        }
    }
);

import {getWeatherByCoords} from "./weather_handlers/weather_by_coord_handler.js";
import {getWeatherByCityName} from "./weather_handlers/weather_by_cityname_handler.js";
import {getWeatherByCityNameAutocomplete} from "./weather_handlers/weather_autocomplete_handler.js";

const stage = new Stage([multipleCitiesWeatherWizard, tttWizard])
multipleCitiesWeatherWizard.hears(['Exit','Cancel','exit','cancel'], ctx => {
    ctx.reply('Значит, в другой раз')
    return ctx.scene.leave('multipleCitiesWeatherWizard')
})
tttWizard.hears(['Exit','Cancel','exit','cancel'], ctx => {
    ctx.reply('Значит, в другой раз')
    return ctx.scene.leave('tttWizard')
})
stage.on('callback_query',  ctx => {
        try{
            if(!getPlayingState()) return weatherHandlerAnswer(bot,ctx)
            return tttHandler(ctx)
        } catch (error){
            setDrawCounter(0)
            setPlayingState(!getPlayingState())
            console.log(error)
            return ctx.editMessageText('Incorrect callback response')
        }
    }
)

const bot = new Telegraf(process.env.BOT_TOKEN,)
bot.use(session(), stage.middleware());
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username
})

bot.command('/send', async ctx => {
    try{
        if(ctx.from.id === 404598770){
            const id = ctx.update.message.text.split(' ')[1]
            const message = ctx.update.message.text.substring(7 + id.length)
            console.log('sending ' + message + ' to chat ' + id)
            await bot.telegram.sendMessage(id, message, {
                parse_mode: "Markdown"})
        } else {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Ваша роль должна быть *Главный читер* или выше, чтобы использовать эту команду`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        }
    } catch (error){
        console.log(error)
    }
})
bot.command(['/start', '/help'], async ctx => {
    //console.log(ctx.from)
    await bot.telegram.sendMessage(ctx.chat.id,
        `Привет, меня зовут *Veather*.
Я - метеобот, который может помочь тебе узнать погоду в любой точке мира.
Вот что я умею:

/loc - получить прогноз погоды по *местоположению*
/w {название города} - получить прогноз погоды по названию города с функцией *автодополнения*
/weather {название города} - получить прогноз погоды по *точному названию* города
/stat - узнать статистику запросов по городам
/help - вызвать список команд`, {
            parse_mode: 'Markdown',
            disable_notification: 'true',
        })
})
bot.hears(['ctx', 'Ctx'], async(ctx) => {
    try{
        if(ctx.from.id === 404598770){
            //console.log(ctx)
            await bot.telegram.sendMessage(ctx.message.chat.id,
                `${JSON.stringify(ctx.update)}\n\n${JSON.stringify(ctx.update.message)}`, {
                disable_notification: 'true',
            })
        } else {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Ваша роль должна быть *Главный читер* или выше, чтобы использовать эту команду`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        }
    } catch (error) {
        console.log(error)
    }
})
bot.hears(['/clearstat', 'Clearstat','clearstat'], async(ctx) => {
    try{
        if(ctx.from.id === 404598770){
            clearStat().then(() => {
            }, error => {
                console.log(error)
                bot.telegram.sendMessage(ctx.message.chat.id, `Ошибка при удалении статистики`, {
                    parse_mode: 'Markdown',
                    disable_notification: 'true',
                })
            })
            bot.telegram.sendMessage(ctx.message.chat.id,
                `Статистика удалена`, {
                    disable_notification: 'true',
                })
        } else {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Ваша роль должна быть *Главный читер* или выше, чтобы использовать эту команду`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        }
    } catch (error) {
        console.log(error)
    }
})
bot.hears(['ctxcid', 'Ctxcid'], async(ctx) => {
    try{
        if(ctx.from.id === 404598770){
            //console.log(ctx)
            await bot.telegram.sendMessage(ctx.message.chat.id, `${JSON.stringify(ctx.update.message.chat.id)}`, {
                disable_notification: 'true',
            })
        } else {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Ваша роль должна быть *Главный читер* или выше, чтобы использовать эту команду`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        }
    } catch (error) {
        console.log(error)
    }
})
bot.on('sticker', async(ctx) =>{
    try{
        if(ctx.from.id === 404598770){
            console.log(ctx.update.message.sticker.file_id)
            await bot.telegram.sendMessage(ctx.message.chat.id, `${ctx.update.message.sticker.file_id}`, {
                parse_mode: "Markdown",
                disable_notification: 'true',
            })
        }
    } catch (error) {
        console.log(error)
    }
})
bot.hears(['бах', '/бах' , 'Бах', '/bax'], async ctx => {
    try{
        if(ctx.from.id === 404598770){
            let randomVar = Math.round(Math.random() * 10)
            if(randomVar > 4){
                console.log(`got shot by ${ctx.from.id} ${ctx.from.username}`)
                await ctx.replyWithVoice({
                    source: `./voices/get_maslina.ogg`,
                    disable_notification: 'true',
                })
            } else {
                console.log(`dodged shot by ${ctx.from.id} ${ctx.from.username}`)
                await ctx.reply(`Не попал`, {
                    disable_notification: 'true',
                })
            }
        }
        
    } catch (error){
        console.log(error)
    }
})
bot.hears(['Привет','привет'], async(ctx) =>{
    //console.log(ctx.from)
    await bot.telegram.sendMessage(ctx.message.chat.id, '*Здарова*', {
        parse_mode: "Markdown",
        disable_notification: 'true',
    })
})
bot.hears(['Харош','харош','Харош?'], async(ctx) =>{
    //console.log(ctx.from)
    await bot.telegram.sendSticker(ctx.message.chat.id, 'CAACAgIAAxkBAAICnGJHL-CjIvlvIbDuTwgpyrO7vxFDAAKiDwACIVD4SF2L5ep3b5-EIwQ', {
        disable_notification: 'true',
    })
})

bot.command(['/vloc', '/vlocation'], async (ctx) => {
    try{
        await ctx.reply(
            'Чтобы узнать погоду, мне нужны координаты',
            Markup.keyboard([
                Markup.button.locationRequest('Отправить местоположение'),
                Markup.button.text('Cancel')
            ]).resize().oneTime()
        )
    } catch (error){
        await ctx.reply('Данная функция недоступна в групповых чатах, но координаты можно отправить через *вложения*',{
            parse_mode: 'markdown',
            disable_notification: 'true',
        })
    }
})
bot.on('location', async(ctx) =>{
    try{
        console.log(ctx.update.message.location)
        await getWeatherByCoords(bot,ctx, ctx.update.message.location.latitude, ctx.update.message.location.longitude).then((axiosResponseCity)=>{

        }, error => {
            console.log(error)
        })
    } catch (error) {
        console.log(error)
    }
})
bot.command(['/vweather'], async(ctx) => {
    try{
        const city = ctx.update.message.text.split(' ')[1]
        if (typeof city === 'undefined'){
            await bot.telegram.sendMessage(ctx.chat.id,
                `Введённый город не был опознан`,{
                    parse_mode: 'Markdown',
                    disable_notification: 'true',
                })
            return
        }
        await getWeatherByCityName(bot,ctx, city).then((axiosResponseCity)=>{

        }, error => {
            console.log(error)

        })
    } catch(error){
        console.log(error)
        await bot.telegram.sendMessage( ctx.chat.id, `Неправильный ввод команды`, {
            parse_mode: 'Markdown',
            disable_notification: 'true',
        })
    }
});
bot.command(['/vw'], async(ctx) => {
    try{
        const city = ctx.update.message.text.split(' ')[1]
        if (typeof city === 'undefined'){
            await bot.telegram.sendMessage(ctx.chat.id,
                `Введённый город не был опознан`,{
                    parse_mode: 'markdown',
                    disable_notification: 'true',
                })
            return
        }
        await getWeatherByCityNameAutocomplete(bot,ctx, city).then((axiosResponseCity)=>{

        }, error => {
            console.log(error)
        })
    } catch(error){
        console.log(error)
        await bot.telegram.sendMessage( ctx.chat.id, `Неправильный ввод команды`)
    }
});

bot.command(['/vplayttt'], async(ctx) => {
    try{
        setPlayingState(true)
        await ctx.scene.enter('tttWizard',{
        })
    } catch(error){
        console.log(error)
        await bot.telegram.sendMessage( ctx.chat.id, `Неправильный ввод команды`)
    }
});

bot.command(['/vstat','/vstatistics'], async ctx => {
    try{
        let dbStatfb = await getStat().then(response => {
            let labels = []
            let requestValues = []
            response.forEach((city_id) => {
                labels.push(`${city_id.val().city}`)
                requestValues.push(`${city_id.val().queries}`)
            })
            labels.reverse()
            requestValues.reverse()
            const width = 512; //px
            const height = 512; //px
            const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});

            (async () => {
                const configuration = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: "Частота запросов по городам",
                                data: requestValues,
                                backgroundColor: [
                                    'rgba(255, 0, 0, 0.2)',
                                    'rgba(252, 68, 68, 0.2)',
                                    'rgba(252, 100, 4, 0.2)',
                                    'rgba(252, 212, 68, 0.2)',
                                    'rgba(140, 196, 60, 0.2)',
                                    'rgba(2, 150, 88, 0.2)',
                                    'rgba(26, 188, 156, 0.2)',
                                    'rgba(91, 192, 222, 0.2)',
                                    'rgba(100, 84, 172, 0.2)',
                                    'rgba(252, 140, 132, 0.2)'
                                ],
                                borderColor: [
                                    'rgb(255, 0, 0)',
                                    'rgb(252, 68, 68)',
                                    'rgb(252, 100, 4)',
                                    'rgb(252, 212, 68)',
                                    'rgb(140, 196, 60)',
                                    'rgb(2, 150, 88)',
                                    'rgb(26, 188, 156)',
                                    'rgb(91, 192, 222)',
                                    'rgb(100, 84, 172)',
                                    'rgb(252, 140, 132)'
                                ],
                                borderWidth: 1
                            },
                        ]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    },
                }
                const image = await chartJSNodeCanvas.renderToBuffer(configuration)
                // const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
                // const stream = await chartJSNodeCanvas.renderToStream(configuration);
                await bot.telegram.sendPhoto(ctx.chat.id, {source: Buffer.from(image, 'base64')})
            })()
        })

        // let dbStat = await showStat().then(response => {
        //     let labels = []
        //     let requestValues = []
        //     response.forEach((city) => {
        //         labels.push(`${city.City}`)
        //         requestValues.push(`${city.RequestAmount}`)
        //     })
        //     const width = 400; //px
        //     const height = 400; //px
        //     const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
        //     const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});
        //
        //     (async () => {
        //         const configuration = {
        //             type: 'bar',
        //             data: {
        //                 labels: labels,
        //                 datasets: [
        //                     {
        //                         label: "Частота запросов по городам",
        //                         data: requestValues,
        //                         backgroundColor: [
        //                             'rgba(255, 0, 0, 0.2)',
        //                             'rgba(252, 68, 68, 0.2)',
        //                             'rgba(252, 100, 4, 0.2)',
        //                             'rgba(252, 212, 68, 0.2)',
        //                             'rgba(140, 196, 60, 0.2)',
        //                             'rgba(2, 150, 88, 0.2)',
        //                             'rgba(26, 188, 156, 0.2)',
        //                             'rgba(91, 192, 222, 0.2)',
        //                             'rgba(100, 84, 172, 0.2)',
        //                             'rgba(252, 140, 132, 0.2)'
        //                         ],
        //                         borderColor: [
        //                             'rgb(255, 0, 0)',
        //                             'rgb(252, 68, 68)',
        //                             'rgb(252, 100, 4)',
        //                             'rgb(252, 212, 68)',
        //                             'rgb(140, 196, 60)',
        //                             'rgb(2, 150, 88)',
        //                             'rgb(26, 188, 156)',
        //                             'rgb(91, 192, 222)',
        //                             'rgb(100, 84, 172)',
        //                             'rgb(252, 140, 132)'
        //                         ],
        //                         borderWidth: 1
        //                     },
        //                 ]
        //             },
        //             options: {
        //                 scales: {
        //                     y: {
        //                         beginAtZero: true
        //                     }
        //                 }
        //             },
        //         }
        //         const image = await chartJSNodeCanvas.renderToBuffer(configuration)
        //         // const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
        //         // const stream = await chartJSNodeCanvas.renderToStream(configuration);
        //         await bot.telegram.sendPhoto(ctx.chat.id, {source: Buffer.from(image, 'base64')})
        //     })()
        // })
    } catch (error){
        console.log(error)
    }
})

bot.hears('/test', async ctx => {
    try{
        if(ctx.from.id === 404598770) {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Привет, *Главный читер*`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        } else {
            await bot.telegram.sendMessage(ctx.message.chat.id, `Ваша роль должна быть *Главный читер* или выше, чтобы использовать эту команду`, {
                parse_mode: 'Markdown',
                disable_notification: 'true',
            })
        }
    } catch (error){
        console.log(error)
    }
})

bot.launch()