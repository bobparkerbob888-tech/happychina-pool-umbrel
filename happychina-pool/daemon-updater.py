#!/usr/bin/env python3
"""
Pool Daemon Auto-Updater
Checks GitHub releases for ALL coin daemons and auto-updates Docker containers.
Run via systemd timer: daily at 4 AM
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
import re
from datetime import datetime

# === CONFIG ===
UMBREL_HOST = os.getenv("UMBREL_HOST", "192.168.1.100")
UMBREL_USER = os.getenv("UMBREL_USER", "umbrel")
UMBREL_PASS = os.getenv("UMBREL_PASS", "umbrel")
POOL_DIR = "/home/umbrel/umbrel/app-data/happychina-pool"
DOCKER_PROJECT = "happychina-pool"

# Each coin's configuration
COINS = {
    "litecoin": {
        "github": "litecoin-project/litecoin",
        "asset_pattern": "litecoin-{version}-x86_64-linux-gnu.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "litecoin-{version}/bin",
        "daemon": "litecoind",
        "cli": "litecoin-cli",
        "extra_bins": ["litecoin-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "litecoind",
        "rpc_port": "9332",
        "p2p_port": "9333",
        "data_dir": "/home/litecoin/.litecoin",
        "version_prefix": "LTC",
    },
    "dogecoin": {
        "github": "dogecoin/dogecoin",
        "asset_pattern": "dogecoin-{version}-x86_64-linux-gnu.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "dogecoin-{version}/bin",
        "daemon": "dogecoind",
        "cli": "dogecoin-cli",
        "extra_bins": ["dogecoin-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "dogecoind",
        "rpc_port": "22555",
        "p2p_port": "22556",
        "data_dir": "/home/dogecoin/.dogecoin",
        "version_prefix": "Dogecoin",
    },
    "pepecoin": {
        "github": "pepecoin-project/pepecoin",
        "asset_pattern": "pepecoin-{version}-x86_64-linux-gnu.tar.xz",
        "archive_type": "tar.xz",
        "bin_dir_pattern": "pepecoin-{version}/bin",
        "daemon": "pepecoind",
        "cli": "pepecoin-cli",
        "extra_bins": ["pepecoin-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "pepecoind",
        "rpc_port": "29373",
        "p2p_port": "29374",
        "data_dir": "/home/pepecoin/.pepecoin",
        "version_prefix": "Pepecoin",
    },
    "bells": {
        "github": "Nintondo/bellscoinV3",
        "asset_pattern": "bells-{version}-x86_64-linux-gnu.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "bells-{version}/bin",
        "daemon": "bellsd",
        "cli": "bells-cli",
        "extra_bins": ["bells-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "bellsd",
        "rpc_port": "19918",
        "p2p_port": "19919",
        "data_dir": "/root/.bells",
        "version_prefix": "Bells",
    },
    "luckycoin": {
        "github": "LuckycoinFoundation/Luckycoin",
        "asset_pattern": "luckycoin-{version}-x86_64-linux-gnu.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "luckycoin-{version}/bin",
        "daemon": "luckycoind",
        "cli": "luckycoin-cli",
        "extra_bins": ["luckycoin-tx"],
        "container_bin_path": "/bin",
        "service": "luckycoind",
        "rpc_port": "9918",
        "p2p_port": "9917",
        "data_dir": "/root/.luckycoin",
        "version_prefix": "LKY",
    },
    "junkcoin": {
        "github": "Junkcoin-Foundation/junkcoin-core",
        "asset_pattern": "junkcoin-{version}-linux.tar.xz",
        "archive_type": "tar.xz",
        "bin_dir_pattern": "junkcoin-{version}/bin",
        "daemon": "junkcoind",
        "cli": "junkcoin-cli",
        "extra_bins": ["junkcoin-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "junkcoind",
        "rpc_port": "9772",
        "p2p_port": "9771",
        "data_dir": "/root/.junkcoin",
        "version_prefix": "Junkcoin",
    },
    "dingocoin": {
        "github": "dingocoin/dingocoin",
        "asset_pattern": "dingocoin-{tag}-linux-binaries-ubuntu-20.04.zip",
        "archive_type": "zip",
        "bin_dir_pattern": ".",  # zip extracts flat
        "daemon": "dingocoind",
        "cli": "dingocoin-cli",
        "extra_bins": ["dingocoin-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "dingocoind",
        "rpc_port": "34646",
        "p2p_port": "33117",
        "data_dir": "/root/.dingocoin",
        "version_prefix": "Dingocoin",
    },
    "shibacoin": {
        "github": "shibacoinppc/shibacoin",
        "asset_pattern": "shibacoin-{version}-linux.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "shibacoin-{version}/bin",
        "daemon": "shibacoind",
        "cli": "shibacoin-cli",
        "extra_bins": [],
        "container_bin_path": "/usr/local/bin",
        "service": "shibacoind",
        "rpc_port": "33863",
        "p2p_port": "33864",
        "data_dir": "/root/.shibacoin",
        "version_prefix": "ShibaCoin",
    },
    "trumpow": {
        "github": "trumpowppc/trumpow",
        "asset_pattern": "trumpow-v{version}-x86_64-linux-gnu.tar.gz",
        "archive_type": "tar.gz",
        "bin_dir_pattern": "trumpow-{version}/bin",
        "daemon": "trumpowd",
        "cli": "trumpow-cli",
        "extra_bins": ["trumpow-tx"],
        "container_bin_path": "/usr/local/bin",
        "service": "trumpowd",
        "rpc_port": "33883",
        "p2p_port": "33884",
        "data_dir": "/root/.trumpow",
        "version_prefix": "TrumPOW",
    },
}


def log(msg):
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} [DaemonUpdater] {msg}", flush=True)


def ssh_cmd(cmd, timeout=60):
    """Run command on Umbrel via SSH"""
    full_cmd = [
        "sshpass", "-p", UMBREL_PASS,
        "ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null",
        f"{UMBREL_USER}@{UMBREL_HOST}", cmd
    ]
    try:
        result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        log(f"SSH command timed out: {cmd[:80]}...")
        return ""
    except Exception as e:
        log(f"SSH error: {e}")
        return ""


def ssh_sudo(cmd, timeout=120):
    """Run sudo command on Umbrel"""
    return ssh_cmd(f"echo '{UMBREL_PASS}' | sudo -S bash -c '{cmd}'", timeout=timeout)


def github_api(path):
    """Fetch from GitHub API"""
    url = f"https://api.github.com/{path}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "daemon-updater"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log(f"GitHub API error for {path}: {e}")
        return None


def get_latest_release(repo):
    """Get latest release tag and assets from GitHub"""
    data = github_api(f"repos/{repo}/releases/latest")
    if not data:
        # Try getting the first non-prerelease
        releases = github_api(f"repos/{repo}/releases")
        if releases:
            for r in releases:
                if not r.get("prerelease"):
                    return r.get("tag_name", ""), r.get("assets", [])
            # If all are prereleases, use the latest
            return releases[0].get("tag_name", ""), releases[0].get("assets", [])
        return "", []
    return data.get("tag_name", ""), data.get("assets", [])


def normalize_version(tag):
    """Remove 'v' prefix and other junk from version tag"""
    v = tag.strip().lstrip("v").lstrip(".")
    # Handle cases like "v.021.2.1" -> "0.21.2.1" wait no, "021.2.1"
    return v


def get_running_version(coin, cfg):
    """Get currently running daemon version via RPC"""
    container = f"{DOCKER_PROJECT}_{cfg['service']}_1"
    cli = cfg["cli"]
    rpc_port = cfg["rpc_port"]
    
    output = ssh_cmd(
        f"echo '{UMBREL_PASS}' | sudo -S docker exec {container} "
        f"{cli} -rpcuser=umbrel -rpcpassword=umbrel -rpcport={rpc_port} getnetworkinfo 2>/dev/null"
    )
    
    if not output:
        return ""
    
    try:
        data = json.loads(output)
        subversion = data.get("subversion", "")
        # Parse "/LKY:5.0.1/" or "/Dogecoin:1.14.9/" etc.
        match = re.search(r':([^/]+)/', subversion)
        if match:
            return match.group(1)
    except:
        pass
    return ""


def find_linux_asset(assets, coin, cfg, tag, version):
    """Find the correct x86_64 Linux asset from release assets"""
    # Try the configured pattern first
    for pattern_key in ["version", "tag"]:
        pattern = cfg["asset_pattern"].format(version=version, tag=tag)
        for asset in assets:
            if asset["name"] == pattern:
                return asset
    
    # Fallback: search for any x86_64 linux asset
    for asset in assets:
        name = asset["name"].lower()
        if "linux" in name and ("x86_64" in name or "amd64" in name):
            return asset
    
    # Fallback: any linux asset
    for asset in assets:
        name = asset["name"].lower()
        if "linux" in name and not name.endswith(".sig") and not name.endswith(".sha256") and not name.endswith(".txt"):
            return asset
    
    return None


def download_and_extract(asset, coin, cfg, version, tag):
    """Download asset to Umbrel and extract binaries"""
    url = asset["browser_download_url"]
    name = asset["name"]
    archive_type = cfg["archive_type"]
    
    # Determine extract command based on archive type
    if name.endswith(".tar.gz") or name.endswith(".tgz"):
        extract_cmd = "tar xzf"
    elif name.endswith(".tar.xz"):
        extract_cmd = "tar xJf"
    elif name.endswith(".zip"):
        extract_cmd = "unzip -o"
    else:
        extract_cmd = "tar xzf"  # default
    
    log(f"  Downloading {name}...")
    ssh_sudo(
        f"cd /tmp && rm -rf /tmp/{coin}-update && mkdir -p /tmp/{coin}-update && "
        f"cd /tmp/{coin}-update && wget -q '{url}' -O archive && "
        f"{extract_cmd} archive && rm -f archive && "
        f"find /tmp/{coin}-update -type f -name '{cfg['daemon']}' 2>/dev/null",
        timeout=300
    )
    
    # Find the daemon binary
    daemon_path = ssh_sudo(f"find /tmp/{coin}-update -type f -name '{cfg['daemon']}' 2>/dev/null | head -1")
    if not daemon_path:
        log(f"  ERROR: Could not find {cfg['daemon']} in extracted archive")
        return None
    
    bin_dir = os.path.dirname(daemon_path)
    log(f"  Found binaries in: {bin_dir}")
    return bin_dir


def build_docker_image(coin, cfg, bin_dir, version):
    """Build a local Docker image with the new binaries"""
    image_name = f"local/{coin}:{version}"
    daemon = cfg["daemon"]
    cli = cfg["cli"]
    bin_path = cfg["container_bin_path"]
    p2p_port = cfg["p2p_port"]
    rpc_port = cfg["rpc_port"]
    
    # Collect all binary names
    bins = [daemon, cli] + cfg.get("extra_bins", [])
    
    copy_lines = "\n".join([f"COPY bin/{b} {bin_path}/{b}" for b in bins])
    chmod_list = " ".join([f"{bin_path}/{b}" for b in bins])
    
    dockerfile = f"""FROM ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libevent-2.1-7 libboost-system1.74.0 libboost-filesystem1.74.0 \\
    libboost-thread1.74.0 libboost-program-options1.74.0 \\
    libboost-chrono1.74.0 libzmq5 libminiupnpc17 libnatpmp1 \\
    && rm -rf /var/lib/apt/lists/*
{copy_lines}
RUN chmod +x {chmod_list}
EXPOSE {p2p_port} {rpc_port}
ENTRYPOINT ["{bin_path}/{daemon}"]
"""
    
    log(f"  Building Docker image {image_name}...")
    
    # Create build context
    ssh_sudo(f"rm -rf /tmp/{coin}-docker-build && mkdir -p /tmp/{coin}-docker-build/bin")
    
    for b in bins:
        ssh_sudo(f"cp {bin_dir}/{b} /tmp/{coin}-docker-build/bin/ 2>/dev/null || true")
    
    # Write Dockerfile (escape for bash)
    escaped_dockerfile = dockerfile.replace("'", "'\\''")
    ssh_sudo(f"cat > /tmp/{coin}-docker-build/Dockerfile << 'DOCKERFILEEOF'\n{dockerfile}DOCKERFILEEOF")
    
    result = ssh_sudo(f"docker build -t '{image_name}' /tmp/{coin}-docker-build 2>&1 | tail -3", timeout=600)
    log(f"  Build result: {result}")
    
    # Verify image exists
    check = ssh_sudo(f"docker image inspect '{image_name}' >/dev/null 2>&1 && echo OK || echo FAIL")
    if "OK" in check:
        log(f"  Image {image_name} built successfully")
        return image_name
    else:
        log(f"  ERROR: Image build failed")
        return None


def update_container(coin, cfg, new_image, version):
    """Stop old container, update config, restart"""
    service = cfg["service"]
    container = f"{DOCKER_PROJECT}_{service}_1"
    
    log(f"  Stopping {container}...")
    ssh_sudo(f"docker stop {container} 2>/dev/null || true")
    
    log(f"  Removing {container}...")
    ssh_sudo(f"docker rm {container} 2>/dev/null || true")
    
    log(f"  Updating dockerControl.js...")
    # Update image reference - handle both local/* and other image formats
    ssh_sudo(
        f"sed -i \"s|image: '[^']*{coin}[^']*'|image: '{new_image}'|\" "
        f"{POOL_DIR}/dockerControl.js"
    )
    
    # Verify the update
    check = ssh_sudo(f"grep '{new_image}' {POOL_DIR}/dockerControl.js")
    if new_image in check:
        log(f"  dockerControl.js updated to {new_image}")
    else:
        log(f"  WARNING: dockerControl.js may not have been updated correctly")
    
    log(f"  Restarting pool backend...")
    ssh_sudo(f"docker restart {DOCKER_PROJECT}_backend_1 2>/dev/null || true")
    
    # Wait for backend to come back
    time.sleep(15)
    
    # The backend should recreate the container automatically
    # But let's also try to start it directly
    log(f"  Waiting for container to be recreated...")
    time.sleep(10)
    
    status = ssh_sudo(f"docker ps --filter name={container} --format '{{{{.Status}}}}' 2>/dev/null")
    if status:
        log(f"  Container status: {status}")
    else:
        log(f"  Container not yet running - backend will start it when needed")


def check_and_update_coin(coin, cfg):
    """Main update check for a single coin"""
    log(f"=== Checking {coin} ===")
    
    # Get latest release
    tag, assets = get_latest_release(cfg["github"])
    if not tag:
        log(f"  Could not get latest release from {cfg['github']}")
        return
    
    latest_version = normalize_version(tag)
    log(f"  Latest release: {tag} (version: {latest_version})")
    
    # Get running version
    running_version = get_running_version(coin, cfg)
    log(f"  Running version: {running_version or 'unknown/not running'}")
    
    if running_version and running_version == latest_version:
        log(f"  {coin} is up to date ✓")
        return
    
    if not running_version:
        log(f"  WARNING: Could not determine running version, proceeding with update check")
    
    log(f"  UPDATE AVAILABLE: {running_version or '?'} → {latest_version}")
    
    # Find Linux asset
    asset = find_linux_asset(assets, coin, cfg, tag, latest_version)
    if not asset:
        log(f"  ERROR: No Linux x86_64 binary found in release assets")
        return
    
    log(f"  Found asset: {asset['name']}")
    
    # Download and extract
    bin_dir = download_and_extract(asset, coin, cfg, latest_version, tag)
    if not bin_dir:
        return
    
    # Build Docker image
    new_image = build_docker_image(coin, cfg, bin_dir, latest_version)
    if not new_image:
        return
    
    # Update container
    update_container(coin, cfg, new_image, latest_version)
    
    # Cleanup
    ssh_sudo(f"rm -rf /tmp/{coin}-update /tmp/{coin}-docker-build")
    
    log(f"  ✓ {coin} updated to {latest_version}")


def main():
    log("=" * 60)
    log("Starting daemon update check for ALL coins")
    log("=" * 60)
    
    updated = []
    up_to_date = []
    errors = []
    
    for coin, cfg in COINS.items():
        try:
            check_and_update_coin(coin, cfg)
        except Exception as e:
            log(f"  ERROR updating {coin}: {e}")
            errors.append(coin)
    
    log("=" * 60)
    log("Update check complete")
    if errors:
        log(f"Errors: {', '.join(errors)}")
    log("=" * 60)


if __name__ == "__main__":
    main()
