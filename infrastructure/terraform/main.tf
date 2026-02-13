terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 4.0.0"
    }
  }
}

provider "oci" {
  region = var.region
}

# ---------------------------------------------------------------------------
# Network Resources
# ---------------------------------------------------------------------------

resource "oci_core_vcn" "zync_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_id
  display_name   = "zync-vcn"
  dns_label      = "zyncvcn"
}

resource "oci_core_internet_gateway" "zync_ig" {
  compartment_id = var.compartment_id
  display_name   = "zync-internet-gateway"
  vcn_id         = oci_core_vcn.zync_vcn.id
}

resource "oci_core_route_table" "zync_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.zync_vcn.id
  display_name   = "zync-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.zync_ig.id
  }
}

resource "oci_core_security_list" "zync_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.zync_vcn.id
  display_name   = "zync-security-list"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
    description = "SSH"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
    description = "HTTP"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
    description = "HTTPS"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 5000
      max = 5000
    }
    description = "Zync Backend API"
  }
}

resource "oci_core_subnet" "zync_subnet" {
  cidr_block        = "10.0.1.0/24"
  display_name      = "zync-public-subnet"
  dns_label         = "zyncpub"
  security_list_ids = [oci_core_security_list.zync_sl.id]
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.zync_vcn.id
  route_table_id    = oci_core_route_table.zync_rt.id
  dhcp_options_id   = oci_core_vcn.zync_vcn.default_dhcp_options_id
}

# ---------------------------------------------------------------------------
# Compute Resources
# ---------------------------------------------------------------------------

# Get latest Ubuntu 22.04 Aarch64 image
data "oci_core_images" "ubuntu_images" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "zync_server" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = var.instance_display_name
  shape               = var.instance_shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_in_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.zync_subnet.id
    display_name     = "primary-vnic"
    assign_public_ip = true
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_images.images[0].id
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yaml"))
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}
