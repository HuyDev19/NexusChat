import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Uploads a file to Google Drive and makes it public
 * @param {Object} file - The file object from multer (req.file)
 * @returns {Promise<{fileUrl: string, fileName: string, fileSize: number}>}
 */
export const uploadFileToDrive = async (file) => {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set in environment variables");
    }

    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink",
    });

    const fileId = response.data.id;

    // Make the file publicly accessible so anyone with link can view/download
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Remove the file from local storage after successful upload
    fs.unlinkSync(file.path);

    return {
      fileUrl: response.data.webViewLink, // Or webContentLink for direct download
      fileName: file.originalname,
      fileSize: file.size,
    };
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    // Cleanup local file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};
