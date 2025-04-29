# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port your app listens on (adjust if needed)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
