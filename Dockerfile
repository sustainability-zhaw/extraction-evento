FROM node:24-slim

WORKDIR /app

COPY src/ ./src/
COPY package.json package-lock.json LICENSE ./

RUN npm ci

CMD ["node", "src/index.js"]
