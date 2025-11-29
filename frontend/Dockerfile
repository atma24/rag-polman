# Gunakan Node image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy sisa file
COPY . .

# Expose port 3000
EXPOSE 3000

# Jalankan mode dev
CMD ["npm", "run", "dev"]