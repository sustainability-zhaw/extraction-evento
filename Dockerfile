FROM node:24-slim

ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

COPY src/ ./src/
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

CMD ["node", "src/index.js"]
