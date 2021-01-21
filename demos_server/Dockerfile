FROM rust:1.49 AS planner
WORKDIR app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare  --recipe-path recipe.json

FROM rust:1.49 AS cacher
WORKDIR app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

FROM rust:1.49 AS builder
WORKDIR app
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo
COPY . .
RUN cargo build --release

FROM debian:buster-slim AS runtime
WORKDIR app
COPY --from=builder /app/target/release/demos_server demos_server
ENV APP_ENVIRONMENT production
ENTRYPOINT ["./demos_server"]
