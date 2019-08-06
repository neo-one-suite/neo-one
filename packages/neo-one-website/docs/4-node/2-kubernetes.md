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
  - Minimum: **_at least_** 2GB Memory, and 50GB Storage allocated
  - Recommended: 4GB Memory, 60GB+ Storage allocated (you will need ~60GB of storage per pod)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
  - You can enable Kubernetes through the docker GUI; Docker >> Preferences... >> Kubernetes >> Enable Kubernetes

---

## Getting Started

The following deployment spec will create a StatefulSet of `n` nodes defined by `spec.replicas`. Each requests 60GB of storage and 4GB of memory. If you do not have a default storage class set (docker will automatically create one for local deployments) you will need to create one, see [storage classes](https://kubernetes.io/docs/concepts/storage/storage-classes/) for more information.

A requirement of StateFul sets is a headless service, so we'll start by creating `neo-one-service`:

```yml
#node-svc.yml
apiVersion: v1
kind: Service
metadata:
  name: neo-one-node
  labels:
    app: neo-one-node
spec:
  ports:
    - port: 8080
      name: node
  clusterIP: None
  selector:
    app: neo-one-node
```

followed by the StatefulSet itself which we'll save as `node-spec.yml`:

```yml
# node-spec.yml
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
        image: quay.io/neoone/node:1.5
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
kubectl apply -f node-svc.yml
kubectl apply -f node-spec.yml
```

will start a single pod which:

- makes a persistent volume claim for 60GB of storage.
- starts the node with this volume mounted to the default node-storage path
- if node-data isn't present, restore from the public google-cloud backup
- sync the node using two seeds from http://monitor.cityofzion.io/

There are two main benefits to deploying the nodes this way. If a pod needs to restart for _any_ reason it will always attempt to bind to the same persistent volume and will not start until it is scheduled on the same machine as that volume. It also makes it incredibly simple to scale the number of nodes you would like to run.

## Pause/Shutdown

The simplest way to pause any pods from scheduling/running is by setting `spec.replicas: 0` in your `node-spec.yml` and running

```bash
kubectl apply -f node-spec.yml
```

To purge the persisted volume space and shutdown the headless service you can simply delete both with:

```bash
kubectl delete svc neo-one-service
kubectl delete statefulset node
```

## Configuration

[Configuration Reference](/docs/node-configuration/)

While the above examples shows how to configure our pods with environment variables we can also mount a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/) to our pods. As an example we will use a basic configuration:

```bash
#/path/to/config.json
{
  "environment": {
    "logger": {
      "level": "debug"
    }
  }
}
```

Creating a ConfigMap is as easy as running:

```bash
#create the configMap
kubectl create configmap example-config-map --from-file=config=/path/to/config.json
#inspect the configMap
kubectl describe configmap example-config-map
```

Then, we can apply the ConfigMap by modifying the node-spec above to the following:

```yml
# node-spec.yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: node
spec:
  serviceName: 'neo-one-node'
  podManagementPolicy: 'Parallel'
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
          image: quay.io/neoone/node:latest
          ports:
            - containerPort: 8080
              name: node
          volumeMounts:
            - name: node-data
              mountPath: /root/.local/share/neo_one_node
            - name: config-volume
              mountPath: /etc/neo_one_node/config
              subPath: config
          resources:
            requests:
              memory: '4Gi'
              cpu: '1'
      volumes:
        - name: config-volume
          configMap:
            name: example-config-map
            optional: true

  volumeClaimTemplates:
    - metadata:
        name: node-data
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 60Gi
```

::: warning

Note

