# V2Ray on Glitch

This project allows you to run a V2Ray VPN server on Glitch.com's free hosting platform.

## Features

- Runs V2Ray with WebSocket protocol
- Automatically downloads and configures V2Ray
- Includes a simple web server to keep the Glitch project alive
- Configurable UUID and WebSocket path

## Setup Instructions

### 1. Create a new Glitch project

- Go to [Glitch.com](https://glitch.com/)
- Sign in or create an account
- Create a new project by clicking "New Project" and selecting "Import from GitHub"
- Paste the URL of this repository

### 2. Configure environment variables (optional)

You can customize your V2Ray server by setting the following environment variables in the Glitch project settings:

- `UUID`: Your custom UUID (default: `de04add9-5c68-8bab-950c-08cd5320df18`)
- `WSPATH`: Custom WebSocket path (default: `/`)

To set environment variables:

1. Click on your project name in the top-left corner
2. Select "Settings"
3. Scroll down to "Environment Variables"
4. Add your variables and values

### 3. Get your V2Ray configuration

After your project is running, you can use the following client configuration:

```json
{
  "v": "2",
  "ps": "Glitch V2Ray",
  "add": "YOUR-PROJECT-NAME.glitch.me",
  "port": "443",
  "id": "YOUR-UUID",
  "aid": "0",
  "net": "ws",
  "type": "none",
  "host": "YOUR-PROJECT-NAME.glitch.me",
  "path": "YOUR-WSPATH",
  "tls": "tls"
}
```

Replace:

- `YOUR-PROJECT-NAME` with your Glitch project name
- `YOUR-UUID` with your configured UUID (or the default if you didn't change it)
- `YOUR-WSPATH` with your configured WebSocket path (or `/` if you didn't change it)

## Important Notes

1. **Glitch Free Tier Limitations**:

   - Glitch projects go to sleep after 5 minutes of inactivity
   - There's a monthly limit on hours the project can run
   - Bandwidth and resources are limited

2. **For Educational Purposes Only**:

   - This project is for educational purposes
   - Always comply with Glitch's Terms of Service
   - Respect the laws and regulations of your country

3. **Security**:
   - Change the default UUID to enhance security
   - Consider using a custom WebSocket path

## Troubleshooting

If you encounter issues:

1. Check the Glitch logs for error messages
2. Visit `YOUR-PROJECT-NAME.glitch.me/status` to check if V2Ray is running
3. Make sure your client configuration matches your server settings
4. Try restarting the project by clicking "Tools" > "Terminal" and typing `refresh`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
