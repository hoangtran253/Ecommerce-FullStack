# server/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 80

CMD ["npm", "start"]