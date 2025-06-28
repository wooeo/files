FROM node:alpine

WORKDIR /app

COPY . .

EXPOSE 9999

RUN apk update && apk upgrade &&\
    apk add --no-cache unzip zip wget curl git screen &&\
    chmod +x server.js &&\
    npm install

CMD ["npm", "start"]
