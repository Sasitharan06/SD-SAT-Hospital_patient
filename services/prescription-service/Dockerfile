FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY services/prescription-service/ ./services/prescription-service/
EXPOSE 3004
CMD ["node", "services/prescription-service/src/server.js"]
