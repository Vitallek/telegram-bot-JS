import {Markup} from "telegraf";
import axios from "axios";
import {insertStat} from "../db_operations/dbController.js";
import dotenv from 'dotenv'
import {add_city} from "../db_operations/firebase_operations.js";
dotenv.config()
// API keys
const openWeatherToken = process.env.WEATHER_TOKEN
const geoapifyToken = process.env.GEOAPIFY_AUTO
const EMOJI = {
    "Clear": "\u2600\uFE0F",
    "Clouds": "\u2601\uFE0F",
    "Rain": "\u2614\uFE0F",
    "Drizzle": "\u2614\uFE0F",
    "Thunderstorm": "\u26A1\uFE0F",
    "Snow": "\uD83C\uDF28\uFE0F",
    "Mist": "\uD83C\uDF2B\uFE0F",
}
// OpenWeatherMap endpoint for get weather by coords
const weatherEndpoint = (lat,lon) => (
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${openWeatherToken}`
)
// GeoApify endpoint for get 5 cities by name with autocomplete
const cityNameEndpointAC = (city) => (
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(city)}&type=city&limit=5&apiKey=${geoapifyToken}`
)
// Template for weather response by name
const weatherByNameMD = (name, main, weather, wind, country) => (
    `*${name}, ${country}*

Погода в городе *${name}* сейчас: 
Облачность: *${weather.description}* ${EMOJI[weather.main]}
Температура: *${Math.round(main.temp)} °C*, ощущается как *${Math.round(main.feels_like)} °C*
Влажность: *${main.humidity} %*
Ветер: *${wind.speed} м/с*
`
);

export const weatherHandlerOffer = (bot,ctx) => {
    try{
        ctx.wizard.state.data = {};
        let axiosCityResponse = ctx.scene.state.axiosCityResponse
        let buttons = []
        axiosCityResponse.forEach((city, i) => {
            let cityName = city.properties.city
            if (typeof(city.properties.city) === 'undefined') {
                cityName = city.properties.suburb
                if (typeof(city.properties.suburb) === 'undefined') {
                    cityName = city.properties.county
                }
            }
            buttons.push([Markup.button.callback(
            `${i+1}. ${cityName}, ${city.properties.country}`,`${i}`)])
        })
        ctx.reply(
            'Я нашёл *несколько* городов, какой выбрать?', {
                reply_markup: {
                    inline_keyboard: buttons
                },
                parse_mode: 'Markdown',
                reply_to_message_id: `${ctx.update.message.message_id}`,
            }
        )
        ctx.wizard.state.data.msgToEdit = ctx.message.message_id
        return ctx.wizard.next();
    } catch (error){
        ctx.reply('Значит, в другой раз')
        return ctx.scene.leave()
    }
}
export const weatherHandlerAnswer = (bot,ctx) => {
    try{
        let index = ctx.update.callback_query.data
        let axiosCityResponse = ctx.scene.state.axiosCityResponse
        axios.get(weatherEndpoint(axiosCityResponse[index].properties.lat,axiosCityResponse[index].properties.lon)
        ).then((responseWeather) => {
            const {
                name,
                main,
                weather,
                wind,
                sys,
                id
            } = responseWeather.data;
            let cityName = axiosCityResponse[index].properties.city
            if (typeof(axiosCityResponse[index].properties.city) === 'undefined') {
                cityName = axiosCityResponse[index].properties.suburb
                if (typeof(axiosCityResponse[index].properties.suburb) === 'undefined') {
                    cityName = axiosCityResponse[index].properties.county
                }
            }
            add_city(id,cityName, sys.country)
            //insertStat(id, axiosCityResponse[index].properties.city, id)

            return ctx.editMessageText(
                weatherByNameMD(cityName, main, weather[0], wind, sys.country),{
                    reply_markup: {},
                    parse_mode: "Markdown",
                    disable_notification: 'true',
                })
        }, () => {
            bot.telegram.sendMessage(
                ctx.chat.id, `Не могу найти погоду для города *${city}*`, {
                    parse_mode: "Markdown",
                    disable_notification: 'true',
                }
            );
        })
        return ctx.scene.leave();
    } catch (error) {
        ctx.reply('Значит, в другой раз')
        return ctx.scene.leave()
    }
}

// Function that gets the weather by the city name with autocomplete
// query contains place_id from openweather and city_name from geoapify properties.city in both cases
export const getWeatherByCityNameAutocomplete = async (bot,ctx, city) => {
    try{
        let axiosCityResponse = await axios.get(cityNameEndpointAC(city)).then((responseCities) => {
            if (typeof responseCities.data.features[0] === 'undefined') throw ('Empty response to ' + ctx.from.id + ' ' + ctx.from.first_name)
            const {
                city,
                country_code,
                lon,
                lat,
                place_id
            } = responseCities.data.features
            return responseCities.data.features
        }, () => {
            throw ('Empty response to ' + ctx.from.id + ' ' + ctx.from.username)
        })
        if (typeof axiosCityResponse[1] !== 'undefined'){
            await ctx.scene.enter('multipleCitiesWeatherWizard',{
                axiosCityResponse:  axiosCityResponse,
            })
        } else {
            axios.get(weatherEndpoint(axiosCityResponse[0].properties.lat,axiosCityResponse[0].properties.lon)
            ).then((responseWeather) => {
                const {
                    name,
                    main,
                    weather,
                    wind,
                    sys,
                    id
                } = responseWeather.data;
                let cityName = axiosCityResponse[0].properties.city
                if (typeof(axiosCityResponse[0].properties.city) === 'undefined') {
                    cityName = axiosCityResponse[0].properties.suburb
                    if (typeof(axiosCityResponse[0].properties.suburb) === 'undefined') {
                        cityName = axiosCityResponse[0].properties.county
                    }
                }
                add_city(id,cityName, sys.country)
                //insertStat(id, cityName, id)
                bot.telegram.sendMessage(
                    ctx.chat.id,
                    weatherByNameMD(city, main, weather[0], wind, sys.country), {
                        parse_mode: "Markdown",
                        disable_notification: 'true',
                        reply_to_message_id: `${ctx.update.message.message_id}`,
                    }
                )
            }, () => {
                bot.telegram.sendMessage(
                    ctx.chat.id, `Не могу найти погоду для города *${city}*`, {
                        parse_mode: "Markdown",
                        disable_notification: 'true',
                    }
                );
            })
        }

        console.log(`${Date.now()}` + ' '
            + ctx.from.id + ' '
            + `${encodeURIComponent(ctx.from.first_name)}`
            + ' запросил погоду в городе '
            + axiosCityResponse[0].properties.city)

    } catch (error) {
        console.log(error)
        await bot.telegram.sendMessage(
            ctx.chat.id, `Такого города не существует`, {
                parse_mode: "Markdown",
                disable_notification: 'true',
            }
        )
    }
}
