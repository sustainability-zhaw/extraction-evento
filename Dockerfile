FROM node:24-slim

WORKDIR /app

COPY src/ ./
COPY package.json package-lock.json LICENSE ./

RUN npm ci

CMD ["src/index.js"]
