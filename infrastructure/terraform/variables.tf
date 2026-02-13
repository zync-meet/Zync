variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "region" {
  description = "OCI Region (e.g., us-ashburn-1)"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH Public Key for instance access"
  type        = string
}

variable "instance_display_name" {
  description = "Name of the compute instance"
  type        = string
  default     = "zync-backend-server"
}

variable "instance_shape" {
  description = "Instance Shape (Using ARM Free Tier)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "Number of OCPUs"
  type        = number
  default     = 4 # Free tier allows up to 4
}

variable "instance_memory_in_gbs" {
  description = "Memory in GBs"
  type        = number
  default     = 24 # Free tier allows up to 24
}
