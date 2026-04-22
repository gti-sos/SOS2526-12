FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/front/package*.json ./src/front/
RUN cd src/front && npm install

COPY src/front ./src/front
RUN cd src/front && npm run build

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