Because of how [rc](https://www.npmjs.com/package/rc) searches for configuration files the key of the configMap MUST be `config` no extension.

:::

## Health Probes

Sometimes a node will go down and need to be restarted, more commonly a node gets 'stuck' while syncing the blockchain data from other nodes. Because of this it can be extremely useful to configure health probes alongside your pods.

To enable health checks on the NEO•ONE Node you must first enable the options in your configuration. Assuming you have set up configuration mounting described above the following example `config.json` will enable health checks:

```json
{
  "node": {
    "rpcURLs": [
      "http://seed1.ngd.network:10332",
      "http://seed2.ngd.network:10332",
      "http://seed3.ngd.network:10332",
      "http://seed4.ngd.network:10332",
      "http://seed5.ngd.network:10332",
      "http://seed6.ngd.network:10332",
      "http://seed7.ngd.network:10332",
      "http://seed8.ngd.network:10332",
      "http://seed9.ngd.network:10332",
      "http://seed10.ngd.network:10332",
      "https://seed1.cityofzion.io:443",
      "https://seed2.cityofzion.io:443",
      "https://seed3.cityofzion.io:443",
      "https://seed4.cityofzion.io:443",
      "https://seed5.cityofzion.io:443"
    ]
  },
  "network": {
    "listenTCP": {
      "port": 8081
    }
  },
  "rpc": {
    "http": {
      "port": 8080
    },
    "liveHealthCheck": {
      "rpcURLs": [
        "http://seed1.ngd.network:10332",
        "http://seed2.ngd.network:10332",
        "http://seed3.ngd.network:10332",
        "http://seed4.ngd.network:10332",
        "http://seed5.ngd.network:10332",
        "http://seed6.ngd.network:10332",
        "http://seed7.ngd.network:10332",
        "http://seed8.ngd.network:10332",
        "http://seed9.ngd.network:10332",
        "http://seed10.ngd.network:10332",
        "https://seed1.cityofzion.io:443",
        "https://seed2.cityofzion.io:443",
        "https://seed3.cityofzion.io:443",
        "https://seed4.cityofzion.io:443",
        "https://seed5.cityofzion.io:443"
      ]
    },
    "readyHealthCheck": {
      "rpcURLs": [
        "http://seed1.ngd.network:10332",
        "http://seed2.ngd.network:10332",
        "http://seed3.ngd.network:10332",
        "http://seed4.ngd.network:10332",
        "http://seed5.ngd.network:10332",
        "http://seed6.ngd.network:10332",
        "http://seed7.ngd.network:10332",
        "http://seed8.ngd.network:10332",
        "http://seed9.ngd.network:10332",
        "http://seed10.ngd.network:10332",
        "https://seed1.cityofzion.io:443",
        "https://seed2.cityofzion.io:443",
        "https://seed3.cityofzion.io:443",
        "https://seed4.cityofzion.io:443",
        "https://seed5.cityofzion.io:443"
      ]
    }
  }
}
```

Be sure to apply this new config to your ConfigMap `example-config-map` by running:

```bash
kubectl delete configmap example-config-map
kubectl create configmap example-config-map --from-file=config=/path/to/config.json
```

After our config has been mapped we can add the liveness/readiness configurations to our `node-spec.yml`:

```yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: node
spec:
  selector:
    matchLabels:
      app: neo-one-node
  serviceName: 'neo-one-node'
  podManagementPolicy: 'Parallel'
  replicas: 1
  template:
    metadata:
      labels:
        app: neo-one-node
    spec:
      containers:
        - name: neo-one-node
          image: quay.io/neoone/node:1.5
          ports:
            - containerPort: 8080
              name: node
          volumeMounts:
            - name: node-data
              mountPath: /root/.local/share/neo_one_node
            - name: config-volume
              mountPath: /etc/neo_one_node/config
              subPath: config
          resources:
            requests:
              memory: '4Gi'
              cpu: '1'
          livenessProbe:
            httpGet:
              path: /live_health_check
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 60
          readinessProbe:
            httpGet:
              path: /ready_health_check
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 15
      volumes:
        - name: config-volume
          configMap:
            name: example-config-map
            optional: true

  volumeClaimTemplates:
    - metadata:
        name: node-data
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 60Gi
```

After starting this StatefulSet with

```bash
kubectl apply -f node-spec.yml
```

you should be able to inspect the state of the health checks (once they start running) with

```bash
kubectl describe pod node-0
```

see [Kubernetes Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-readiness-probes) for more information on health probes.

## Exposing Pods of a StatefulSet Locally

Since we start our StatefulSet under a headless service we do not have direct access to the underlying endpoints (see [headless services](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services)). The solution to this issue is by creating _another_ service which explicitly targets the pods created by the stateful set. For our single pod example it is as simple as starting a service:

```yml
#node-0-svc.yml
apiVersion: v1
kind: Service
metadata:
  name: node-0-svc
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local
  selector:
    statefulset.kubernetes.io/pod-name: node-0
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
```

Voilà! You should now be able to access the pod locally! You can test this by running

```bash
curl localhost:8080/live_health_check
```
