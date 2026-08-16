-include .env
export

# Docker image name
IMAGE_NAME=tradingbutler-admin
CONTAINER_NAME=tradingbutler-admin
PORT=8080

# Local development commands
run:
	bun run start

dev: run

install:
	bun install

build:
	bun run build

test:
	bun run test

# Build the Docker image
docker-build:
	docker build -t $(IMAGE_NAME) \
		--progress=plain \
		.

# Run the container
docker-run:
	docker run -it --rm --name $(CONTAINER_NAME) \
		-p $(PORT):8080 $(IMAGE_NAME)

docker-push:
	docker buildx build \
		-t dimitrmok/tradingbutler-admin:latest \
		--platform linux/amd64,linux/arm64 \
		-f Dockerfile \
		--progress=plain \
		--push \
		.

# Stop the container
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Build and run
up: docker-build stop docker-run

# View logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Shell into container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# Clean up
clean: stop
	docker rmi $(IMAGE_NAME) || true

.PHONY: run dev install build test docker-build docker-run docker-push stop up logs shell clean
