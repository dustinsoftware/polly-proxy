FROM node:10 AS build

COPY package.json .

RUN yarn --frozen-lockfile

COPY . .
RUN yarn build
RUN timeout 30 yarn test:ci

FROM node:10-slim
COPY --from=build dist/ dist/

ENTRYPOINT node ./dist/server-start.js
