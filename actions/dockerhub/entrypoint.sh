#!/bin/sh

set -u -e -o pipefail

USERNAME=${GITHUB_REPOSITORY%%/*}
REPOSITORY=${GITHUB_REPOSITORY#*/}

ref_tmp=${GITHUB_REF#*/} ## throw away the first part of the ref (GITHUB_REF=refs/heads/master or refs/tags/2019/03/13)
ref_type=${ref_tmp%%/*} ## extract the second element of the ref (heads or tags)
ref_value=${ref_tmp#*/} ## extract the third+ elements of the ref (master or 2019/03/13)
echo GITHUB_REF: $GITHUB_REF
echo ref_tmp: $ref_tmp
echo ref_type: $ref_type
echo ref_value: $ref_value

LATEST_TAG=latest
REGISTRY_IMAGE="$DOCKER_NAMESPACE/$DOCKER_IMAGE_NAME"
echo REGISTRY_IMAGE: $REGISTRY_IMAGE

## login if needed
if [ -n "${DOCKER_PASSWORD+set}" ]
then
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
fi

## build the image locally
docker build -t $DOCKER_IMAGE_NAME ${*:-.} ## pass in the build command from user input, otherwise build in default mode

# push latest tagged image to the repository
docker tag $DOCKER_IMAGE_NAME $REGISTRY_IMAGE:$LATEST_TAG
docker push $REGISTRY_IMAGE:$LATEST_TAG

echo CHECKING MATCH: @neo-one/node-bin = "${ref_value:0:17}"
# if releasing, push image tagged with tag
if [ "${ref_value:0:17}" = "@neo-one/node-bin" ]
then
  RELEASE_TAG=${ref_value//\//-} ## replace `/` with `-`
  RELEASE_TAG=${RELEASE_TAG//\@/v} ## replace `@` with `v`
  RELEASE_TAG=${RELEASE_TAG:1}
  echo RELEASE_TAG: $RELEASE_TAG

  docker tag $DOCKER_IMAGE_NAME $REGISTRY_IMAGE:$RELEASE_TAG
  docker push $REGISTRY_IMAGE:$RELEASE_TAG
else
  # push sha tagged image to the repository
  SHA_TAG=${GITHUB_SHA:0:7}
  echo SHA_TAG: $SHA_TAG

  docker tag $DOCKER_IMAGE_NAME $REGISTRY_IMAGE:$SHA_TAG
  docker push $REGISTRY_IMAGE:$SHA_TAG
fi
