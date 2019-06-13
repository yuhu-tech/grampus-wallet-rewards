FROM node:10-alpine as builder
MAINTAINER in_vane <in_vane@yuhu.tech>

ENV PATH=$PATH:/app/node_modules/.bin

WORKDIR /app

RUN mkdir -p /app

COPY package.json yarn.lock /tmp/

RUN cd /tmp && mkdir -p node_modules \
    && yarn install --pure-lockfile --prefer-offline \
    && mv node_modules dev_node_modules \
    && NODE_ENV=production yarn install --pure-lockfile --prod --prefer-offline \
    && mv node_modules prod_node_modules \
    && mv dev_node_modules node_modules

COPY . /app
RUN cd /app && ln -fs /tmp/node_modules && yarn build

FROM node:10-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN yarn global add serve
RUN mkdir -p /app/build

COPY --from=builder /app/build /app/build

EXPOSE 3006

CMD ["serve", "-s", "build"]
