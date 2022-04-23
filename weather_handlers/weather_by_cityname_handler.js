// Function that gets the weather by the city name
// query contains place_id and city_name from openweather
import axios from "axios";
import {insertStat} from "../db_operations/dbController.js";
import {add_city} from "../db_operations/firebase_operations.js";
import dotenv from 'dotenv'
dotenv.config()
// API keys
const openWeatherToken = process.env.WEATHER_TOKEN
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
// OpenWeatherMap endpoint for get city by name
const cityNameEndpoint = (city) => (
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${openWeatherToken}`
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

export const getWeatherByCityName = async (bot,ctx, city) => {
    try{
        let axiosCityResponse = await axios.get(cityNameEndpoint(city)).then((responseCity) => {
            if (typeof responseCity.data[0] === 'undefined') throw ('Empty response to ' + ctx.from.id + ' ' + ctx.from.first_name)
            const {
                name,
                local_names,
                lat,
                lon,
                country,
                state,
            } = responseCity.data[0]
            return responseCity.data[0]
        }, () => {
            throw ('Empty response to ' + ctx.from.id + ' ' + ctx.from.username)
        })

        axios.get(weatherEndpoint(axiosCityResponse.lat,axiosCityResponse.lon))
            .then((responseWeather) => {
                const {
                    name,
                    main,
                    weather,
                    wind,
                    sys,
                    id
                } = responseWeather.data;
                add_city(id,axiosCityResponse.name, sys.country)
                //insertStat(id, axiosCityResponse.name, id)
                bot.telegram.sendMessage(
                    ctx.chat.id,
                    weatherByNameMD(city, main, weather[0], wind, sys.country), {
                        parse_mode: "Markdown",
                        disable_notification: 'true',
                        reply_to_message_id: `${ctx.update.message.message_id}`,
                    }
                );
            }, () => {
                bot.telegram.sendMessage(
                    ctx.chat.id, `Не могу найти погоду для города *${city}*`, {
                        parse_mode: "Markdown",
                        disable_notification: 'true',
                    }
                );
            })
        console.log(`${Date.now()}` + ' '
            + ctx.from.id + ' '
            + `${encodeURIComponent(ctx.from.first_name)}`
            + ' запросил погоду в городе '
            + axiosCityResponse.name)

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