FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY services/doctor-service/ ./services/doctor-service/
EXPOSE 3002
CMD ["node", "services/doctor-service/src/server.js"]
