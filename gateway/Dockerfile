FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY gateway/ ./gateway/
EXPOSE 3000
CMD ["node", "gateway/server.js"]
