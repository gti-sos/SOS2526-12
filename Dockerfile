FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install and build Svelte frontend
COPY src/front/package*.json ./src/front/
RUN cd src/front && npm install

COPY src/front ./src/front
RUN cd src/front && npm run build

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
