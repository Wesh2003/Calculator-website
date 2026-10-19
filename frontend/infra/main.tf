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
  name         = "nginx:latest"
  keep_locally = true
}

resource "docker_container" "staging" {
  name  = "scm-staging"
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = 8080
  }

  # Mount your HTML app into nginx's web root (read-only)
  volumes {
    host_path      = abspath("${path.module}/../app")
    container_path = "/usr/share/nginx/html"
    read_only      = true
  }
}

output "app_url" {
  value = "http://localhost:8080"
}