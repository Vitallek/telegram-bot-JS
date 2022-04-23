FROM node:16
VOLUME [ "/app/:/db" ]
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install 
COPY . .
EXPOSE 3000
CMD ["node", "main.js"]
