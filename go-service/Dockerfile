FROM golang:1.24-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY main.go ./

RUN mkdir -p /scratch-data && touch /scratch-data/.keep
ENV CGO_ENABLED=1
RUN go build \
    -tags "netgo osusergo" \
    -ldflags "-linkmode external -extldflags '-static' -s -w" \
    -o urlshortener main.go

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder --chown=65532:65532 /scratch-data /data
COPY --from=builder --chown=65532:65532 /src/urlshortener /urlshortener

WORKDIR /data

USER 65532:65532

EXPOSE 8000

CMD ["/urlshortener"]
