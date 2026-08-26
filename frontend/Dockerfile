FROM node:18-alpine

WORKDIR /workspace

COPY package.json ./
RUN npm install

COPY . .

# Disable Next telemetry during builds
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
