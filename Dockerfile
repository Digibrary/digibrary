# Use official Node.js image
FROM node:latest

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Create app directory and set permissions
WORKDIR /app
COPY --chown=appuser:appuser package*.json ./

# Set correct ownership of the app directory (before install)
RUN chown -R appuser:appuser /app

# Install dependencies
USER appuser
RUN npm install

# Copy source files
COPY --chown=appuser:appuser . .

# Build TypeScript code
RUN npm run build

#copy required files
RUN cp preparedb.sql dist/
RUN cp utils/*.txt dist/utils/
RUN cp -r views/ dist/
RUN chmod +x scripts/* && cp scripts/* /bin/

# Use non-root user
USER appuser

# Expose the port your app listens on (adjust if needed)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
