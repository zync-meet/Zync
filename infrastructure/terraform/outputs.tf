output "instance_public_ip" {
  value = oci_core_instance.zync_server.public_ip
  description = "Public IP address of the Zync Backend Server"
}

output "instance_username" {
  value = "ubuntu"
  description = "Default username for the instance"
}

output "redis_status" {
  value = "Redis installed and listening on localhost:6379"
}
