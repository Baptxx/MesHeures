FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN mkdir -p /data
ENV DB_PATH=/data/mesheures.db
EXPOSE 3000
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
