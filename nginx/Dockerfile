FROM nginx:alpine


WORKDIR /var/www

COPY etc/ /etc/

RUN cd /etc/nginx/conf.d;\
	rm default.conf;\
	ln -fs ../http.conf

COPY html html/
