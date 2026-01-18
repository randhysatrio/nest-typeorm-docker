FROM node:22-alpine

RUN apk add --no-cache bash openssl

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose NestJS port
EXPOSE 3000

# Start in watch mode
CMD ["npm", "run", "start:dev"]
