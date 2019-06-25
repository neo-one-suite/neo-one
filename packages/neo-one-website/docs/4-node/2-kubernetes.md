---
slug: node-kubernetes
title: Kubernetes
---

In this section we will cover how to deploy a NEO•ONE Node to a Kubernetes cluster.

If you are unfamiliar with Kubernetes visit their [getting started](https://kubernetes.io/docs/tutorials/kubernetes-basics/) page,
in particular we will be implementing a [StatefulSet](https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/) locally using Kubernetes through Docker.

---

[[toc]]

---

## Requirements

- [Docker](https://www.docker.com/get-started)
  - Minimum: ***at least*** 2GB Memory, and 50GB Storage allocated
  - Recommended: 4GB Memory, 60GB+ Storage allocated (you will need ~60GB of storage per pod)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
  - You can enable Kubernetes through the docker GUI; Docker >> Preferences... >> Kubernetes >> Enable Kubernetes

---

## Getting Started

The following deployment spec will create a StatefulSet of `n` nodes defined by `spec.replicas`. Each requests 60GB of storage and 4GB of memory. If you do not have a default storage class set (docker will automatically create one for local deployments) you will need to create one, see [storage classes](https://kubernetes.io/docs/concepts/storage/storage-classes/) for more information.

We include a headless service named `neo-one-service`, this is a requirement of StatefulSets.

```yml
# node-spec.yml
apiVersion: v1
kind: Service
metadata:
  name: neo-one-service
  labels:
    app: neo-one-service
spec:
  ports:
  - port: 8080
    name: node
  clusterIP: None
  selector:
    app: neo-one-node
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: node
spec:
  serviceName: "neo-one-node"
  replicas: 1
  selector:
    matchLabels:
      app: neo-one-node
  template:
    metadata:
      labels:
        app: neo-one-node
    spec:
      containers:
      - name: neo-one-node
        image: quay.io/neoone/node
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: node
        volumeMounts:
        - name: node-data
          mountPath: /root/.local/share/neo_one_node
        args: [
          "--node.rpcURLs=http://seed6.ngd.network:10332",
          "--node.rpcURLs=https://seed1.red4sec.com:10332",
          "--backup.restore=true",
          "--backup.provider.gcloud.projectID=neotracker-172901",
          "--backup.provider.gcloud.bucket=bucket-1.neo-one.io",
          "--backup.provider.gcloud.prefix=node_0",
          "--backup.provider.gcloud.maxSizeBytes=419430400"
        ]
        resources:
          requests:
            memory: "4Gi"
            cpu: "1"
  volumeClaimTemplates:
  - metadata:
      name: node-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 60Gi
```

Running this deployment with

```bash
kubectl apply -f node-spec.yml
```

will start a single pod which:
- makes a persistent volume claim for 60GB of storage.
- starts the node with this volume mounted to the default node-storage path
- if node-data isn't present, restore from the public google-cloud backup
- sync the node using two seeds from http://monitor.cityofzion.io/

There are two main benefits to deploying the nodes this way. If a pod needs to restart for *any* reason it will always attempt to bind to the same persistent volume and will not start until it is scheduled on the same machine as that volume. It also makes it incredibly simple to scale the number of nodes you would like to run.

## Configuration

[Configuration Reference](/docs/node-configuration/)

Unlike in the local docker example we don't want to mount a configuration to this container, instead all configurations are passed in as either container arguments or environment variables, however environment variables cannot represent array values. All configuration options can be set this way including array values

```bash
"--node.rpcURLs=http://seed6.ngd.network:10332",
"--node.rpcURLs=https://seed1.red4sec.com:10332"
```

is the equivalent of

```bash
{
  "node": {
    "rpcURLs": [
      "http://seed6.ngd.network:10332",
      "https://seed1.red4sec.com:10332"
    ]
  }
}
```

in config file notation.
