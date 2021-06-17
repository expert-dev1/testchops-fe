#!/bin/bash
aws configure --profile VC_AWS_PROFILE set aws_access_key_id AKIATNJPY47JJCCLKAAF
aws configure --profile VC_AWS_PROFILE set aws_secret_access_key_id nsl4s5LG06PO3aJvd/SMLoCUYPG+0f2m/pygQqs4
aws configure --profile VC_AWS_PROFILE set default_region_name us-east-1
aws configure --profile VC_AWS_PROFILE set default_output_format none

REACT_APP_ENV=production npm run build || exit;

zip -r build.zip build/;

aws s3 cp build.zip s3://vidchops-backups/ --profile VC_AWS_PROFILE

rm -rf build*;

