# ==========================================
# STAGE 1: Build the React/Vite Application
# ==========================================
FROM node:20-alpine AS builder
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy the package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install
 
# Copy the rest of the frontend source code
COPY . .
 
# Build the Vite project (outputs to the /dist folder)
RUN npm run build
 
# ==========================================
# STAGE 2: Serve the App using Nginx
# ==========================================
FROM nginx:alpine
 
# Copy the compiled static files from the builder stage into Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
 
# Overwrite the default Nginx config to support React Router (SPA routing)
RUN echo $'\n\
server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n\
' > /etc/nginx/conf.d/default.conf
 
# Expose port 80 to the Kubernetes cluster
EXPOSE 80
 
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]