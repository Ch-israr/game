# Mini Golf 3D — Docker image for Render.
# The native-Node service built and reported Live but answered HTTP 502 on
# every request in two regions (Singapore, then Oregon), with clean logs —
# so the service is being run as Docker instead, exactly like TwitterDown
# and ClearMark, which both serve fine on this Render account.
FROM node:22-slim
WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json ./
RUN npm install --include=dev

# App source (node_modules/.next/.git excluded by .dockerignore).
COPY . .
# Generate the Prisma client, make sure the SQLite schema exists in the
# committed db/custom.db, then build the Next.js standalone output.
RUN npx prisma generate \
 && npx prisma db push --accept-data-loss \
 && npm run build \
 # The standalone server chdirs into .next/standalone, so the SQLite file
 # must live there too for DATABASE_URL=file:./db/custom.db to resolve.
 && cp -r db .next/standalone/

# Render injects $PORT (usually 10000); Next.js standalone binds to it.
EXPOSE 10000
CMD ["node", ".next/standalone/server.js"]
