#!/bin/bash

set -ex
npx jest --coverage --runInBand --coverageDirectory=.coverage/incremental $@ 
lcov --add-tracefile .coverage/incremental/lcov.info --add-tracefile .coverage/lcov.info --output-file .coverage/lcov.info --checksum --branch-coverage
