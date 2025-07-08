FROM node:alpine

WORKDIR /tmp
COPY . .

EXPOSE 7860

RUN apk update && apk upgrade &&\
    apk add --no-cache unzip zip wget curl git screen &&\
    chmod +x server.js &&\
    npm install

CMD ["npm", "start"]
