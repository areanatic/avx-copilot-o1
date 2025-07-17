FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all source files
COPY . .

# Expose port (optional, for health checks)
EXPOSE 3000

# Start the bot
CMD ["node", "start-production.js"]
