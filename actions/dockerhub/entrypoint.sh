#!/bin/sh

set -u -e -o pipefail

## mapping of var from user input or default value

USERNAME=${GITHUB_REPOSITORY%%/*}
REPOSITORY=${GITHUB_REPOSITORY#*/}

ref_tmp=${GITHUB_REF#*/} ## throw away the first part of the ref (GITHUB_REF=refs/heads/master or refs/tags/2019/03/13)
ref_type=${ref_tmp%%/*} ## extract the second element of the ref (heads or tags)
ref_value=${ref_tmp#*/} ## extract the third+ elements of the ref (master or 2019/03/13)
echo GITHUB_REF: $GITHUB_REF
echo ref_tmp: $ref_tmp
echo ref_type: $ref_type
echo ref_value: $ref_value

IMAGE_TAG=${ref_value//\//-} ## replace `/` with `-` in ref for docker tag requirement (master or 2019-03-13)
IMAGE_TAG=${IMAGE_TAG//\@/v}
IMAGE_TAG=${IMAGE_TAG:1}
SHA_TAG=${GITHUB_SHA:0:7}
LATEST_TAG=latest
NAMESPACE=${DOCKER_NAMESPACE:-$USERNAME} ## use github username as docker namespace unless specified
IMAGE_NAME=${DOCKER_IMAGE_NAME:-$REPOSITORY} ## use github repository name as docker image name unless specified
REGISTRY_IMAGE="$NAMESPACE/$IMAGE_NAME"
echo IMAGE_TAG: $IMAGE_TAG
echo NAMESPAACE: $NAMESPACE
echo IMAGE_NAME: $IMAGE_NAME
echo REGISTRY_IMAGE: $REGISTRY_IMAGE

## login if needed
if [ -n "${DOCKER_PASSWORD+set}" ]
then
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
fi

## build the image locally
docker build -t $IMAGE_NAME ${*:-.} ## pass in the build command from user input, otherwise build in default mode

# push sha tagged image to the repository
docker tag $IMAGE_NAME $REGISTRY_IMAGE:$SHA_TAG
docker push $REGISTRY_IMAGE:$SHA_TAG

# push latest tagged image to the repository
docker tag $IMAGE_NAME $REGISTRY_IMAGE:$LATEST_TAG
docker push $REGISTRY_IMAGE:$LATEST_TAG

# if releasing tags, push image tagged with tag
if [ "${ref_type}" = "tags" ]
then
  docker tag $IMAGE_NAME $REGISTRY_IMAGE:$IMAGE_TAG
  docker push $REGISTRY_IMAGE:$IMAGE_TAG
fi
