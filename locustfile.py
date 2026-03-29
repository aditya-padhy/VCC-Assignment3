# locustfile.py
from locust import HttpUser, task, between

class SampleAppUser(HttpUser):
    # Wait 1-2 seconds between tasks
    wait_time = between(1, 2)
    # Host to target - configure this when starting Locust or via environment variable
    # host = "http://sample-app3.default.svc.cluster.local" # Target the K8s service

    @task
    def index(self):
        self.client.get("/")

    # Add more tasks to hit different endpoints if your app has them
    # @task(3) # Example: Make this task 3 times more likely
    # def other_endpoint(self):
    #    self.client.get("/other")