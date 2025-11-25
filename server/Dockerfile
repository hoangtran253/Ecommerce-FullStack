# server/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 8000

CMD ["npm", "start"]