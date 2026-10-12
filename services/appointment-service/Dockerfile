FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY services/appointment-service/ ./services/appointment-service/
EXPOSE 3003
CMD ["node", "services/appointment-service/src/server.js"]
