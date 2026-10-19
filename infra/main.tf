terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name = "nginx:latest"
}

resource "docker_container" "staging" {
  name  = "scm-staging"
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = 8080
  }
}

output "staging_url" {
  value = "http://localhost:8080"
}
