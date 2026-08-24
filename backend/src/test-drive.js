import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE_PATH = path.join(__dirname, "../google-drive-key.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

async function test() {
  try {
    const folderId = "1HqHTbikDUoa0zaFP61WR5vH3nuzHTZxd";
    console.log("Checking folder access...");
    
    // Attempt to get the folder metadata
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, capabilities"
    });
    
    console.log("Folder details:", JSON.stringify(response.data, null, 2));
    
    console.log("\nAttempting to create a test file inside...");
    
    // Attempt to create a dummy file
    const createRes = await drive.files.create({
      resource: {
        name: "test_file.txt",
        parents: [folderId]
      },
      media: {
        mimeType: "text/plain",
        body: "Hello from test script"
      },
      fields: "id, name"
    });
    
    console.log("Created successfully:", createRes.data);
    
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
