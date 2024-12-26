STATIC_FILES=nodejs/api/openapi.yaml
STATIC_FILES+=$(foreach f,$(shell find nginx/html/ -type f),$(shell echo $f |sed 's#nginx/html/#/var/www/#g' ))

update_inside_vagrant: ${STATIC_FILES} nodejs/index.js

/var/www/%: nginx/html/%
	mkdir -p $(shell dirname $@)
	cp -u $^ $@

nodejs/api/openapi.yaml: api/api.yaml
	sudo bin/update dev
	make /var/www/openapi.json

NODEJS_FILES=$(shell find nodejs/ -path "nodejs/node_modules" -prune -o -path "nodejs/index.js" -prune -o -type f -name "*.js" -print)
nodejs/index.js: $(NODEJS_FILES)
	docker ps --filter name=what-to-eat_nodejs --format "{{.ID}}" |head -n1|xargs -IX docker exec X touch index.js

.PHONY: update_inside_vagrant
