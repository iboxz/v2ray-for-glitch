const express = require("express");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Configuration
const UUID = process.env.UUID || "de04add9-5c68-8bab-950c-08cd5320df18"; // Default UUID
const WSPATH = process.env.WSPATH || "/"; // WebSocket path

// Initialize V2Ray
function initV2Ray() {
  try {
    // Create config directory if it doesn't exist
    if (!fs.existsSync("./config")) {
      fs.mkdirSync("./config");
    }

    // Generate V2Ray config
    const config = {
      log: {
        loglevel: "warning",
      },
      inbounds: [
        {
          port: 8080,
          protocol: "vmess",
          settings: {
            clients: [
              {
                id: UUID,
                alterId: 0,
              },
            ],
          },
          streamSettings: {
            network: "ws",
            wsSettings: {
              path: WSPATH,
            },
          },
        },
      ],
      outbounds: [
        {
          protocol: "freedom",
        },
      ],
    };

    fs.writeFileSync("./config/config.json", JSON.stringify(config, null, 2));
    console.log("V2Ray configuration generated successfully");

    // Start V2Ray
    execSync("./v2ray run -c ./config/config.json &");
    console.log("V2Ray started successfully");
  } catch (error) {
    console.error("Error initializing V2Ray:", error);
  }
}

// Download and setup V2Ray if not already present
function setupV2Ray() {
  try {
    if (!fs.existsSync("./v2ray")) {
      console.log("Downloading V2Ray...");
      execSync("curl -L -o v2ray.zip https://github.com/v2fly/v2ray-core/releases/latest/download/v2ray-linux-64.zip");
      execSync("unzip v2ray.zip");
      execSync("chmod +x ./v2ray");
      execSync("rm v2ray.zip");
      console.log("V2Ray downloaded and set up successfully");
    } else {
      console.log("V2Ray is already set up");
    }
  } catch (error) {
    console.error("Error setting up V2Ray:", error);
  }
}

// Generate VMess configuration link
function generateVMessLink() {
  try {
    // Get the Glitch project name from the environment
    const projectName = process.env.PROJECT_DOMAIN || "your-project-name";
    
    // Create VMess configuration object
    const vmessConfig = {
      v: "2",
      ps: `Glitch-V2Ray-${projectName}`,
      add: `${projectName}.glitch.me`,
      port: "443",
      id: UUID,
      aid: "0",
      net: "ws",
      type: "none",
      host: `${projectName}.glitch.me`,
      path: WSPATH,
      tls: "tls"
    };
    
    // Convert to Base64
    const vmessLink = "vmess://" + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    
    return {
      vmessLink,
      config: vmessConfig
    };
  } catch (error) {
    console.error("Error generating VMess link:", error);
    return null;
  }
}

// Setup and start V2Ray
setupV2Ray();
initV2Ray();

// Web server routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Status endpoint
app.get("/status", (req, res) => {
  try {
    const status = execSync("ps aux | grep v2ray").toString();
    res.send(`<pre>${status}</pre>`);
  } catch (error) {
    res.status(500).send("Error checking status");
  }
});

// Config endpoint - returns the VMess configuration link
app.get("/config", (req, res) => {
  const configInfo = generateVMessLink();
  if (configInfo) {
    res.send(`
      <h1>V2Ray Configuration</h1>
      <p>Scan this QR code with your V2Ray client:</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(configInfo.vmessLink)}" />
      <p>Or use this VMess link:</p>
      <code>${configInfo.vmessLink}</code>
      <h2>Manual Configuration:</h2>
      <pre>${JSON.stringify(configInfo.config, null, 2)}</pre>
    `);
  } else {
    res.status(500).send("Error generating configuration");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Generate and log the VMess configuration link
  const configInfo = generateVMessLink();
  if (configInfo) {
    console.log("\n=== V2Ray Configuration ===");
    console.log(`VMess Link: ${configInfo.vmessLink}`);
    console.log("\nManual Configuration:");
    console.log(JSON.stringify(configInfo.config, null, 2));
    console.log("\nAccess the web interface at:");
    console.log(`https://${configInfo.config.add}/config`);
    console.log("=============================\n");
  }
});

// Keep the application alive
setInterval(() => {
  console.log("Keeping the application alive...");
}, 5 * 60 * 1000); // Every 5 minutes