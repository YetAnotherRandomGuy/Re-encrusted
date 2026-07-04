FROM alpine:3.20

RUN apk add --no-cache nginx

RUN mkdir -p /var/www/encrusted /var/www/encrusted/games /run/nginx /var/log/nginx

COPY --chown=nginx:nginx web/ /var/www/encrusted/

# Copy any game files from the host's games/ directory into the container.
# The directory is created even if empty; .gitkeep is excluded so it doesn't
# appear in the listing. Use a wildcard so the build doesn't fail if empty.
COPY --chown=nginx:nginx games/ /var/www/encrusted/games/

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8999

CMD ["nginx", "-g", "daemon off;"]