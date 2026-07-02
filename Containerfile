FROM alpine:3.20

RUN apk add --no-cache nginx

RUN mkdir -p /var/www/encrusted /run/nginx /var/log/nginx

COPY --chown=nginx:nginx web/ /var/www/encrusted/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8999

CMD ["nginx", "-g", "daemon off;"]