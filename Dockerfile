FROM node:18-slim

WORKDIR /app

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]