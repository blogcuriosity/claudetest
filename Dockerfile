FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/data
ENV DB_PATH=/app/data/guestbook.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
