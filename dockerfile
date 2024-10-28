FROM node:20-alpine
LABEL author="etik"

WORKDIR /app


COPY package.json yarn.lock ./
RUN  yarn install \
     && yarn cache clean

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]