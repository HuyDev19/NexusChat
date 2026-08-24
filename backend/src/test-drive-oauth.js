import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const drive = google.drive({ version: "v3", auth: oauth2Client });

async function test() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log("Checking folder access...");
    
    // Attempt to get the folder metadata
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name"
    });
    
    console.log("Folder details:", JSON.stringify(response.data, null, 2));
    
    console.log("\nAttempting to create a test file inside...");
    
    // Attempt to create a dummy file
    const createRes = await drive.files.create({
      resource: {
        name: "test_file_oauth.txt",
        parents: [folderId]
      },
      media: {
        mimeType: "text/plain",
        body: "Hello from OAuth2 test script"
      },
      fields: "id, name, webViewLink"
    });
    
    console.log("Created successfully:", createRes.data);
    
    // Make public
    await drive.permissions.create({
      fileId: createRes.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    console.log("Permission added.");

    // Delete the test file
    await drive.files.delete({
      fileId: createRes.data.id
    });
    console.log("Test file deleted.");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
  }
}

test();
