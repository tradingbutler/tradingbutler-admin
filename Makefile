-include .env
export

run:
	npm start

dev: run

build:
	npm run build

docker-build:
	docker buildx build --platform linux/amd64,linux/arm64 \
	  -t dimitrmok/tradingbutler-admin .

docker-push:
	docker buildx build --platform linux/amd64,linux/arm64 \
	  -t dimitrmok/tradingbutler-admin:latest \
	  --push .

docker-run:
	docker run --rm -p 8080:80 dimitrmok/tradingbutler-admin

.PHONY: dev build docker-build docker-push docker-run
