#!/bin/bash

set -ex
lcov -r .coverage/lcov.info "$@" -o .coverage/lcov.info
