FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY shared/ ./shared/
COPY services/patient-service/ ./services/patient-service/
EXPOSE 3001
CMD ["node", "services/patient-service/src/server.js"]
