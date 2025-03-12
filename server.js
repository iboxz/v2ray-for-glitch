const express = require("express");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;

// Configuration
const UUID = process.env.UUID || "de04add9-5c68-8bab-950c-08cd5320df18"; // Default UUID
const WSPATH = process.env.WSPATH || "/"; // WebSocket path

// Install necessary dependencies
function installDependencies() {
  try {
    console.log("Installing necessary dependencies...");
    execSync("apt-get update && apt-get install -y unzip curl wget", { stdio: 'inherit' });
    console.log("Dependencies installed successfully");
  } catch (error) {
    console.log("Could not install dependencies with apt-get, trying with apk...");
    try {
      execSync("apk add --no-cache unzip curl wget", { stdio: 'inherit' });
      console.log("Dependencies installed successfully with apk");
    } catch (innerError) {
      console.error("Failed to install dependencies:", innerError.message);
      console.log("Continuing without installing dependencies...");
    }
  }
}

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
          port: port,  // Use the PORT provided by Railway
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

    // Start V2Ray in the background
    try {
      execSync("./v2ray run -c ./config/config.json &");
      console.log("V2Ray started successfully");
    } catch (error) {
      console.error("Error starting V2Ray:", error.message);
      console.log("Continuing without starting V2Ray...");
    }
  } catch (error) {
    console.error("Error initializing V2Ray:", error);
  }
}

// Download and setup V2Ray if not already present
function setupV2Ray() {
  try {
    if (!fs.existsSync("./v2ray")) {
      console.log("Downloading V2Ray...");
      
      // Try multiple methods to download and extract V2Ray
      try {
        // Method 1: Using curl and unzip
        execSync("curl -L -o v2ray.zip https://github.com/v2fly/v2ray-core/releases/latest/download/v2ray-linux-64.zip");
        execSync("unzip v2ray.zip");
      } catch (error) {
        console.log("Error with curl and unzip method:", error.message);
        
        // Method 2: Using wget and unzip
        try {
          execSync("wget -O v2ray.zip https://github.com/v2fly/v2ray-core/releases/latest/download/v2ray-linux-64.zip");
          execSync("unzip v2ray.zip");
        } catch (error2) {
          console.log("Error with wget and unzip method:", error2.message);
          
          // Method 3: Using Node.js to download and extract
          console.log("Trying Node.js method to download and extract...");
          
          // Create a simple script to download and extract
          const extractScript = `
          const https = require('https');
          const fs = require('fs');
          const { execSync } = require('child_process');
          
          const file = fs.createWriteStream('v2ray.zip');
          https.get('https://github.com/v2fly/v2ray-core/releases/download/v4.45.2/v2ray-linux-64.zip', function(response) {
            response.pipe(file);
            file.on('finish', function() {
              file.close(() => {
                console.log('Download completed');
                
                // Extract using Node.js
                const AdmZip = require('adm-zip');
                const zip = new AdmZip('v2ray.zip');
                zip.extractAllTo('./', true);
                console.log('Extraction completed');
                
                // Make v2ray executable
                execSync('chmod +x ./v2ray');
              });
            });
          });
          `;
          
          // Install adm-zip for extraction
          execSync("npm install adm-zip");
          
          // Save and run the script
          fs.writeFileSync('extract.js', extractScript);
          execSync('node extract.js');
        }
      }
      
      // Make v2ray executable
      execSync("chmod +x ./v2ray");
      
      // Clean up
      try {
        execSync("rm v2ray.zip");
      } catch (error) {
        console.log("Could not remove zip file:", error.message);
      }
      
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
    // Get the Railway service domain from the environment
    const domain = process.env.RAILWAY_STATIC_URL || 
                  process.env.RAILWAY_PUBLIC_DOMAIN || 
                  "dazzling-inspiration.up.railway.app";  // Use your actual Railway domain
    
    // Create VMess configuration object
    const vmessConfig = {
      v: "2",
      ps: `Railway-V2Ray`,
      add: domain,
      port: "443",
      id: UUID,
      aid: "0",
      net: "ws",
      type: "none",
      host: domain,
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

// Express middleware
app.use(express.static('public'));

// Try to install dependencies first
installDependencies();

// Setup and start V2Ray
setupV2Ray();
initV2Ray();

// Web server routes
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>V2Ray Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
          .container { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>V2Ray Server is Running</h1>
        <p>Your V2Ray server is up and running on Railway.</p>
        <p><a href="/config">View Configuration</a> | <a href="/status">Check Status</a></p>
      </body>
    </html>
  `);
});

// Status endpoint
app.get("/status", (req, res) => {
  try {
    const status = execSync("ps aux | grep v2ray").toString();
    res.send(`
      <html>
        <head>
          <title>V2Ray Status</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>V2Ray Status</h1>
          <pre>${status}</pre>
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error checking status: " + error.message);
  }
});

// Config endpoint - returns the VMess configuration link
app.get("/config", (req, res) => {
  const configInfo = generateVMessLink();
  if (configInfo) {
    res.send(`
      <html>
        <head>
          <title>V2Ray Configuration</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .config-box { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .qr-code { text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>V2Ray Configuration</h1>
          
          <div class="config-box">
            <h2>VMess Link</h2>
            <p>Scan this QR code with your V2Ray client:</p>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(configInfo.vmessLink)}" />
            </div>
            <p>Or use this VMess link:</p>
            <pre>${configInfo.vmessLink}</pre>
          </div>
          
          <div class="config-box">
            <h2>Manual Configuration</h2>
            <pre>${JSON.stringify(configInfo.config, null, 2)}</pre>
          </div>
          
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
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