FROM node:20.10.0-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY app.js /app/
EXPOSE 80
EXPOSE 9091
CMD ["node", "app.js"]