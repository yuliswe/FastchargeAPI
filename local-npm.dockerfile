FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends \
    bzr \
    git \
    mercurial \
    openssh-client \
    subversion \
    procps \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf \
    automake \
    bzip2 \
    file \
    g++ \
    gcc \
    imagemagick \
    libbz2-dev \
    libc6-dev \
    libcurl4-openssl-dev \
    libdb-dev \
    libevent-dev \
    libffi-dev \
    libgeoip-dev \
    libglib2.0-dev \
    libjpeg-dev \
    liblzma-dev \
    libmagickcore-dev \
    libmagickwand-dev \
    default-libmysqlclient-dev \
    libncurses-dev \
    libpng-dev \
    libpq-dev \
    libreadline-dev \
    libsqlite3-dev \
    libssl-dev \
    libtool \
    libwebp-dev \
    libxml2-dev \
    libxslt-dev \
    libyaml-dev \
    make \
    patch \
    xz-utils \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
# RUN set -ex \
#     && for key in \
#       9554F04D7259F04124DE6B476D5A82AC7E37093B \
#       94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
#       0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
#       FD3A5288F042B6850C66B31F09FE44734EB7990E \
#       71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
#       DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
#       B9AE9905FFD7803F25714661B63B535A4C206CA9 \
#       C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
#     ; do \
#       gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
#     done
# RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz"   && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc"   && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc   && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c -   && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1   && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs 
WORKDIR /local-npm
RUN npm install local-npm
ENV PATH="/local-npm/node_modules/.bin/:${PATH}"
RUN local-npm --version

ENV REMOTE_REGISTRY_SKIMDB=https://skimdb.npmjs.com/registry
ENV REMOTE_REGISTRY=https://registry.npmjs.org
ENV DATA_DIRECTORY=/data
ENV BASE_URL=http://0.0.0.0:5080
VOLUME [/data]
EXPOSE 16984/tcp
EXPOSE 5080/tcp

CMD ["/bin/sh", "-c", "mkdir -p \"$DATA_DIRECTORY\" && local-npm --remote $REMOTE_REGISTRY --remote-skim $REMOTE_REGISTRY_SKIMDB --directory $DATA_DIRECTORY --url $BASE_URL"]
