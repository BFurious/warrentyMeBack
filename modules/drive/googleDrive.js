import express from 'express';
import { google } from 'googleapis';
import { authenticateMiddleware } from '../../middleware/authenticate.js';
const router = express.Router();

// Google Drive API Integration
const oauth2Client = new google.auth.OAuth2();

// Save letter to Google Drive
router.post("/save-letter", authenticateMiddleware, async (req, res) => {
    try {
        oauth2Client.setCredentials({ access_token: req.user.accessToken });
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Check if "Letters" folder exists
        const folderResponse = await drive.files.list({
            q: "name='Letters' and mimeType='application/vnd.google-apps.folder'",
            fields: "files(id)",
        });

        let folderId = folderResponse.data.files.length ? folderResponse.data.files[0].id : null;

        // If folder does not exist, create it
        if (!folderId) {
            const folderMetadata = {
                name: "Letters",
                mimeType: "application/vnd.google-apps.folder",
            };
            const folder = await drive.files.create({
                resource: folderMetadata,
                fields: "id",
            });
            folderId = folder.data.id;
        }

        // Save letter inside "Letters" folder
        const fileMetadata = {
            name: `${req.body.title}.docx`,
            mimeType: "application/vnd.google-apps.document",
            parents: [folderId],
        };
        const media = { mimeType: "text/plain", body: req.body.content };

        const file = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id",
        });

        res.json({ message: "Letter saved in Google Drive!", fileId: file.data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all letters from Google Drive
router.get("/list-letters", authenticateMiddleware, async (req, res) => {
    try {
        oauth2Client.setCredentials({ access_token: req.user.accessToken });
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const files = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.document'",
            fields: "files(id, name, webViewLink)",
        });

        res.json({ files: files.data.files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific letter from Google Drive
router.get("/get-letter/:fileId", authenticateMiddleware, async (req, res) => {
    try {
        oauth2Client.setCredentials({ access_token: req.user.accessToken });
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Fetch the file metadata to get the title
        const fileMetadata = await drive.files.get({
            fileId: req.params.fileId,
            fields: "name",
        });

        // Remove .docx extension from the title (if it exists)
        const titleWithoutExtension = fileMetadata.data.name.replace(/\.docx$/, "");

        // Export the Google Doc as plain text
        const file = await drive.files.export({
            fileId: req.params.fileId,
            mimeType: "text/plain", // Export as plain text
        });

        // Send the letter content and title to the frontend
        res.json({
            title: titleWithoutExtension,
            content: file.data, // The content of the letter
        });
    } catch (error) {
        console.error("Error fetching letter:", error);
        res.status(500).json({ error: "Failed to fetch letter from Google Drive" });
    }
});

router.put("/update-letter/:fileId", authenticateMiddleware, async (req, res) => {
    try {
      oauth2Client.setCredentials({ access_token: req.user.accessToken });
      const drive = google.drive({ version: "v3", auth: oauth2Client });
  
      // Update the letter content
      const fileMetadata = {
        name: `${req.body.title}.docx`,
      };
      const media = { mimeType: "text/plain", body: req.body.content };
  
      await drive.files.update({
        fileId: req.params.fileId,
        resource: fileMetadata,
        media,
      });
  
      res.json({ message: "Letter updated successfully!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/delete-letter/:fileId", authenticateMiddleware, async (req, res) => {
    try {
      oauth2Client.setCredentials({ access_token: req.user.accessToken });
      const drive = google.drive({ version: "v3", auth: oauth2Client });
  
      // Delete the letter
      await drive.files.delete({
        fileId: req.params.fileId,
      });
  
      res.json({ message: "Letter deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

export const DriveRouter = router;