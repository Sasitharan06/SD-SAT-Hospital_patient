FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY services/notification-service/ ./services/notification-service/
EXPOSE 3005
CMD ["node", "services/notification-service/src/server.js"]
