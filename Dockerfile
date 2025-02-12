# Use the official Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install dependencies first (for caching optimization)
COPY package.json package-lock.json ./
RUN npm install

# Copy everything into the container
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev"]
