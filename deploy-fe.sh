#!/bin/bash

cd /var/www/vidchops-fe || exit;

rm -rf build;

aws s3 cp s3://vidchops-backups/build.zip .;

unzip -o build.zip;

rm build.zip;
