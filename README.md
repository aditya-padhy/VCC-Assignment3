# 🚀 VCC Assignment 3 – Auto Scaling with Monitoring

## 📌 Overview

This project demonstrates a **cloud-integrated auto-scaling system** where a local virtual machine is continuously monitored, and when resource usage exceeds a defined threshold **(75%)**, a new instance is automatically provisioned on **Google Cloud Platform (GCP)**.

The system uses **Prometheus + Node Exporter** for monitoring and leverages **GCP Compute Engine** for scaling.

---

## 🎯 Objective

- Monitor CPU and memory usage of a local VM
- Trigger auto-scaling when usage exceeds **75%**
- Automatically create a new VM instance on GCP
- Simulate load using stress testing tools

---

## 🏗️ Architecture

| Component | Role |
|-----------|------|
| Local VM (Kali Linux on VMware) | Host machine being monitored |
| Prometheus | Monitoring & metrics aggregation |
| Node Exporter | Metrics collection from the VM |
| Auto-scaling Script | Triggers GCP provisioning on threshold breach |
| GCP Compute Engine | Cloud instances spun up on demand |

---

## 🛠️ Tech Stack

| Category | Tools |
|----------|-------|
| **Virtualization** | VMware |
| **OS** | Kali Linux |
| **Monitoring** | Prometheus, Node Exporter |
| **Cloud** | Google Cloud Platform (GCP) |
| **Scripting** | Bash |
| **Load Testing** | stress-ng |
| **Container/Deployment** *(optional)* | Docker, Kubernetes |

---

## 📂 Project Structure

```
.
├── app.js
├── Dockerfile
├── package.json
├── locustfile.py
├── prometheus-config.yaml
├── prometheus-deployment.yaml
├── grafana-deployment.yaml
├── kube-deploy/
│   └── locust-deployment.yaml
├── monitor.sh              # (conceptual) Resource monitoring script
└── scale_to_gcp.sh         # (conceptual) GCP scaling trigger script
```

---

## ⚙️ Setup Instructions

### 1️⃣ Local VM Setup

1. Install **VMware Workstation/Player**
2. Create a new VM with **Kali Linux** ISO
3. Allocate appropriate resources (CPU, RAM, Disk)
4. Boot and complete the OS installation

---

### 2️⃣ Install Monitoring Tools

#### Install Prometheus

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/latest/download/prometheus-*.linux-amd64.tar.gz

# Extract and setup
tar xvf prometheus-*.tar.gz
cd prometheus-*/

# Run Prometheus
./prometheus --config.file=prometheus.yml
```

#### Install Node Exporter

```bash
# Create a dedicated system user
sudo useradd -rs /bin/false node_exporter

# Download Node Exporter
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz

# Extract and move binary
tar xvf node_exporter-*.tar.gz
sudo cp node_exporter-*/node_exporter /usr/local/bin/

# Start Node Exporter
sudo -u node_exporter /usr/local/bin/node_exporter &
```

---

### 3️⃣ Configure Prometheus

Edit `prometheus.yml` (or `prometheus-config.yaml`):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
```

Restart Prometheus after applying the configuration.

---

### 4️⃣ Setup GCP

```bash
# Initialize GCP CLI
gcloud init

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

> 💡 Make sure the **Compute Engine API** is enabled in your GCP project.

---

### 5️⃣ Auto Scaling Script (`scale_to_gcp.sh`)

The script:
- Monitors CPU usage via Prometheus metrics
- Compares against the **75% threshold**
- Triggers a new GCP instance on breach

```bash
#!/bin/bash

THRESHOLD=75
CPU_USAGE=$(curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)' \
  | python3 -c "import sys,json; print(float(json.load(sys.stdin)['data']['result'][0]['value'][1]))")

if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
  echo "$(date): CPU at ${CPU_USAGE}% — triggering GCP scale-out..." >> scaling.log

  INSTANCE_NAME="auto-scale-$(date +%s)"

  gcloud compute instances create "$INSTANCE_NAME" \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --image-family=debian-11 \
    --image-project=debian-cloud

  echo "$(date): Instance $INSTANCE_NAME created." >> scaling.log
else
  echo "$(date): CPU at ${CPU_USAGE}% — within limits." >> monitoring.log
fi
```

---

### 6️⃣ Load Testing

```bash
# Install stress-ng
sudo apt install stress-ng -y

# Simulate CPU load on 4 cores for 120 seconds
stress-ng --cpu 4 --timeout 120s
```

---

### 7️⃣ Automation with Cron

Run the monitoring script every 5 minutes:

```bash
# Open crontab
crontab -e

# Add the following line
*/5 * * * * /path/to/monitor.sh >> /var/log/monitor.log 2>&1
```

---

## 🔁 Workflow

```
┌─────────────────────────────┐
│  1. Monitor VM Resource      │
│     (CPU & Memory via        │
│      Prometheus + NodeExp)   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  2. Detect Threshold Breach  │
│     CPU/Memory > 75%?        │
└────────────┬────────────────┘
             │ YES
             ▼
┌─────────────────────────────┐
│  3. Trigger Scaling Script   │
│     scale_to_gcp.sh          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  4. Create New GCP Instance  │
│     via gcloud CLI           │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  5. Log All Events           │
│     monitoring.log /         │
│     scaling.log              │
└─────────────────────────────┘
```

---

## 📊 Logs

| Log File | Description |
|----------|-------------|
| `monitoring.log` | Periodic CPU/memory resource tracking |
| `scaling.log` | Records all scale-out events and GCP instance creation |

---

## 🧪 Testing

1. **Start monitoring:**
   ```bash
   ./monitor.sh
   ```

2. **Generate load:**
   ```bash
   stress-ng --cpu 4 --timeout 120s
   ```

3. **Verify GCP instances were created:**
   ```bash
   gcloud compute instances list
   ```

4. **Check logs:**
   ```bash
   tail -f monitoring.log
   tail -f scaling.log
   ```

---

## 📝 Notes

- Ensure `gcloud` CLI is authenticated before running the scaling script
- The threshold (75%) can be adjusted in `monitor.sh` and `scale_to_gcp.sh`
- GCP instances created during testing should be **deleted after use** to avoid charges:
  ```bash
  gcloud compute instances delete INSTANCE_NAME --zone=us-central1-a
  ```

---

## 👨‍💻 Author
Aditya Padhy - B22CS103
