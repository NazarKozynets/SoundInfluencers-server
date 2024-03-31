import { Injectable } from "@nestjs/common";
import { Dropbox, DropboxAuth } from "dropbox";

@Injectable()
export class DropboxService {
  private dbxAuth: DropboxAuth;
  private dbx: Dropbox;
  private accessToken: string;
  private refreshToken: string;

  constructor() {
    this.accessToken =
      "sl.Bv-E_guOgtiQn6FLji8xFpO73nVz9krnIfrSnW5OU2hS3Qlw3vzExkPZlbkIgDRH8lLDILFp-6X3ptcMVr4096ED0pmPH7cP-02p9DCe0I1lvQ9MqiLdUxk8ToTl48Kpdg8sx01tEjO1WTRYoPw5";
    this.refreshToken =
      "QydSschJ_vMAAAAAAAAAAUH0fIuNzZ9ExG5TwzqHpa4bgiAUcJkXCf9ouONt5bSE";
    this.dbx = new Dropbox({
      clientId: "rnxlin8iqwjihu7",
      clientSecret: "drq6feze89b0j33",
      refreshToken:
        "QydSschJ_vMAAAAAAAAAAUH0fIuNzZ9ExG5TwzqHpa4bgiAUcJkXCf9ouONt5bSE",
    });
    this.dbxAuth = new DropboxAuth({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      let response = await this.dbx.filesUpload({
        path: "/" + new Date().toISOString() + fileName,
        contents: fileBuffer,
      });

      // Create a shareable link
      const shareLink = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: response.result.path_lower,
        settings: {
          requested_visibility: { ".tag": "public" }, // Set visibility to public
        },
      });

      return shareLink.result.url.replace(
        "www.dropbox.com",
        "dl.dropboxusercontent.com"
      );
    } catch (error) {
      if (
        error &&
        error.status === 401 &&
        error.error.error_summary.includes("expired_access_token")
      ) {
        const newDbx = await this.refreshTokenIfNeeded();
        if (newDbx) {
          return this.uploadFile(fileBuffer, fileName); // Retry after refresh
        }
      } else {
        console.error("Error uploading file to Dropbox", error);
        throw new Error("Unable to upload file to Dropbox");
      }
    }
  }
  async refreshTokenIfNeeded() {
    try {
      const clientId = this.dbxAuth.getClientId(); // Simplified
      this.dbxAuth.setClientId(clientId); // Simplified
      await this.dbxAuth.checkAndRefreshAccessToken(); // Simplified
      const response = this.dbxAuth.getAccessToken(); // Simplified
      this.accessToken = response;
      this.dbx = new Dropbox({ accessToken: this.accessToken });
      return this.dbx;
    } catch (error) {
      console.error("Error refreshing Dropbox token", error);
    }
  }
}
