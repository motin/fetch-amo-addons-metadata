#!/usr/bin/env bash

# fail on any error
set -o errexit

# run from the same directory as the script
script_path=`dirname $0`
cd $script_path

# echo commands to console
set -x

# run actual commands
rm results/*.json || true
node index.js
jq -s '.[0]=([.[]]|flatten)|.[0]' results/*.json > ../addons.json

# exit gracefully
exit 0
