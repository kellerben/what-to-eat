FROM node:15.0-alpine

WORKDIR /usr/local/share/lunch-api

COPY package.json ./

RUN npm install && npm install pm2 -g

COPY . ./

EXPOSE 8080

CMD [ "pm2-runtime", "index.js" ]
